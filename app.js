App({
  onLaunch() {
    // 初始化：从本地缓存加载Token及有效期（含refresh_token）
    this.initTokenFromStorage();

    // 可选：原有日志存储逻辑（保留）
    // const logs = wx.getStorageSync('logs') || []
    // logs.unshift(Date.now())
    // wx.setStorageSync('logs', logs)

    // 可选：默认登录逻辑（若需自动登录可保留，否则注释）
    // this.autoLogin();
  },

  /**
   * 从本地缓存加载Token到全局变量（核心修改：增加refresh_token有效期处理）
   */
  initTokenFromStorage() {
    const token = wx.getStorageSync('token') || '';
    const refreshToken = wx.getStorageSync('refreshToken') || '';
    const tokenExpireTime = wx.getStorageSync('tokenExpireTime') || 0;
    const refreshTokenExpireTime = wx.getStorageSync('refreshTokenExpireTime') || 0;
    const openid = wx.getStorageSync('openid') || '';
    const now = Date.now();
    
    // 1. 处理 access_token 过期：只清空 access_token，保留 refresh_token
    if (token && tokenExpireTime > 0 && tokenExpireTime <= now) {
      // 只清除 access_token 相关存储
      wx.removeStorageSync('token');
      wx.removeStorageSync('tokenExpireTime');
      this.globalData.token = '';
      this.globalData.tokenExpireTime = 0;
    }

    // 2. 处理 refresh_token 过期：此时才清空 refresh_token（因为它已无用）
    if (refreshToken && refreshTokenExpireTime > 0 && refreshTokenExpireTime <= now) {
      wx.removeStorageSync('refreshToken');
      wx.removeStorageSync('refreshTokenExpireTime');
      this.globalData.refreshToken = '';
      this.globalData.refreshTokenExpireTime = 0;
    }

    // 3. 加载剩余有效凭证到全局（如果 access_token 没过期，则保留；否则已被清空）
    if (!this.globalData.token) {
      // 如果 access_token 已被清空，全局 token 保持空（后续会通过 refresh_token 刷新）
    } else {
      this.globalData.token = token;
      this.globalData.tokenExpireTime = tokenExpireTime;
    }

    this.globalData.openid = openid;
    this.globalData.token = token;
    this.globalData.tokenExpireTime = tokenExpireTime;
    this.globalData.refreshToken = refreshToken;
    this.globalData.refreshTokenExpireTime = refreshTokenExpireTime;
  },

  /**
   * 清空所有Token及有效期（新增：复用清理逻辑）
   */
  // clearAllToken() {
  //   // 清空全局变量
  //   this.globalData.token = '';
  //   this.globalData.refreshToken = '';
  //   this.globalData.tokenExpireTime = 0;
  //   this.globalData.refreshTokenExpireTime = 0;

  //   // 清空本地缓存
  //   wx.removeStorageSync('token');
  //   wx.removeStorageSync('refreshToken');
  //   wx.removeStorageSync('tokenExpireTime');
  //   wx.removeStorageSync('refreshTokenExpireTime');
  // },

  /**
   * 全局变量（核心修改：补充refresh_token有效期、刷新/跳转标记）
   */
  globalData: {
    openid: '', // 用户唯一标识
    token: '', // access_token（接口调用凭证）
    refreshToken: '', // refresh_token（刷新凭证）
    tokenExpireTime: 0, // access_token过期时间戳（毫秒）
    refreshTokenExpireTime: 0, // 新增：refresh_token过期时间戳（毫秒）
    userInfo: null, // 用户信息
    isRefreshing: false, // 新增：标记是否正在刷新Token（防重复）
    isLoginRedirect: false // 新增：标记是否正在跳转登录（防重复）
  }
})