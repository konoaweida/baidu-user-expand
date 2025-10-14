import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'
import { store } from '../store/store'

Component({
  behaviors: [storeBindingsBehavior],
  storeBindings: {
    store,
    fields: {
      active: 'activeTabBarIndex' 
    },
    actions: {
      updateActive: 'updateActiveTabBarIndex'
    }
  },
  data: {
    list: [
      { pagePath: "/pages/expand/expand", text: "拓圈", icon: "usergroup-add" },
      { pagePath: "/pages/chat/chat", text: "聊天", icon: "chat-bubble" },
      { pagePath: "/pages/event/event", text: "事件", icon: "calendar" },
      { pagePath: "/pages/schedule/schedule", text: "行程", icon: "task-checked" },
      { pagePath: "/pages/user/user", text: "我的", icon: "user" },
    ],
  },
  lifetimes: {
    // 组件挂载时执行
    // attached() {
    //   setTimeout(() => {
    //     this.syncTabBarActive();
    //   }, 100);
    // }
  },
  methods: {
    // 核心方法：自动同步当前页面对应的TabBar索引
    // syncTabBarActive() {
    //   // 1. 获取当前页面路径（如 "/pages/chat/chat"）
    //   const pages = getCurrentPages()
    //   const currentPage = pages[pages.length - 1]
    //   const currentPath = currentPage.route // 获取路由（不带"/"）
    //   const fullCurrentPath = `/${currentPath}` // 拼接成完整路径（带"/"）

    //   // 2. 在list中查找当前路径对应的索引
    //   const matchedIndex = this.data.list.findIndex(
    //     item => item.pagePath === fullCurrentPath
    //   )

    //   // 3. 如果找到匹配的索引，更新激活状态
    //   if (matchedIndex !== -1 && matchedIndex !== this.data.active) {
    //     this.updateActive(matchedIndex)
    //   }
    // },
    onChange(e) {
      const selectedIndex = e.detail.value;

      const targetPath = this.data.list[selectedIndex].pagePath;

      this.updateActive(selectedIndex);

      wx.switchTab({ 
        url: targetPath
      });
    },
  },
});