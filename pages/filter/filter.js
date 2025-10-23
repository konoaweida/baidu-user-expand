// pages/filter/filter.js
// pages/filter/filter.js
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
    selectedGender: 0, // 0代表不限
    genderOptions: [
      { value: 0, text: '不限' },
      { value: 1, text: '男' },
      { value: 2, text: '女' }
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
    const gender = parseInt(e.currentTarget.dataset.value); // 转数字
    this.setData({
      selectedGender: gender
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

  // 完成筛选（返回上一页并携带筛选数据）
  onConfirm() {
    const pages = getCurrentPages();  
    // 确认当前页面栈长度，避免越界
    if (pages.length > 1) {
      const prevPage = pages[pages.length - 2];
      prevPage.setData({
        filterResult: {
          constellation: this.data.selectedConstellation,
          gender: this.data.selectedGender,
          income: {
            min: this.data.incomeRange[0],
            max: this.data.incomeRange[1]
          },
          age: {
            min: this.data.ageRange[0],
            max: this.data.ageRange[1]
          }
        }
      });
      wx.navigateBack({ delta: 1 });
    } else {
      console.error('未找到上一页');
    }
  }
});