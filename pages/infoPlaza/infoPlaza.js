const util = require('../../utils/util.js');
Page({
  data: {
    navHeaderHeightRpx: 172,
    currentTab: 'outCircle',
    dynamicList: {
      inCircle: [],
      outCircle: []
    },
    scrollTop: {
      inCircle: 0,
      outCircle: 0
    },
    tempScrollTop: 0,
    // Tab切换防抖定时器
    debounceTimer: null,
    inputValue: '',
    isFocus: false,
    hasNetwork: true,
    pageConfig: {
      inCircle: { pageNum: 1, pageSize: 10, hasMore: true },
      outCircle: { pageNum: 1, pageSize: 10, hasMore: true }
    },
    // 加载状态（避免重复请求）
    isLoading: {
      inCircle: false,
      outCircle: false
    },
    // 骨架屏状态（首屏加载中显示）
    isSkeletonLoading: {
      inCircle: true,
      outCircle: false
    }
  },

  onLoad(options) {
    // 检查初始网络状态
    this.checkNetworkStatus();
    // 监听网络状态变化
    wx.onNetworkStatusChange((res) => {
      this.setData({ hasNetwork: res.isConnected });
      // 网络恢复时刷新当前Tab数据
      if (res.isConnected) {
        this.loadDynamicList(this.data.currentTab, true);
      }
    });
  },

  async onReady() {
    const navHeaderHeightRpx = await util.getElementHeight(this, '#navHeader');
    this.setData({ navHeaderHeightRpx });
    // 加载默认Tab（圈内）数据
    this.loadDynamicList(this.data.currentTab, true);
  },

  // 页面卸载时清理
  onUnload() {
    // 保存最后滚动位置
    const { currentTab, tempScrollTop } = this.data;
    this.setData({ [`scrollTop.${currentTab}`]: tempScrollTop });
    // 清除定时器
    if (this.data.debounceTimer) clearTimeout(this.data.debounceTimer);
    if (this.data.searchTimer) clearTimeout(this.data.searchTimer);
  },

  //Tab切换事件（防抖处理）
  handleTabClick(e) {
    const targetTab = e.currentTarget.dataset.tab;
    const { currentTab, debounceTimer, tempScrollTop, dynamicList, pageConfig } = this.data;

    if (targetTab === currentTab) return;

    if (debounceTimer) clearTimeout(debounceTimer);
    const newTimer = setTimeout(() => {
      this.setData({ [`scrollTop.${currentTab}`]: tempScrollTop }, () => {
        wx.reportEvent('click_circle_tab', {
          tab: targetTab === 'inCircle' ? 'inner' : 'outer'
        });

        this.setData({
          currentTab: targetTab,
          tempScrollTop: this.data.scrollTop[targetTab] || 0
        });

        // 优化：只有当目标Tab“未加载过数据”（pageNum=1且列表为空）时，才显示骨架屏
        const targetList = dynamicList[targetTab];
        const hasLoaded = pageConfig[targetTab].pageNum > 1; 
        if (targetList.length === 0 && !hasLoaded) {
          this.setData({ [`isSkeletonLoading.${targetTab}`]: true });
          this.loadDynamicList(targetTab, true);
        }
      });
    }, 300);

    this.setData({ debounceTimer: newTimer });
  },

  /**
   * 加载动态列表数据（核心方法）
   * @param {string} tab - 目标Tab（inCircle/outCircle）
   * @param {boolean} isRefresh - 是否下拉刷新（重置分页）
   */
  async loadDynamicList(tab, isRefresh = false) {
    const { hasNetwork, pageConfig, isLoading, inputValue } = this.data;

    // 前置校验
    if (!hasNetwork) return;
    if (isLoading[tab]) return;
    if (!isRefresh && !pageConfig[tab].hasMore) return;

    // 设置加载状态
    this.setData({ [`isLoading.${tab}`]: true });

    // 新增：记录骨架屏开始显示时间
    const skeletonStartTime = Date.now();
    // 最小骨架屏显示时间（300ms，可调整）
    const minSkeletonTime = 300;

    try {
      const config = pageConfig[tab];
      const params = {
        type: tab === 'inCircle' ? 'cp' : 'recommend',
        page: isRefresh ? 1 : config.pageNum,
        size: config.pageSize,
        keyword: inputValue.trim()
      };

      const res = await wx.request({
        url: '/circle/moments',
        method: 'GET',
        data: params,
        header: { 'content-type': 'application/json' }
      });

      // 新增：计算骨架屏已显示时间，不足300ms则等待补足
      const skeletonDuration = Date.now() - skeletonStartTime;
      if (skeletonDuration < minSkeletonTime) {
        await new Promise(resolve => setTimeout(resolve, minSkeletonTime - skeletonDuration));
      }

      if (res.statusCode === 200 && res.data.success) {
        const newData = res.data.data.list || [];
        const total = res.data.data.total || 0;
        const hasMore = (isRefresh ? 1 : config.pageNum) * config.pageSize < total;

        this.setData({
          [`dynamicList.${tab}`]: isRefresh ? newData : [...this.data.dynamicList[tab], ...newData],
          [`pageConfig.${tab}.pageNum`]: isRefresh ? 2 : config.pageNum + 1,
          [`pageConfig.${tab}.hasMore`]: hasMore,
          [`isSkeletonLoading.${tab}`]: false // 延迟隐藏骨架屏
        });

        // 埋点逻辑不变...
      } else {
        // 接口错误时也需等待最小骨架屏时间
        const skeletonDuration = Date.now() - skeletonStartTime;
        if (skeletonDuration < minSkeletonTime) {
          await new Promise(resolve => setTimeout(resolve, minSkeletonTime - skeletonDuration));
        }
        wx.showToast({ title: '数据加载失败', icon: 'none', duration: 2000 });
        this.setData({ [`isSkeletonLoading.${tab}`]: false });
      }
    } catch (err) {
      // 网络错误时也需等待最小骨架屏时间
      const skeletonDuration = Date.now() - skeletonStartTime;
      if (skeletonDuration < minSkeletonTime) {
        await new Promise(resolve => setTimeout(resolve, minSkeletonTime - skeletonDuration));
      }
      wx.showToast({ title: '网络请求异常', icon: 'none', duration: 2000 });
      this.setData({ [`isSkeletonLoading.${tab}`]: false });
    } finally {
      this.setData({ [`isLoading.${tab}`]: false });
      wx.stopPullDownRefresh();
    }
  },

  /**
   * 监听列表滚动（记录实时位置）
   */
  onListScroll(e) {
    this.setData({ tempScrollTop: e.detail.scrollTop });
  },

  /**
   * 上拉触底加载更多
   */
  onReachBottom() {
    const currentTab = this.data.currentTab;
    this.loadDynamicList(currentTab, false);
  },

  /**
   * 下拉刷新
   */
  onPullRefresh() {
    const currentTab = this.data.currentTab;
    this.loadDynamicList(currentTab, true);
  },

  /**
   * 下拉刷新完成回调
   */
  onRefresherRestore() {
    wx.stopPullDownRefresh();
  },


  onFocus() {
    this.setData({ isFocus: true });
  },

  onBlur() {
    this.setData({ isFocus: false });
  },

  // 重新加载列表
  refreshList() {
    this.checkNetworkStatus();
    if (this.data.hasNetwork) {
      const currentTab = this.data.currentTab;
      this.setData({
        [`pageConfig.${currentTab}.pageNum`]: 1,
        [`pageConfig.${currentTab}.hasMore`]: true,
        [`isSkeletonLoading.${currentTab}`]: true
      });
      this.loadDynamicList(currentTab, true);
    }
  },
  
  // 检查网络状态
  checkNetworkStatus() {
    wx.getNetworkType({
      success: (res) => {
        this.setData({ hasNetwork: res.networkType !== 'none' });
      }
    });
  },

});