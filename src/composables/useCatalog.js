import { onBeforeUnmount, onMounted, readonly, ref, shallowRef, watch } from 'vue'
import { getAccessToken } from '../services/registryApi.js'
import { fetchCatalog } from '../services/catalogApi.js'

export function useCatalog(active) {
  const files = shallowRef(Object.freeze([]))
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref('')
  let controller = null, cachedToken = getAccessToken()
  function stop() { controller?.abort(); controller = null; loading.value = false }
  function syncCredential() {
    const token = getAccessToken()
    if (token === cachedToken) return
    stop(); cachedToken = token; files.value = Object.freeze([]); loaded.value = false; error.value = ''
  }
  async function load() {
    syncCredential()
    if (!active.value || document.visibilityState === 'hidden' || controller) return
    const current = new AbortController(), token = cachedToken
    controller = current
    loading.value = true
    error.value = ''
    try {
      const result = await fetchCatalog({ signal: current.signal })
      if (getAccessToken() !== token) { syncCredential(); return }
      if (controller !== current) return
      files.value = result
      loaded.value = true
    } catch (cause) {
      if (getAccessToken() !== token) { syncCredential(); return }
      if (controller === current && cause.name !== 'AbortError') error.value = cause.message || '文件目录加载失败，请重试'
    } finally {
      if (controller === current) { controller = null; loading.value = false }
    }
  }
  function applyFileLevel(id, fileLevel) {
    // 避免提交之前发出的目录响应覆盖已确认的新等级。
    stop()
    files.value = Object.freeze(files.value.map(file => file.id === id ? Object.freeze({ ...file, fileLevel }) : file))
  }
  function sync() {
    syncCredential()
    if (!active.value || document.visibilityState === 'hidden') stop()
    else if (!loaded.value) void load()
  }
  watch(active, sync)
  onMounted(() => { document.addEventListener('visibilitychange', sync); sync() })
  onBeforeUnmount(() => { document.removeEventListener('visibilitychange', sync); stop() })
  return { files: readonly(files), loading: readonly(loading), loaded: readonly(loaded), error: readonly(error), load, applyFileLevel }
}
