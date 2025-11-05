// pages/connections/connections.js
const request = require('../../utils/request.js');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    tabs: [
      { id: 'cp', name: 'CP链' },
      { id: 'dynamic', name: '动态' }
    ],
    currentTab: 0,
    // 存储用户详情（与后端字段一一对应）
    userDetail: {
      userId: '',
      nickName: '',
      avatar: '',
      backgroundImage: '',
      signature: '',
      gender: 0, // 0-未知, 1-男, 2-女
      city: '',
      cpRelationCount: 0,
      mutualCp: false
    },
    isLoading: false,
    isPopupShow: false, // 弹出层显示状态
  },

  onLoad(options) {
    const { userId } = options;
    this.setData({ 'userDetail.userId': userId });
    this.getUserDetail(userId);
  },

  onTabChange(e) {
    const index = e.detail && e.detail.index;
    if (typeof index === 'number') {
      this.setData({ currentTab: index });
      console.log('已切换到选项卡：', index, this.data.tabs[index] && this.data.tabs[index].name);
      // 可在此根据 index 加载对应数据
    }
  },

  async getUserDetail(userId) {
    try {
      // 调用接口，获取用户完整数据
      const res = await request.get(`/api/user/recommend/info/${userId}`);

      // 验证接口返回（按实际后端规范调整，此处假设code=200为成功）
      if (res?.code !== 200 || !res.data) {
        throw new Error(res?.msg || '获取用户信息失败');
      }

      // 3. 更新用户详情到data（字段与后端返回对齐）
      this.setData({
        userDetail: {
          userId: res.data.userId || '',
          nickName: res.data.nickName || '未知用户',
          avatar: res.data.avatar || '../../assets/image/default-avatar.png', // 默认头像兜底
          backgroundImage: res.data.backgroundImage || '',
          signature: res.data.signature || '暂无个性签名', // 空签名兜底
          gender: res.data.gender || 0,
          city: res.data.city || '未知城市',
          cpRelationCount: res.data.cpRelationCount || 0,
          mutualCp: res.data.mutualCp || false
        },
        isLoading: false // 加载完成
      });
    } catch (err) {
      // 异常处理：提示用户+返回上一页
      console.error('拉取用户详情失败：', err);
      this.setData({ isLoading: false, isError: true });
      wx.showToast({ title: err.message || '网络异常，请重试', icon: 'none' });
      setTimeout(() => wx.navigateBack({ delta: 1 }), 1500);
    }
  },  

  // 新增：接收user-profile组件的事件，打开弹出层
  onReceiveOpenPopup() {
    console.log('接收到打开弹出层事件');
    
    this.showPopup();
  },
  // 显示弹出层
  showPopup() {
    this.setData({ isPopupShow: true });
  },
  // 隐藏弹出层
  hidePopup() {
    this.setData({ isPopupShow: false });
  },
  // 自定义导航栏返回逻辑（如询问是否放弃编辑）
  handlePopupNavBack() {
    this.hidePopup();
  }
})