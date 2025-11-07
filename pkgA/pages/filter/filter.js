// pkgA/pages/filter/filter.js
const filterStore = require('../../../store/filterStore');
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
              wx.redirectTo({ url: '/pages/expand/expand' });
            }
          });
        }
      }
    });
  },
  // 重置筛选条件
  onReset() {
    // 二次确认弹窗
    wx.showModal({
      title: '提示',
      content: '确定要重置所有筛选条件为默认值吗？',
      confirmText: '确定',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.resetToDefault();
        }
      }
    });
  },
  // 重置为默认值
  resetToDefault() {
    // 1. 重置页面数据为初始状态
    this.setData({
      // 星座重置
      zodiac: '',
      selectedConstellation: '',
      // 性别重置
      gender: 'any',
      // 收入滑块重置
      incomeLeft: 0,
      incomeRight: 0,
      prevIncome: [0, 0],
      // 年龄滑块重置
      ageLeft: 0,
      ageRight: 0,
      prevAge: [0, 0]
    });

    // 2. 重置全局filterStore为默认值
    const defaultFilters = {
      gender: 'any',
      ageMin: 0,
      ageMax: 60,
      incomeMin: 0,
      incomeMax: 10000,
      constellation: '',
      intents: [], // 预留字段
      cityIds: []  // 预留字段
    };
    filterStore.setFilters(defaultFilters);

    // 3. 显示重置成功提示
    wx.showToast({
      title: '已重置为默认筛选',
      icon: 'none',
      duration: 1500
    });
  },
  // 完成筛选（提交数据）
  onConfirm() {
    // 1. 数据校验
    const ageMin = Math.min(this.data.ageLeft, this.data.ageRight);
    const ageMax = Math.max(this.data.ageLeft, this.data.ageRight);
    const incomeMin = Math.min(this.data.incomeLeft, this.data.incomeRight);
    const incomeMax = Math.max(this.data.incomeLeft, this.data.incomeRight);

    // 简单校验
    if (ageMin < 0 || ageMax > 60) {
      wx.showToast({
        title: '年龄范围应在0-60之间',
        icon: 'none',
        duration: 1500
      });
      return;
    }

    if (incomeMin < 0 || incomeMax > 10000) {
      wx.showToast({
        title: '收入范围应在0-10000之间',
        icon: 'none',
        duration: 1500
      });
      return;
    }

    // 2. 组装完整的filterData（符合数据契约）
    const filterData = {
      gender: this.data.gender,
      ageMin: ageMin,
      ageMax: ageMax,
      incomeMin: incomeMin,
      incomeMax: incomeMax,
      constellation: this.data.zodiac || '',
      intents: [], // 预留字段
      cityIds: []  // 预留字段
    };

    // 3. 更新全局存储
    filterStore.setFilters(filterData);

    // 4. 显示保存成功提示
    wx.showToast({
      title: '筛选条件已应用',
      icon: 'none',
      duration: 1500
    });

    // 5. 延迟返回上一页（确保提示可见）
    setTimeout(() => {
      wx.navigateBack({
        delta: 1,
        fail: () => {
          wx.redirectTo({ url: '/pages/expand/expand' });
        }
      });
    }, 1000);
  },
});