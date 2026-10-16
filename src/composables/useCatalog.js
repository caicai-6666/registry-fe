import { onBeforeUnmount, onMounted, readonly, ref, shallowRef, watch } from 'vue'
import { fetchCatalog } from '../services/catalogApi.js'

export function useCatalog(active) {
  const files = shallowRef(Object.freeze([]))
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref('')
  let controller = null
  function stop() { controller?.abort(); controller = null; loading.value = false }
  async function load() {
    if (!active.value || document.visibilityState === 'hidden' || controller) return
    const current = new AbortController()
    controller = current
    loading.value = true
    error.value = ''
    try {
      const result = await fetchCatalog({ signal: current.signal })
      if (controller !== current) return
      files.value = result
      loaded.value = true
    } catch (cause) {
      if (controller === current && cause.name !== 'AbortError') error.value = cause.message || '文件目录加载失败，请重试'
    } finally {
      if (controller === current) { controller = null; loading.value = false }
    }
  }
  function sync() { if (active.value && document.visibilityState !== 'hidden') void load(); else stop() }
  watch(active, sync)
  onMounted(() => { document.addEventListener('visibilitychange', sync); sync() })
  onBeforeUnmount(() => { document.removeEventListener('visibilitychange', sync); stop() })
  return { files: readonly(files), loading: readonly(loading), loaded: readonly(loaded), error: readonly(error), load }
}
