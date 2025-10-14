import { observable, action } from 'mobx-miniprogram'

// 创建 store 实例
export const store = observable({
  // 当前激活的 tabBar 索引
  activeTabBarIndex: 0,

  // 更新激活的 tabBar 索引
  updateActiveTabBarIndex: action(function(index) {
    this.activeTabBarIndex = index
    console.log('TabBar index updated to:', index)
  }),

  // 可以根据需要添加其他状态
  userInfo: null,
  
  setUserInfo: action(function(info) {
    this.userInfo = info
  })
})