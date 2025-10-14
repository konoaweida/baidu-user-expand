// 引入工具函数：使用转换后返回 rpx 的函数（关键修改）
const { getMenuButtonTopRpx, getMenuButtonHeightRpx } = require('../../utils/util')

Component({
  /**
   * 组件的属性列表
   */
  properties: {

  },

  /**
   * 组件的初始数据
   * 此时 menuTop/menuHeight 存储的是 rpx 单位值（关键修改）
   */
  data: {
    menuTop: 0,
    menuHeight: 0,
  },

  /**
   * 组件生命周期：节点树完成初始化后执行
   */
  attached() {
    // 调用 rpx 版本函数，获取胶囊按钮的 rpx 尺寸（关键修改）
    const menuTop = getMenuButtonTopRpx()
    const menuHeight = getMenuButtonHeightRpx()
    
    // console.log('胶囊按钮-顶部距离（rpx）：', menuTop)
    // console.log('胶囊按钮-高度（rpx）：', menuHeight)
    
    // 存入 data，供 WXML 布局使用
    this.setData({
      menuTop,
      menuHeight
    })
  },

  /**
   * 组件的方法列表
   */
  methods: {
    
  }
})