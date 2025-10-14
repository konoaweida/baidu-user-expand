Component({
  properties: {
    // 弹窗是否可见
    visible: {
      type: Boolean,
      value: false
    },
    // 弹窗标题
    title: {
      type: String,
      value: '标题文字'
    },
    // 取消按钮文字
    cancelText: {
      type: String,
      value: '取消'
    },
    // 确认按钮文字
    confirmText: {
      type: String,
      value: '确定'
    },
    // 弹窗位置：top, bottom, left, right, center
    placement: {
      type: String,
      value: 'center'
    }
  },
  methods: {
    // 取消按钮点击事件
    onCancel() {
      this.setData({ visible: false });
      // 触发取消事件，供父组件使用
      this.triggerEvent('cancel');
    },
    
    // 确认按钮点击事件
    onConfirm() {
      this.setData({ visible: false });
      // 触发确认事件，供父组件使用
      this.triggerEvent('confirm');
    },
    
    // 弹窗显示状态变化
    onVisibleChange(e) {
      this.setData({
        visible: e.detail.visible
      });
      // 触发可见性变化事件
      this.triggerEvent('visibleChange', { visible: e.detail.visible });
    }
  }
});
