// pages/socialMine/socialMine.js
Page({
  data: {
    webViewUrl: '', // 存储带参数的网页地址
    baseWebUrl: 'https://你的业务域名/web-page.html', // 基础网页地址（固定）
    h5Message: '暂无消息'
  },

  onLoad() {
    // const webViewContext = wx.createSelectorQuery().select('#web-view').context();
    // console.log(webViewContext);
    // webViewContext.postMessage({ data: 'Hello, H5 page!' });
    console.log(1111);
    

    
    // webViewContext.postMessage({ data: 'Hello, H5 page!' });
  },
  // 向网页发送消息
  sendMessageToWeb() {
    this.webview.postMessage({
      data: {
        type: 'hello',
        msg: '这是小程序发给网页的消息'
      }
    })
  },
  // 接收网页发送的消息
  onReceiveWebMessage(e) {
    console.log('小程序接收网页消息：', e.detail.data);
    // 消息格式：数组（包含网页多次 postMessage 的内容）
    const messages = e.detail.data;
    // 遍历消息处理业务逻辑（示例：提取用户信息、执行对应操作）
    messages.forEach(msg => {
      switch (msg.type) {
        case 'userInfo':
          console.log('获取网页传递的用户信息：', msg.data);
          // 可执行小程序端逻辑（如存储用户信息、跳转页面等）
          wx.setStorageSync('webUserInfo', msg.data);
          break;
        case 'submitAction':
          console.log('网页触发提交操作：', msg.content);
          // 示例：显示提示
          wx.showToast({ title: `收到提交：${msg.content}` });
          break;
        default:
          console.log('未知消息类型：', msg);
      }
    });
  },

  // 网页加载成功回调
  onWebLoadSuccess(e) {
    this.webview = wx.createWebViewContext('webview')
    console.log(this.webview);
    console.log('web-view 加载成功：', e.detail.src);
  },

  // 网页加载失败回调
  onWebLoadError(e) {
    console.error('web-view 加载失败：', e.detail.fullUrl);
    wx.showToast({ title: '网页加载失败', icon: 'none' });
  },

  // 分享时获取 web-view 网页地址（可选）
  onShareAppMessage(options) {
    console.log('当前 web-view 网页地址：', options.webViewUrl);
    return {
      title: '分享 web-view 页面',
      path: `/pages/webViewDemo/webViewDemo?url=${encodeURIComponent(options.webViewUrl)}`
    };
  },

  onTap() {
    const token = wx.getStorageSync('token')
    wx.request({
      url: 'http://192.168.0.108:8099/bd-client/api/graph/province/13/relations',
      method: 'GET',
      header: {
        'Authorization': token 
      },
      data: {
        userId: 3
      },
      success: (res) => {
        console.log('成功：', res);
      },
      fail: (err) => {
        console.error('失败原因：', err); // 重点看这里的错误信息！
        // 常见错误示例：
        // 1. errMsg: "request:fail url not in domain list" → 域名未配置（开发环境需关闭校验）
        // 2. errMsg: "request:fail connect ECONNREFUSED" → 服务端未启动或网络不通
        // 3. 服务端返回 401/403 → token无效或格式错误
      }
    })
  },

})