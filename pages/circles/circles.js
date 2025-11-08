// pages/circles/circles.js
const request = require('../../utils/request.js');
Page({
  data: {
    isGroupPopupShow: false, // 圈子信息弹出层显示状态
    isFriendPopupShow:false, 
    isFocus: false,   // 控制搜索框聚焦状态
    inputValue: '',    // 存储输入内容
    cpList: []
  },

  async getCpList() {
    try {
      const { data } = request.get('/api/cp/list')
      this.setData({
        cpList: data
      })
    } catch(err) {
      console.log(err);

    }

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

  // 显示好友弹出层
  showFriendPopup() {
    this.setData({ isFriendPopupShow: true });
    const tabBar = this.getTabBar();
    if (tabBar) tabBar.toggleVisibility(false);
  },
  // 隐藏好友弹出层
  hideFriendPopup() {
    this.setData({ isFriendPopupShow: false });
    const tabBar = this.getTabBar();
    if (tabBar) tabBar.toggleVisibility(true);
  },
  // 自定义导航栏返回逻辑（如询问是否放弃编辑）
  handlePopupNavBack() {
    this.hideFriendPopup();
    const tabBar = this.getTabBar();
    if (tabBar) tabBar.toggleVisibility(true);
  }
});