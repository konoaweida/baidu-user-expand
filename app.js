App({
  onLaunch() {
    this.initTokenFromStorage();
  },

  /**
   * 从本地缓存加载 Token & RefreshToken
   * 过期则删除，不加载入全局
   */
  initTokenFromStorage() {
    const token = wx.getStorageSync('token') || '';
    const refreshToken = wx.getStorageSync('refreshToken') || '';
    const tokenExpireTime = wx.getStorageSync('tokenExpireTime') || 0;
    const refreshTokenExpireTime = wx.getStorageSync('refreshTokenExpireTime') || 0;
    const openid = wx.getStorageSync('openid') || '';
    const now = Date.now();

    // ✅ access_token 已过期 → 移除
    if (token && tokenExpireTime <= now) {
      wx.removeStorageSync('token');
      wx.removeStorageSync('tokenExpireTime');
    }

    // ✅ refresh_token 也可能过期 → 移除
    if (refreshToken && refreshTokenExpireTime <= now) {
      wx.removeStorageSync('refreshToken');
      wx.removeStorageSync('refreshTokenExpireTime');
    }

    // ✅ 恢复全局变量
    this.globalData.openid = openid;
    this.globalData.refreshTokenExpireTime = refreshTokenExpireTime;
    this.globalData.tokenExpireTime = tokenExpireTime;
    this.globalData.refreshToken = refreshToken;

    // ✅ access_token有效才存入 globalData
    if (token && tokenExpireTime > now) {
      this.globalData.token = token;
    } else {
      this.globalData.token = '';
    }
  },

  /**
   * 清空所有 Token & 时间
   */
  // clearAllToken() {
  //   this.globalData.token = '';
  //   this.globalData.refreshToken = '';
  //   this.globalData.tokenExpireTime = 0;
  //   this.globalData.refreshTokenExpireTime = 0;

  //   wx.removeStorageSync('token');
  //   wx.removeStorageSync('refreshToken');
  //   wx.removeStorageSync('tokenExpireTime');
  //   wx.removeStorageSync('refreshTokenExpireTime');
  // },

  /**
   * 全局变量
   */
  globalData: {
    openid: '',
    token: '',
    refreshToken: '',
    tokenExpireTime: 0,
    refreshTokenExpireTime: 0,
    userInfo: null,
    isRefreshing: false,    // 防止并发刷新
    isLoginRedirect: false  // 避免多次跳登录
  }
});
