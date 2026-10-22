import { onBeforeUnmount, reactive } from 'vue'
import { createFileLevelAdjustment } from '../models/fileLevelAdjustment.js'
import { adjustFileLevel } from '../services/catalogApi.js'

export function useFileLevelAdjustments(onSuccess) {
  const updates = reactive({})
  let disposed = false
  async function submit(id, level) {
    if (updates[id]?.pending) return
    const body = updates[id]?.body || createFileLevelAdjustment(id, level)
    updates[id] = { pending: true, body, error: '', notice: '' }
    try {
      const result = await adjustFileLevel(body.resource_id, body.file_level)
      if (disposed) return
      onSuccess(result)
      updates[id] = { pending: false, body: null, error: '', notice: '等级已更新' }
    } catch (cause) {
      if (disposed) return
      // 本地提交与发布分步执行；未确认结果时保留同一请求用于恢复。
      const uncertain = !cause.status || cause.status >= 500 || cause.detail?.database_updated === true
      const recovery = cause.detail?.database_updated === true ? '本地等级已更新，发布尚未确认，请重试原更新。' : uncertain ? '更新结果尚未确认，请重试原更新。' : ''
      updates[id] = { pending: false, body: uncertain ? body : null, error: [cause.message || '等级更新失败', recovery].filter(Boolean).join('；'), notice: '' }
    }
  }
  onBeforeUnmount(() => { disposed = true })
  return { updates, submit }
}
