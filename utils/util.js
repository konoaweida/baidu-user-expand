// utils/util.js（完整代码）
const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()
  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

// -------------------------- px 转 rpx 基础逻辑 --------------------------
const systemInfo = wx.getSystemInfoSync()
const screenWidthPx = systemInfo.screenWidth
const pxToRpx = px => {
  return Number((px * 750) / screenWidthPx.toFixed(2))
}

// -------------------------- 胶囊按钮信息（rpx） --------------------------
const menuButtonInfoPx = wx.getMenuButtonBoundingClientRect()
function getMenuButtonTopRpx() {
  return pxToRpx(menuButtonInfoPx.top)
}
function getMenuButtonHeightRpx() {
  return pxToRpx(menuButtonInfoPx.height)
}

// -------------------------- 核心修改：getElementHeight 集成 rpx 转换 --------------------------
/**
 * 获取指定选择器的元素/组件高度（默认返回 rpx，支持可选返回 px）
 * @param {Object} page - 页面实例（this）
 * @param {string} selector - 元素选择器（如 '#navHeader'）
 * @param {boolean} [returnRpx=true] - 是否返回 rpx 高度（默认 true，传 false 则返回 px）
 * @returns {Promise<number>} 高度值（rpx/px），查询失败返回 0
 */
function getElementHeight(page, selector, returnRpx = true) {
  return new Promise((resolve) => {
    if (!page || !selector) {
      console.error('参数错误：page 和 selector 为必填项')
      resolve(0)
      return
    }
    // 1. 获取元素 px 高度
    const query = wx.createSelectorQuery().in(page)
    query.select(selector)
      .boundingClientRect((rect) => {
        const heightPx = rect ? rect.height : 0
        // 2. 根据 returnRpx 决定是否转换为 rpx
        const finalHeight = returnRpx ? pxToRpx(heightPx) : heightPx
        resolve(finalHeight)
      })
      .exec()
  })
}

// -------------------------- 导出函数 --------------------------
module.exports = {
  formatTime,
  pxToRpx,
  getMenuButtonTopRpx,
  getMenuButtonHeightRpx,
  menuButtonInfoPx,
  getElementHeight // 已集成 rpx 转换
}