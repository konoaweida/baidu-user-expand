const app = getApp();

// ---------------------- 基础配置 ----------------------
const BASE_CONFIG = {
  baseURL: 'http://1.95.53.183:8095/bd-client',
  timeout: 10000,
  defaultHeader: {
    'Content-Type': 'application/json'
  },
  expireThreshold: 300000 // Token 剩 5 分钟则提前刷新
};

// ---------------------- 缓存工具 ----------------------
function saveTokenToStorage({
  accessToken,
  refreshToken,
  tokenExpireTime,
  refreshTokenExpireTime
}) {
  wx.setStorageSync('token', accessToken);
  wx.setStorageSync('refreshToken', refreshToken);
  wx.setStorageSync('tokenExpireTime', tokenExpireTime);
  wx.setStorageSync('refreshTokenExpireTime', refreshTokenExpireTime);
}

// ---------------------- token有效性判断 ----------------------
function checkTokenValidity(needToken = true) {
  // 不需要 token 的请求，直接通过
  if (!needToken) return { valid: true, needRefresh: false, msg: '' };

  const now = Date.now();
  const { token, tokenExpireTime } = app.globalData;

  // 无 token
  if (!token) {
    return { valid: false, needRefresh: false, msg: '未登录，请先登录' };
  }

  // 已过期 → 直接刷新
  if (tokenExpireTime <= now) {
    return { valid: true, needRefresh: true, msg: '' };
  }

  // 即将过期（小于阈值）→ 提前刷新
  if (tokenExpireTime - now < BASE_CONFIG.expireThreshold) {
    return { valid: true, needRefresh: true, msg: '' };
  }

  return { valid: true, needRefresh: false, msg: '' };
}

// ---------------------- 主请求函数 ----------------------
function request(options = {}) {
  const config = {
    url: '',
    method: 'GET',
    data: {},
    needToken: true, // 默认需要 token
    header: {},
    ...options
  };

  return new Promise((resolve, reject) => {
    // 检查 token 状态
    const check = checkTokenValidity(config.needToken);

    if (!check.valid) {
      return reject(new Error(check.msg));
    }

    // 若需刷新 → 刷新 token
    if (check.needRefresh) {
      refreshAccessToken()
        .then(() => sendRequest(config, resolve, reject))
        .catch(err => {
          // 刷新失败 → 跳登录
          handleLoginRedirect();
          reject(err);
        });
      return;
    }

    // 直接发请求
    sendRequest(config, resolve, reject);
  });
}

// ---------------------- 发送请求 ----------------------
function sendRequest(config, resolve, reject) {
  const fullUrl = BASE_CONFIG.baseURL + config.url;

  // header 合并
  const header = { ...BASE_CONFIG.defaultHeader, ...config.header };

  // 附加 token
  if (config.needToken && app.globalData.token && !header.Authorization) {
    header.Authorization = `${app.globalData.token}`;
  }

  wx.request({
    url: fullUrl,
    method: config.method,
    data: config.data,
    header,
    timeout: BASE_CONFIG.timeout,

    success: (res) => {
      const { statusCode, data } = res;  
      // HTTP 层异常
      if (statusCode < 200 || statusCode >= 300) {
        return reject(new Error(`HTTP错误：${statusCode}`));
      }

      // 业务 code 非 200
      if (data.code !== 200) {
        const msg = data.msg || '请求失败，请重试';

        // 401 | Token失效
        if (data.code === 401 || msg.includes('Token过期') || msg.includes('未登录')) {
          app.clearAllToken();
          
          handleLoginRedirect();
          return reject(new Error('登录已过期，请重新登录'));
        }

        return reject(new Error(msg));
      }

      return resolve(data);
    },

    fail: (err) => {
      const msg = err.errMsg.includes('timeout')
        ? '请求超时，请检查网络后重试'
        : '网络异常，请检查连接';

      reject(new Error(msg));
    }
  });
}

// ---------------------- 刷新 Token ----------------------
function refreshAccessToken() {
  return new Promise((resolve, reject) => {
    const now = Date.now();
    const { refreshToken, refreshTokenExpireTime, isRefreshing } = app.globalData;

    // 无 refreshToken
    if (!refreshToken) {
      return reject(new Error('无刷新凭证，请重新登录'));
    }

    // refreshToken 过期
    if (refreshTokenExpireTime <= now) {
      app.clearAllToken();
      console.log(111);
      
      return reject(new Error('刷新凭证已过期，请重新登录'));
    }

    // ✅ 并发控制 → 若正在刷新，等待
    if (isRefreshing) {
      const waitTimer = setInterval(() => {
        if (!app.globalData.isRefreshing) {
          clearInterval(waitTimer);

          if (app.globalData.token) resolve();
          else reject(new Error('刷新失败'));
        }
      }, 200);
      return;
    }

    app.globalData.isRefreshing = true;

    wx.request({
      url: `${BASE_CONFIG.baseURL}/auth/refresh-token`,
      method: 'POST',
      data: { refreshToken },
      header: BASE_CONFIG.defaultHeader,

      success: (res) => {
        app.globalData.isRefreshing = false;

        if (res.data && res.data.code === 200) {
          const {
            access_token,
            refresh_token,
            expire_in,
            refresh_expire_in
          } = res.data.data || {};

          // 返回参数校验
          if (!access_token || !refresh_token || !expire_in || !refresh_expire_in) {
            app.clearAllToken();
                  console.log(111);
            return reject(new Error('刷新接口返回格式错误'));
          }

          // 计算有效期
          const newTokenExpire = now + expire_in * 1000;
          const newRefreshExpire = now + refresh_expire_in * 1000;

          // 存全局
          app.globalData.token = access_token;
          app.globalData.refreshToken = refresh_token;
          app.globalData.tokenExpireTime = newTokenExpire;
          app.globalData.refreshTokenExpireTime = newRefreshExpire;

          // 存本地
          saveTokenToStorage({
            accessToken: access_token,
            refreshToken: refresh_token,
            tokenExpireTime: newTokenExpire,
            refreshTokenExpireTime: newRefreshExpire
          });

          return resolve();
        } else {
          app.clearAllToken();
                console.log(111);
          return reject(new Error(res.data?.msg || 'Token刷新失败，请重新登录'));
        }
      },

      fail: (err) => {
        app.globalData.isRefreshing = false;
        app.clearAllToken();
              console.log(111);
        reject(new Error('刷新请求失败：' + err.errMsg));
      }
    });
  });
}

// ---------------------- 登录重定向 ----------------------
function handleLoginRedirect() {
  // 避免多次弹窗
  if (app.globalData.isLoginRedirect) return;
  app.globalData.isLoginRedirect = true;

  wx.showModal({
    title: '登录失效',
    content: '您的登录状态已过期，请重新登录',
    showCancel: false,
    confirmText: '去登录',
    confirmColor: '#2F54EB',
    success: () => {
      wx.reLaunch({
        url: '/pages/login/login',
        complete: () => {
          app.globalData.isLoginRedirect = false;
        }
      });
    }
  });
}

// ---------------------- GET/POST 快捷方法 ----------------------
function get(url, data = {}, options = {}) {
  return request({ url, data, method: 'GET', ...options });
}

function post(url, data = {}, options = {}) {
  return request({ url, data, method: 'POST', ...options });
}

// ---------------------- 导出 ----------------------
module.exports = {
  request,
  get,
  post,
  clearToken: app.clearAllToken
};
