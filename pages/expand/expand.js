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
    // 潜在人脉数据保留原逻辑
    potentialList: [],
    potentialEmpty: false,
    // 推荐页仅保留2个核心状态（删除btnError/btnEmpty，用Toast替代）
    btnLoading: false,  // 仅控制“加载中”（容器透明度+禁止重复点击）
    isNoNetwork: false, // 辅助判断无网场景
    // 其他状态
    navHeaderHeightRpx: 0,
    showFilterPanel: false
  },

  onLoad() {
    this.debouncedTabClick = debounce(this._handleTabClick, 300);
    // 关键：用防抖包裹handleScroll，确保生效
    this.debouncedHandleScroll = debounce(this.handleScroll, 100); 
  },

  async onReady() {
    const navHeightRpx = await util.getElementHeight(this, '#navHeader');
    this.setData({ navHeaderHeightRpx: navHeightRpx });
  },

  // Tab切换：重置推荐页加载状态
  handleTabClick(e) {
    const tab = e.currentTarget.dataset.tab;
    this.debouncedTabClick(tab);
  },

  _handleTabClick(tab) {
    const { currentTab, filterStatus } = this.data;
    if (tab === currentTab) return;

    // 切换Tab时，重置推荐页“加载中”状态（容器恢复正常）
    if (currentTab === 'recommend') {
      this.setData({ btnLoading: false });
    }

    this.setData({ currentTab: tab }, () => {
      wx.reportEvent('click_tab', { tab });
      if (tab === 'potential') this.loadTabContent('potential', filterStatus[tab]);
    });
  },

  // 核心：触发搜寻（点击容器触发，失败/空态用Toast提示）
  triggerSearch() {
    // 1. 加载中禁止重复点击
    console.log('开始触发搜寻');
    if (this.data.btnLoading) {
      console.log('加载中，禁止重复点击');
      return;
    }

    // 2. 进入加载中状态
    this.setData({ btnLoading: true }, () => {
      console.log('进入加载中状态');
      wx.reportEvent('view_recommend_loading');

      // 3. 网络判断
      wx.getNetworkType({
        success: (res) => {
          console.log('网络类型检测结果：', res.networkType);
          if (res.networkType === 'none') {
            wx.showToast({
              title: '无网络连接，请检查网络',
              icon: 'none',
              duration: 2000
            });
            this.setData({ btnLoading: false });
            wx.reportEvent('retry_recommend', { reason: 'no_network' });
            return;
          }

          // 4. 模拟接口请求
          setTimeout(() => {
            console.log('模拟接口请求完成');
            const mockSuccess = true  // 测试用
            const mockHasData = true;  // 测试用

            if (!mockSuccess) {
              wx.showToast({
                title: '搜寻失败，请重试',
                icon: 'none',
                duration: 2000
              });
              this.setData({ btnLoading: false });
              wx.reportEvent('retry_recommend', { reason: 'request_failed' });
              return;
            }

            if (!mockHasData) {
              wx.showToast({
                title: '暂无匹配的潜在人脉',
                icon: 'none',
                duration: 2000
              });
              this.setData({ btnLoading: false });
              wx.reportEvent('retry_recommend', { reason: 'no_data' });
              return;
            }

            // 成功则跳转
            wx.navigateTo({
              url: '/pages/connections/connections',
              success: () => this.setData({ btnLoading: false }),
              fail: () => {
                wx.showToast({ 
                  title: '跳转失败，请重试', 
                  icon: 'none', 
                  duration: 2000 
                });
                this.setData({ btnLoading: false });
                wx.reportEvent('retry_recommend', { reason: 'navigate_failed' });
              }
            });
          }, 500);
        },
        fail: () => {
          wx.showToast({
            title: '网络异常，请重试',
            icon: 'none',
            duration: 2000
          });
          this.setData({ btnLoading: false });
          wx.reportEvent('retry_recommend', { reason: 'network_error' });
        }
      });
    });
  },

  // 空事件：加载中禁止点击
  noop() {},

  // 以下筛选、潜在人脉加载等逻辑完全保留不变
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

  loadTabContent(tab, filterParams) {
    wx.getNetworkType({
      success: (res) => {
        const isNoNetwork = res.networkType === 'none';
        if (isNoNetwork) {
          this.setData({ [`${tab}Empty`]: true });
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

          this.setData({
            [`${tab}List`]: mockData,
            [`${tab}Empty`]: mockData.length === 0
          });
        }, 500);
      },
    });
  },

  handleScroll(e) {
    const tab = e.currentTarget.dataset.tab;
    const top = e.detail.scrollTop;
    // 优化点：仅当滚动位置变化超过10rpx时才更新（过滤微小滚动，进一步减少setData）
    if (Math.abs(this.data.scrollTop[tab] - top) > 10) {
      this.setData({ 
        [`scrollTop.${tab}`]: top  // 保持“字符串路径”更新，只改单个属性（最优写法）
      });
    }
  },

  onFilterPanelConfirm(e) {
    const { tab, newFilter } = e.detail;
    this.updateFilterAndReload(tab, newFilter);
    this.setData({ showFilterPanel: false });
  },

  onFilterPanelCancel() {
    this.setData({ showFilterPanel: false });
  }
});