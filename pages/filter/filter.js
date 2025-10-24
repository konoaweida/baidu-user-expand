const filterStore = require('../../store/filterStore.js');
Page({
  data: {
    // 星座相关
    showConstellationPopup: false, // 控制弹出层显示
    selectedConstellation: '', // 选中的星座
    zodiac: '', // 星座显示文本
    constellationList: [ // 星座列表
      '摩羯座', '水瓶座', '双鱼座', '白羊座', 
      '金牛座', '双子座', '巨蟹座', '狮子座', 
      '处女座', '天秤座', '天蝎座', '射手座'
    ],

    // 性别相关
    gender: 'any', 
    genderOptions: [
      { value: 'any', text: '不限' },
      { value: 'male', text: '男' },
      { value: 'female', text: '女' }
    ],

    // 收入滑块相关（视觉游标位置+历史值）
    incomeLeft: 0,
    incomeRight: 0,
    prevIncome: [0, 0],

    // 年龄滑块相关（视觉游标位置+历史值）
    ageLeft: 0,
    ageRight: 0,
    prevAge: [0, 0]
  },

  // 性别选择
  selectGender(e) {
    const gender = e.currentTarget.dataset.value;
    this.setData({ gender });
  },

  // 打开星座弹出层
  openConstellationPopup() {
    this.setData({ 
      showConstellationPopup: true,
      // 打开时保留已选值（若无则默认空）
      selectedConstellation: this.data.zodiac || '' 
    });
  },

  // 关闭星座弹出层
  closeConstellationPopup() {
    this.setData({ showConstellationPopup: false });
  },

  // 选择星座
  selectConstellation(e) {
    this.setData({
      selectedConstellation: e.currentTarget.dataset.value
    });
  },

  // 确认星座选择
  confirmConstellation() {
    this.setData({ 
      showConstellationPopup: false, 
      zodiac: this.data.selectedConstellation 
    });
  },

  // 收入滑块拖动中（实时更新视觉位置）
  onIncomeDrag(e) {
    const current = e.detail;
    // console.log(e.detail);
    
    // 严格校验数据有效性（避免undefined）
    if (!Array.isArray(current) || current.length !== 2 || 
        typeof current[0] !== 'number' || typeof current[1] !== 'number') {
      return;
    }
    const prev = this.data.prevIncome;

    // 判断左/右游标移动
    if (current[0] !== prev[0] && current[1] === prev[1]) {
      // 左游标移动
      this.setData({
        incomeLeft: current[0],
        prevIncome: current
      });
    } else if (current[1] !== prev[1] && current[0] === prev[0]) {
      // 右游标移动
      this.setData({
        incomeRight: current[1],
        prevIncome: current
      });
    } else {
      // 初始状态或特殊情况（如交叉拖动）
      this.setData({
        incomeLeft: current[0],
        incomeRight: current[1],
        prevIncome: current
      });
    }
  },

  // 收入滑块结束拖动
  onIncomeChange(e) {
    // console.log(e.detail);
    this.onIncomeDrag(e); // 复用拖动逻辑
  },

  // 年龄滑块拖动中（实时更新视觉位置）
  onAgeDrag(e) {
    const current = e.detail;
    // 严格校验数据有效性
    if (!Array.isArray(current) || current.length !== 2 || 
        typeof current[0] !== 'number' || typeof current[1] !== 'number') {
      return;
    }
    const prev = this.data.prevAge;

    // 判断左/右游标移动
    if (current[0] !== prev[0] && current[1] === prev[1]) {
      // 左游标移动
      this.setData({
        ageLeft: current[0],
        prevAge: current
      });
    } else if (current[1] !== prev[1] && current[0] === prev[0]) {
      // 右游标移动
      this.setData({
        ageRight: current[1],
        prevAge: current
      });
    } else {
      // 初始状态或特殊情况
      this.setData({
        ageLeft: current[0],
        ageRight: current[1],
        prevAge: current
      });
    }
  },

  // 年龄滑块结束拖动
  onAgeChange(e) {
    this.onAgeDrag(e); // 复用拖动逻辑
  },

  // 头部返回按钮（二次确认）
  onHeaderBack() {
    wx.showModal({
      title: '提示',
      content: '是否放弃当前筛选变更？',
      confirmText: '放弃',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.navigateBack({
            delta: 1,
            fail: () => {
              wx.redirectTo({ url: '/pages/potentialContacts/potentialContacts' });
            }
          });
        }
      }
    });
  },

  // 完成筛选（提交数据）
  onConfirm() {
    // 组装筛选数据（确保范围为 [min, max]）
    const filterData = {
      constellation: this.data.zodiac || '',
      gender: this.data.gender,
      income: {
        min: Math.min(this.data.incomeLeft, this.data.incomeRight),
        max: Math.max(this.data.incomeLeft, this.data.incomeRight)
      },
      age: {
        min: Math.min(this.data.ageLeft, this.data.ageRight),
        max: Math.max(this.data.ageLeft, this.data.ageRight)
      }
    };

    // 更新全局存储
    filterStore.setFilters(filterData);

    // 返回上一页
    wx.navigateBack({
      delta: 1,
      fail: () => {
        wx.redirectTo({ url: '/pages/expand/expand' });
      }
    });
  }
});