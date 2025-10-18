const util = require('../../utils/util.js');

// 测试数据：15条推荐人卡片数据（无需后端接口，直接使用）
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
  { id: 10, avatar: 'https://picsum.photos/id/73/200/200', name: '吴泽宇', summary: '2位共同邻居', mutualCount: 2 },
  { id: 11, avatar: 'https://picsum.photos/id/74/200/200', name: '郑欣怡', summary: '3位共同兴趣好友', mutualCount: 3 },
  { id: 12, avatar: 'https://picsum.photos/id/75/200/200', name: '马浩然', summary: '6位共同合作伙伴', mutualCount: 6 },
  { id: 13, avatar: 'https://picsum.photos/id/76/200/200', name: '孙思妍', summary: '4位共同培训同学', mutualCount: 4 },
  { id: 14, avatar: 'https://picsum.photos/id/77/200/200', name: '朱雨辰', summary: '1位共同家人的朋友', mutualCount: 1 },
  { id: 15, avatar: 'https://picsum.photos/id/78/200/200', name: '胡艺馨', summary: '5位共同志愿者伙伴', mutualCount: 5 }
];

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

Page({
  data: {
    currentTab: 'potential',
    scrollTop: { recommend: 0, potential: 0 },
    scrollCache: { recommend: 0, potential: 0 },
    filterStatus: {
      recommend: { type: '', keyword: '', timeRange: '' },
      potential: { type: '', area: '', company: '' }
    },
    potentialList: [],
    btnLoading: false,
    isNoNetwork: false,
    navHeaderHeightRpx: 0,
    showFilterPanel: false,
    topCandidates: [], // 存储完整数据（测试/真实接口）
    displayCandidates: [], // 展示用（过滤已移除项，最多10个）
    dismissedCardIds: [], // 已移除卡片ID（会话级）
    isRefreshing: false,
    lastScrollLeft: 0, // 记录上一次的scrollLeft
    // === 新增字段 ===
    cardTouchStartX: 0,
    cardScrollMetrics: { scrollLeft: 0, clientWidth: 0, scrollWidth: 0 },
    isLoadingMoreCards: false, // 防止重复加载更多
  },

  onLoad() {
    this.checkNetworkStatus();
    this.debouncedTabClick = debounce(this._handleTabClick, 300);
    this.scrollCache = {};
    // 监听网络状态变化（优化体验：网络恢复时自动更新状态）
    wx.onNetworkStatusChange((res) => {
      this.setData({ isNoNetwork: !res.isConnected });
    });
  },

  async onReady() {
    // 获取导航栏高度（适配不同设备）
    const navHeightRpx = await util.getElementHeight(this, '#navHeader');
    this.setData({ navHeaderHeightRpx: navHeightRpx });
    // 初始进入潜在人脉页时加载卡片
    if (this.data.currentTab === 'potential') {
      this.loadTopCandidates();
    }
    this.checkNetworkStatus();
  },

  // 切换到潜在人脉Tab时加载数据（避免重复加载）
  onTabShow(tab) {
    if (tab === 'potential' && this.data.topCandidates.length === 0) {
      this.loadTopCandidates();
    }
  },

  // 检查网络状态（更新isNoNetwork状态）
  checkNetworkStatus() {
    wx.getNetworkType({
      success: (res) => this.setData({ isNoNetwork: res.networkType === 'none' }),
      fail: () => this.setData({ isNoNetwork: true })
    });
  },

  // Tab切换处理（防抖避免频繁切换）
  handleTabClick(e) {    
    const tab = e.currentTarget.dataset.tab;
    this.debouncedTabClick(tab);
  },

  _handleTabClick(tab) {
    const { currentTab, filterStatus } = this.data;
    if (tab === currentTab) return;

    // 切换回推荐页时，重置加载按钮状态
    if (currentTab === 'recommend') {
      this.setData({ btnLoading: false });
    }

    // --- 核心修改点 ---

    // 1. 先将目标 Tab 的滚动位置从缓存更新到 data 中
    //    确保即将要渲染的 scroll-view 能拿到正确的 scroll-top 值
    const targetTop = this.scrollCache[tab] || 0;
    this.setData({ [`scrollTop.${tab}`]: targetTop });

    // 2. 再切换 currentTab
    this.setData({ currentTab: tab }, () => {
      wx.reportEvent('click_tab', { tab });
      
      // 3. 切换后，强制触发一次滚动，解决值相同不滚动的问题
      this.setData({ [`scrollTop.${tab}`]: -1 }, () => {
        setTimeout(() => {
          this.setData({ [`scrollTop.${tab}`]: targetTop });
        }, 0);
      });

      // 4. 加载数据
      if (tab === 'potential') {
        if (this.data.topCandidates.length === 0) {
          this.loadTopCandidates();
        }
        this.loadTabContent('potential', filterStatus[tab]);
      }
    });
  },


  // 主内容区滚动位置缓存（减少setData调用，优化性能）
  handleScroll(e) {
    const tab = e.currentTarget.dataset.tab;
    const top = e.detail?.scrollTop || 0;
    this.scrollCache[tab] = top;
  },

  // 页面隐藏/卸载时保存滚动位置（恢复时保持浏览位置）
  onHide() {
    this.persistScrollPositions();
  },
  onUnload() {
    this.persistScrollPositions();
  },
  persistScrollPositions() {
    if (Object.keys(this.scrollCache).length > 0) {
      this.setData({ scrollTop: this.scrollCache });
    }
  },

  // 推荐页搜寻逻辑（模拟跳转）
  triggerSearch() {
    if (this.data.isNoNetwork) {
      wx.showToast({ title: '无网络连接，请检查网络', icon: 'none' });
      return;
    }
    if (this.data.btnLoading) return;

    this.setData({ btnLoading: true }, () => {
      // 埋点：触发推荐搜寻
      wx.reportEvent('view_recommend_loading');
      wx.getNetworkType({
        success: (res) => {
          const isNoNetwork = res.networkType === 'none';
          this.setData({ isNoNetwork });

          if (isNoNetwork) {
            wx.showToast({ title: '无网络连接，请检查网络', icon: 'none' });
            this.setData({ btnLoading: false });
            wx.reportEvent('retry_recommend', { reason: 'no_network' });
            return;
          }

          // 模拟搜寻延迟（模拟接口耗时）
          setTimeout(() => {
            const mockSuccess = true;
            const mockHasData = true;

            if (!mockSuccess) {
              wx.showToast({ title: '搜寻失败，请重试', icon: 'none' });
              this.setData({ btnLoading: false });
              return;
            }
            if (!mockHasData) {
              wx.showToast({ title: '暂无匹配的潜在人脉', icon: 'none' });
              this.setData({ btnLoading: false });
              return;
            }

            // 跳转人脉详情页（替换为你的实际页面路径）
            wx.navigateTo({
              url: '/pages/connections/connections',
              success: () => this.setData({ btnLoading: false }),
              fail: () => {
                wx.showToast({ title: '跳转失败，请重试', icon: 'none' });
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

  // 筛选逻辑（模拟筛选弹窗）
  handleFilterClick() {
    const { currentTab, filterStatus } = this.data;
    wx.showModal({
      title: `${currentTab === 'recommend' ? '推荐' : '潜在人脉'}筛选`,
      content: this.formatFilterContent(currentTab, filterStatus[currentTab]),
      confirmText: '确认筛选',
      cancelText: '重置筛选',
      success: (res) => {
        if (res.confirm) {
          const newFilter = this.getMockNewFilter(currentTab);
          this.updateFilterAndReload(currentTab, newFilter);
        } else if (res.cancel) {
          this.updateFilterAndReload(currentTab, this.getEmptyFilter(currentTab));
        }
      }
    });
  },

  // 格式化筛选内容（展示当前筛选条件）
  formatFilterContent(tab, filter) {
    let content = '当前筛选：\n';
    if (tab === 'recommend') {
      content += `类型：${filter.type || '无'}\n关键词：${filter.keyword || '无'}\n时间范围：${filter.timeRange || '无'}`;
    } else {
      content += `人脉类型：${filter.type || '无'}\n地区：${filter.area || '无'}\n公司：${filter.company || '无'}`;
    }
    return content;
  },

  // 模拟筛选条件（确认筛选时使用）
  getMockNewFilter(tab) {
    return tab === 'recommend'
      ? { type: '最新', keyword: '技术', timeRange: '近7天' }
      : { type: '同事', area: '北京', company: '某科技公司' };
  },

  // 清空筛选条件（重置筛选时使用）
  getEmptyFilter(tab) {
    return tab === 'recommend'
      ? { type: '', keyword: '', timeRange: '' }
      : { type: '', area: '', company: '' };
  },

  // 更新筛选条件并重新加载列表
  updateFilterAndReload(tab, newFilter) {
    this.setData({
      [`filterStatus.${tab}`]: newFilter,
      [`scrollTop.${tab}`]: 0 // 筛选后回到顶部
    }, () => {
      if (tab === 'potential') this.loadTabContent(tab, newFilter);
    });
  },

  // 加载潜在人脉列表（模拟数据）
  loadTabContent(tab, filterParams) {
    this.checkNetworkStatus();
    if (this.data.isNoNetwork) return;

    wx.getNetworkType({
      success: (res) => {
        if (res.networkType === 'none') {
          this.setData({ isNoNetwork: true });
          return;
        }

        // 模拟列表加载延迟
        setTimeout(() => {
          let mockData = [];
          // 根据筛选条件返回不同模拟数据（示例：筛选北京地区时返回15条）
          if (tab === 'potential' && filterParams.area === '北京') {
            mockData = Array.from({ length: 15 }, (_, i) => ({
              id: i, name: `北京人脉-${i}`, company: filterParams.company || '未知公司'
            }));
          } else {
            mockData = Array.from({ length: 20 }, (_, i) => ({ id: i }));
          }
          this.setData({ [`${tab}List`]: mockData });
        }, 100);
      },
      fail: () => this.setData({ isNoNetwork: true }) 
    });
  },

  // 顶部推荐人卡片核心逻辑
  loadTopCandidates() {
    console.log('当前网络状态 isNoNetwork：', this.data.isNoNetwork);
    
    // 无网络时直接提示，终止加载
    if (this.data.isNoNetwork) {
      wx.showToast({ title: '无网络，无法加载推荐人', icon: 'none', duration: 1500 });
      return;
    }

    // 刷新时显示加载提示（提升用户感知）
    if (this.data.isRefreshing) {
      wx.showLoading({ title: '刷新中...', mask: false });
    }

    // ==============================================
    // 【当前使用：测试数据逻辑】（无需后端接口）
    // 后续有真实接口时，注释这部分，解开下方"真实接口逻辑"即可
    // ==============================================
    const { dismissedCardIds } = this.data;
    // 1. 从测试数据中过滤已移除的卡片（避免重复显示已删除项）
    const filteredCards = mockTopCandidates.filter(card => !dismissedCardIds.includes(card.id));
    // 2. 最多展示10个卡片（符合需求限制）
    const displayCards = filteredCards.slice(0, 10);

    // 模拟接口请求延迟（800ms，模拟真实网络耗时）
    setTimeout(() => {
      wx.hideLoading(); // 关闭加载提示
      this.setData({
        topCandidates: mockTopCandidates, // 存储完整测试数据
        displayCandidates: displayCards,  // 存储待展示的10个卡片
        isRefreshing: false // 重置刷新状态
      });
      // 埋点：推荐人卡片加载成功（查看事件）
      wx.reportEvent('view_top_candidates');
      console.log('测试数据加载成功，当前展示', displayCards.length, '条推荐人卡片');
    }, 800);

    // ==============================================
    // 【后续使用：真实接口逻辑】（需配置后端接口）
    // 步骤1：注释上方"测试数据逻辑"；步骤2：解开下方注释；步骤3：替换apiUrl为你的真实接口地址
    // ==============================================
    /*
    // 1. 配置真实接口地址（注意：需在小程序后台配置"合法request域名"）
    const apiUrl = '/circle/potential/top'; // 相对路径（推荐，自动拼接当前环境域名）
    // const apiUrl = 'https://你的后端域名/circle/potential/top'; // 完整路径（备选）

    // 2. 发起真实接口请求
    wx.request({
      url: apiUrl,
      method: 'GET', // 接口请求方法（与后端一致，通常为GET）
      data: { 
        dismissedCardIds: this.data.dismissedCardIds, // 携带已移除卡片ID，后端可按需过滤
        pageSize: 10 // 按需传参：请求10条数据（符合最多展示10个的需求）
      },
      timeout: 5000, // 超时时间（5秒，避免长时间无响应）
      success: (res) => {
        wx.hideLoading(); // 关闭加载提示
        console.log('真实接口返回数据：', res);

        // 接口业务成功（根据后端约定，通常res.data.success为true）
        if (res.data?.success) {
          const rawCards = res.data.data || []; // 后端返回的完整推荐人数据
          const { dismissedCardIds } = this.data;

          // 3. 过滤已移除卡片 + 最多展示10个
          const filteredCards = rawCards.filter(card => !dismissedCardIds.includes(card.id));
          const displayCards = filteredCards.slice(0, 10);

          // 4. 更新页面数据
          this.setData({
            topCandidates: rawCards, // 存储后端返回的完整数据
            displayCandidates: displayCards, // 存储待展示的10个卡片
            isRefreshing: false // 重置刷新状态
          });

          // 埋点：推荐人卡片加载成功（查看事件）
          wx.reportEvent('view_top_candidates');
          console.log('真实接口加载成功，当前展示', displayCards.length, '条推荐人卡片');
        } else {
          // 接口业务失败（如参数错误、无权限等，后端返回success: false）
          wx.showToast({ 
            title: `加载失败：${res.data?.msg || '后端业务错误'}`, 
            icon: 'none', 
            duration: 2000 
          });
          this.setData({ isRefreshing: false });
        }
      },
      fail: (err) => {
        // 接口请求失败（如网络中断、域名未配置、超时等）
        wx.hideLoading();
        wx.showToast({ title: '网络异常，加载失败', icon: 'none', duration: 1500 });
        this.setData({ isRefreshing: false });
        // 打印错误详情，方便排查问题（如域名未配置、接口路径错误等）
        console.error('推荐人卡片真实接口请求失败：', err);
      }
    });
    */
  },

  // 移除推荐人卡片（会话级，移除后不再出现）
  handleDismissCard(e) {
    const cardId = e.currentTarget.dataset.id;
    const { displayCandidates, dismissedCardIds } = this.data;

    // 仅从"展示列表"中移除，不自动补充新数据（符合需求）
    const updatedDisplay = displayCandidates.filter(card => card.id !== cardId);

    this.setData({
      displayCandidates: updatedDisplay,
      dismissedCardIds: [...dismissedCardIds, cardId] // 记录已移除ID，后续过滤用
    });

    // 埋点：移除推荐人卡片事件
    wx.reportEvent('dismiss_top_card', { id: cardId });
    console.log(`已移除卡片ID：${cardId}，剩余展示卡片数：${updatedDisplay.length}`);
  },

  // 滑动到【真正滑不动的尽头】才触发刷新（彻底解决随便滑就刷新的问题）
handleCardScroll(e) {
  const { scrollLeft = 0, clientWidth = 0, scrollWidth = 0 } = e.detail || {};
  const { isRefreshing, displayCandidates, lastScrollLeft } = this.data;
  
  // 更新滚动指标，供 touch 事件使用
  this.setData({ cardScrollMetrics: { scrollLeft, clientWidth, scrollWidth } });

  // 基础防护：无卡片/正在刷新，不处理刷新逻辑
  if (displayCandidates.length === 0 || isRefreshing) {
    this.setData({ lastScrollLeft: scrollLeft });
    return;
  }

  const scrollChange = Math.abs(scrollLeft - lastScrollLeft);
  const currentDirection = scrollLeft - lastScrollLeft;
  const isNearLeftEnd = scrollLeft <= 5;
  const isNearRightEnd = (scrollLeft + clientWidth) >= (scrollWidth - 5);

  const shouldRefresh = (
    (isNearLeftEnd && currentDirection <= 0 && scrollChange <= 3) ||
    (isNearRightEnd && currentDirection >= 0 && scrollChange <= 3)
  );

  if (shouldRefresh) {
    this.setData({ isRefreshing: true });
    this.loadTopCandidates();
  }

  this.setData({ lastScrollLeft: scrollLeft });
},

// 点击推荐人卡片进入详情页
handleCardClick(e) {
  const cardId = e.currentTarget.dataset.id;
  // 跳转详情页（替换为你的实际详情页路径，携带卡片ID）
  wx.navigateTo({ 
    url: `/pages/connections/connections?id=${cardId}`,
    // 新增：捕获跳转失败原因
    fail: (err) => {
      console.error('卡片跳转失败：', err); // 打印错误详情
      wx.showToast({ title: '跳转失败，请检查页面配置', icon: 'none' });
    }
  });
  
  // 埋点：点击推荐人卡片事件（携带卡片ID，便于统计）
  wx.reportEvent('click_top_card', { id: cardId });
  console.log(`点击推荐人卡片，ID：${cardId}，跳转详情页`);
},

  // === 新增触摸事件处理：记录起点、根据向外滑动判断触发左右加载更多 ===
handleCardTouchStart(e) {
  const touch = e.touches && e.touches[0];
  if (touch) this.setData({ cardTouchStartX: touch.clientX });
},

handleCardTouchMove(e) {
  const touch = e.touches && e.touches[0];
  if (!touch) return;

  const startX = this.data.cardTouchStartX || 0;
  const deltaX = touch.clientX - startX; // 正=向右滑，负=向左滑
  const THRESHOLD = 30; // px 阈值，手势意图判定

  const { scrollLeft = 0, clientWidth = 0, scrollWidth = 0 } = this.data.cardScrollMetrics || {};

  const isNearLeftEnd = scrollLeft <= 5;
  const isNearRightEnd = (scrollLeft + clientWidth) >= (scrollWidth - 5);

  // 左边缘并且用户向右继续滑（deltaX > THRESHOLD）：加载左侧更多（prepend）
  if (isNearLeftEnd && deltaX > THRESHOLD) {
    this.loadMoreCandidates('left');
    // 防止短时间内多次触发，重置起点
    this.setData({ cardTouchStartX: touch.clientX });
    return;
  }

  // 右边缘并且用户向左继续滑（deltaX < -THRESHOLD）：加载右侧更多（append）
  if (isNearRightEnd && deltaX < -THRESHOLD) {
    this.loadMoreCandidates('right');
    this.setData({ cardTouchStartX: touch.clientX });
    return;
  }
},

handleCardTouchEnd() {
  // 触摸结束时不需要特殊处理，保留以备扩展
},

  // === 新增：根据方向加载更多卡片（从 mockTopCandidates 中补充，避免重复与已移除） ===
loadMoreCandidates(direction = 'right', count = 5) {
  if (this.data.isLoadingMoreCards) return;
  this.setData({ isLoadingMoreCards: true });

  const dismissed = this.data.dismissedCardIds || [];
  const existingIds = new Set((this.data.displayCandidates || []).map(i => i.id));

  // 可用源：从 mockTopCandidates 过滤（如果后端真实接口，请改为请求）
  const available = mockTopCandidates.filter(card => !dismissed.includes(card.id) && !existingIds.has(card.id));

  if (available.length === 0) {
    wx.showToast({ title: '没有更多推荐了', icon: 'none' });
    this.setData({ isLoadingMoreCards: false });
    return;
  }

  // 取 count 条，右侧追加，左侧前置（可根据需求调整）
  const toAdd = direction === 'right'
    ? available.slice(0, count)
    : available.slice(-count);

  // 模拟网络延迟，提供视觉反馈
  wx.showLoading({ title: '加载更多...', mask: false });
  setTimeout(() => {
    wx.hideLoading();
    const { displayCandidates } = this.data;
    let newDisplay;
    if (direction === 'right') {
      newDisplay = [...displayCandidates, ...toAdd];
    } else {
      newDisplay = [...toAdd, ...displayCandidates];
    }
    // 更新展示列表并清除加载锁
    this.setData({ displayCandidates: newDisplay, isLoadingMoreCards: false });
    wx.reportEvent('load_more_top_candidates', { direction, count: toAdd.length });
  }, 600);
},
});