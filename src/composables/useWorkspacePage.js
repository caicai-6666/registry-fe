import { computed, nextTick, onActivated, onBeforeUnmount, onDeactivated, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

export function useWorkspacePage(name) {
  const route = useRoute()
  const pageRoot = ref(null), activated = ref(true)
  const active = computed(() => activated.value && route.name === name)
  let scrollPositions = [], frame = null
  function rememberScroll() {
    const root = pageRoot.value
    if (!root) return
    scrollPositions = [root, ...root.querySelectorAll('*')]
      .filter(element => element.scrollTop || element.scrollLeft)
      .map(element => ({ element, top: element.scrollTop, left: element.scrollLeft }))
  }
  function restoreScroll() {
    if (!active.value) return
    for (const { element, top, left } of scrollPositions) {
      if (element.isConnected) { element.scrollTop = top; element.scrollLeft = left }
    }
  }
  function cancelFrame() { if (frame !== null) cancelAnimationFrame(frame); frame = null }
  // 路由变化时先保存位置并停用页面，避免等退场结束才停止读取或关闭弹窗。
  watch(active, value => { if (!value) { rememberScroll(); cancelFrame() } }, { flush: 'sync' })
  onActivated(async () => {
    activated.value = true
    await nextTick()
    restoreScroll()
    cancelFrame()
    if (active.value) frame = requestAnimationFrame(() => { frame = null; restoreScroll() })
  })
  onDeactivated(() => { activated.value = false; cancelFrame() })
  onBeforeUnmount(cancelFrame)
  return { active, pageRoot }
}
