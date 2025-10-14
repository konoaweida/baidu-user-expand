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

// -------------------------- 核心修改：px 转 rpx 逻辑 --------------------------
// 1. 获取当前设备系统信息（关键：获取屏幕宽度 px，用于计算转换比例）
const systemInfo = wx.getSystemInfoSync()
// 屏幕宽度（px）：不同设备屏幕宽度不同，是 px 转 rpx 的核心基准
const screenWidthPx = systemInfo.screenWidth

// 2. px 转 rpx 工具函数（核心公式：rpx = px * (750 / 屏幕宽度 px)）
/**
 * px 转 rpx
 * @param {number} px - 待转换的 px 值
 * @returns {number} 转换后的 rpx 值（保留 2 位小数，避免精度问题）
 */
const pxToRpx = px => {
  return Number((px * 750) / screenWidthPx.toFixed(2))
}

// 3. 获取胶囊按钮信息（原始单位：px）
const menuButtonInfoPx = wx.getMenuButtonBoundingClientRect()

// 4. 封装获取胶囊按钮属性的函数（返回单位：rpx）
/**
 * 获取胶囊按钮顶部距离（rpx）
 * @returns {number} 胶囊顶部距离 rpx 值
 */
function getMenuButtonTopRpx() {
  return pxToRpx(menuButtonInfoPx.top)
}

/**
 * 获取胶囊按钮高度（rpx）
 * @returns {number} 胶囊高度 rpx 值
 */
function getMenuButtonHeightRpx() {
  return pxToRpx(menuButtonInfoPx.height)
}

// -------------------------- 导出函数 --------------------------
module.exports = {
  formatTime,
  getMenuButtonTopRpx, // 导出 rpx 版本的顶部距离函数
  getMenuButtonHeightRpx, // 导出 rpx 版本的高度函数
  pxToRpx, // 可选：导出转换工具函数，方便其他地方复用
  menuButtonInfoPx, // 可选：导出原始 px 信息，留作备用
}