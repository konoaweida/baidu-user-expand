// utils/filterStore.js：全局筛选数据存储工具
const filterStore = {
  // 存储筛选结果（初始为空）
  filters: {},

  /**
   * 更新筛选结果
   * @param {Object} data - 筛选数据（星座、性别、收入、年龄）
   */
  setFilters(data) {
    this.filters = { ...data };  // 深拷贝，避免引用污染
    console.log('筛选结果已更新到全局store：', this.filters);
  },

  /**
   * 获取当前筛选结果
   * @returns {Object} 筛选数据
   */
  getFilters() {
    return this.filters;
  },

  /**
   * 清空筛选结果（可选，用于“重置筛选”功能）
   */
  clearFilters() {
    this.filters = {};
  }
};

module.exports = filterStore;  // 导出，供其他页面引入