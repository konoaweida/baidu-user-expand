import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'
import { store } from '../store/store'

Component({
  behaviors: [storeBindingsBehavior],
  storeBindings: {
    store,
    fields: {
      active: 'activeTabBarIndex' // 从store获取当前选中索引
    },
    actions: {
      updateActive: 'updateActiveTabBarIndex' // 同步选中状态到store
    }
  },
  data: {
    isShow: true,
    list: [
      { 
        pagePath: "/pages/expand/expand", 
        text: "拓圈", 
        icon: "../assets/image/tabbar/拓圈.png", // 未选中图标
        selectedIcon: "../assets/image/tabbar/拓圈选中.png" // 选中图标
      },
      { 
        pagePath: "/pages/socialMine/socialMine", 
        text: "人脉矿场", 
        icon: "../assets/image/tabbar/广场.png",
        selectedIcon: "../assets/image/tabbar/广场选中.png"
      },
      { 
        pagePath: "/pages/infoPlaza/infoPlaza", 
        text: "信息广场", 
        icon: "../assets/image/tabbar/矿场.png",
        selectedIcon: "../assets/image/tabbar/矿场选中.png"
      },
      { 
        pagePath: "/pages/circles/circles", 
        text: "圈子", 
        icon: "../assets/image/tabbar/圈子.png",
        selectedIcon: "../assets/image/tabbar/圈子选中.png"
      },
      { 
        pagePath: "/pages/user/user", 
        text: "个人主页", 
        icon: "../assets/image/tabbar/我的.png",
        selectedIcon: "../assets/image/tabbar/我的选中.png"
      },
    ],
  },
  lifetimes: {
    // 组件挂载时同步当前页面的Tab状态
    attached() {
      // 延迟确保页面路由已加载
      setTimeout(() => {
        this.syncTabBarActive();
      }, 100);
    }
  },
  methods: {
    // 同步当前页面对应的Tab索引
    syncTabBarActive() {
      const pages = getCurrentPages();
      if (pages.length === 0) return;
      
      // 获取当前页面路由（如 "pages/chat/chat"）
      const currentPage = pages[pages.length - 1];
      const currentPath = `/${currentPage.route}`; // 拼接为完整路径（带"/"）
      
      // 查找当前路径在list中的索引
      const matchedIndex = this.data.list.findIndex(item => item.pagePath === currentPath);
      
      // 若找到匹配项且状态不一致，更新选中状态
      if (matchedIndex !== -1 && matchedIndex !== this.data.active) {
        this.updateActive(matchedIndex);
      }
    },

    // 点击Tab项切换页面
    switchTab(e) {
      const { path, index } = e.currentTarget.dataset;
      const currentActive = this.data.active;
      
      // 若点击的是当前选中项，不重复操作
      if (index === currentActive) return;
      
      // 更新选中状态到store
      this.updateActive(index);
      
      // 切换到目标Tab页面（仅支持app.json中配置的tabBar页面）
      wx.switchTab({
        url: path,
        fail: (err) => {
          console.error("Tab切换失败：", err);
        }
      });
    },

    // 切换TabBar显隐状态（供外部调用）
    toggleVisibility(flag) {
      this.setData({ isShow: flag });
    },
  },
});