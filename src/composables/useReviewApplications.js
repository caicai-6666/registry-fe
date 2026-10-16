import { computed, onBeforeUnmount, onMounted, reactive, ref, shallowRef, watch } from 'vue'
import { fetchPendingIngestionReviews, submitIngestionDecision } from '../services/ingestionReviewApi.js'
import { fetchPendingDeletionReviews, submitDeletionDecision } from '../services/deletionReviewApi.js'
import { attachDeletionResources, createDeletionDecision } from '../models/deletionReview.js'
import { fetchCatalog } from '../services/catalogApi.js'
import { createIngestionDecision } from '../models/ingestionReview.js'
import { passportOptions } from '../models/passportSelection.js'

export function useReviewApplications(active, kind = 'ingestion') {
  const records = shallowRef([]), catalog = shallowRef([]), options = shallowRef([])
  const applications = computed(() => kind === 'deletion' ? attachDeletionResources(records.value, catalog.value) : records.value)
  const fetchPending = kind === 'deletion' ? fetchPendingDeletionReviews : fetchPendingIngestionReviews
  const sendDecision = kind === 'deletion' ? submitDeletionDecision : submitIngestionDecision
  const createDecision = kind === 'deletion' ? createDeletionDecision : createIngestionDecision
  const loading = ref(false), loaded = ref(false), error = ref(''), passportError = ref('')
  const decisions = reactive({})
  let request = null, disposed = false
  function stop() { request?.abort(); request = null; loading.value = false }
  async function load() {
    if (!active.value || document.visibilityState === 'hidden' || request || Object.values(decisions).some(item => item.pending)) return
    const current = new AbortController()
    request = current; loading.value = true; error.value = ''; passportError.value = ''
    await Promise.all([
      fetchPending({ signal: current.signal }).then(rows => {
        if (request === current) { records.value = rows; loaded.value = true }
      }).catch(cause => { if (request === current && cause.name !== 'AbortError') error.value = cause.message || '申请列表加载失败，请重试' }),
      fetchCatalog({ signal: current.signal }).then(rows => {
        if (request === current) { catalog.value = rows; options.value = passportOptions(rows.flatMap(row => row.passport || [])) }
      }).catch(cause => { if (request === current && cause.name !== 'AbortError') passportError.value = cause.message || '文件目录加载失败' }),
    ])
    if (request === current) { request = null; loading.value = false }
  }
  async function submit(id, input) {
    if (decisions[id]?.pending || Object.values(decisions).some(item => item.pending)) return
    const body = decisions[id]?.body || createDecision(input.approved, input.note, input.passport)
    stop()
    decisions[id] = { pending: true, body, error: '' }
    try {
      const result = await sendDecision(id, body)
      if (kind === 'deletion' && result.resourceId !== records.value.find(row => row.id === id)?.resourceId) throw new Error('删除审核结果与申请资源不一致')
      if (disposed) return
      records.value = records.value.filter(row => row.id !== id)
      delete decisions[id]
    } catch (cause) {
      if (disposed) return
      // 超时及服务失败可能发生在决定已落库之后，重试必须保留原始请求。
      const uncertain = !cause.status || cause.status >= 500
      decisions[id] = { pending: false, body: uncertain ? body : null, error: cause.message || '审核提交失败，请重试' }
    }
  }
  function sync() { if (active.value && document.visibilityState !== 'hidden') void load(); else stop() }
  watch(active, sync)
  onMounted(() => { document.addEventListener('visibilitychange', sync); sync() })
  onBeforeUnmount(() => { disposed = true; stop(); document.removeEventListener('visibilitychange', sync) })
  return { applications, options, loading, loaded, error, passportError, decisions, load, submit }
}
