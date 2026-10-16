// 渲染器统一接收 src、blob、label、kind，发出 ready / error。
export const fileRenderers = Object.freeze({
  audio: () => import('./renderers/MediaRenderer.vue'),
  video: () => import('./renderers/MediaRenderer.vue'),
  pdf: () => import('./renderers/PdfRenderer.vue'),
})
