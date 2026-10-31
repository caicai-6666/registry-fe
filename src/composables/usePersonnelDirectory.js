import { onBeforeUnmount, onMounted, readonly, ref, shallowRef, watch } from 'vue'
import { getAccessToken } from '../services/registryApi.js'
import { fetchPersonnel, fetchDepartments } from '../services/personnelApi.js'
export const PERSONNEL_DIRECTORY_KEY = Symbol('registry-personnel-directory')
export function usePersonnelDirectory(active) {
  const records = shallowRef(Object.freeze([])), departments = shallowRef(Object.freeze([]))
  const loading = ref(false), loaded = ref(false), error = ref('')
  let controller = null, fresh = false, cachedToken = getAccessToken()
  function stop() { controller?.abort(); controller = null; loading.value = false }
  function invalidate() { fresh = false; stop() }
  function syncCredential() {
    const token = getAccessToken()
    if (token === cachedToken) return
    invalidate(); cachedToken = token
    records.value = Object.freeze([]); departments.value = Object.freeze([]); loaded.value = false; error.value = ''
  }
  async function load() {
    syncCredential()
    if (!active.value || document.visibilityState === 'hidden' || controller) return
    const current = new AbortController(), token = cachedToken
    controller = current; loading.value = true; error.value = ''
    try {
      const [users, units] = await Promise.all([fetchPersonnel({ signal: current.signal }), fetchDepartments({ signal: current.signal })])
      if (getAccessToken() !== token) { syncCredential(); return }
      if (controller !== current) return
      records.value = users; departments.value = units; loaded.value = true; fresh = true
    } catch (cause) {
      if (getAccessToken() !== token) { syncCredential(); return }
      if (controller === current && cause.name !== 'AbortError') error.value = cause.message || '人员目录加载失败，请重试'
      current.abort()
    } finally { if (controller === current) { controller = null; loading.value = false } }
  }
  function sync() {
    syncCredential()
    if (!active.value || document.visibilityState === 'hidden') stop()
    else if (!fresh) void load()
  }
  watch(active, sync)
  onMounted(() => { document.addEventListener('visibilitychange', sync); sync() })
  onBeforeUnmount(() => { document.removeEventListener('visibilitychange', sync); stop() })
  return { records: readonly(records), departments: readonly(departments), loading: readonly(loading), loaded: readonly(loaded), error: readonly(error), load, invalidate, ensureLoaded: sync }
}
