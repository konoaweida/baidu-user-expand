// pkgB/pages/login/login.js
Page({
  data: {
    menuTop: 0,       // 菜单按钮顶部距离（rpx）
    menuHeight: 0,    // 菜单按钮高度（rpx）
    isNewUser: false,        // 是否为新用户
    isShowCodeLogin: false,  // 是否显示验证码登录
    phoneNumber: '',         // 手机号
    verifyCode: '',          // 验证码
    isCodeSending: false,    // 是否正在发送验证码
    countDown: 60,           // 倒计时
    isPhoneValid: false,     // 手机号是否有效
    tempUserId: '',           // 临时用户ID（用于后续请求）
    agreementChecked: false, // 是否同意用户协议
    isLoginDisabled: true, // 登录按钮是否禁用（默认禁用）
    loginCode: '', // 登录时使用的验证码

  },

  onLoad() {
    this.initMenuButtonPos();
    // 页面加载时检查用户状态
    this.checkUserStatus();

  },

  onUnload() {
    // 页面卸载时清理定时器
    if (this.timer) {
      clearInterval(this.timer);
    }
  },
  // 计算菜单按钮位置（核心逻辑）
  initMenuButtonPos() {
    // 获取系统信息（屏幕宽度）
    const { screenWidth = 375 } = wx.getWindowInfo();
    // 获取菜单按钮布局（px）
    const { top = 0, height = 0 } = wx.getMenuButtonBoundingClientRect();
    // px转rpx（保留2位小数，与原工具一致）
    const px2rpx = px => Number(((px * 750) / screenWidth).toFixed(2));
    
    // 设置数据
    this.setData({
      menuTop: px2rpx(top),
      menuHeight: px2rpx(height)
    });
  },
  
  // 微信手机号授权回调
  getPhoneNumber(e) { 
    const { errMsg, code } = e.detail;
    console.log('手机号授权结果:', e.detail);
    const app = getApp();

    // 1. 用户取消授权：切换到验证码登录
    if (errMsg.includes('fail')) {
      this.setData({ isShowCodeLogin: true });
      wx.showToast({
        title: '已取消授权，请使用验证码登录',
        icon: 'none'
      });
      return;
    }

    // 2. 用户允许授权：用手机号code调用后端登录
    if (errMsg === 'getPhoneNumber:ok' && code) {
      wx.showLoading({ title: '登录中...' });
      wx.request({
        url: 'http://1.95.53.183:8095/bd-client/api/auth/wx-phone', 
        method: 'POST',
        data: { 
          phoneCode: code,        // 手机号快速验证的code
          code: this.data.loginCode,  // 临时用户ID，用于关联用户
          deviceType: 'wechat-mini'
        },
        success: (res) => {
          wx.hideLoading();
          // console.log(res.data.data);
          const { access_token, refresh_token, expire_in, refresh_expire_in, openid } = res.data.data;

          // 1. 存储到本地缓存

          // 计算 token 过期时间（当前时间 + 有效期，单位：毫秒）
          const now = Date.now();
          const tokenExpireTime = now + expire_in * 1000; // access_token过期时间
          const refreshTokenExpireTime = now + refresh_expire_in * 1000; // 新增：refresh_token过期时间

          wx.setStorageSync('token', access_token);
          wx.setStorageSync('refreshToken', refresh_token);
          wx.setStorageSync('tokenExpireTime', tokenExpireTime);
          wx.setStorageSync('refreshTokenExpireTime', refreshTokenExpireTime);
          wx.setStorageSync('openid', openid);      
          
          wx.showToast({
            title: '登录成功',
            icon: 'success',
            success: () => {
              setTimeout(() => {
                wx.reLaunch({ url: '/pages/expand/expand' });
              }, 1500);
            }
          });

        },
        fail: (error) => {
          wx.hideLoading();
          console.error('登录请求失败:', error);
          this.handleError('网络异常，登录失败');
        }
      });
    }
  },

  // 检查用户状态（核心方法）
  checkUserStatus() { 
    wx.login({
      success: (res) => {
        
      this.setData({ loginCode: res.code });
      if (this.data.loginCode) {
        wx.setStorageSync('loginCode', this.data.loginCode);
      }

        if (res.code) {
          // 发送登录code到后端，查询用户状态
          wx.request({
            url: '',
            method: 'POST',
            data: { 
              loginCode: res.code // 微信登录code，用于换取openid
            },
            success: (response) => {
              
              if (response.data.success) {
                const { isNewUser, tempUserId } = response.data;
                
                this.setData({ 
                  isNewUser,
                  tempUserId 
                });
                
                // 保存临时用户ID到本地存储，用于后续请求
                if (tempUserId) {
                  wx.setStorageSync('tempUserId', tempUserId);
                }
                
                // 老用户直接显示验证码登录
                if (!isNewUser) {
                  this.setData({ isShowCodeLogin: true });
                }
                // 新用户默认显示快捷登录（isShowCodeLogin保持false）
              } else {
                this.handleError(response.data.msg || '获取用户状态失败');
              }
            },
            fail: (error) => {
              console.error('检查用户状态请求失败:', error);
              this.handleError('网络异常，请稍后再试');
            }
          });
        } else {
          this.handleError('获取登录状态失败');
        }
      },
      fail: (error) => {
        console.error('wx.login失败:', error);
        this.handleError('登录服务异常');
      }
    });
  },

  // 处理各类错误：显示提示并切换到验证码登录
  handleError(msg) {
    wx.showToast({
      title: msg,
      icon: 'none',
      duration: 2000
    });
    this.setData({
      isShowCodeLogin: false // 错误时强制显示验证码登录
    });
  },

  // 手机号输入监听 + 格式验证
  bindPhoneInput(e) {
    // replace(/\D/g, '') 过滤所有非数字字符（空格+字母+符号）
    const phone = e.detail.value.replace(/\D/g, ''); 
    const isPhoneValid = /^1[3-9]\d{9}$/.test(phone);
    this.setData({
      phoneNumber: phone,
      isPhoneValid
    });
    this.updateLoginButtonStatus(); // 新增：更新按钮状态
  },

  // 验证码输入监听
  bindVerifyInput(e) {
    // 过滤非数字，确保验证码纯数字
    const verifyCode = e.detail.value.replace(/\D/g, '');
    this.setData({ verifyCode });
    this.updateLoginButtonStatus(); // 新增：更新按钮状态
  },

  // 切换用户协议勾选状态（新增方法）
  toggleAgreement() {
    const agreementChecked = !this.data.agreementChecked;
    this.setData({ agreementChecked });
    this.updateLoginButtonStatus(); // 新增：更新按钮状态
  },

  // 更新登录按钮状态（核心判断逻辑）
  updateLoginButtonStatus() {
    const { isPhoneValid, verifyCode, agreementChecked } = this.data;
    // 三个条件同时满足才启用按钮：手机号有效 + 验证码不为空 + 同意协议
    const isLoginDisabled = !(isPhoneValid && verifyCode.trim() !== '' && agreementChecked);
    this.setData({ isLoginDisabled });
  },

  // 获取验证码 + 倒计时
  getVerifyCode() {
    if (!this.data.isPhoneValid) {
      wx.showToast({ 
        title: '请输入正确的手机号', 
        icon: 'none' 
      });
      return;
    }
    
    // 显示发送中状态
    this.setData({ isCodeSending: true });
    
    // 获取临时用户ID
    const tempUserId = wx.getStorageSync('tempUserId') || this.data.tempUserId;
    
    // 调用后端发送验证码接口
    wx.request({
      url: '',
      method: 'POST',
      data: {
        phoneNumber: this.data.phoneNumber,
        tempUserId: tempUserId
      },
      success: (res) => {
        if (res.data.success) {
          wx.showToast({
            title: '验证码已发送',
            icon: 'success'
          });
          
          // 开始倒计时
          this.startCountDown();
        } else {
          this.setData({ isCodeSending: false });
          wx.showToast({
            title: res.data.msg || '验证码发送失败',
            icon: 'none'
          });
        }
      },
      fail: (error) => {
        this.setData({ isCodeSending: false });
        console.error('发送验证码请求失败:', error);
        wx.showToast({
          title: '网络异常，请重试',
          icon: 'none'
        });
      }
    });
  },

  // 开始倒计时
  startCountDown() {
    this.timer = setInterval(() => {
      if (this.data.countDown <= 1) {
        clearInterval(this.timer);
        this.setData({ 
          countDown: 60, 
          isCodeSending: false 
        });
      } else {
        this.setData({ countDown: this.data.countDown - 1 });
      }
    }, 1000);
  },

  // 验证码登录
  codeLogin() {

    // 若按钮处于禁用状态，直接提示并返回
    if (this.data.isLoginDisabled) {
      wx.showToast({
        title: '请完善信息并同意用户协议',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    
    const { phoneNumber, verifyCode } = this.data;
    
    if (!this.data.isPhoneValid) {
      wx.showToast({ 
        title: '请输入正确的手机号', 
        icon: 'none' 
      });
      return;
    }
    
    if (!verifyCode) {
      wx.showToast({ 
        title: '请输入验证码', 
        icon: 'none' 
      });
      return;
    }
    
    // 获取临时用户ID
    const tempUserId = wx.getStorageSync('tempUserId') || this.data.tempUserId;
    
    wx.showLoading({ title: '登录中...' });
    
    // 调用后端验证码登录接口
    wx.request({
      url: '',
      method: 'POST',
      data: {
        phoneNumber: phoneNumber,
        verifyCode: verifyCode,
        tempUserId: tempUserId
      },
      success: (res) => {
        wx.hideLoading();
        
        if (res.data.success) {
          // 登录成功
          wx.setStorageSync('userInfo', res.data.userInfo);
          wx.setStorageSync('token', res.data.token);
          
          // 清除临时用户ID
          wx.removeStorageSync('tempUserId');
          
          wx.showToast({
            title: '登录成功',
            icon: 'success',
            success: () => {
              setTimeout(() => {
                wx.reLaunch({ url: '/pages/index/index' });
              }, 1500);
            }
          });
        } else {  
          wx.showToast({
            title: res.data.msg || '登录失败',
            icon: 'none'
          });
        }
      },
      fail: (error) => {
        wx.hideLoading();
        console.error('验证码登录请求失败:', error);
        wx.showToast({
          title: '网络异常，请重试',
          icon: 'none'
        });
      }
    });
  },
});