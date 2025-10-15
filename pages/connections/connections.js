// pages/connections/connections.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    tabs: [
      { id: 'cp', name: 'CP链' },
      { id: 'dynamic', name: '动态' }
    ],
    currentTab: 0
  },
  onNavBack() {
    console.log('用户点击了返回按钮');
    // 可以添加额外逻辑，如：
    // wx.showToast({ title: '返回前保存数据' });
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },
  onTabChange(e) {
    const index = e.detail && e.detail.index;
    if (typeof index === 'number') {
      this.setData({ currentTab: index });
      console.log('已切换到选项卡：', index, this.data.tabs[index] && this.data.tabs[index].name);
      // 可在此根据 index 加载对应数据
    }
  }
})