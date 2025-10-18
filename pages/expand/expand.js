const util = require('../../utils/util.js');

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
    currentTab: 'recommend',
    scrollTop: { recommend: 0, potential: 0 },
    filterStatus: {
      recommend: { type: '', keyword: '', timeRange: '' },
      potential: { type: '', area: '', company: '' }
    },
    potentialList: [],
    btnLoading: false,
    isNoNetwork: false,
    navHeaderHeightRpx: 0,
    showFilterPanel: false,
    topCandidates: [
          { id: 1, avatar: '../../assets/image/1028c3c7f8a19900d55630f214fa7c3b.jpg', name: '宋子彤', summary: '6位共同同学', mutualCount: 6 },
          { id: 2, avatar: '../../assets/image/1028c3c7f8a19900d55630f214fa7c3b.jpg', name: '李浩然', summary: '5位共同同事', mutualCount: 5 },
          { id: 3, avatar: '../../assets/image/1028c3c7f8a19900d55630f214fa7c3b.jpg', name: '张思语', summary: '4位共同朋友', mutualCount: 4 },
          // { id: 4, avatar: '../../assets/image/1028c3c7f8a19900d55630f214fa7c3b.jpg', name: '张思文', summary: '4位共同朋友', mutualCount: 4 },
          // { id: 5, avatar: '../../assets/image/1028c3c7f8a19900d55630f214fa7c3b.jpg', name: '张思数', summary: '4位共同朋友', mutualCount: 4 },
          // { id: 6, avatar: '../../assets/image/1028c3c7f8a19900d55630f214fa7c3b.jpg', name: '张思学', summary: '4位共同朋友', mutualCount: 4 },
          // { id: 7, avatar: '../../assets/image/1028c3c7f8a19900d55630f214fa7c3b.jpg', name: '张思学', summary: '4位共同朋友', mutualCount: 4 },
          // { id: 8, avatar: '../../assets/image/1028c3c7f8a19900d55630f214fa7c3b.jpg', name: '张思学', summary: '4位共同朋友', mutualCount: 4 },
          // { id: 9, avatar: '../../assets/image/1028c3c7f8a19900d55630f214fa7c3b.jpg', name: '张思学', summary: '4位共同朋友', mutualCount: 4 },
          // { id: 10, avatar: '../../assets/image/1028c3c7f8a19900d55630f214fa7c3b.jpg', name: '张思学', summary: '4位共同朋友', mutualCount: 4 },
          // { id: 11, avatar: '../../assets/image/1028c3c7f8a19900d55630f214fa7c3b.jpg', name: '张思学', summary: '4位共同朋友', mutualCount: 4 },
          // { id: 12, avatar: '../../assets/image/1028c3c7f8a19900d55630f214fa7c3b.jpg', name: '张思学', summary: '4位共同朋友', mutualCount: 4 },
          // { id: 13, avatar: '../../assets/image/1028c3c7f8a19900d55630f214fa7c3b.jpg', name: '张思学', summary: '4位共同朋友', mutualCount: 4 },
          // { id: 14, avatar: '../../assets/image/1028c3c7f8a19900d55630f214fa7c3b.jpg', name: '张思学', summary: '4位共同朋友', mutualCount: 4 },
          // { id: 15, avatar: '../../assets/image/1028c3c7f8a19900d55630f214fa7c3b.jpg', name: '张思学', summary: '4位共同朋友', mutualCount: 4 },
          // { id: 16, avatar: '../../assets/image/1028c3c7f8a19900d55630f214fa7c3b.jpg', name: '张思学', summary: '4位共同朋友', mutualCount: 4 },
          // { id: 17, avatar: '../../assets/image/1028c3c7f8a19900d55630f214fa7c3b.jpg', name: '张思学', summary: '4位共同朋友', mutualCount: 4 },
          // { id: 18, avatar: '../../assets/image/1028c3c7f8a19900d55630f214fa7c3b.jpg', name: '张思学', summary: '4位共同朋友', mutualCount: 4 },
          // { id: 19, avatar: '../../assets/image/1028c3c7f8a19900d55630f214fa7c3b.jpg', name: '张思学', summary: '4位共同朋友', mutualCount: 4 },
          // { id: 20, avatar: '../../assets/image/1028c3c7f8a19900d55630f214fa7c3b.jpg', name: '张思学', summary: '4位共同朋友', mutualCount: 4 },

    ],
    dismissedCardIds: []
  },

  onLoad() {
    this.checkNetworkStatus();
    this.debouncedTabClick = debounce(this._handleTabClick, 300);
    this.scrollCache = {}; // ✅ 新增缓存对象（替代 scrollTop 实时更新）
  },

  async onReady() {
    const navHeightRpx = await util.getElementHeight(this, '#navHeader');
    this.setData({ navHeaderHeightRpx: navHeightRpx });
    this.loadTopCandidates();
    this.checkNetworkStatus();
  },

  // ✅ 统一的网络检查
  checkNetworkStatus() {
    wx.getNetworkType({
      success: (res) => this.setData({ isNoNetwork: res.networkType === 'none' }),
      fail: () => this.setData({ isNoNetwork: true })
    });
  },

  // Tab 切换
  handleTabClick(e) {
    const tab = e.currentTarget.dataset.tab;
    this.debouncedTabClick(tab);
  },

  _handleTabClick(tab) {
    const { currentTab, filterStatus } = this.data;
    if (tab === currentTab) return;

    if (currentTab === 'recommend') {
      this.setData({ btnLoading: false });
    }

    // ✅ 切换时保存旧 tab 的滚动位置
    if (this.scrollCache[currentTab] !== undefined) {
      this.setData({ [`scrollTop.${currentTab}`]: this.scrollCache[currentTab] });
    }

    this.setData({ currentTab: tab }, () => {
      wx.reportEvent('click_tab', { tab });
      if (tab === 'potential') this.loadTabContent('potential', filterStatus[tab]);
    });
  },

  // ✅ 改进：不在滚动时 setData
  handleScroll(e) {
    const tab = e.currentTarget.dataset.tab;
    const top = e.detail?.scrollTop || 0;
    this.scrollCache[tab] = top; // 仅缓存，不触发 setData
  },

  // ✅ 页面隐藏/卸载时统一保存 scrollTop 状态
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

  // 搜寻逻辑
  triggerSearch() {
    if (this.data.isNoNetwork) {
      wx.showToast({ title: '无网络连接，请检查网络', icon: 'none' });
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
            wx.showToast({ title: '无网络连接，请检查网络', icon: 'none' });
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
              wx.showToast({ title: '暂无匹配的潜在人脉', icon: 'none' });
              this.setData({ btnLoading: false });
              return;
            }

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

  // 筛选逻辑
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

  formatFilterContent(tab, filter) {
    let content = '当前筛选：\n';
    if (tab === 'recommend') {
      content += `类型：${filter.type || '无'}\n关键词：${filter.keyword || '无'}\n时间范围：${filter.timeRange || '无'}`;
    } else {
      content += `人脉类型：${filter.type || '无'}\n地区：${filter.area || '无'}\n公司：${filter.company || '无'}`;
    }
    return content;
  },

  getMockNewFilter(tab) {
    return tab === 'recommend'
      ? { type: '最新', keyword: '技术', timeRange: '近7天' }
      : { type: '同事', area: '北京', company: '某科技公司' };
  },

  getEmptyFilter(tab) {
    return tab === 'recommend'
      ? { type: '', keyword: '', timeRange: '' }
      : { type: '', area: '', company: '' };
  },

  updateFilterAndReload(tab, newFilter) {
    this.setData({
      [`filterStatus.${tab}`]: newFilter,
      [`scrollTop.${tab}`]: 0
    }, () => {
      if (tab === 'potential') this.loadTabContent(tab, newFilter);
    });
  },

  // 加载潜在人脉内容
  loadTabContent(tab, filterParams) {
    this.checkNetworkStatus();
    if (this.data.isNoNetwork) return;

    wx.getNetworkType({
      success: (res) => {
        if (res.networkType === 'none') {
          this.setData({ isNoNetwork: true });
          return;
        }

        setTimeout(() => {
          let mockData = [];
          if (tab === 'potential' && filterParams.area === '北京') {
            mockData = Array.from({ length: 15 }, (_, i) => ({
              id: i, name: `北京人脉-${i}`, company: filterParams.company || '未知公司'
            }));
          } else {
            mockData = Array.from({ length: 10 }, (_, i) => ({ id: i }));
          }

          this.setData({ [`${tab}List`]: mockData });
        }, 500);
      },
      fail: () => this.setData({ isNoNetwork: true })
    });
  },

  // 顶部推荐人卡片
  loadTopCandidates() {
    wx.getNetworkType({
      success: (res) => {
        if (res.networkType === 'none') return;
        wx.request({
          url: '/circle/potential/top',
          method: 'GET',
          success: (res) => {
            if (res.data?.success) {
              const mockData = res.data.data;
              const filteredData = mockData.filter(item => !this.data.dismissedCardIds.includes(item.id));
              this.setData({ topCandidates: filteredData.slice(0, 10) });
              wx.reportEvent('view_top_candidates');
            }
          },
          fail: () => console.log("推荐人加载失败")
        });
      },
      fail: () => console.log("fail")
    });
  },

  handleDismissCard(e) {
    const cardId = e.currentTarget.dataset.id;
    const { topCandidates, dismissedCardIds } = this.data;
    this.setData({
      topCandidates: topCandidates.filter(item => item.id !== cardId),
      dismissedCardIds: [...dismissedCardIds, cardId]
    });
    wx.reportEvent('dismiss_top_card', { id: cardId });
  },

  handleCardClick(e) {
    const cardId = e.currentTarget.dataset.id;
    console.log(11111);
    
    wx.navigateTo({ url: `/pages/connections/connections?id=${cardId}` });
    wx.reportEvent('click_top_card', { id: cardId });
  }
});
