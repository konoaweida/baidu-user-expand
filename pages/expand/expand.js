const util = require('../../utils/util.js'); // 引入工具类

// 防抖工具函数：避免短时间重复点击
function debounce(func, wait) {
  let timeout;
  return function () {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

Page({
  data: {
    currentTab: 'recommend', // 默认激活“推荐”Tab
    // 1. 存储每个Tab的独立滚动位置（切换时自动恢复）
    scrollTop: {
      recommend: 0,
      potential: 0,
    },
    // 2. 存储每个Tab的独立筛选状态（根据实际需求定义字段，示例含类型/关键词/地区）
    filterStatus: {
      recommend: {
        type: '',       // 推荐Tab筛选：类型（如“最新”“最热”）
        keyword: '',    // 推荐Tab筛选：搜索关键词
        timeRange: ''   // 推荐Tab筛选：时间范围（如“近7天”）
      },
      potential: {
        type: '',       // 潜在人脉Tab筛选：人脉类型（如“同事”“校友”）
        area: '',       // 潜在人脉Tab筛选：地区（如“北京”“上海”）
        company: ''     // 潜在人脉Tab筛选：公司
      }
    },
    // 数据列表与空态标识
    recommendList: [],
    potentialList: [],
    recommendEmpty: false,
    potentialEmpty: false,
    // 导航栏高度（用于布局）
    navHeaderHeightRpx: 0,
    // 可选：筛选面板显示状态（若用自定义筛选组件，需控制显隐）
    showFilterPanel: false
  },

  onLoad() {
    // 初始化防抖Tab点击（300ms防重复）
    this.debouncedTabClick = debounce(this._handleTabClick, 300);
    // 加载默认Tab（推荐）的内容（初始无筛选，传空对象）
    // 新增：防抖滚动事件（30ms 触发一次，平衡实时性和性能）
    this.debouncedHandleScroll = debounce(this.handleScroll, 30); 
    this.loadTabContent('recommend', this.data.filterStatus.recommend);
  },

  // 页面渲染完成后：获取导航栏高度（rpx）
  async onReady() {
    const navHeightRpx = await util.getElementHeight(this, '#navHeader');
    this.setData({
      navHeaderHeightRpx: navHeightRpx
    });
    console.log('navigation-header 组件高度（rpx）：', navHeightRpx);
  },

  // -------------------------- Tab切换相关 --------------------------
  // 对外暴露的Tab点击事件（绑定防抖）
  handleTabClick(e) {
    const tab = e.currentTarget.dataset.tab;
    this.debouncedTabClick(tab);
  },

  // 防抖后的Tab切换核心逻辑
  _handleTabClick(tab) {
    const { currentTab, filterStatus, scrollTop } = this.data;
    if (tab === currentTab) return;

    // 1. 切换Tab状态（带回调）
    this.setData({ currentTab: tab }, () => {
      // 3. 埋点上报
      wx.reportEvent('click_tab', { tab });
      // 4. 加载目标Tab的内容
      this.loadTabContent(tab, filterStatus[tab]);
    });
  },

  // -------------------------- 筛选相关 --------------------------
  // 打开筛选面板（传递当前Tab的筛选状态）
  handleFilterClick() {
    const { currentTab, filterStatus } = this.data;
    // 方式1：用模态框模拟筛选（快速演示，实际可替换为自定义筛选组件）
    wx.showModal({
      title: `${currentTab === 'recommend' ? '推荐' : '潜在人脉'}筛选`,
      // 显示当前Tab的已有筛选状态（方便用户修改）
      content: this.formatFilterContent(currentTab, filterStatus[currentTab]),
      confirmText: '确认筛选',
      cancelText: '重置筛选',
      success: (res) => {
        if (res.confirm) {
          // 模拟用户选择的新筛选条件（实际需替换为筛选面板的真实输入）
          const newFilter = this.getMockNewFilter(currentTab);
          // 更新筛选状态+重置滚动+重新加载数据
          this.updateFilterAndReload(currentTab, newFilter);
        } else if (res.cancel) {
          // 重置筛选（恢复为空状态）
          this.updateFilterAndReload(currentTab, this.getEmptyFilter(currentTab));
        }
      }
    });

    // 方式2：若用自定义筛选组件，打开面板并传递当前筛选状态（注释模态框后启用）
    // this.setData({
    //   showFilterPanel: true,
    //   currentFilterTab: currentTab // 标记当前筛选的Tab
    // });
  },

  // 格式化筛选内容（用于模态框显示已有筛选状态）
  formatFilterContent(tab, filter) {
    let content = '当前筛选：\n';
    if (tab === 'recommend') {
      content += `类型：${filter.type || '无'}\n`;
      content += `关键词：${filter.keyword || '无'}\n`;
      content += `时间范围：${filter.timeRange || '无'}`;
    } else {
      content += `人脉类型：${filter.type || '无'}\n`;
      content += `地区：${filter.area || '无'}\n`;
      content += `公司：${filter.company || '无'}`;
    }
    return content;
  },

  // 模拟用户选择的新筛选条件（实际项目替换为筛选面板的输入值）
  getMockNewFilter(tab) {
    if (tab === 'recommend') {
      return { type: '最新', keyword: '技术', timeRange: '近7天' };
    } else {
      return { type: '同事', area: '北京', company: '某科技公司' };
    }
  },

  // 获取空筛选状态（用于重置筛选）
  getEmptyFilter(tab) {
    if (tab === 'recommend') {
      return { type: '', keyword: '', timeRange: '' };
    } else {
      return { type: '', area: '', company: '' };
    }
  },

  // 更新筛选状态+重置滚动位置+重新加载数据（核心方法）
  updateFilterAndReload(tab, newFilter) {
    this.setData({
      // 1. 更新当前Tab的筛选状态（保留其他Tab的状态）
      [`filterStatus.${tab}`]: newFilter,
      // 2. 筛选后数据变化，重置当前Tab的滚动位置到顶部
      [`scrollTop.${tab}`]: 0 
    }, () => {
      // 3. 状态更新完成后，加载筛选后的数据
      this.loadTabContent(tab, newFilter);
    });
  },

  // -------------------------- 数据加载相关 --------------------------
  // 加载Tab内容（支持携带筛选条件，含无网空态处理）
  loadTabContent(tab, filterParams) {
    wx.getNetworkType({
      success: (res) => {
        const isNoNetwork = res.networkType === 'none';
        if (isNoNetwork) {
          // 无网时显示空态
          this.setData({ [`${tab}Empty`]: true });
          return;
        }

        // 模拟接口请求（实际项目替换为真实接口，携带filterParams筛选参数）
        setTimeout(() => {
          let mockData = [];
          // 根据筛选条件生成不同数据（演示筛选效果）
          if (tab === 'recommend' && filterParams.type === '最新') {
            // 推荐Tab-筛选“最新”：返回20条数据
            mockData = Array.from({ length: 20 }, (_, i) => ({
              id: i,
              title: `推荐最新内容-${i}`,
              filterTag: '最新'
            }));
          } else if (tab === 'potential' && filterParams.area === '北京') {
            // 潜在人脉Tab-筛选“北京”：返回15条数据
            mockData = Array.from({ length: 15 }, (_, i) => ({
              id: i,
              name: `北京人脉-${i}`,
              company: filterParams.company || '未知公司'
            }));
          } else {
            // 默认无筛选：返回10条基础数据
            mockData = Array.from({ length: 10 }, (_, i) => ({
              id: i,
              title: `${tab === 'recommend' ? '推荐' : '人脉'}基础内容-${i}`
            }));
          }

          // 更新数据与空态（数据为空时显示空态）
          this.setData({
            [`${tab}List`]: mockData,
            [`${tab}Empty`]: mockData.length === 0
          });
        }, 500); // 模拟接口延迟
      },
    });
  },

  // -------------------------- 滚动位置存储 --------------------------
  // 监听scroll-view滚动，存储当前Tab的滚动位置
  handleScroll(e) {
    const tab = e.currentTarget.dataset.tab;
    const top = e.detail.scrollTop;
    // console.log(`[${tab}]滚动位置更新：`, top); // 验证是否有日志输出
    this.setData({
      [`scrollTop.${tab}`]: top
    });
  },

  // -------------------------- 可选：自定义筛选组件回调（若使用） --------------------------
  // 自定义筛选面板确认回调（接收面板传递的新筛选条件）
  onFilterPanelConfirm(e) {
    const { tab, newFilter } = e.detail;
    this.updateFilterAndReload(tab, newFilter);
    this.setData({ showFilterPanel: false });
  },

  // 自定义筛选面板取消回调
  onFilterPanelCancel() {
    this.setData({ showFilterPanel: false });
  }
});