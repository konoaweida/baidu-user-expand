// component/build-relationships/build-relationships.js
const request = require('../../utils/request.js'); // 引入请求工具

Component({
  /**
   * 组件属性：控制显示/传递目标用户ID
   */
  properties: {
    show: {
      type: Boolean,
      value: false,
      observer(newVal) {
        if (newVal && this.data.targetUserId) {
          this.getCpTypes(); // 显示时加载数据（需目标用户ID存在）
        }
      }
    },
    targetUserId: {
      type: String,
      value: ''
    }
  },

  /**
   * 组件数据：同步新代码的数据源结构
   */
  data: {
    inputValue: '',
    wordCount: 0,
    cpTypesList: [], // 优先接口数据
    // 静态备用数据（字段同步新代码：id、typeName、sortOrder）
    relationshipList: [
      { id: 0, typeName: '家人', icon: '../../assets/image/relationship/图标-家人.png', sortOrder: 0 },
      { id: 1, typeName: '朋友', icon: '../../assets/image/relationship/图标-朋友.png', sortOrder: 1 },
      { id: 2, typeName: '恋人', icon: '../../assets/image/relationship/图标-恋人.png', sortOrder: 2 },
      { id: 3, typeName: '同学', icon: '../../assets/image/relationship/图标-同学.png', sortOrder: 3 },
      { id: 4, typeName: '同事', icon: '../../assets/image/relationship/图标-同事.png', sortOrder: 4 },
      { id: 5, typeName: '师生', icon: '../../assets/image/relationship/图标-师生.png', sortOrder: 5 },
      { id: 6, typeName: '网友', icon: '../../assets/image/relationship/图标-网友.png', sortOrder: 6 },
    ],
    selectedIndex: -1,
    isSubmitting: false
  },

  /**
   * 组件方法：同步新代码逻辑，保留组件化事件
   */
  methods: {
    /**
     * 导航栏返回：触发关闭事件
     */
    handleNavBack() {
      this.triggerEvent('navBack', {}, {
        success: () => this.triggerEvent('close')
      });
    },

    /**
     * 获取关系类型列表（优先接口，兜底静态数据）
     */
    getCpTypes() {
      this.setData({ cpTypesList: this.data.relationshipList });
      
      // request.get('/api/cp/types', {}, { needToken: false })
      //   .then(res => {
      //     // 验证接口返回数据是否为有效数组
      //     const isEffectiveData = Array.isArray(res.data) && res.data.length > 0;
      //     // 有效则用接口数据，否则用静态数据
      //     const finalData = isEffectiveData ? res.data : this.data.relationshipList;
      //     this.setData({ cpTypesList: this.data.relationshipList });
      //   })
      //   .catch(err => {
      //     console.error('获取关系类型失败，使用静态数据：', err);
      //     this.setData({ cpTypesList: this.data.relationshipList });
      //   });
    },

    /**
     * 输入框字数统计
     */
    onDescInput(e) {
      const value = e.detail.value || '';
      this.setData({
        inputValue: value,
        wordCount: value.length
      });
    },

    /**
     * 切换关系选中状态（点击整个选项）
     */
    onFamilyCheck(e) {
      const currentIndex = e.currentTarget.dataset.index;
      this.setData({
        selectedIndex: currentIndex === this.data.selectedIndex ? -1 : currentIndex
      });
    },

    /**
     * 提交关系申请：同步新代码的验证和提交逻辑
     */
    onConfirm() {
      const {
        selectedIndex,
        cpTypesList,
        inputValue,
        isSubmitting,
        targetUserId
      } = this.data;

      // 防止重复提交
      if (isSubmitting) return;

      // 验证选中状态
      if (selectedIndex === -1) {
        wx.showToast({ title: '请选择关系类型', icon: 'none', duration: 1500 });
        return;
      }

      // 验证目标用户ID
      if (!targetUserId) {
        wx.showToast({ title: '用户ID异常', icon: 'none' });
        return;
      }

      // 验证选中数据
      const selectedRelation = cpTypesList[selectedIndex];
      if (!selectedRelation) {
        wx.showToast({ title: '选中的关系数据异常', icon: 'none' });
        return;
      }

      // 收集提交数据
      const submitData = {
        relationshipType: selectedRelation.typeName, // 用新字段 typeName
        applyDesc: inputValue.trim(),
        targetUserId: targetUserId,
        token: wx.getStorageSync('token') || ''
      };

      // 验证登录状态
      if (!submitData.token) {
        wx.showToast({ title: '请先登录', icon: 'none' });
        return;
      }

      // 提交请求
      this.setData({ isSubmitting: true });
      wx.showLoading({ title: '提交中...' });

      wx.request({
        url: 'https://your-domain/api/relation/apply',
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${submitData.token}`
        },
        data: submitData,
        success: (res) => {
          if (res.data?.success) {
            wx.showToast({
              title: '申请发送成功',
              icon: 'success',
              duration: 1500,
              success: () => setTimeout(() => this.triggerEvent('close'), 1500)
            });
          } else {
            wx.showToast({
              title: res.data?.msg || '提交失败，请稍后重试',
              icon: 'none',
              duration: 1500
            });
          }
        },
        fail: (error) => {
          console.error('申请失败：', error);
          wx.showToast({ title: '网络异常，请重试', icon: 'none' });
        },
        complete: () => {
          this.setData({ isSubmitting: false });
          wx.hideLoading();
        }
      });
    }
  }
});