// 引入工具函数
const { getMenuButtonTopRpx, getMenuButtonHeightRpx } = require('../../utils/util')

Component({
  /**
   * 组件的属性列表：新增 showPlaceholder 控制占位显隐
   */
  properties: {
    // 是否显示顶部占位（默认需要，值为 true）
    showPlaceholder: {
      type: Boolean,
      value: true // 默认显示占位，不传递参数时也会显示
    },
    // 原有属性保留
    showBackButton: {
      type: Boolean,
      value: false
    },
    title: {
      type: String,
      value: ''
    },
    backButtonColor: {
      type: String,
      value: '#333'
    },
    titleColor: {
      type: String,
      value: '#333'
    }
  },

  /**
   * 组件的初始数据（不变）
   */
  data: {
    menuTop: 0,
    menuHeight: 0,
    backSymbol: '<'
  },

  /**
   * 组件生命周期（不变）
   */
  attached() {
    const menuTop = getMenuButtonTopRpx()
    const menuHeight = getMenuButtonHeightRpx()
    
    this.setData({
      menuTop,
      menuHeight
    })
  },

  /**
   * 组件的方法列表（不变）
   */
  methods: {
    onBackClick() {
      wx.navigateBack({
        delta: 1,
        fail: () => {
          // 可选：无法返回时的降级逻辑
          // wx.switchTab({ url: '/pages/index/index' })
        }
      })
      this.triggerEvent('back', {}, {})
    }
  }
})