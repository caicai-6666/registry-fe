import { onBeforeUnmount, onMounted, readonly, ref, shallowRef, watch } from 'vue'
import { fetchMyIngestionHistory } from '../services/reviewHistoryApi.js'
import { getAccessToken } from '../services/registryApi.js'

export function useReviewHistory(active, fetchHistory = fetchMyIngestionHistory, { sessionActive = null } = {}) {
  const records = shallowRef(Object.freeze([])), loading = ref(false), loaded = ref(false), error = ref('')
  let request = null, fresh = false, cachedToken = getAccessToken()
  function stop() { request?.abort(); request = null; loading.value = false }
  function syncCredential() {
    const token = getAccessToken()
    if (token !== cachedToken) {
      stop(); cachedToken = token; fresh = false
      records.value = Object.freeze([]); loaded.value = false; error.value = ''
    }
  }
  async function load() {
    syncCredential()
    if (!active.value || document.visibilityState === 'hidden' || request) return
    const current = new AbortController(), token = cachedToken
    request = current; loading.value = true; error.value = ''
    try {
      const rows = await fetchHistory({ signal: current.signal })
      if (getAccessToken() !== token) { syncCredential(); return }
      if (request !== current) return
      records.value = rows; loaded.value = true; fresh = true
    } catch (cause) {
      if (getAccessToken() !== token) { syncCredential(); return }
      if (request === current && cause.name !== 'AbortError') error.value = cause.message || '审核记录读取失败，请重试'
    } finally { if (request === current) { request = null; loading.value = false } }
  }
  function sync() {
    syncCredential()
    if (!active.value || document.visibilityState === 'hidden') stop()
    else if (!fresh) void load()
  }
  function onVisibilityChange() {
    if (active.value && document.visibilityState !== 'hidden') void load()
    else stop()
  }
  watch(active, sync)
  // 一次打开期间切换类型复用各自缓存；下次打开重新查询。
  if (sessionActive) watch(sessionActive, opened => { if (!opened) { fresh = false; stop() } }, { flush: 'sync' })
  onMounted(() => { document.addEventListener('visibilitychange', onVisibilityChange); sync() })
  onBeforeUnmount(() => { stop(); document.removeEventListener('visibilitychange', onVisibilityChange) })
  return { records: readonly(records), loading: readonly(loading), loaded: readonly(loaded), error: readonly(error), load }
}
