// pages/filter/filter.js
const filterStore = require('../../store/filterStore.js');
Page({
  data: {
    value: 35,
    label(value, position) {
      const symbols = { min: '%', max: '%', start: '%', end: '%' };
      return `${value}${symbols[position]}`;
    },
    // 星座相关
    showConstellationPopup: false, // 控制弹出层显示
    selectedConstellation: '', // 选中的星座
    zodiac: '', // 星座显示文本
    constellationList: [ // 星座列表（供遍历）
      '摩羯座', '水瓶座', '双鱼座', '白羊座', 
      '金牛座', '双子座', '巨蟹座', '狮子座', 
      '处女座', '天秤座', '天蝎座', '射手座'
    ],
    gender: 'any', 
    genderOptions: [
      { value: 'any', text: '不限' },
      { value: 'male', text: '男' },
      { value: 'female', text: '女', }
    ],
    // 收入范围（滑块值）
    incomeRange: [0, 5000],

    // 年龄范围（滑块值）
    ageRange: [18, 60]
  },
    // handleChange(e) {
    //   this.setData({
    //     value: e.detail.value,
    //   });
    // },
  selectGender(e) {
    const gender = e.currentTarget.dataset.value;
    this.setData({
      gender: gender
    });
  },
  // 打开星座弹出层
  openConstellationPopup() {
    this.setData({ showConstellationPopup: true, selectedConstellation: '双鱼座'});
  },

  // 关闭星座弹出层
  closeConstellationPopup() {
    this.setData({ showConstellationPopup: false, selectedConstellation: ''});
  },

  // 选择星座
  selectConstellation(e) {
    this.setData({
      selectedConstellation: e.currentTarget.dataset.value
    });
  },

  // 确认星座选择
  confirmConstellation() {
    this.setData({ showConstellationPopup: false, zodiac: this.data.selectedConstellation });
  },
  
  // 收入滑块变更
  onIncomeChange(e) {
    this.setData({
      incomeRange: e.detail.value
    });
  },

  // 年龄滑块变更
  onAgeChange(e) {
    this.setData({
      ageRange: e.detail.value
    });
  },
  onHeaderBack() {
    // 1. 弹出二次确认弹窗
    wx.showModal({
      title: '提示',
      content: '是否放弃当前筛选变更？', // 明确告知用户“不保存”
      confirmText: '放弃',
      cancelText: '取消',
      success: (res) => {
        // 2. 用户确认放弃：执行返回（不保存任何筛选变更）
        if (res.confirm) {
          wx.navigateBack({
            delta: 1,
            fail: () => {
              // 降级逻辑：若无法返回（如页面栈仅1层），跳回潜在人脉页（需替换为你的人脉页路径）
              wx.redirectTo({ url: '/pages/potentialContacts/potentialContacts' });
            }
          });
        }
        // 3. 用户取消：留在当前筛选页，不做任何操作（保留已选筛选条件）
      }
    });
  },

  // 完成筛选（返回上一页并携带筛选数据）
  onConfirm() {
    // 1. 组装筛选数据（与之前一致，确保字段完整）
    const filterData = {
      constellation: this.data.selectedConstellation || '',  // 空值处理
      gender: this.data.gender,
      income: {
        min: this.data.incomeRange[0],
        max: this.data.incomeRange[1]
      },
      age: {
        min: this.data.ageRange[0],
        max: this.data.ageRange[1]
      }
    };

    // 2. 关键：将筛选数据更新到全局store
    filterStore.setFilters(filterData);

    // 3. 返回潜在人脉页（无需传递参数，人脉页从store获取）
    wx.navigateBack({
      delta: 1,
      fail: () => {
        // 降级逻辑：跳回人脉页（避免页面栈异常）
        wx.redirectTo({ url: '/pages/expand/expand' });
      }
    });
  }
});