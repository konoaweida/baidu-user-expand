const util = require('../../utils/util.js'); // 引入工具类

// 防抖工具函数：避免短时间重复点击
function debounce(func, wait) {
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
    currentTab: 'recommend', // 默认激活“推荐”Tab
    // 1. 存储每个Tab的独立滚动位置（切换时自动恢复）
    scrollTop: {
      recommend: 0,
      potential: 0,
    },
    // 2. 存储每个Tab的独立筛选状态（根据实际需求定义字段）
    filterStatus: {
      recommend: { type: '', keyword: '', timeRange: '' },
      potential: { type: '', area: '', company: '' }
    },
    // 数据列表与空态标识（潜在人脉保留，推荐页不再用列表）
    potentialList: [],
    potentialEmpty: false,
    // 新增：推荐页【正方形按钮三态】变量（核心）
    btnLoading: false,  // 加载中
    btnError: false,    // 加载失败
    btnEmpty: false,    // 暂无推荐人
    isNoNetwork: false, // 区分无网/普通失败
    // 原有其他状态
    navHeaderHeightRpx: 0,
    showFilterPanel: false
  },

  onLoad() {
    // 初始化防抖Tab点击（300ms防重复）
    this.debouncedTabClick = debounce(this._handleTabClick, 300);
    // 新增：防抖滚动事件（30ms 触发一次）
    this.debouncedHandleScroll = debounce(this.handleScroll, 30);
    // 推荐页初始不加载，显示按钮（原有 loadTabContent 注释）
  },

  // 页面渲染完成后：获取导航栏高度（rpx）
  async onReady() {
    const navHeightRpx = await util.getElementHeight(this, '#navHeader');
    this.setData({ navHeaderHeightRpx: navHeightRpx });
    console.log('navigation-header 组件高度（rpx）：', navHeightRpx);
  },

  // -------------------------- Tab切换相关（完全保留） --------------------------
  handleTabClick(e) {
    const tab = e.currentTarget.dataset.tab;
    this.debouncedTabClick(tab);
  },

  _handleTabClick(tab) {
    const { currentTab, filterStatus } = this.data;
    if (tab === currentTab) return;

    // 切换Tab时，重置推荐页状态为初始按钮
    if (currentTab === 'recommend') {
      this.setData({ btnLoading: false, btnError: false, btnEmpty: false });
    }

    this.setData({ currentTab: tab }, () => {
      // 埋点上报
      wx.reportEvent('click_tab', { tab });
      // 潜在人脉页仍加载数据，推荐页不自动加载（靠按钮触发）
      if (tab === 'potential') this.loadTabContent('potential', filterStatus[tab]);
    });
  },

  // -------------------------- 新增：推荐页正方形按钮核心逻辑 --------------------------
  // 触发搜寻（按钮点击/重试点击）
  triggerSearch() {
    // 1. 重置状态，进入加载中，上报埋点
    this.setData({
      btnLoading: true,
      btnError: false,
      btnEmpty: false,
      isNoNetwork: false
    });
    wx.reportEvent('view_recommend_loading'); // 加载埋点

    // 2. 网络判断
    wx.getNetworkType({
      success: (res) => {
        const isNoNetwork = res.networkType === 'none';
        if (isNoNetwork) {
          // 无网：切换失败态
          this.setData({
            btnLoading: false,
            btnError: true,
            isNoNetwork: true
          });
          return;
        }

        // 3. 模拟接口请求（实际替换为 GET /circle/recommend）
        setTimeout(() => {
          const mockSuccess = true; // 控制成功/失败：true=成功（跳转）
          const mockHasData = true; // 控制是否有数据：true=有（跳转），false=空态

          if (!mockSuccess) {
            // 失败：切换失败态
            this.setData({ btnLoading: false, btnError: true });
            return;
          }
          if (!mockHasData) {
            // 空态：切换空态
            this.setData({ btnLoading: false, btnEmpty: true });
            return;
          }

          // 4. 成功：跳转到推荐人页面（唯一跳转场景）
          wx.navigateTo({
            url: '/pages/recommend-person/recommend-person', // 替换为实际推荐人页面路径
            success: () => {
              // 跳转后重置推荐页状态（返回时显示按钮）
              this.setData({ btnLoading: false });
            },
            fail: () => {
              // 跳转失败：切换失败态
              this.setData({ btnLoading: false, btnError: true });
            }
          });
        }, 1500); // 模拟加载耗时
      },
      fail: () => {
        // 网络判断失败：切换失败态
        this.setData({ btnLoading: false, btnError: true });
      }
    });
  },

  // 重置到初始按钮状态（空态时点击“重新搜寻”）
  resetToInit() {
    this.setData({ btnError: false, btnEmpty: false });
  },

  // -------------------------- 筛选相关（完全保留） --------------------------
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
      content += `类型：${filter.type || '无'}\n`;
      content += `关键词：${filter.keyword || '无'}\n`;
      content += `时间范围：${filter.timeRange || '无'}`;
    } else {
      content += `人脉类型：${filter.type || '无'}\n`;
      content += `地区：${filter.area || '无'}\n`;
      content += `公司：${filter.company || '无'}`;
    }
    return content;
  },

  getMockNewFilter(tab) {
    if (tab === 'recommend') {
      return { type: '最新', keyword: '技术', timeRange: '近7天' };
    } else {
      return { type: '同事', area: '北京', company: '某科技公司' };
    }
  },

  getEmptyFilter(tab) {
    if (tab === 'recommend') {
      return { type: '', keyword: '', timeRange: '' };
    } else {
      return { type: '', area: '', company: '' };
    }
  },

  updateFilterAndReload(tab, newFilter) {
    this.setData({
      [`filterStatus.${tab}`]: newFilter,
      [`scrollTop.${tab}`]: 0 
    }, () => {
      if (tab === 'potential') this.loadTabContent(tab, newFilter);
    });
  },

  // -------------------------- 数据加载相关（仅保留潜在人脉逻辑） --------------------------
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

  // -------------------------- 滚动位置存储（完全保留） --------------------------
  handleScroll(e) {
    const tab = e.currentTarget.dataset.tab;
    const top = e.detail.scrollTop;
    this.setData({ [`scrollTop.${tab}`]: top });
  },

  // -------------------------- 可选：自定义筛选组件回调（完全保留） --------------------------
  onFilterPanelConfirm(e) {
    const { tab, newFilter } = e.detail;
    this.updateFilterAndReload(tab, newFilter);
    this.setData({ showFilterPanel: false });
  },

  onFilterPanelCancel() {
    this.setData({ showFilterPanel: false });
  }
});