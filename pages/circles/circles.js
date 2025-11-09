// pages/circles/circles.js
const request = require('../../utils/request.js');
Page({
  data: {
    isGroupPopupShow: false, // 圈子信息弹出层显示状态
    isFocus: false,   // 控制搜索框聚焦状态
    inputValue: '',    // 存储输入内容
    cpList: [1,2,3],  
    incomingData: [],
  },
  async onLoad() {
    this.getCpList()
    this.getCpComing()
  },

  async getCpComing() {
    try {
      const { data } = request.get('/api/cp/coming')
      this.setData({
        incomingData: data
      })
      console.log(data);
    } catch(err) {
      console.log(err);
    }
  },

  // 获取圈子列表
  async getCpList() {
    try {
      const { data } = request.get('/api/cp/list')
      console.log(data);
      
      // this.setData({
      //   cpList: data
      // })
    } catch(err) {
      console.log(err);

    }

  },
  goToDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pkgA/pages/infoList/infoList?id=${id}`,
    })
  },
  // 搜索框聚焦：切换状态，显示高度/图标/取消按钮
  onFocus() {
    this.setData({ isFocus: true });
  },

  // 搜索框失焦：切换状态，隐藏高度/图标/取消按钮
  onBlur() {
    this.setData({ isFocus: false });
  },

  // 输入内容变化：同步inputValue
  onSearchInput(e) {
    this.setData({ inputValue: e.detail.value });
  },

  // 清除输入内容
  clearInput() {
    this.setData({ inputValue: '' });
  },

  // 点击“取消”：可自定义逻辑（如关闭搜索、清空输入等）
  onCancel() {
    this.setData({ 
      isFocus: false, 
      inputValue: '' 
    });
    // 若需隐藏键盘，可调用：wx.hideKeyboard();
  },
  

  // 打开群组弹出层
  openGroupPopup() {
    console.log(111);
    
    this.setData({ 
      isGroupPopupShow: true,
    });
    const tabBar = this.getTabBar();
    if (tabBar) tabBar.toggleVisibility(false);
  },

  // 关闭群组弹出层
  closeGroupPopup() {
    this.setData({ isGroupPopupShow: false });
    const tabBar = this.getTabBar();
    if (tabBar) tabBar.toggleVisibility(true);
  },

  // 确认群组头像昵称选择选择
  confirmGroup() {
    this.setData({ 
      isGroupPopupShow: false, 
    });
  },
});