// pages/relationship/relationship.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    inputValue: '', // 输入框内容
    wordCount: 0,    // 字数统计
    relationshipList: [
      {
        name: '家人',
        icon: '../../assets/image/relationship/图标-家人.png'
      },
      {
        name: '朋友',
        icon: '../../assets/image/relationship/图标-朋友.png'
      },
      {
        name: '恋人',
        icon: '../../assets/image/relationship/图标-恋人.png'
      },
      {
        name: '同学',
        icon: '../../assets/image/relationship/图标-同学.png'
      },
      {
        name: '同事',
        icon: '../../assets/image/relationship/图标-同事.png'
      },
      {
        name: '师生',
        icon: '../../assets/image/relationship/图标-师生.png'
      },
      {
        name: '网友',
        icon: '../../assets/image/relationship/图标-网友.png'
      },
    ],
  },
  // 监听输入变化，更新字数
  onDescInput(e) {
    const value = e.detail.value;
    this.setData({
      inputValue: value,
      wordCount: value.length
    });
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
})