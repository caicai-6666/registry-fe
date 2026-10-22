import { parseFileLevel } from './fileLevel.js'

export const fileLevelHistoryLabels = Object.freeze({ prepared: '已记录意图', local_updated: '待发布确认', published: '已发布' })
export const fileLevelHistoryDescriptions = Object.freeze({ prepared: '本地提交尚未确认', local_updated: '本地等级已更新，发布尚未确认', published: '本地更新及发布已确认' })
function positiveId(value, maximum) {
  const id = typeof value === 'string' ? value : Number.isSafeInteger(value) ? String(value) : ''
  if (!/^[1-9]\d{0,19}$/.test(id) || BigInt(id) > maximum) throw new Error('文件等级变更记录 ID 无效')
  return id
}
const isTime = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value))
export function parseFileLevelHistory(payload) {
  if (!Array.isArray(payload)) throw new Error('文件等级变更记录返回了无效的数据')
  const ids = new Set()
  return Object.freeze(payload.map(row => {
    const id = positiveId(row?.id, 9223372036854775807n)
    const resourceId = positiveId(row.resource_id, 18446744073709551615n)
    if (ids.has(id) || !Object.hasOwn(fileLevelHistoryLabels, row.status) ||
        !['source_platform', 'source_id', 'reviewer', 'reviewer_name', 'note'].every(key => typeof row[key] === 'string') ||
        !row.source_platform.trim() || !row.reviewer.trim() ||
        !(row.result_message_id === null || typeof row.result_message_id === 'string') ||
        !isTime(row.created_at) || !isTime(row.updated_at)) throw new Error('文件等级变更记录返回了无效的数据')
    ids.add(id)
    return Object.freeze({ id, resourceId, sourcePlatform: row.source_platform, sourceId: row.source_id,
      previousLevel: row.previous_file_level === null ? null : parseFileLevel(row.previous_file_level),
      newLevel: parseFileLevel(row.file_level), reviewer: row.reviewer, reviewerName: row.reviewer_name.trim() || row.reviewer,
      note: row.note, status: row.status, resultMessageId: row.result_message_id, createdAt: row.created_at, updatedAt: row.updated_at })
  }))
}
