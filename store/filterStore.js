// utils/filterStore.js：全局筛选数据存储工具
const filterStore = {
  // 存储筛选结果（初始为默认值）
  filters: {
    gender: 'any',
    ageMin: 0,
    ageMax: 60,
    incomeMin: 0,
    incomeMax: 10000,
    constellation: '',
    intents: [],
    cityIds: []
  },

  /**
   * 更新筛选结果
   * @param {Object} data - 筛选数据
   */
  setFilters(data) {
    // 确保所有必要字段都存在
    this.filters = {
      gender: data.gender || 'any',
      ageMin: data.ageMin !== undefined ? data.ageMin : 0,
      ageMax: data.ageMax !== undefined ? data.ageMax : 60,
      incomeMin: data.incomeMin !== undefined ? data.incomeMin : 0,
      incomeMax: data.incomeMax !== undefined ? data.incomeMax : 10000,
      constellation: data.constellation || '',
      intents: data.intents || [],
      cityIds: data.cityIds || []
    };
    console.log('筛选结果已更新到全局store：', this.filters);
    
    // 可以添加本地存储逻辑，实现页面间数据持久化
    try {
      wx.setStorageSync('lastFilters', this.filters);
    } catch (e) {
      console.error('存储筛选条件失败', e);
    }
  },

  /**
   * 获取当前筛选结果
   * @returns {Object} 筛选数据
   */
  getFilters() {
    return this.filters;
  },

  /**
   * 清空筛选结果
   */
  clearFilters() {
    this.filters = {
      gender: 'any',
      ageMin: 0,
      ageMax: 60,
      incomeMin: 0,
      incomeMax: 10000,
      constellation: '',
      intents: [],
      cityIds: []
    };
    wx.removeStorageSync('lastFilters');
  }
};

module.exports = filterStore;