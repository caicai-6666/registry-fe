// 每组依次为背板深色、封面底色、封面高光；可集中调整文件夹配色。
export const FOLDER_COVER_PALETTE = Object.freeze([
  ['#bd853c', '#dca64e', '#edc578'], // 蜂蜜金
  ['#527d6a', '#74a58b', '#a1c8ad'], // 鼠尾草绿
  ['#54799b', '#79a2c5', '#adcce2'], // 雾蓝
  ['#84709d', '#a391bc', '#c8b8dc'], // 丁香紫
  ['#9a6a7c', '#c08f9f', '#deb7c2'], // 烟粉
  ['#497f82', '#6caaac', '#a0cdcc'], // 青瓷
  ['#a16c50', '#c68e70', '#e2b59a'], // 陶土
  ['#737d94', '#99a5bf', '#bec9db'], // 灰蓝
].map(colors => Object.freeze(colors)))

export function folderCoverStyle(code) {
  // 按唯一代号稳定分配，列表重排或同步不会改变已有平台的颜色。
  let hash = 0
  for (const character of code) hash = (Math.imul(hash, 31) + character.charCodeAt(0)) >>> 0
  const [back, base, highlight] = FOLDER_COVER_PALETTE[hash % FOLDER_COVER_PALETTE.length]
  return { '--folder-back': back, '--folder-base': base, '--folder-highlight': highlight }
}
