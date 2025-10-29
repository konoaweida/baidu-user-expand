const util = require('../../utils/util.js');
const filterStore = require('../../store/filterStore.js');

const ITEM_HEIGHT_RPX = 158;
const mockTopCandidates = [
  { id: 1, avatar: 'https://picsum.photos/id/64/200/200', name: '宋子彤', summary: '6位共同同学', mutualCount: 6 },
  { id: 2, avatar: 'https://picsum.photos/id/65/200/200', name: '李浩然', summary: '5位共同同事', mutualCount: 5 },
  { id: 3, avatar: 'https://picsum.photos/id/66/200/200', name: '张思语', summary: '4位共同朋友', mutualCount: 4 },
  { id: 4, avatar: 'https://picsum.photos/id/67/200/200', name: '王梓轩', summary: '3位共同校友', mutualCount: 3 },
  { id: 5, avatar: 'https://picsum.photos/id/68/200/200', name: '陈雨欣', summary: '2位共同客户', mutualCount: 2 },
  { id: 6, avatar: 'https://picsum.photos/id/69/200/200', name: '赵宇辰', summary: '7位共同行业伙伴', mutualCount: 7 },
  { id: 7, avatar: 'https://picsum.photos/id/70/200/200', name: '刘思琪', summary: '1位共同导师', mutualCount: 1 },
  { id: 8, avatar: 'https://picsum.photos/id/71/200/200', name: '黄俊豪', summary: '4位共同项目成员', mutualCount: 4 },
  { id: 9, avatar: 'https://picsum.photos/id/72/200/200', name: '周雨彤', summary: '5位共同社团成员', mutualCount: 5 },
  { id: 10, avatar: 'https://picsum.photos/id/73/200/200', name: '吴泽宇', summary: '2位共同邻居', mutualCount: 2 }
];

const CACHE_KEY = 'potentialListCache';
const FILTER_CACHE_KEY = 'lastFilters';
const CACHE_TTL = 5 * 60 * 1000;

