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
    currentTab: 'recommend', // 默认激活“推荐”
    scrollTop: {
      recommend: 0,
      potential: 0,
    }, // 保存各 Tab 滚动位置
    recommendList: [], // 推荐数据（模拟）
    potentialList: [], // 潜在人脉数据（模拟）
    recommendEmpty: false, // 推荐空态标识
    potentialEmpty: false, // 潜在人脉空态标识
  },

  onLoad() {
    // 初始化防抖 Tab 点击（300ms 防抖）
    this.debouncedTabClick = debounce(this._handleTabClick, 300);
    // 加载默认 Tab 内容
    this.loadTabContent('recommend');
  },

  // Tab 点击事件（对外暴露）
  handleTabClick(e) {
    const tab = e.currentTarget.dataset.tab;
    this.debouncedTabClick(tab);
  },

  // 防抖后的 Tab 切换核心逻辑
  _handleTabClick(tab) {
    const { currentTab } = this.data;
    if (tab === currentTab) return; // 重复点击无操作

    // 切换 Tab 状态
    this.setData({ currentTab: tab });

    // 埋点上报：click_tab { tab: 'recommend'|'potential' }
    wx.reportEvent('click_tab', { tab });

    // 加载对应 Tab 内容（含无网空态处理）
    this.loadTabContent(tab);
  },

  // 加载 Tab 内容（含网络状态判断）
  loadTabContent(tab) {
    wx.getNetworkType({
      success: (res) => {
        const isNoNetwork = res.networkType === 'none';
        if (isNoNetwork) {
          // 无网时显示空态
          this.setData({
            [`${tab}Empty`]: true,
          });
          return;
        }

        // 有网时模拟请求（实际替换为接口请求）
        setTimeout(() => {
          const mockData = Array.from({ length: 10 }, (_, i) => i);
          this.setData({
            [`${tab}List`]: mockData,
            [`${tab}Empty`]: false,
          });
        }, 500);
      },
    });
  },

  // 保存滚动位置
  handleScroll(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      [`scrollTop[${tab}]`]: e.detail.scrollTop,
    });
  },
});