Component({
properties: {
  // 显隐开关 - 使用 value 定义默认值
  showUserInfo: { 
    type: Boolean, 
    value: true 
  },
  showDesc: { 
    type: Boolean, 
    value: true 
  },
  showImage: { 
    type: Boolean, 
    value: true 
  },
  // 内容数据 - 为 String 类型设置默认值
  avatarUrl: { 
    type: String, 
    value: '/assets/image/微信图片_20250906204507_794_8.jpg' 
  },
  nickName: { 
    type: String, 
    value: '匿名用户' 
  },
  desc: { 
    type: String, 
    value: '' 
  },
  imageUrl: { 
    type: String, 
    value: '/assets/image/b_9392f366fef37cdba57f928ba30ff243.jpg' 
  },
},
  methods: {
    handleComment() { /* 评论逻辑 */ },
    handleLike() { /* 点赞逻辑 */ },
    handleShare() { /* 分享逻辑 */ }
  }
});