function debounce(func, wait = 100) {
  let timeout;
  return function () {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

// 判断两个筛选条件是否一致（避免缓存与当前筛选不匹配）
function isFiltersEqual(filters1, filters2) {
  return JSON.stringify(filters1 || {}) === JSON.stringify(filters2 || {});   
}

// 读取并合并筛选条件缓存（优先全局筛选→本地缓存→默认筛选）
function pickInitialFilters(defaultFilters) {
  const globalFilters = filterStore.getFilters(); // 全局筛选条件
  let localFilters = null;
  try {
    localFilters = wx.getStorageSync(FILTER_CACHE_KEY); // 本地缓存的筛选条件
  } catch (e) {}

  // 优先级1：全局筛选与本地缓存一致，合并到默认筛选
  if (
    globalFilters &&
    localFilters &&
    isFiltersEqual(globalFilters, localFilters)
  ) {
    return { ...defaultFilters, ...localFilters };
  }

  // 优先级2：仅全局筛选有效，合并到默认筛选
  if (globalFilters && Object.keys(globalFilters).length > 0) {
    return { ...defaultFilters, ...globalFilters };
  }

  // 优先级3：仅本地缓存有效，合并到默认筛选
  if (localFilters) {
    return { ...defaultFilters, ...localFilters };
  }

  // 优先级4：无缓存，返回默认筛选
  return defaultFilters;
}

// 读取列表数据缓存
function readListCache() {
  try {
    return wx.getStorageSync(CACHE_KEY) || null;
  } catch (e) {
    return null;
  }
}

// 写入列表数据缓存
function writeListCache(payload) {
  try {
    wx.setStorageSync(CACHE_KEY, payload);
  } catch (e) {}
}

Page({
  data: {
    rowColsAvater: [{ size: '96rpx', type: 'circle' }],
    rowColsImage: [{ size: '96rpx', type: 'rect' }],
    rowColsContent: [{ width: '50%' }, { width: '100%' }],

    currentTab: 'recommend',
    scrollTop: { recommend: 0, potential: 0 },

    filterStatus: {
      recommend: { type: '', keyword: '', timeRange: '' },
      potential: {
        gender: 'any',
        ageMin: 0,
        ageMax: 60,
        incomeMin: 0,
        incomeMax: 10000,
        constellation: '',
        intents: [],
        cityIds: []
      }
    },

    potentialList: [],
    visibleList: [],
    bufferSize: 5, // 缓冲区大小
    itemHeightPx: util.rpxToPx(ITEM_HEIGHT_RPX),
    itemHeightRpx: ITEM_HEIGHT_RPX,
    translateYPx: 0,
    translateYRpx: 0,
    virtualHeightRpx: 0,

    btnLoading: false,
    isNoNetwork: false,
    navHeaderHeightRpx: 0,
    showFilterPanel: false,
    showSkeleton: false,

    topCandidates: [],
    displayCandidates: [],
    dismissedCardIds: [],

    isRefreshing: false,
    isLoadingMoreCards: false,

    cardTouchStartX: 0,
    cardScrollMetrics: { scrollLeft: 0, scrollWidth: 0 },

    loadError: false,
    isLoading: false,
    page: 1,
    pageSize: 20,
    hasMore: true,

    isRefreshingList: false,
    preloadingNextPage: false,
    preloadThreshold: 400,
    isLoadingMoreError: false
  },

  cachedFullList: null,
  hasCachedFullData: false,
  preloadedData: null, // 预加载的数据
  preloadTimer: null,  // 预加载定时器
  scrollThrottle: null,
  pendingPage: null,

  onLoad() {
    this.checkNetworkStatus();
    this.debouncedTabClick = debounce(this._handleTabClick, 300);
    this.scrollCache = {};

    wx.onNetworkStatusChange((res) => {
      this.setData({ isNoNetwork: !res.isConnected });
    });

    this.cpStatusCheckInterval = setInterval(() => {
      this.checkCpStatus();
    }, 10000);

    const mergedFilters = pickInitialFilters(
      this.data.filterStatus.potential
    );
    this.setData({
      filterStatus: {
        ...this.data.filterStatus,
        potential: mergedFilters
      }
    });
  },

  async onReady() {
    const navHeightRpx = await util.getElementHeight(this, '#navHeader');
    this.setData({ navHeaderHeightRpx: navHeightRpx });

    if (this.data.currentTab === 'potential') {
      this.bootstrapPotentialList();
    }
    this.checkNetworkStatus();
  },

  onShow() {
    if (this.data.currentTab === 'potential') {
      this.clearPreloadState();
      const globalFilters = filterStore.getFilters();
      const currentFilters = this.data.filterStatus.potential;
      if (
        globalFilters &&
        Object.keys(globalFilters).length > 0 &&
        !isFiltersEqual(currentFilters, globalFilters)
      ) {
        this.applyNewFilters(globalFilters);
      }
    }
  },

  onHide() {
    this.persistScrollPositions();
    this.clearPreloadState();
  },

  onUnload() {
    this.persistScrollPositions();
    if (this.cpStatusCheckInterval) {
      clearInterval(this.cpStatusCheckInterval);
    }
    this.clearPreloadState();
    if (this.scrollThrottle) {
      clearTimeout(this.scrollThrottle);
      this.scrollThrottle = null;
    }
    this.cachedFullList = null;
    this.hasCachedFullData = false;
    this.pendingPage = null;
  },

  // 初始化潜在人脉列表（页面就绪/切换到potential tab时触发）
  bootstrapPotentialList() {
    const cached = readListCache();
    if (cached && cached.list && cached.list.length > 0 && 
        isFiltersEqual(cached.filters, this.data.filterStatus.potential)) {
      const isExpired = Date.now() - cached.ts > CACHE_TTL;
      const sliced = cached.list.slice(0, this.data.pageSize);
      const hasMore = cached.hasMore ?? cached.list.length > this.data.pageSize;
      this.setData(
        {
          potentialList: sliced,
          hasMore,
          page: hasMore ? 2 : 1,
          showSkeleton: false,
          loadError: false
        },
        () => {
          this.updateVisibleList(this.scrollCache.potential || 0);
        }
      );
      if (hasMore) {
        this.cachedFullList = cached.list;
        this.hasCachedFullData = true;
      }
      // 缓存过期则强制刷新
      if (isExpired) {
        this.loadPotentialList({ forceRefresh: true, resetPage: !hasMore });
      }
    // 无有效缓存：直接加载第一页
    } else {
      this.setData({ showSkeleton: true });
      this.loadTopCandidates();
      this.loadPotentialList({ forceRefresh: true });
    }
  },

  clearPreloadState() {
    this.preloadedData = null;
    if (this.preloadTimer) {
      clearTimeout(this.preloadTimer);
      this.preloadTimer = null;
    }
  },

  applyNewFilters(newFilters) {
    this.cachedFullList = null;
    this.hasCachedFullData = false;
    this.clearPreloadState();

    this.setData(
      {
        filterStatus: {
          ...this.data.filterStatus,
          potential: newFilters
        },
        page: 1,
        hasMore: true,
        scrollTop: { ...this.data.scrollTop, potential: 0 },
        isLoading: false,
        isLoadingMoreError: false,
        loadError: false
      },
      () => {
        this.setData({ showSkeleton: true });
        wx.setStorageSync(FILTER_CACHE_KEY, newFilters);
        this.loadPotentialList({ forceRefresh: true, resetPage: true });
      }
    );
  },

  // 从缓存的完整列表中加载下一页（优化性能，避免重复请求）
  loadNextPageFromCache() {
    // 是否有完整缓存
    if (!this.hasCachedFullData || !this.cachedFullList) {
      return false;
    }

    // 分页范围计算
    const currentDataLength = this.data.potentialList.length;
    const nextPageStart = currentDataLength;
    const nextPageEnd = currentDataLength + this.data.pageSize;

    const nextPageData = this.cachedFullList.slice(
      nextPageStart,
      nextPageEnd
    );

    // 无更多缓存数据：更新hasMore为false
    if (nextPageData.length === 0) {
      this.setData({ hasMore: false });
      this.hasCachedFullData = false;
      this.cachedFullList = null;
      return false;
    }
    // 拼接缓存数据，更新页面状态
    const newList = [...this.data.potentialList, ...nextPageData];
    const hasMoreData = newList.length < this.cachedFullList.length;

    this.setData(
      {
        potentialList: newList,
        hasMore: hasMoreData,
        page: this.data.page + 1,
        isLoading: false,
        isLoadingMoreError: false
      },
      () => {
        this.updateVisibleList(this.scrollCache.potential || 0);

        // 无更多数据时，更新缓存并清空fullList
        if (!hasMoreData) {
          writeListCache({
            list: newList,
            filters: this.data.filterStatus.potential,
            ts: Date.now(),
            hasMore: false
          });
          this.hasCachedFullData = false;
          this.cachedFullList = null;
        }
      }
    );

    return true;
  },

  checkNetworkStatus() {
    wx.getNetworkType({
      success: (res) =>
        this.setData({ isNoNetwork: res.networkType === 'none' }),
      fail: () => this.setData({ isNoNetwork: true })
    });
  },

  handleTabClick(e) {
    const tab = e.currentTarget.dataset.tab;
    this.debouncedTabClick(tab);
  },

  _handleTabClick(tab) {
    const { currentTab } = this.data;
    if (tab === currentTab) return;

    if (currentTab === 'recommend') {
      this.setData({ btnLoading: false });
    }

    if (tab !== 'potential') {
      this.clearPreloadState();
    }

    const targetTop = this.scrollCache[tab] || 0;
    this.setData({ [`scrollTop.${tab}`]: targetTop });

    this.setData({ currentTab: tab }, () => {
      wx.reportEvent('click_tab', { tab });

      if (tab === 'potential') {
        if (this.data.topCandidates.length === 0) {
          this.loadTopCandidates();
        }
        if (this.data.potentialList.length === 0) {
          this.bootstrapPotentialList();
        } else {
          this.updateVisibleList(targetTop);
        }
      }
    });
  },

  updateVisibleList(scrollTop) {
    const { itemHeightPx, bufferSize, potentialList } = this.data;
    const listLength = potentialList.length;

    if (listLength === 0) {
      this.setData({
        visibleList: [],          // 可视列表清空
        translateYPx: 0,          // 偏移量（像素）设为0
        translateYRpx: 0,         // 偏移量（rpx）设为0
        virtualHeightRpx: 0       // 虚拟容器高度设为0（无滚动条）
      });
      return;
    }

    const totalHeightPx = listLength * itemHeightPx;
    const virtualHeightRpx = util.pxToRpx(totalHeightPx);
    const scrollTopPx = scrollTop - util.rpxToPx(166); // 减去卡片区域的高度
    const { windowHeight } = wx.getWindowInfo();
    const visibleHeight = windowHeight - util.rpxToPx(332) - util.rpxToPx(160) - util.rpxToPx(110) - util.rpxToPx(this.data.navHeaderHeightRpx); // 减去卡片区域和底部导航栏的高度        // console.log(windowHeight);
    
    const startIndex = Math.max(
      0,
      Math.floor(scrollTopPx / itemHeightPx) - bufferSize
    );
    const endIndex = Math.min(
      listLength,
      Math.ceil((scrollTopPx + visibleHeight) / itemHeightPx) + bufferSize
    );
// console.log('scrollTop:', scrollTop, 'itemHeightPx:', itemHeightPx, 'start/end:', startIndex, endIndex);
    const newVisibleList = potentialList.slice(startIndex, endIndex);
    const translateYPx = startIndex * itemHeightPx;
    const translateYRpx = util.pxToRpx(translateYPx);

    if (
      this.hasVisibleListChanged(newVisibleList) ||
      this.data.translateYPx !== translateYPx ||
      this.data.virtualHeightRpx !== virtualHeightRpx
    ) {
      this.setData({
        visibleList: newVisibleList,
        translateYPx,
        translateYRpx,
        virtualHeightRpx
      });
    }
  },

  hasVisibleListChanged(newList) {
    const currentList = this.data.visibleList || [];
    if (currentList.length !== newList.length) {
      return true;
    }
    for (let i = 0; i < newList.length; i += 1) {
      if (currentList[i]?.id !== newList[i]?.id) {
        return true;
      }
    }
    return false;
  },

  handleScroll(e) {
    const tab = e.currentTarget.dataset.tab;
    const top = e.detail?.scrollTop || 0;
    this.scrollCache[tab] = top;

    if (tab === 'potential') {
      if (this.scrollThrottle) {
        clearTimeout(this.scrollThrottle);
      }

      this.scrollThrottle = setTimeout(() => {
        this.updateVisibleList(top);
        this.scrollThrottle = null;
      }, 16);

      if (
        this.data.hasMore &&
        !this.data.isLoading &&
        !this.data.isRefreshingList &&
        !this.pendingPage
      ) {
        const scrollHeight = e.detail?.scrollHeight || 0;
        const { windowHeight } = wx.getWindowInfo();
        const remainPx = scrollHeight - (top + windowHeight + util.rpxToPx(this.data.navHeaderHeightRpx) + 80);

        if (
          remainPx < this.data.preloadThreshold &&
          !this.preloadedData
        ) {
          this.preloadNextPage();
        }

        if (remainPx < 50) {

          // 第一级：完整缓存加载
          if (this.hasCachedFullData) {
            this.setData({ isLoading: true, isLoadingMoreError: false });
            const loadedFromCache = this.loadNextPageFromCache();
            if (loadedFromCache) {
              return;
            }
          }

          // 第二级：预加载数据使用 
          if (this.preloadedData) {
            const newList = [
              ...this.data.potentialList,
              ...this.preloadedData
            ];
            const hasMoreData =
              this.preloadedData.length === this.data.pageSize;

            this.setData(
              {
                potentialList: newList,
                hasMore: hasMoreData,
                page: this.data.page + 1,
                showSkeleton: false,
                isLoading: false,
                isLoadingMoreError: false
              },
              () => {
                writeListCache({
                  list: newList,
                  filters: this.data.filterStatus.potential,
                  ts: Date.now(),
                  hasMore: hasMoreData
                });
                this.updateVisibleList(this.scrollCache.potential || 0);
                wx.reportEvent('load_more', {
                  page: this.data.page - 1,
                  pageSize: this.data.pageSize,
                  fromCache: true
                });
                this.preloadedData = null;
              }
            );
          } else {
            // 第三级：接口加载
            this.loadPotentialList();
          }
        }
      }
    }
  },

  persistScrollPositions() {
    if (Object.keys(this.scrollCache).length > 0) {
      this.setData({ scrollTop: this.scrollCache });
    }
  },

  // 下拉刷新事件处理函数
  handlePullToRefresh() {
    if (this.data.isNoNetwork) {
      wx.showToast({ title: '无网络连接', icon: 'none' });
      this.setData({ isRefreshingList: false });
      return;
    }

    // 刷新前重置状态：清空缓存、清除预加载
    this.cachedFullList = null;
    this.hasCachedFullData = false;
    this.clearPreloadState();

    wx.reportEvent('pull_to_refresh');
    this.setData({
      isRefreshingList: true,
      preloadingNextPage: false,
      isLoadingMoreError: false
    });

    Promise.all([this.refreshTopCandidates(), this.refreshPotentialList()])
      .then(() => {
        this.setData({ isRefreshingList: false });
        wx.showToast({
          title: '刷新成功',
          icon: 'success',
          duration: 1500
        });
      })
      .catch((error) => {
        console.error('下拉刷新失败:', error);
        this.setData({ isRefreshingList: false });
        wx.showToast({
          title: '刷新失败',
          icon: 'none',
          duration: 1500
        });
      });
  },

  triggerSearch() {
    if (this.data.isNoNetwork) {
      wx.showToast({
        title: '无网络连接，请检查网络',
        icon: 'none'
      });
      return;
    }
    if (this.data.btnLoading) return;

    this.setData({ btnLoading: true }, () => {
      wx.reportEvent('view_recommend_loading');
      wx.getNetworkType({
        success: (res) => {
          const isNoNetwork = res.networkType === 'none';
          this.setData({ isNoNetwork });

          if (isNoNetwork) {
            wx.showToast({
              title: '无网络连接，请检查网络',
              icon: 'none'
            });
            this.setData({ btnLoading: false });
            wx.reportEvent('retry_recommend', { reason: 'no_network' });
            return;
          }

          setTimeout(() => {
            const mockSuccess = true;
            const mockHasData = true;

            if (!mockSuccess) {
              wx.showToast({ title: '搜寻失败，请重试', icon: 'none' });
              this.setData({ btnLoading: false });
              return;
            }
            if (!mockHasData) {
              wx.showToast({
                title: '暂无匹配的潜在人脉',
                icon: 'none'
              });
              this.setData({ btnLoading: false });
              return;
            }

            wx.navigateTo({
              url: '/pages/connections/connections',
              success: () => this.setData({ btnLoading: false }),
              fail: () => {
                wx.showToast({
                  title: '跳转失败，请重试',
                  icon: 'none'
                });
                this.setData({ btnLoading: false });
              }
            });
          }, 50);
        },
        fail: () => {
          this.setData({ isNoNetwork: true, btnLoading: false });
          wx.showToast({ title: '网络异常，请重试', icon: 'none' });
        }
      });
    });
  },

  noop() {},

  handleFilterClick() {
    filterStore.setFilters(this.data.filterStatus.potential);
    wx.navigateTo({ url: '/pages/filter/filter' });
  },

  loadTopCandidates() {
    if (this.data.isNoNetwork) {
      wx.showToast({
        title: '无网络，无法加载推荐人',
        icon: 'none',
        duration: 1500
      });
      return;
    }

    if (this.data.isRefreshing) {
      wx.showLoading({ title: '刷新中...', mask: false });
    }

    const { dismissedCardIds } = this.data;
    const filteredCards = mockTopCandidates.filter(
      (card) => !dismissedCardIds.includes(card.id)
    );
    const displayCards = filteredCards.slice(0, 5);

    setTimeout(() => {
      wx.hideLoading();
      this.setData({
        topCandidates: mockTopCandidates,
        displayCandidates: displayCards,
        isRefreshing: false
      });
      wx.reportEvent('view_top_candidates');
    }, 800);
  },

  // 顶部卡片刷新
  refreshTopCandidates() {
    return new Promise((resolve) => {
      this.setData({
        dismissedCardIds: [],
        isRefreshing: true
      });

      setTimeout(() => {
        const filteredCards = mockTopCandidates;
        this.setData({
          topCandidates: mockTopCandidates,
          displayCandidates: filteredCards,
          isRefreshing: false
        });
        resolve();
        wx.reportEvent('pull_to_refresh_top_cards');
      }, 800);
    });
  },

  // 推荐人刷新
  refreshPotentialList() {
    return new Promise((resolve) => {
      this.cachedFullList = null;
      this.hasCachedFullData = false;
      this.clearPreloadState();

      this.setData({
        page: 1,
        hasMore: true,
        isLoading: true,
        showSkeleton: true,
        preloadingNextPage: false,
        isLoadingMoreError: false
      });

      setTimeout(() => {
        try {
          const mockData = this.generateMockData(0, this.data.pageSize);
          this.pendingPage = null;

          this.setData(
            {
              potentialList: mockData,
              loadError: false,
              isLoading: false,
              hasMore: mockData.length === this.data.pageSize,
              page: mockData.length === this.data.pageSize ? 2 : 1,
              ['scrollTop.potential']: 0,
              showSkeleton: false
            },
            () => {
              writeListCache({
                list: mockData,
                filters: this.data.filterStatus.potential,
                ts: Date.now(),
                hasMore: mockData.length === this.data.pageSize
              });
              wx.setStorageSync(
                FILTER_CACHE_KEY,
                this.data.filterStatus.potential
              );
              this.updateVisibleList(0);
              wx.reportEvent('pull_to_refresh_potential_list');
              resolve();
            }
          );
        } catch (error) {
          console.error('刷新潜在人脉列表失败:', error);
          this.pendingPage = null;
          this.setData({
            loadError: true,
            isLoading: false,
            showSkeleton: false
          });
          wx.showToast({
            title: '刷新失败',
            icon: 'none',
            duration: 2000
          });
          resolve();
        }
      }, 1000);
    });
  },

  handleDismissCard(e) {
    const cardId = e.currentTarget.dataset.id;
    const { displayCandidates, dismissedCardIds } = this.data;

    const updatedDisplay = displayCandidates.filter(
      (card) => card.id !== cardId
    );

    this.setData({
      displayCandidates: updatedDisplay,
      dismissedCardIds: [...dismissedCardIds, cardId]
    });

    wx.reportEvent('dismiss_top_card', { id: cardId });
  },

  handleCardClick(e) {
    const cardId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/connections/connections?id=${cardId}`,
      fail: (err) => {
        console.error('卡片跳转失败：', err);
        wx.showToast({ title: '跳转失败', icon: 'none' });
      }
    });

    wx.reportEvent('click_top_card', { id: cardId });
  },

  handleCardScroll(e) {
    const { scrollLeft = 0, scrollWidth = 0, deltaX = 0 } = e.detail || {};
    const { displayCandidates } = this.data;

    this.setData({ cardScrollMetrics: { scrollLeft, scrollWidth } });

    if (displayCandidates.length === 0) {
      return;
    }

    const isNearLeftEnd = scrollLeft <= 5;
    const isNearRightEnd = scrollWidth - scrollLeft <= 370;

    if (isNearLeftEnd && deltaX <= 15 && deltaX > 0) {
      this.loadMoreCandidates('left');
    }
    if (isNearRightEnd && deltaX >= -15 && deltaX < 0) {
      this.loadMoreCandidates('right');
    }
  },

  handleCardTouchStart(e) {
    const touch = e.touches && e.touches[0];
    if (touch) this.setData({ cardTouchStartX: touch.clientX });
  },

  handleCardTouchMove(e) {
    const touch = e.touches && e.touches[0];
    if (!touch) return;

    const startX = this.data.cardTouchStartX || 0;
    const deltaX = touch.clientX - startX;
    const THRESHOLD = 30;

    const { scrollLeft = 0, scrollWidth = 0 } =
      this.data.cardScrollMetrics || {};

    const isNearLeftEnd = scrollLeft <= 5;
    const isNearRightEnd = scrollWidth - scrollLeft <= 370;

    if (isNearLeftEnd && deltaX > THRESHOLD) {
      this.loadMoreCandidates('left');
      this.setData({ cardTouchStartX: touch.clientX });
      return;
    }

    if (isNearRightEnd && deltaX < -THRESHOLD) {
      this.loadMoreCandidates('right');
      this.setData({ cardTouchStartX: touch.clientX });
      return;
    }
  },

  loadMoreCandidates(direction = 'right', count = 5) {
    if (this.data.isLoadingMoreCards) return;
    this.setData({ isLoadingMoreCards: true });

    const dismissed = this.data.dismissedCardIds || [];
    const existingIds = new Set(
      (this.data.displayCandidates || []).map((i) => i.id)
    );

    const available = mockTopCandidates.filter(
      (card) => !dismissed.includes(card.id) && !existingIds.has(card.id)
    );

    if (available.length === 0) {
      wx.showToast({ title: '没有更多推荐了', icon: 'none' });
      this.setData({ isLoadingMoreCards: false });
      return;
    }

    const toAdd =
      direction === 'right'
        ? available.slice(0, count)
        : available.slice(-count);

    wx.showLoading({ title: '加载更多...', mask: false });
    setTimeout(() => {
      wx.hideLoading();
      const { displayCandidates } = this.data;
      const newDisplay =
        direction === 'right'
          ? [...displayCandidates, ...toAdd]
          : [...toAdd, ...displayCandidates];

      this.setData({ displayCandidates: newDisplay, isLoadingMoreCards: false });
      wx.reportEvent('load_more_top_candidates', {
        direction,
        count: toAdd.length
      });
    }, 600);
  },

  handlePotentialItemClick(e) {
    const item = e.currentTarget.dataset.item;
    if (!item) return;

    wx.reportEvent('click_item', { id: item.id });

    wx.navigateTo({
      url: `/pages/connections/connections?id=${item.id}`,
      fail: (err) => {
        console.error('跳转详情页失败:', err);
        wx.showToast({ title: '跳转失败', icon: 'none' });
      }
    });
  },

  handleCpButtonClick(e) {
    const item = e.currentTarget.dataset.item;
    if (!item) {
      console.warn('事件对象中未找到item数据');
      return;
    }
    //第一步：登录校验（核心缺失点）
    const token = wx.getStorageSync('userToken'); // 假设token存在本地缓存
    if (!token) {
      wx.showModal({
        title: '需要登录',
        content: '请先登录后再建立CP关系',
        confirmText: '去登录',
        cancelText: '稍后',
        success: (res) => {
          if (res.confirm) {
            // 引导授权登录（根据项目登录方案选择，示例用wx.getUserProfile）
            wx.getUserProfile({
              desc: '用于建立CP关系',
              success: (profileRes) => {
                // 此处需调用项目的“登录接口”获取token，示例省略接口请求
                wx.request({
                  url: '/api/user/login', // 项目真实登录接口
                  method: 'POST',
                  data: { code: '', userInfo: profileRes.userInfo }, // 需传code（通过wx.login获取）
                  success: (loginRes) => {
                    if (loginRes.data.success && loginRes.data.data.token) {
                      wx.setStorageSync('userToken', loginRes.data.data.token);
                      // 登录成功后，重新触发CP流程
                      this.handleCpButtonClick(e);
                    }
                  },
                  fail: () => wx.showToast({ title: '登录失败，请重试', icon: 'none' })
                });
              }
            });
          }
        }
      });
      return; // 未登录时终止后续流程
    }

    wx.reportEvent('click_cp', { id: item.id });

    if (item.cpEligible === false) {
      const reason = item.cpEligibleReason || '暂时无法建立关系';
      wx.showToast({
        title: reason,
        icon: 'none',
        duration: 2000
      });
      return;
    }

    if (item.cpStatus === 'pending') {
      wx.showToast({
        title: '邀请已发送，请等待对方确认',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    wx.showModal({
      title: '确认建立关系',
      content: `确定要与${item.name}建立CP关系吗？`,
      confirmText: '确定',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.sendCpInvitation(item);
        }
      }
    });
  },

  sendCpInvitation(item) {
    const token = wx.getStorageSync('userToken');
    wx.showLoading({ title: '发送邀请中...', mask: true });

    // 先标记为pending（优化用户感知）
    this.updateItemCpStatus(item.id, 'pending');

    wx.request({
      url: '/circle/cp/create', // 需求指定的接口地址
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // 携带登录态token
      },
      data: { targetId: item.id }, // 传递目标用户ID（需求要求的参数）
      success: (res) => {
        wx.hideLoading();
        // 接口成功处理（需根据项目实际返回格式调整）
        if (res.data.success && res.data.data.cpId) {
          const cpId = res.data.data.cpId; // 接收接口返回的cpId
          wx.showToast({ title: '邀请发送成功', icon: 'success', duration: 1500 });
          
          // 【新增】3. 存储cpId（供后续跳转使用）
          wx.setStorageSync(`cpId_${item.id}`, cpId);
          
          // 【新增】4. 成功后跳转会话/详情页（需求核心缺失点）
          setTimeout(() => {
            wx.navigateTo({
              url: `/pages/cp/chat?cpId=${cpId}` // 跳转会话页（或详情页，根据项目路由调整）
            });
          }, 1500); // 延迟跳转，确保用户看到成功提示
          
          // 埋点：上报成功事件
          wx.reportEvent('cp_invitation_sent', { id: item.id, status: 'success', cpId });
        } else {
          // 接口返回业务错误（如“对方已拒绝过您的邀请”）
          wx.showToast({ title: res.data.message || '发送失败', icon: 'none', duration: 2000 });
          this.updateItemCpStatus(item.id, ''); // 恢复按钮状态
          wx.reportEvent('cp_invitation_sent', { id: item.id, status: 'fail', error: res.data.message });
        }
      },
      fail: (err) => {
        // 网络错误处理
        wx.hideLoading();
        wx.showToast({ title: '网络异常，请重试', icon: 'none', duration: 2000 });
        this.updateItemCpStatus(item.id, ''); // 恢复按钮状态
        wx.reportEvent('cp_invitation_sent', { id: item.id, status: 'fail', error: 'network_error' });
        console.error('CP邀请接口失败:', err);
      }
    });
  },

  updateItemCpStatus(itemId, status) {
    const { potentialList } = this.data;
    const updatedList = potentialList.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          cpStatus: status
        };
      }
      return item;
    });

    this.setData({ potentialList: updatedList }, () => {
      this.updateVisibleList(this.scrollCache.potential || 0);
    });
  },

  checkCpStatus() {
    const { potentialList } = this.data;
    const updatedList = potentialList.map((item) => {
      if (item.cpStatus === 'pending' && Math.random() > 0.7) {
        const cpId = wx.getStorageSync(`cpId_${item.id}`); // 读取之前存储的cpId
        const successMsg = `${item.name}已接受您的CP邀请`;
        wx.showToast({ title: successMsg, icon: 'success', duration: 2000 });

        // 【新增】接受后自动跳转会话页（可选，根据产品需求决定是否自动跳转）
        if (cpId) {
          setTimeout(() => {
            wx.navigateTo({ url: `/pages/cp/chat?cpId=${cpId}` });
          }, 2000);
        }

        return {
          ...item,
          cpStatus: 'success',
          level: '已建立关系',
          desc: '已成功建立CP关系'
        };
      }
      return item;
    });

    this.setData({ potentialList: updatedList }, () => {
      this.updateVisibleList(this.scrollCache.potential || 0);
    });
  },

  handleRetryLoad() {
    this.cachedFullList = null;
    this.hasCachedFullData = false
    this.clearPreloadState();

    this.setData({
      loadError: false,
      page: 1,
      hasMore: true,
      showSkeleton: true,
      isLoading: false,
      isLoadingMoreError: false
    });
    this.loadPotentialList({ forceRefresh: true, resetPage: true });
  },

  retryLoadMore() {
    if (this.pendingPage || this.data.isLoading) return;
    const retryPage = this.data.page;
    this.loadPotentialList({ retryPage });
  },

  preloadNextPage() {
    if (
      this.data.preloadingNextPage ||
      this.data.isLoading ||
      !this.data.hasMore ||
      this.data.isRefreshingList ||
      this.pendingPage
    ) {
      return;
    }

    this.setData({ preloadingNextPage: true });

    const startIndex = this.data.page * this.data.pageSize;
    const mockData = this.generateMockData(startIndex, this.data.pageSize);

    this.preloadedData = mockData;

    this.setData({ preloadingNextPage: false });

    wx.reportEvent('preload_complete', {
      page: this.data.page,
      count: mockData.length
    });
  },

  loadPotentialList(options = {}) {
    const {
      forceRefresh = false,  // 强制刷新，忽略缓存
      resetPage = false,   // 重置到第一页
      retryPage = null  // 重试特定页码
    } = options;

    // 防重复加载：正在加载/无更多数据（非重试场景）则拦截
    if ((this.data.isLoading && !retryPage) || (!this.data.hasMore && !retryPage)) return;
    if (this.pendingPage && !retryPage) return;

    // 确定当前要加载的页码（重置/刷新时页码=1，默认加载当前page）
    const currentPage = retryPage || (forceRefresh || resetPage ? 1 : this.data.page);
    this.pendingPage = currentPage;

    // 显示加载状态（第一页加载显示骨架屏，后续页显示“加载中”）
    if (currentPage === 1) {
      this.setData({
        isLoading: true,
        loadError: false,
        showSkeleton: forceRefresh || resetPage
      });
    } else {
      this.setData({ isLoading: true, isLoadingMoreError: false });
    }

    setTimeout(() => {
      try {
        const startIndex = (currentPage - 1) * this.data.pageSize;
        const mockData = this.generateMockData(startIndex,this.data.pageSize);

        const newList = currentPage === 1 ? mockData : [...this.data.potentialList, ...mockData];
        const hasMoreData = mockData.length === this.data.pageSize;

        this.pendingPage = null;
        this.setData(
          {
            potentialList: newList,
            isLoading: false,
            hasMore: hasMoreData,
            page:
              currentPage === 1
                ? hasMoreData
                  ? 2
                  : 1
                : currentPage + 1,
            showSkeleton: false,
            loadError: currentPage === 1 ? false : this.data.loadError,
            isLoadingMoreError: false
          },
          () => {
            writeListCache({
              list: newList,
              filters: this.data.filterStatus.potential,
              ts: Date.now(),
              hasMore: hasMoreData
            });

            if (currentPage === 1) {
              wx.setStorageSync(
                FILTER_CACHE_KEY,
                this.data.filterStatus.potential
              );
              this.scrollCache.potential = 0;
              this.setData({ ['scrollTop.potential']: 0 });
            }

            this.updateVisibleList(this.scrollCache.potential || 0);

            wx.reportEvent('load_more', {
              page: currentPage,
              pageSize: this.data.pageSize,
              fromCache: false
            });

            // if (hasMoreData) {
            //   this.clearPreloadState();
            //   this.preloadTimer = setTimeout(() => {
            //     this.preloadNextPage();
            //   }, 1000);
            // }
          }
        );
      } catch (error) {
        console.error('加载潜在人脉列表失败:', error);
        this.pendingPage = null;

        if (currentPage === 1) {
          this.setData({
            loadError: true,
            isLoading: false,
            showSkeleton: false
          });
        } else {
          this.setData({ isLoading: false, isLoadingMoreError: true });
        }
      }
    }, 800);
  },

  generateMockData(startIndex = 0, count = 20) {
    const names = [
      '张伟', '王芳', '李娜', '刘洋', '陈静', '杨磊', '赵雪', '黄强',
      '周敏', '吴勇', '郑洁', '孙浩', '马丽', '朱涛', '胡军', '林芳',
      '郭静', '何伟', '高婷', '罗强', '梁艳', '谢明', '宋佳', '唐磊',
      '董洁', '袁伟', '邓丽', '许强', '韩梅', '冯军', '曹静', '彭涛',
      '曾艳', '肖明', '田芳', '董军', '潘静', '董涛', '余艳', '杜明'
    ];
    const cities = [
      '北京', '上海', '深圳', '广州', '杭州', '成都', '武汉', '西安'
    ];
    const descriptions = [
      '2位共同同事', '3位共同同学', '1位共同好友', '4位共同群成员',
      '同一行业从业者', '参加过同一活动', '有共同兴趣爱好', '居住在同一区域',
      '毕业于同一学校', '曾在同一公司工作', '有共同客户', '同一社团成员'
    ];

    return Array.from({ length: count }, (_, index) => {
      const globalIndex = startIndex + index;
      const nameIndex = globalIndex % names.length;
      const hasAge = globalIndex % 7 !== 0;
      const mutualCount = 1 + (globalIndex % 15);
      const isCpEligible = globalIndex % 6 !== 0;

      const descIndex = globalIndex % descriptions.length;
      let desc = descriptions[descIndex];
      if (descIndex < 4 && mutualCount > 1) {
        desc = `${mutualCount}${desc.replace(/\d+/, '')}`;
      }

      return {
        id: globalIndex + 1,
        avatar: `https://picsum.photos/id/${(globalIndex % 70) + 100}/200/200`,
        name: names[nameIndex],
        age: hasAge ? 20 + (globalIndex % 25) : null,
        level: globalIndex % 3 === 0 ? '2级人脉' : '3级人脉',
        mutualCount,
        desc,
        city: cities[globalIndex % cities.length],
        cpEligible: isCpEligible,
        cpEligibleReason: isCpEligible ? '' : '今日邀请次数已达上限',
        cpStatus: ''
      };
    });
  }
});