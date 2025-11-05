// pages/schedule/schedule.js
Page({
  data: {
    isPopupShow: false, // 弹出层显示状态
    isFocus: false,   // 控制搜索框聚焦状态
    inputValue: ''    // 存储输入内容
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
  
  // 显示弹出层
  showPopup() {
    this.setData({ isPopupShow: true });
    const tabBar = this.getTabBar();
    if (tabBar) tabBar.toggleVisibility(false);
  },

  // 隐藏弹出层
  hidePopup() {
    this.setData({ isPopupShow: false });
    const tabBar = this.getTabBar();
    if (tabBar) tabBar.toggleVisibility(true);
  },

  // 自定义导航栏返回逻辑（如询问是否放弃编辑）
  handlePopupNavBack() {
    this.hidePopup();
    // // 示例：弹出确认框，确认后关闭弹出层
    // wx.showModal({
    //   title: '提示',
    //   content: '是否放弃当前编辑？',
    //   success: (res) => {
    //     if (res.confirm) {
    //       this.hidePopup(); // 确认后关闭
    //     }
    //     // 取消则不做处理，留在弹出层
    //   }
    // });
    const tabBar = this.getTabBar();
    if (tabBar) tabBar.toggleVisibility(true);
  }
});