Component({

  /**
   * 组件的属性列表
   */
  properties: {
    // 修正：接收单个帖子对象（与页面 posts 数组的每一项格式匹配）
    postData: {
      type: Object, // 每个 post-item 对应一个帖子对象
      value: {},    // 默认空对象，避免 undefined
      // observer(newVal) { // 监听数据变化，确认数据是否传递成功
      //   console.log("组件接收的帖子数据：", newVal); 
      // }
    }
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {

  }
})