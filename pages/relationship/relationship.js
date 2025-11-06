const request = require('../../utils/request.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    inputValue: '',        // 输入框内容
    wordCount: 0,          // 字数统计
    cpTypesList: [],       // 主要数据源（优先接口数据，为空则用静态数据）
    relationshipList: [    // 静态备用数据（结构与接口返回一致）
      { id: 0, typeName: '家人', icon: '../../assets/image/relationship/图标-家人.png', sortOrder: 0 },
      { id: 1, typeName: '朋友', icon: '../../assets/image/relationship/图标-朋友.png', sortOrder: 1 },
      { id: 2, typeName: '恋人', icon: '../../assets/image/relationship/图标-恋人.png', sortOrder: 2 },
      { id: 3, typeName: '同学', icon: '../../assets/image/relationship/图标-同学.png', sortOrder: 3 },
      { id: 4, typeName: '同事', icon: '../../assets/image/relationship/图标-同事.png', sortOrder: 4 },
      { id: 5, typeName: '师生', icon: '../../assets/image/relationship/图标-师生.png', sortOrder: 5 },
      { id: 6, typeName: '网友', icon: '../../assets/image/relationship/图标-网友.png', sortOrder: 6 },
    ],
    selectedIndex: -1,     // 选中的关系索引（-1表示未选中）
    isSubmitting: false,   // 防止重复提交
    targetUserId: ''       // 对方用户ID（从跳转参数获取）
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.getCpTypes()
    // 从跳转参数获取对方用户ID
    if (options?.targetUserId) {
      this.setData({ targetUserId: options.targetUserId });
      this.getCpTypes(); // 加载关系类型数据（优先接口，兜底静态数据）
    } else {
      wx.showToast({ title: '参数错误，缺少用户ID', icon: 'none' });
      setTimeout(() => wx.navigateBack({ delta: 1 }), 1500);
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {},

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {},

  /**
   * 获取关系类型列表（核心逻辑：接口数据优先，为空/失败则用静态数据）
   */
  getCpTypes() {
    this.setData({ cpTypesList: this.data.relationshipList });
    // request.get('/api/cp/types', {}, { needToken: false })
    //   .then(res => {
    //     console.log(111);
        
    //     // 验证接口返回数据是否为有效数组
    //     const isEffectiveData = Array.isArray(res) && res.length > 0;
    //     // 有效则用接口数据，否则用静态数据
    //     const finalData = isEffectiveData ? res : this.data.relationshipList;
    //     this.setData({ cpTypesList: this.data.relationshipList });
    //   })
    //   .catch(err => {
    //     this.setData({ cpTypesList: this.data.relationshipList });
    //     console.error('获取关系类型接口失败，使用静态数据：', err);
    //     // 接口请求失败时，强制使用静态数据
    //   });
  },

  /**
   * 监听输入框变化，更新字数统计
   */
  onDescInput(e) {
    const value = e.detail.value || ''; // 处理空值
    this.setData({
      inputValue: value,
      wordCount: value.length
    });
  },

  /**
   * 切换关系选项的选中状态
   */
  onFamilyCheck(e) {
    const currentIndex = e.currentTarget.dataset.index;
    // 点击已选中项则取消选中，否则选中当前项
    this.setData({
      selectedIndex: currentIndex === this.data.selectedIndex ? -1 : currentIndex
    });
  },

  /**
   * 提交关系申请
   */
  onConfirm() {
    const {
      selectedIndex,
      cpTypesList,  // 使用主要数据源
      inputValue,
      isSubmitting,
      targetUserId
    } = this.data;

    // 1. 防止重复提交
    if (isSubmitting) return;

    // 2. 验证选中状态
    if (selectedIndex === -1) {
      wx.showToast({
        title: '请选择关系类型',
        icon: 'none',
        duration: 1500
      });
      return;
    }

    // 3. 验证对方用户ID
    if (!targetUserId) {
      wx.showToast({ title: '用户ID异常', icon: 'none' });
      return;
    }

    // 4. 获取选中的关系数据
    const selectedRelation = cpTypesList[selectedIndex];
    if (!selectedRelation) {
      wx.showToast({ title: '选中的关系数据异常', icon: 'none' });
      return;
    }

    // 5. 收集提交数据
    const submitData = {
      relationshipType: selectedRelation.typeName, // 从主要数据源获取关系名称
      applyDesc: inputValue.trim(),                // 申请说明（去空格）
      targetUserId: targetUserId,                  // 对方用户ID
      token: wx.getStorageSync('token') || ''      // 用户登录凭证
    };

    // 6. 验证登录状态
    if (!submitData.token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    // 7. 开始提交（更新状态防止重复提交）
    this.setData({ isSubmitting: true });
    wx.showLoading({ title: '提交中...' });

    // 8. 调用后端接口提交
    wx.request({
      url: 'https://your-domain/api/relation/apply', // 替换为实际接口地址
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${submitData.token}` // token放入请求头（按接口要求调整）
      },
      data: submitData,
      success: (res) => {
        // 接口返回成功处理
        if (res.data?.success) {
          wx.showToast({
            title: '申请发送成功',
            icon: 'success',
            duration: 1500,
            success: () => {
              // 成功后返回上一页
              setTimeout(() => wx.navigateBack({ delta: 1 }), 1500);
            }
          });
        } else {
          // 接口返回业务失败（如已发送过申请）
          wx.showToast({
            title: res.data?.msg || '提交失败，请稍后重试',
            icon: 'none',
            duration: 1500
          });
        }
      },
      fail: (error) => {
        // 网络请求失败
        console.error('关系申请接口请求失败：', error);
        wx.showToast({
          title: '网络异常，请检查网络后重试',
          icon: 'none',
          duration: 1500
        });
      },
      complete: () => {
        // 无论成功/失败，重置提交状态并关闭加载提示
        this.setData({ isSubmitting: false });
        wx.hideLoading();
      }
    });
  }

})