import { onBeforeUnmount, onMounted, readonly, ref, shallowRef, watch } from 'vue'
import { fetchMyIngestionHistory } from '../services/reviewHistoryApi.js'

export function useReviewHistory(active, fetchHistory = fetchMyIngestionHistory) {
  const records = shallowRef(Object.freeze([])), loading = ref(false), loaded = ref(false), error = ref('')
  let request = null
  function stop() { request?.abort(); request = null; loading.value = false }
  async function load() {
    if (!active.value || document.visibilityState === 'hidden' || request) return
    const current = new AbortController()
    request = current; loading.value = true; error.value = ''
    try {
      const rows = await fetchHistory({ signal: current.signal })
      if (request !== current) return
      records.value = rows; loaded.value = true
    } catch (cause) {
      if (request === current && cause.name !== 'AbortError') error.value = cause.message || '审核记录读取失败，请重试'
    } finally { if (request === current) { request = null; loading.value = false } }
  }
  function sync() { if (active.value && document.visibilityState !== 'hidden') void load(); else stop() }
  watch(active, sync)
  onMounted(() => { document.addEventListener('visibilitychange', sync); sync() })
  onBeforeUnmount(() => { stop(); document.removeEventListener('visibilitychange', sync) })
  return { records: readonly(records), loading: readonly(loading), loaded: readonly(loaded), error: readonly(error), load }
}
