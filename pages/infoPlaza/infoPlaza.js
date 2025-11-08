// pages/infoPlaza/infoPlaza.js
const util = require('../../utils/util.js');
Page({
  /**
   * 页面的初始数据（删除 isLoading 相关配置）
   */
  data: {
    navHeaderHeightRpx: 172,
    currentTab: 'inCircle', // 当前激活的Tab：inCircle-圈内，outCircle-圈外
    dynamicList: { // 分Tab存储动态数据
      inCircle: [],
      outCircle: []
    },
    scrollTop: { // 分Tab存储滚动位置
      inCircle: 0,
      outCircle: 0
    },
    debounceTimer: null, // 防抖定时器
    inputValue: '', // 搜索输入值（筛选条件）
    isFocus: false, // 搜索框聚焦状态
    hasNetwork: true // 网络状态
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 检查网络状态
    this.checkNetworkStatus();
    // 监听网络状态变化
    wx.onNetworkStatusChange((res) => {
      this.setData({ hasNetwork: res.isConnected });
      // 网络恢复时，刷新当前Tab数据
      if (res.isConnected) {
        this.loadDynamicList(this.data.currentTab);
      }
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  async onReady() {
    // 获取导航栏高度，设置Tab容器位置
    const navHeaderHeightRpx = await util.getElementHeight(this, '#navHeader');
    this.setData({ navHeaderHeightRpx });
    // 加载默认Tab（圈内）数据
    this.loadDynamicList('inCircle');
  },

  /**
   * Tab点击事件（防抖300ms，重复点击无副作用）
   */
  handleTabClick(e) {
    const targetTab = e.currentTarget.dataset.tab;
    const { currentTab, debounceTimer } = this.data;

    // 重复点击同一Tab，直接返回
    if (targetTab === currentTab) return;

    // 防抖处理：300ms内重复点击不触发
    if (debounceTimer) clearTimeout(debounceTimer);
    const newTimer = setTimeout(() => {
      // 埋点上报
      const tabType = targetTab === 'inCircle' ? 'inner' : 'outer';
      wx.reportEvent('click_circle_tab', { tab: tabType });

      // 切换当前Tab
      this.setData({ currentTab: targetTab });

      // 加载目标Tab数据（未加载过则请求，已加载过直接显示）
      const targetList = this.data.dynamicList[targetTab];
      if (targetList.length === 0) {
        this.loadDynamicList(targetTab);
      }
    }, 300);

    this.setData({ debounceTimer: newTimer });
  },

  /**
   * 加载动态列表数据（删除 loading 状态控制）
   * @param {string} tab - 目标Tab（inCircle/outCircle）
   */
  loadDynamicList(tab) {
    // 无网时直接返回，显示空态
    if (!this.data.hasNetwork) return;

    // 模拟接口请求（实际项目替换为真实接口）
    const mockApi = tab === 'inCircle' 
      ? 'https://mock-api/inCircle/dynamics' 
      : 'https://mock-api/outCircle/dynamics';

    wx.request({
      url: mockApi,
      data: {
        keyword: this.data.inputValue, // 携带搜索筛选条件
        page: 1,
        pageSize: 10
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.success) {
          // 直接更新对应Tab的动态数据
          this.setData({
            [`dynamicList.${tab}`]: res.data.data
          });
        } else {
          this.setData({ [`dynamicList.${tab}`]: [] });
        }
      },
      fail: () => {
        this.setData({ [`dynamicList.${tab}`]: [] });
      }
    });
  },

  /**
   * 监听列表滚动，记录当前Tab的滚动位置
   */
  onListScroll(e) {
    const currentTab = this.data.currentTab;
    this.setData({
      [`scrollTop.${currentTab}`]: e.detail.scrollTop
    });
  },

  /**
   * 搜索输入事件（筛选动态列表）
   */
  onSearchInput(e) {
    const inputValue = e.detail.value.trim();
    this.setData({ inputValue });
    // 输入防抖：500ms后触发搜索
    if (this.data.searchTimer) clearTimeout(this.data.searchTimer);
    const searchTimer = setTimeout(() => {
      this.loadDynamicList(this.data.currentTab);
    }, 500);
    this.setData({ searchTimer });
  },

  /**
   * 搜索框聚焦
   */
  onFocus() {
    this.setData({ isFocus: true });
  },

  /**
   * 搜索框失焦
   */
  onBlur() {
    this.setData({ isFocus: false });
  },

  /**
   * 清除搜索输入
   */
  clearInput() {
    this.setData({ inputValue: '' });
    // 清除后重新加载数据
    this.loadDynamicList(this.data.currentTab);
  },

  /**
   * 取消搜索（失焦+清除输入）
   */
  onCancel() {
    this.setData({ isFocus: false, inputValue: '' });
    this.loadDynamicList(this.data.currentTab);
  },

  /**
   * 检查网络状态
   */
  checkNetworkStatus() {
    wx.getNetworkType({
      success: (res) => {
        this.setData({ hasNetwork: res.networkType !== 'none' });
      }
    });
  },

  /**
   * 重新加载列表（无网时使用）
   */
  refreshList() {
    this.checkNetworkStatus();
    if (this.data.hasNetwork) {
      this.loadDynamicList(this.data.currentTab);
    }
  },

  /**
   * 下拉刷新（更新当前Tab数据）
   */
  onPullDownRefresh() {
    const currentTab = this.data.currentTab;
    this.loadDynamicList(currentTab); // 移除 loading 相关标记
    wx.stopPullDownRefresh();
  },

  /**
   * 上拉触底（加载更多）
   */
  onReachBottom() {
    // 实际项目中实现分页加载逻辑
    const currentTab = this.data.currentTab;
    // 无需判断 loading 状态，直接执行分页逻辑（后续可补充）
    // this.loadMoreDynamicList(currentTab);
  },

  /**
   * 页面卸载时清除定时器
   */
  onUnload() {
    if (this.data.debounceTimer) clearTimeout(this.data.debounceTimer);
    if (this.data.searchTimer) clearTimeout(this.data.searchTimer);
  }
});