const util = require('../../utils/util.js');
Page({
  data: {
    navHeaderHeightRpx: 172,
    currentTab: 'outCircle',
    dynamicList: {
      inCircle: [
        {
          id: 'in-1001',
          avatar: '',
          nickname: '圈内-老张',
          content: '今天的项目评审会大家觉得怎么样？我整理了几点优化建议，晚点发群里～',
          images: ['/a'], // 可替换为实际图片路径
          createTime: '2025-11-14 09:30:00',
          likeCount: 28,
          commentCount: 12,
          shareCount: 3,
          isLiked: true,
          cpRelation: true // 圈内用户多为关联关系
        },
        {
          id: 'in-1002',
          avatar: '',
          nickname: '圈内-小李',
          content: '新功能测试通过啦！感谢@技术部 加班支持，下周可以正式上线～',
          images: [],
          createTime: '2025-11-14 11:15:00',
          likeCount: 45,
          commentCount: 8,
          shareCount: 5,
          isLiked: false,
          cpRelation: true
        },
        {
          id: 'in-1003',
          avatar: '',
          nickname: '圈内-王姐',
          content: '分享下昨天的团建照片，大家玩得超开心！下次建议去郊外露营～',
          images: ['/assets/image/circles/in-2.jpg', '/assets/image/circles/in-3.jpg'],
          createTime: '2025-11-13 18:40:00',
          likeCount: 76,
          commentCount: 23,
          shareCount: 12,
          isLiked: true,
          cpRelation: true
        },
        {
          id: 'in-1004',
          avatar: '',
          nickname: '圈内-赵总',
          content: '下个月的季度目标已同步到系统，各部门注意核对，有问题随时沟通',
          images: [],
          createTime: '2025-11-13 14:20:00',
          likeCount: 52,
          commentCount: 6,
          shareCount: 8,
          isLiked: false,
          cpRelation: true
        },
        {
          id: 'in-1005',
          avatar: '',
          nickname: '圈内-小陈',
          content: '发现一个超好用的协作工具，推荐给大家，链接放评论区了～',
          images: ['/assets/image/circles/in-4.jpg'],
          createTime: '2025-11-12 20:10:00',
          likeCount: 33,
          commentCount: 15,
          shareCount: 7,
          isLiked: true,
          cpRelation: false // 偶尔出现非关联用户
        }
      ],
      outCircle: [
        {
          id: 'out-2001',
          avatar: '',
          nickname: '旅行爱好者-阿明',
          content: '周末去了趟云南，这是在大理拍的日出，太美了！推荐给大家～',
          images: ['/assets/image/circles/out-1.jpg', '/assets/image/circles/out-2.jpg'],
          createTime: '2025-11-14 08:50:00',
          likeCount: 156,
          commentCount: 42,
          shareCount: 38,
          isLiked: true,
          cpRelation: false // 圈外多为非关联用户
        },
        {
          id: 'out-2002',
          avatar: '',
          nickname: '美食博主-小厨娘',
          content: '今天教大家做一道家常菜：番茄炖牛腩，步骤简单又好吃，附教程～',
          images: ['/assets/image/circles/out-3.jpg'],
          createTime: '2025-11-14 10:20:00',
          likeCount: 210,
          commentCount: 67,
          shareCount: 53,
          isLiked: false,
          cpRelation: false
        },
        {
          id: 'out-2003',
          avatar: '',
          nickname: '科技达人-老K',
          content: '最新款手机测评出炉，性能提升明显，但续航有点拉垮，详情看视频～',
          images: [],
          createTime: '2025-11-13 16:30:00',
          likeCount: 189,
          commentCount: 94,
          shareCount: 76,
          isLiked: true,
          cpRelation: false
        },
        {
          id: 'out-2004',
          avatar: '',
          nickname: '职场导师-李姐',
          content: '工作5年总结的3条晋升技巧，新人必看！核心是「主动承担+结果可视化」',
          images: ['/assets/image/circles/out-4.jpg'],
          createTime: '2025-11-13 19:45:00',
          likeCount: 275,
          commentCount: 128,
          shareCount: 92,
          isLiked: false,
          cpRelation: true // 偶尔有圈外关联用户（如行业前辈）
        },
        {
          id: 'out-2005',
          avatar: '',
          nickname: '铲屎官-小花',
          content: '我家猫今天学会了开抽屉，是不是成精了？附搞笑视频～',
          images: ['/assets/image/circles/out-5.jpg'],
          createTime: '2025-11-12 21:30:00',
          likeCount: 132,
          commentCount: 56,
          shareCount: 29,
          isLiked: true,
          cpRelation: false
        }
      ]
    },
    scrollTop: {
      inCircle: 0,
      outCircle: 0
    },
    tempScrollTop: 0,
    debounceTimer: null,
    inputValue: '',
    isFocus: false,
    hasNetwork: true,
    pageConfig: {
      inCircle: { pageNum: 1, pageSize: 10, hasMore: true },
      outCircle: { pageNum: 1, pageSize: 10, hasMore: true }
    },
    isLoading: {
      inCircle: false,
      outCircle: false
    },
    isSkeletonLoading: {
      inCircle: true,
      outCircle: false
    },
    isRefreshing: {
      inCircle: false,
      outCircle: false
    },
    likeLock: {} // 防重复点击：key=momentId，value=是否正在请求
  },

  onLoad(options) {
    this.checkNetworkStatus();
    wx.onNetworkStatusChange((res) => {
      this.setData({ hasNetwork: res.isConnected });
      if (res.isConnected) {
        const currentTab = this.data.currentTab;
        if (!this.data.isLoading[currentTab] && !this.data.isRefreshing[currentTab]) {
          this.loadDynamicList(currentTab, true);
        }
      }
    });
  },

  async onReady() {
    const navHeaderHeightRpx = await util.getElementHeight(this, '#navHeader');
    this.setData({ navHeaderHeightRpx });
    this.loadDynamicList(this.data.currentTab, true);
  },

  onUnload() {
    const { currentTab, tempScrollTop } = this.data;
    this.setData({ [`scrollTop.${currentTab}`]: tempScrollTop });
    if (this.data.debounceTimer) clearTimeout(this.data.debounceTimer);
  },

  handleTabClick(e) {
    const targetTab = e.currentTarget.dataset.tab;
    const { currentTab, debounceTimer, tempScrollTop, dynamicList, pageConfig } = this.data;

    if (targetTab === currentTab) return;

    if (debounceTimer) clearTimeout(debounceTimer);
    const newTimer = setTimeout(() => {
      this.setData({ [`scrollTop.${currentTab}`]: tempScrollTop }, () => {
        wx.reportEvent('click_circle_tab', {
          tab: targetTab === 'inCircle' ? 'inner' : 'outer'
        });

        this.setData({
          currentTab: targetTab,
          tempScrollTop: this.data.scrollTop[targetTab] || 0
        });

        const targetList = dynamicList[targetTab];
        const hasLoaded = pageConfig[targetTab].pageNum > 1;
        if (targetList.length === 0 && !hasLoaded) {
          this.setData({ [`isSkeletonLoading.${targetTab}`]: true });
          this.loadDynamicList(targetTab, true);
        }else {
          // 已有加载记录，直接关闭骨架屏（防止本地数据已存在但骨架屏未关）
          this.setData({ [`isSkeletonLoading.${targetTab}`]: false });
        }
      });
    }, 300);

    this.setData({ debounceTimer: newTimer });
  },

  /**
   * 加载动态列表数据（核心优化：延长刷新动画持续时间）
   */
  async loadDynamicList(tab, isRefresh = false) {
    const { hasNetwork, pageConfig, isLoading, inputValue } = this.data;

    if (!hasNetwork) {
      if (isRefresh) this.setData({ [`isRefreshing.${tab}`]: false });
      return;
    }
    if (isLoading[tab]) return;
    if (!isRefresh && !pageConfig[tab].hasMore) return;

    this.setData({ [`isLoading.${tab}`]: true });

    // 关键：记录刷新开始时间（用于控制动画时长）
    const refreshStartTime = Date.now();
    // 刷新动画最小持续时间（1000ms，可调整）
    const minRefreshAnimationTime = 1000; 

    try {
      const config = pageConfig[tab];
      const params = {
        type: tab === 'inCircle' ? 'cp' : 'recommend',
        page: isRefresh ? 1 : config.pageNum,
        size: config.pageSize,
        keyword: inputValue.trim()
      };

      // 发起请求（无论请求多快，动画都要至少显示1秒）
      const res = await wx.request({
        url: '/circle/moments',
        method: 'GET',
        data: params,
        header: { 'content-type': 'application/json' }
      });

      // 数据加载完成后，检查动画显示时间是否足够
      const elapsedTime = Date.now() - refreshStartTime;
      if (elapsedTime < minRefreshAnimationTime) {
        // 不足1秒则补足等待时间（确保动画持续够久）
        await new Promise(resolve => setTimeout(resolve, minRefreshAnimationTime - elapsedTime));
      }

      if (res.statusCode === 200 && res.data.success) {
        const newData = res.data.data.list || [];
        const total = res.data.data.total || 0;
        const hasMore = (isRefresh ? 1 : config.pageNum) * config.pageSize < total;

        this.setData({
          [`dynamicList.${tab}`]: isRefresh ? newData : [...this.data.dynamicList[tab], ...newData],
          [`pageConfig.${tab}.pageNum`]: isRefresh ? 2 : config.pageNum + 1,
          [`pageConfig.${tab}.hasMore`]: hasMore,
          [`isSkeletonLoading.${tab}`]: false
        });
      } else {
        // 接口错误时，仍保证动画显示满1秒
        const elapsedTime = Date.now() - refreshStartTime;
        if (elapsedTime < minRefreshAnimationTime) {
          await new Promise(resolve => setTimeout(resolve, minRefreshAnimationTime - elapsedTime));
        }
        wx.showToast({ title: '数据加载失败', icon: 'none', duration: 2000 });
        this.setData({ [`isSkeletonLoading.${tab}`]: false });
      }
    } catch (err) {
      // 网络异常时，同样保证动画显示满1秒
      const elapsedTime = Date.now() - refreshStartTime;
      if (elapsedTime < minRefreshAnimationTime) {
        await new Promise(resolve => setTimeout(resolve, minRefreshAnimationTime - elapsedTime));
      }
      wx.showToast({ title: '网络请求异常', icon: 'none', duration: 2000 });
      this.setData({ [`isSkeletonLoading.${tab}`]: false });
    } finally {
      // 等待足够时间后，才关闭刷新动画（关键！）
      this.setData({
        [`isLoading.${tab}`]: false,
        [`isRefreshing.${tab}`]: false // 此时动画才会停止
      });
    }
  },

  onListScroll(e) {
    this.setData({ tempScrollTop: e.detail.scrollTop });
  },

  onReachBottom() {
    const currentTab = this.data.currentTab;
    this.loadDynamicList(currentTab, false);
  },

  /**
   * 下拉刷新：立即开启动画
   */
  onPullRefresh() {
    const currentTab = this.data.currentTab;
    this.setData({ 
      [`isRefreshing.${currentTab}`]: true, // 刷新动画立即开始
      [`isSkeletonLoading.${currentTab}`]: true 
    });
    this.loadDynamicList(currentTab, true);
  },

  onRefresherRestore() {
    const currentTab = this.data.currentTab;
    this.setData({ [`isRefreshing.${currentTab}`]: false });
  },

  onFocus() {
    this.setData({ isFocus: true });
  },
  onBlur() {
    this.setData({ isFocus: false });
  },

  refreshList() {
    this.checkNetworkStatus();
    if (this.data.hasNetwork) {
      const currentTab = this.data.currentTab;
      this.setData({
        [`pageConfig.${currentTab}.pageNum`]: 1,
        [`pageConfig.${currentTab}.hasMore`]: true,
        [`isSkeletonLoading.${currentTab}`]: true,
        [`isRefreshing.${currentTab}`]: true
      });
      this.loadDynamicList(currentTab, true);
    }
  },

  checkNetworkStatus() {
    wx.getNetworkType({
      success: (res) => {
        this.setData({ hasNetwork: res.networkType !== 'none' });
      }
    });
  },

  async handleMomentLike(e) {
    const { momentId } = e.detail;
    const { currentTab, dynamicList, likeLock, hasNetwork } = this.data;
    const currentList = dynamicList[currentTab];

    // 1. 防重复点击（保留，避免快速连续点击）
    if (likeLock[momentId]) return;

    // 2. 查找当前动态在列表中的位置
    const momentIndex = currentList.findIndex(item => item.id === momentId);
    if (momentIndex === -1) return;
    const targetMoment = currentList[momentIndex];
    const currentIsLiked = targetMoment.isLiked;
    const currentLikeCount = targetMoment.likeCount;

    // 3. 标记请求中（测试动画可保留，避免重复点击）
    this.setData({ [`likeLock.${momentId}`]: true });

    // 4. 本地切换状态（核心：更新 dynamicList 中对应动态的 isLiked）
    const newList = [...currentList]; // 复制列表（不直接修改原数据）
    newList[momentIndex] = {
      ...targetMoment,
      isLiked: !currentIsLiked, // 切换点赞状态
      likeCount: !currentIsLiked ? currentLikeCount + 1 : currentLikeCount - 1 // 同步更新点赞数
    };

    // 5. 更新页面数据，组件会接收新的 props 触发动画
    this.setData({
      [`dynamicList.${currentTab}`]: newList,
      [`likeLock.${momentId}`]: false // 解除锁定
    });
  },

  // 原有其他方法（handleTabClick、loadDynamicList等）保持不变...

  handleMomentComment(e) {},
  handleMomentShare(e) {},
});