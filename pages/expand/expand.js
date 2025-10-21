const util = require('../../utils/util.js');

// 测试数据：15条推荐人卡片数据
const mockTopCandidates = [
  { id: 1, avatar: 'https://picsum.photos/id/64/200/200', name: '宋子彤', summary: '6位共同同学', mutualCount: 6 },
  { id: 2, avatar: 'https://picsum.photos/id/65/200/200', name: '李浩然', summary: '5位共同同事', mutualCount: 5 },
  { id: 3, avatar: 'https://picsum.photos/id/66/200/200', name: '张思语', summary: '4位共同朋友', mutualCount: 4 },
  { id: 4, avatar: 'https://picsum.photos/id/67/200/200', name: '王梓轩', summary: '3位共同校友', mutualCount: 3 },
  { id: 5, avatar: 'https://picsum.photos/id/68/200/200', name: '陈雨欣', summary: '2位共同客户', mutualCount: 2 },
  { id: 6, avatar: 'https://picsum.photos/id/69/200/200', name: '赵宇辰', summary: '7位共同行业伙伴', mutualCount: 7 },
  { id: 7, avatar: 'https://picsum.photos/id/70/200/200', name: '刘思琪', summary: '1位共同导师', mutualCount: 1 },
  { id: 8, avatar: 'https://picsum.photos/id/71/200/200', name: '黄俊豪', summary: '4位共同项目成员', mutualCount: 4 },
  { id: 9, avatar: 'https://picsum.photos/id/72/200/200', name: '周雨彤', summary: '5位共同社团成员', mutualCount: 5 },
  { id: 10, avatar: 'https://picsum.photos/id/73/200/200', name: '吴泽宇', summary: '2位共同邻居', mutualCount: 2 },
  { id: 11, avatar: 'https://picsum.photos/id/74/200/200', name: '郑欣怡', summary: '3位共同兴趣好友', mutualCount: 3 },
  { id: 12, avatar: 'https://picsum.photos/id/75/200/200', name: '马浩然', summary: '6位共同合作伙伴', mutualCount: 6 },
  { id: 13, avatar: 'https://picsum.photos/id/76/200/200', name: '孙思妍', summary: '4位共同培训同学', mutualCount: 4 },
  { id: 14, avatar: 'https://picsum.photos/id/77/200/200', name: '朱雨辰', summary: '1位共同家人的朋友', mutualCount: 1 },
  { id: 15, avatar: 'https://picsum.photos/id/78/200/200', name: '胡艺馨', summary: '5位共同志愿者伙伴', mutualCount: 5 }
];

