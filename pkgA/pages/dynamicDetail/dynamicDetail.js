// pkgA/pages/dynamicDetail/dynamicDetail.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 轮播图图片列表（替换为实际图片路径）
    swiperList: [
      '../../../assets/image/QQ图片20230227214212.jpg', 
      '../../../assets/image/QQ图片20230227214212.jpg', 
      '../../../assets/image/QQ图片20230227214212.jpg', 
      '../../../assets/image/QQ图片20230227214212.jpg',  
    ],
    current: 0,
    autoplay: false,
    duration: 500,
    interval: 5000,
  },

  onTap(e) {
    const { index } = e.detail;

    console.log(index);
  },
  onChange(e) {
    const { current, source } = e.detail;

    console.log(current, source);
  },
  onImageLoad(e) {
    console.log(e.detail.index);
  },
})