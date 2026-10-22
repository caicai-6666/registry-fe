import { parseFileLevel } from './fileLevel.js'

function resourceId(value) {
  const id = typeof value === 'string' ? value : Number.isSafeInteger(value) ? String(value) : ''
  if (!/^[1-9]\d{0,19}$/.test(id) || BigInt(id) > 18446744073709551615n) throw new Error('文件资源 ID 无效')
  return id
}
export function createFileLevelAdjustment(id, value) {
  const level = parseFileLevel(value)
  if (BigInt(level) < 0n || BigInt(level) > 100n) throw new Error('文件等级需在 0–100 之间')
  return Object.freeze({ resource_id: resourceId(id), file_level: level, note: '重新定级' })
}
export function serializeFileLevelAdjustment(body) {
  const validated = createFileLevelAdjustment(body.resource_id, body.file_level)
  return `{"resource_id":${validated.resource_id},"file_level":${validated.file_level},"note":${JSON.stringify(validated.note)}}`
}
export function parseFileLevelAdjustmentJson(text) {
  return JSON.parse(text, (key, value, context) => {
    if (!['id', 'resource_id', 'previous_file_level', 'file_level'].includes(key) || typeof value !== 'number') return value
    if (context?.source && /^-?\d+$/.test(context.source)) return context.source
    if (!Number.isSafeInteger(value)) throw new Error('浏览器无法精确读取等级调整结果')
    return String(value)
  })
}
export function parseFileLevelAdjustmentResult(row, body) {
  const id = resourceId(row?.id)
  if (BigInt(id) > 9223372036854775807n || resourceId(row.resource_id) !== body.resource_id ||
      parseFileLevel(row.file_level) !== body.file_level || row.status !== 'published' || row.note !== body.note ||
      typeof row.reviewer !== 'string' || !row.reviewer.trim() ||
      typeof row.result_message_id !== 'string' || !row.result_message_id.trim() ||
      typeof row.created_at !== 'string' || !/^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/.test(row.created_at) || !Number.isFinite(Date.parse(row.created_at))) throw new Error('等级调整结果与提交的文件不一致或回执不完整')
  const previousFileLevel = row.previous_file_level === null ? null : parseFileLevel(row.previous_file_level)
  return Object.freeze({ id, resourceId: body.resource_id, fileLevel: body.file_level, previousFileLevel })
}
