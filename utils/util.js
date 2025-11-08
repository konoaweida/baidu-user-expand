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

const systemInfo = wx.getWindowInfo()
const screenWidthPx = systemInfo.screenWidth || 375

const pxToRpx = (px) => Number(((px * 750) / screenWidthPx).toFixed(2))
const rpxToPx = (rpx) => Number(((rpx * screenWidthPx) / 750).toFixed(2))

const menuButtonInfoPx = wx.getMenuButtonBoundingClientRect()

function getMenuButtonTopRpx() {
  return pxToRpx(menuButtonInfoPx.top || 0)
}
function getMenuButtonHeightRpx() {
  return pxToRpx(menuButtonInfoPx.height || 0)
}

/**
 * 获取指定选择器的元素/组件高度
 * @param {Object} page
 * @param {string} selector
 * @param {boolean} [returnRpx=true]
 * @returns {Promise<number>}
 */
function getElementHeight(page, selector, returnRpx = true) {
  return new Promise((resolve) => {
    if (!page || !selector) {
      console.error('参数错误：page 和 selector 为必填项')
      resolve(0)
      return
    }
    const query = wx.createSelectorQuery().in(page)
    query.select(selector)
      .boundingClientRect((rect) => {
        const heightPx = rect ? rect.height : 0
        const finalHeight = returnRpx ? pxToRpx(heightPx) : heightPx
        resolve(finalHeight)
      })
      .exec()
  })
}

module.exports = {
  formatTime,
  pxToRpx,
  rpxToPx,
  getMenuButtonTopRpx,
  getMenuButtonHeightRpx,
  menuButtonInfoPx,
  getElementHeight,
  formatNumber
}