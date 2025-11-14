const util = require('../../utils/util.js');
Component({
  properties: {
    moment: { 
      type: Object,
      value: {  
        id: '',
        avatar: '/assets/image/微信图片_20250906204507_794_8.jpg',
        nickname: '匿名用户',
        content: '暂无介绍',
        images: [],
        createTime: '',
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
        isLiked: true,
        cpRelation: false
      }
    },
    showCpTag: { type: Boolean, value: false } // 保留单独控制标签显示的属性
  },
  data: {
    showDesc: true,
    showImage: true
  },
  // 新增：监听moment变化，动态更新showDesc和showImage
  // observers: {
  //   'moment.content': function(content) {
  //     // 文字内容有效：非空字符串（排除纯空格）
  //     const showDesc = typeof content === 'string' && content.trim().length > 0;
  //     this.setData({ showDesc });
  //   },
  //   'moment.images': function(images) {
  //     // 图片有效：数组且长度 > 0
  //     const showImage = Array.isArray(images) && images.length > 0;
  //     this.setData({ showImage });
  //   }
  // },

  // 初始化时计算显示状态（建议开启）
  attached() {
    const { content, images } = this.properties.moment;
    this.setData({
      showDesc: typeof content === 'string' && content.trim().length > 0,
      showImage: Array.isArray(images) && images.length > 0
    });
  },
  methods: {
    // 修改：从moment对象获取时间
    formatCreateTime(time) {
      if (!time) return '';
      return util.formatTimeDifference(time);
    },

    // 修改：从moment对象获取id
    handleLike() {
      this.triggerEvent('like', { momentId: this.properties.moment.id });
    },

    handleComment() {
      this.triggerEvent('comment', { momentId: this.properties.moment.id });
    },

    handleShare() {
      this.triggerEvent('share', { momentId: this.properties.moment.id });
    }
  }
});