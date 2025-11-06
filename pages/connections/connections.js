// pages/connections/connections.js
const request = require('../../utils/request.js');

Page({
  data: {
    tabs: [
      { id: 'cp', name: 'CP链' },
      { id: 'dynamic', name: '动态' }
    ],
    currentTab: 0,
    swiperHeight: 0,

    userDetail: {
      userId: '',
      nickName: '',
      avatar: '',
      backgroundImage: '',
      signature: '',
      gender: 0,
      city: '',
      cpRelationCount: 0,
      mutualCp: false
    },
    isLoading: false,
    isPopupShow: false
  },

  onLoad(options) {
    const { userId } = options;
    this.setData({ 'userDetail.userId': userId });
    this.getUserDetail(userId);
    this.updateSwiperHeight(this.data.currentTab);
  },

  /** =======================
   *  tab-swiper逻辑整合
   * ======================= */
  switchTab(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ currentTab: index });
    this.updateSwiperHeight(index);
    console.log('点击切换到 tab：', this.data.tabs[index].name);
  },

  onSwiperChange(e) {
    const index = e.detail.current;
    this.setData({ currentTab: index });
    this.updateSwiperHeight(index);
    console.log('滑动切换到 tab：', this.data.tabs[index].name);
  },

  updateSwiperHeight(index) {
    const query = this.createSelectorQuery();
    query.select(`#tab${index}`).boundingClientRect(rect => {
      if (rect && rect.height) {
        this.setData({ swiperHeight: rect.height });
      } else {
        this.setData({ swiperHeight: 500 }); // 兜底
      }
    }).exec();
  },

  /** =======================
   *  用户相关逻辑保持原样
   * ======================= */
  async getUserDetail(userId) {
    try {
      const res = await request.get(`/api/user/recommend/info/${userId}`, { userId });
      if (res?.code !== 200 || !res.data) throw new Error(res?.msg || '获取用户信息失败');
      this.setData({
        userDetail: {
          userId: res.data.userId || '',
          nickName: res.data.nickName || '未知用户',
          avatar: res.data.avatar || '../../assets/image/default-avatar.png',
          backgroundImage: res.data.backgroundImage || '',
          signature: res.data.signature || '暂无个性签名',
          gender: res.data.gender || 0,
          city: res.data.city || '未知城市',
          cpRelationCount: res.data.cpRelationCount || 0,
          mutualCp: res.data.mutualCp || false
        },
        isLoading: false
      });
    } catch (err) {
      console.error('拉取用户详情失败：', err);
      this.setData({ isLoading: false });
      wx.showToast({ title: err.message || '网络异常，请重试', icon: 'none' });
    }
  },

  handleOpenRelation() {
    this.showPopup();
  },

  showPopup() {
    this.setData({ isPopupShow: true });
  },

  hidePopup() {
    this.setData({ isPopupShow: false });
  },

  handlePopupNavBack() {
    this.hidePopup();
  }
});