function debounce(func, wait = 100) { 
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
    // ========== 标签页相关 ==========
    currentTab: 'recommend',           // 当前激活的标签页：'recommend' | 'potential'
    
    // ========== 滚动位置管理 ==========
    scrollTop: {                       // 各标签页当前滚动位置，用于scroll-view的scroll-top属性
      recommend: 0,                    // 推荐页滚动位置
      potential: 0                     // 潜在人脉页滚动位置
    },
    scrollCache: {                     // 滚动位置缓存，用于切换标签时记住位置
      recommend: 0,                    // 推荐页滚动位置缓存
      potential: 0                     // 潜在人脉页滚动位置缓存
    },
    
    // ========== 筛选状态 ==========
    filterStatus: {
      recommend: {                     // 推荐页筛选条件
        type: '',                      // 推荐类型筛选
        keyword: '',                   // 关键词筛选  
        timeRange: ''                  // 时间范围筛选
      },
      potential: {                     // 潜在人脉页筛选条件
        type: '',                      // 人脉类型筛选
        area: '',                      // 地区筛选
        company: ''                    // 公司筛选
      }
    },
    
    // ========== 数据列表 ==========
    potentialList: [],                 // 潜在人脉列表数据数组
    
    // ========== UI状态控制 ==========
    btnLoading: false,                 // 推荐页搜索按钮加载状态
    isNoNetwork: false,                // 网络连接状态：true-无网络，false-有网络
    navHeaderHeightRpx: 0,             // 导航栏高度(rpx单位)，用于计算布局
    showFilterPanel: false,            // 筛选面板显示状态
    
    // ========== 顶部推荐人卡片系统 ==========
    topCandidates: [],                 // 所有顶部推荐人卡片数据（完整数据集）
    displayCandidates: [],             // 当前显示的推荐人卡片数据（过滤后的子集）
    dismissedCardIds: [],              // 用户已关闭的卡片ID数组，用于过滤不显示
    
    // ========== 加载状态控制 ==========
    isRefreshing: false,               // 顶部卡片刷新状态：true-正在刷新
    isLoadingMoreCards: false,         // 顶部卡片加载更多状态：true-正在加载
    
    // ========== 卡片滚动交互 ==========
    lastScrollLeft: 0,                 // 卡片区域上一次横向滚动位置，用于计算滚动方向
    cardTouchStartX: 0,                // 卡片触摸起始X坐标，用于拖拽检测
    cardScrollMetrics: {               // 卡片滚动区域尺寸信息
      scrollLeft: 0,                   // 当前横向滚动位置
      clientWidth: 0,                  // 可视区域宽度
      scrollWidth: 0                   // 内容总宽度
    },
    
    // ========== 列表加载状态 ==========
    loadError: false,                  // 列表加载错误状态：true-加载失败
    isLoading: false,                  // 列表加载中状态：true-正在加载
    page: 1,                           // 当前页码，用于分页加载
    pageSize: 20,                      // 每页数据条数
    hasMore: true,                     // 是否有更多数据：true-还有数据可加载
    
    // 【新增】列表下拉刷新状态
    isRefreshingList: false,           // 列表下拉刷新状态：true-正在刷新
  },

  onLoad() {
    this.checkNetworkStatus();
    this.debouncedTabClick = debounce(this._handleTabClick, 300);
    this.scrollCache = {};
    
    // 监听网络状态变化
    wx.onNetworkStatusChange((res) => {
      this.setData({ isNoNetwork: !res.isConnected });
    });
    
    // 定期检查CP状态
    this.cpStatusCheckInterval = setInterval(() => {
      this.checkCpStatus();
    }, 10000);
  },

  async onReady() {
    // 获取导航栏高度
    const navHeightRpx = await util.getElementHeight(this, '#navHeader');
    this.setData({ navHeaderHeightRpx: navHeightRpx });
    
    // 初始加载数据
    if (this.data.currentTab === 'potential') {
      this.loadTopCandidates();
      this.loadPotentialList();
    }
    this.checkNetworkStatus();
  },

  onUnload() {
    this.persistScrollPositions();
    if (this.cpStatusCheckInterval) {
      clearInterval(this.cpStatusCheckInterval);
    }
  },

  // 页面隐藏时保存滚动位置
  onHide() {
    this.persistScrollPositions();
  },

  // 检查网络状态
  checkNetworkStatus() {
    wx.getNetworkType({
      success: (res) => this.setData({ isNoNetwork: res.networkType === 'none' }),
      fail: () => this.setData({ isNoNetwork: true })
    });
  },

  // Tab切换处理
  handleTabClick(e) {    
    const tab = e.currentTarget.dataset.tab;
    this.debouncedTabClick(tab);
  },

  _handleTabClick(tab) {
    const { currentTab, filterStatus } = this.data;
    if (tab === currentTab) return;

    if (currentTab === 'recommend') {
      this.setData({ btnLoading: false });
    }

    const targetTop = this.scrollCache[tab] || 0;
    this.setData({ [`scrollTop.${tab}`]: targetTop });

    this.setData({ currentTab: tab }, () => {
      wx.reportEvent('click_tab', { tab });
      
      if (tab === 'potential') {
        if (this.data.topCandidates.length === 0) {
          this.loadTopCandidates();
        }
        if (this.data.potentialList.length === 0) {
          this.loadPotentialList();
        }
      }
    });
  },

  // 主内容区滚动位置缓存 - 【修改】优化滚动加载逻辑
  handleScroll(e) {
    const tab = e.currentTarget.dataset.tab;
    const top = e.detail?.scrollTop || 0;
    this.scrollCache[tab] = top;
    
    // 滚动加载更多 - 仅在潜在人脉页且距离底部50px时触发
    if (tab === 'potential' && this.data.hasMore && !this.data.isLoading && !this.data.isRefreshingList) {
      const scrollHeight = e.detail?.scrollHeight || 0;
      const clientHeight = e.detail?.clientHeight || 0;
      
      // 【优化】提前50px触发加载，提升用户体验
      if (scrollHeight - top - clientHeight < 50) {
        this.loadPotentialList();
      }
    }
  },

  persistScrollPositions() {
    if (Object.keys(this.scrollCache).length > 0) {
      this.setData({ scrollTop: this.scrollCache });
    }
  },

  // 【新增】scroll-view下拉刷新处理
  handlePullToRefresh() {
    if (this.data.currentTab !== 'potential') {
      this.setData({ isRefreshingList: false });
      return;
    }

    console.log('触发scroll-view下拉刷新');
    
    // 埋点：下拉刷新
    wx.reportEvent('pull_to_refresh');
    
    this.setData({ 
      isRefreshingList: true
    });

    // 同时刷新顶部卡片和潜在人脉列表
    Promise.all([
      this.refreshTopCandidates(),
      this.refreshPotentialList()
    ]).then(() => {
      this.setData({ isRefreshingList: false });
      wx.showToast({
        title: '刷新成功',
        icon: 'success',
        duration: 1500
      });
    }).catch((error) => {
      console.error('下拉刷新失败:', error);
      this.setData({ isRefreshingList: false });
      wx.showToast({
        title: '刷新失败',
        icon: 'none',
        duration: 1500
      });
    });
  },

  // 推荐页搜寻逻辑
  triggerSearch() {
    if (this.data.isNoNetwork) {
      wx.showToast({ title: '无网络连接，请检查网络', icon: 'none' });
      return;
    }
    if (this.data.btnLoading) return;

    this.setData({ btnLoading: true }, () => {
      wx.reportEvent('view_recommend_loading');
      wx.getNetworkType({
        success: (res) => {
          const isNoNetwork = res.networkType === 'none';
          this.setData({ isNoNetwork });

          if (isNoNetwork) {
            wx.showToast({ title: '无网络连接，请检查网络', icon: 'none' });
            this.setData({ btnLoading: false });
            wx.reportEvent('retry_recommend', { reason: 'no_network' });
            return;
          }

          setTimeout(() => {
            const mockSuccess = true;
            const mockHasData = true;

            if (!mockSuccess) {
              wx.showToast({ title: '搜寻失败，请重试', icon: 'none' });
              this.setData({ btnLoading: false });
              return;
            }
            if (!mockHasData) {
              wx.showToast({ title: '暂无匹配的潜在人脉', icon: 'none' });
              this.setData({ btnLoading: false });
              return;
            }

            wx.navigateTo({
              url: '/pages/connections/connections',
              success: () => this.setData({ btnLoading: false }),
              fail: () => {
                wx.showToast({ title: '跳转失败，请重试', icon: 'none' });
                this.setData({ btnLoading: false });
              }
            });
          }, 50);
        },
        fail: () => {
          this.setData({ isNoNetwork: true, btnLoading: false });
          wx.showToast({ title: '网络异常，请重试', icon: 'none' });
        }
      });
    });
  },

  noop() {},

  // 筛选逻辑
  handleFilterClick() {
    const { currentTab, filterStatus } = this.data;
    wx.showModal({
      title: `${currentTab === 'recommend' ? '推荐' : '潜在人脉'}筛选`,
      content: this.formatFilterContent(currentTab, filterStatus[currentTab]),
      confirmText: '确认筛选',
      cancelText: '重置筛选',
      success: (res) => {
        if (res.confirm) {
          const newFilter = this.getMockNewFilter(currentTab);
          this.updateFilterAndReload(currentTab, newFilter);
        } else if (res.cancel) {
          this.updateFilterAndReload(currentTab, this.getEmptyFilter(currentTab));
        }
      }
    });
  },

  // 格式化筛选内容
  formatFilterContent(tab, filter) {
    let content = '当前筛选：\n';
    if (tab === 'recommend') {
      content += `类型：${filter.type || '无'}\n关键词：${filter.keyword || '无'}\n时间范围：${filter.timeRange || '无'}`;
    } else {
      content += `人脉类型：${filter.type || '无'}\n地区：${filter.area || '无'}\n公司：${filter.company || '无'}`;
    }
    return content;
  },

  // 模拟筛选条件
  getMockNewFilter(tab) {
    return tab === 'recommend'
      ? { type: '最新', keyword: '技术', timeRange: '近7天' }
      : { type: '同事', area: '北京', company: '某科技公司' };
  },

  // 清空筛选条件
  getEmptyFilter(tab) {
    return tab === 'recommend'
      ? { type: '', keyword: '', timeRange: '' }
      : { type: '', area: '', company: '' };
  },

  // 更新筛选条件并重新加载列表 - 【修改】调用刷新方法
  updateFilterAndReload(tab, newFilter) {
    this.setData({
      [`filterStatus.${tab}`]: newFilter,
      [`scrollTop.${tab}`]: 0  // 【重要】滚动位置回到顶部
    }, () => {
      if (tab === 'potential') {
        // 使用刷新逻辑而不是加载逻辑
        this.refreshPotentialList();
      }
    });
  },

  // 加载潜在人脉列表
  loadTabContent(tab, filterParams) {
    if (tab !== 'potential') return;
    
    this.checkNetworkStatus();
    if (this.data.isNoNetwork) {
      this.setData({ loadError: true });
      return;
    }

    this.loadPotentialList();
  },

  // 顶部推荐人卡片核心逻辑
  loadTopCandidates() {
    if (this.data.isNoNetwork) {
      wx.showToast({ title: '无网络，无法加载推荐人', icon: 'none', duration: 1500 });
      return;
    }

    if (this.data.isRefreshing) {
      wx.showLoading({ title: '刷新中...', mask: false });
    }

    const { dismissedCardIds } = this.data;
    const filteredCards = mockTopCandidates.filter(card => !dismissedCardIds.includes(card.id));
    const displayCards = filteredCards.slice(0, 10);

    setTimeout(() => {
      wx.hideLoading();
      this.setData({
        topCandidates: mockTopCandidates,
        displayCandidates: displayCards,
        isRefreshing: false
      });
      wx.reportEvent('view_top_candidates');
    }, 800);
  },

  // 【新增】刷新顶部卡片方法
  refreshTopCandidates() {
    return new Promise((resolve) => {
      // 重置已关闭卡片记录，重新显示所有卡片
      this.setData({ 
        dismissedCardIds: [],
        isRefreshing: true 
      });
      
      // 模拟网络请求
      setTimeout(() => {
        const filteredCards = mockTopCandidates.slice(0, 10);
        this.setData({
          topCandidates: mockTopCandidates,
          displayCandidates: filteredCards,
          isRefreshing: false
        });
        resolve();
        
        // 埋点：刷新顶部卡片
        wx.reportEvent('pull_to_refresh_top_cards');
      }, 800);
    });
  },

  // 【新增】刷新潜在人脉列表方法
  refreshPotentialList() {
    return new Promise((resolve) => {
      this.setData({ 
        page: 1,
        hasMore: true,
        isLoading: true
      });

      // 模拟API延迟
      setTimeout(() => {
        try {
          const mockData = Array.from({ length: this.data.pageSize }, (_, i) => {
            // 重新生成第一页数据
            const names = ['郝亦逸', '李华', '黄轩海', '张明', '王芳', '刘伟'];
            const levels = ['2级人脉', '3级人脉'];
            const descriptions = [
              '2位共同同事',
              '可通过宋子彤·李华认识',
              '3位共同同学', 
              '同一行业从业者',
              '有共同兴趣爱好'
            ];
            
            return {
              id: i + 1,
              avatar: `https://picsum.photos/id/${(i % 50) + 200}/200/200`, // 使用不同的图片ID
              name: names[i % names.length],
              age: 20 + (i % 15),
              level: levels[i % levels.length],
              mutualCount: 1 + (i % 8),
              desc: descriptions[i % descriptions.length],
              cpEligible: i % 5 !== 0,
              cpEligibleReason: i % 5 === 0 ? '今日邀请次数已达上限' : '',
              cpStatus: ''
            };
          });

          this.setData({
            potentialList: mockData,
            loadError: false,
            isLoading: false,
            hasMore: mockData.length === this.data.pageSize,
            page: 2, // 下一页
            // 【重要】滚动位置回到顶部
            [`scrollTop.potential`]: 0
          });

          // 埋点：刷新列表
          wx.reportEvent('pull_to_refresh_potential_list');
          resolve();

        } catch (error) {
          console.error('刷新潜在人脉列表失败:', error);
          this.setData({ 
            loadError: true, 
            isLoading: false 
          });
          wx.showToast({ 
            title: '刷新失败', 
            icon: 'none',
            duration: 2000 
          });
          resolve(); // 仍然resolve，让下拉刷新完成
        }
      }, 1000);
    });
  },

  // 移除推荐人卡片
  handleDismissCard(e) {
    const cardId = e.currentTarget.dataset.id;
    const { displayCandidates, dismissedCardIds } = this.data;

    const updatedDisplay = displayCandidates.filter(card => card.id !== cardId);

    this.setData({
      displayCandidates: updatedDisplay,
      dismissedCardIds: [...dismissedCardIds, cardId]
    });

    wx.reportEvent('dismiss_top_card', { id: cardId });
  },

  // 点击推荐人卡片进入详情页
  handleCardClick(e) {
    const cardId = e.currentTarget.dataset.id;
    wx.navigateTo({ 
      url: `/pages/connections/connections?id=${cardId}`,
      fail: (err) => {
        console.error('卡片跳转失败：', err);
        wx.showToast({ title: '跳转失败', icon: 'none' });
      }
    });
    
    wx.reportEvent('click_top_card', { id: cardId });
  },

  // 卡片滚动处理
  handleCardScroll(e) {
    const { scrollLeft = 0, clientWidth = 0, scrollWidth = 0 } = e.detail || {};
    const { isRefreshing, displayCandidates, lastScrollLeft } = this.data;
    
    this.setData({ cardScrollMetrics: { scrollLeft, clientWidth, scrollWidth } });

    if (displayCandidates.length === 0 || isRefreshing) {
      this.setData({ lastScrollLeft: scrollLeft });
      return;
    }

    const scrollChange = Math.abs(scrollLeft - lastScrollLeft);
    const currentDirection = scrollLeft - lastScrollLeft;
    const isNearLeftEnd = scrollLeft <= 5;
    const isNearRightEnd = (scrollLeft + clientWidth) >= (scrollWidth - 5);

    const shouldRefresh = (
      (isNearLeftEnd && currentDirection <= 0 && scrollChange <= 3) ||
      (isNearRightEnd && currentDirection >= 0 && scrollChange <= 3)
    );

    if (shouldRefresh) {
      this.setData({ isRefreshing: true });
      this.loadTopCandidates();
    }

    this.setData({ lastScrollLeft: scrollLeft });
  },

  // 触摸事件处理
  handleCardTouchStart(e) {
    const touch = e.touches && e.touches[0];
    if (touch) this.setData({ cardTouchStartX: touch.clientX });
  },

  handleCardTouchMove(e) {
    const touch = e.touches && e.touches[0];
    if (!touch) return;

    const startX = this.data.cardTouchStartX || 0;
    const deltaX = touch.clientX - startX;
    const THRESHOLD = 30;

    const { scrollLeft = 0, clientWidth = 0, scrollWidth = 0 } = this.data.cardScrollMetrics || {};

    const isNearLeftEnd = scrollLeft <= 5;
    const isNearRightEnd = (scrollLeft + clientWidth) >= (scrollWidth - 5);

    if (isNearLeftEnd && deltaX > THRESHOLD) {
      this.loadMoreCandidates('left');
      this.setData({ cardTouchStartX: touch.clientX });
      return;
    }

    if (isNearRightEnd && deltaX < -THRESHOLD) {
      this.loadMoreCandidates('right');
      this.setData({ cardTouchStartX: touch.clientX });
      return;
    }
  },

  handleCardTouchEnd() {
    // 触摸结束处理
  },

  // 加载更多卡片
  loadMoreCandidates(direction = 'right', count = 5) {
    if (this.data.isLoadingMoreCards) return;
    this.setData({ isLoadingMoreCards: true });

    const dismissed = this.data.dismissedCardIds || [];
    const existingIds = new Set((this.data.displayCandidates || []).map(i => i.id));

    const available = mockTopCandidates.filter(card => !dismissed.includes(card.id) && !existingIds.has(card.id));

    if (available.length === 0) {
      wx.showToast({ title: '没有更多推荐了', icon: 'none' });
      this.setData({ isLoadingMoreCards: false });
      return;
    }

    const toAdd = direction === 'right'
      ? available.slice(0, count)
      : available.slice(-count);

    wx.showLoading({ title: '加载更多...', mask: false });
    setTimeout(() => {
      wx.hideLoading();
      const { displayCandidates } = this.data;
      let newDisplay;
      if (direction === 'right') {
        newDisplay = [...displayCandidates, ...toAdd];
      } else {
        newDisplay = [...toAdd, ...displayCandidates];
      }
      this.setData({ displayCandidates: newDisplay, isLoadingMoreCards: false });
      wx.reportEvent('load_more_top_candidates', { direction, count: toAdd.length });
    }, 600);
  },

  // ========== 潜在人脉列表核心功能 ==========

  // 人脉列表项点击
  handlePotentialItemClick(e) {
    const item = e.currentTarget.dataset.item;
    if (!item) return;
    
    // 埋点：点击列表项
    wx.reportEvent('click_item', { id: item.id });
    
    // 跳转到详情页
    wx.navigateTo({
      url: `/pages/connections/connections?id=${item.id}`,
      fail: (err) => {
        console.error('跳转详情页失败:', err);
        wx.showToast({ title: '跳转失败', icon: 'none' });
      }
    });
  },

  // 组CP按钮点击
  handleCpButtonClick(e) {
    const item = e.currentTarget.dataset.item;
    if (!item) {
      console.warn('事件对象中未找到item数据');
      return;
    }
        
    // 埋点：点击组CP按钮
    wx.reportEvent('click_cp', { id: item.id });
    
    // 检查是否可组CP
    if (item.cpEligible === false) {
      const reason = item.cpEligibleReason || '暂时无法建立关系';
      wx.showToast({ 
        title: reason, 
        icon: 'none',
        duration: 2000 
      });
      return;
    }
    
    // 检查是否已在邀请中
    if (item.cpStatus === 'pending') {
      wx.showToast({ 
        title: '邀请已发送，请等待对方确认', 
        icon: 'none',
        duration: 2000 
      });
      return;
    }
    
    // 执行组CP流程
    wx.showModal({
      title: '确认建立关系',
      content: `确定要与${item.name}建立CP关系吗？`,
      confirmText: '确定',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 用户确认，开始组CP
          this.sendCpInvitation(item);
        }
      }
    });   
  },

  // 发送CP邀请
  sendCpInvitation(item) {
    wx.showLoading({ title: '发送邀请中...', mask: true });
    
    // 立即更新UI状态
    this.updateItemCpStatus(item.id, 'pending');
    
    // 模拟API调用 - 发送CP邀请
    setTimeout(() => {
      wx.hideLoading();
      
      // 模拟成功情况
      const success = Math.random() > 0.2; // 80%成功率
      
      if (success) {
        wx.showToast({ 
          title: '邀请发送成功', 
          icon: 'success',
          duration: 1500 
        });
        
        // 埋点：组CP成功
        wx.reportEvent('cp_invitation_sent', { 
          id: item.id,
          status: 'success'
        });
      } else {
        wx.showToast({ 
          title: '发送失败，请重试', 
          icon: 'none',
          duration: 2000 
        });
        
        // 失败时恢复按钮状态
        this.updateItemCpStatus(item.id, '');
        
        // 埋点：组CP失败
        wx.reportEvent('cp_invitation_sent', { 
          id: item.id,
          status: 'fail',
          error: 'network_error'
        });
      }
    }, 1500);
  },

  // 更新项CP状态
  updateItemCpStatus(itemId, status) {
    const { potentialList } = this.data;
    const updatedList = potentialList.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          cpStatus: status
        };
      }
      return item;
    });
    
    this.setData({ potentialList: updatedList });
  },

  // 模拟CP邀请状态检查
  checkCpStatus() {
    // 模拟检查CP邀请状态
    const { potentialList } = this.data;
    const updatedList = potentialList.map(item => {
      if (item.cpStatus === 'pending' && Math.random() > 0.7) {
        // 30%的概率邀请被接受
        wx.showToast({
          title: `${item.name}已接受您的CP邀请`,
          icon: 'success',
          duration: 2000
        });
        
        return {
          ...item,
          cpStatus: 'success',
          level: '已建立关系',
          desc: '已成功建立CP关系'
        };
      }
      return item;
    });
    
    this.setData({ potentialList: updatedList });
  },

  // 重新加载 - 【修改】支持刷新重置
  handleRetryLoad() {
    this.setData({ 
      loadError: false,
      page: 1,           // 【重要】重置页码
      hasMore: true      // 【重要】重置hasMore状态
    });
    this.loadPotentialList();
  },

  // 加载潜在人脉列表（优化版）
  loadPotentialList() {
    // 防重复加载
    if (this.data.isLoading || !this.data.hasMore || this.data.isRefreshingList) return;
    
    this.setData({ isLoading: true, loadError: false });
    
    setTimeout(() => {
      try {
        const startIndex = (this.data.page - 1) * this.data.pageSize;
        const mockData = this.generateMockData(startIndex, this.data.pageSize);
        
        const newList = this.data.page === 1 ? mockData : [...this.data.potentialList, ...mockData];
        const hasMoreData = mockData.length === this.data.pageSize;
        
        this.setData({
          potentialList: newList,
          isLoading: false,
          hasMore: hasMoreData,
          page: this.data.page + 1
        });
        
        // ✅ 新增：分页加载埋点
        if (mockData.length > 0) {
          wx.reportEvent('load_more', { 
            page: this.data.page - 1, 
            pageSize: this.data.pageSize 
          });
        }
      } catch (error) {
        this.setData({ loadError: true, isLoading: false });
      }
    }, 800);
  }

});