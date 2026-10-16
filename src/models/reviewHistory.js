import { parsePassports } from './passport.js'
export function formatReviewTime(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(value))
}

export function parseReviewHistoryJson(text) {
  return JSON.parse(text, (key, value, context) => {
    if (!['id', 'resource_id'].includes(key) || typeof value !== 'number') return value
    if (context?.source && /^[1-9]\d*$/.test(context.source)) return context.source
    if (!Number.isSafeInteger(value)) throw new Error('浏览器无法精确读取审核资源 ID')
    return String(value)
  })
}

export function parseReviewHistory(payload, reviewer, kind = 'ingestion') {
  if (!Array.isArray(payload)) throw new Error('审核记录返回了无效的数据')
  const ids = new Set()
  return Object.freeze(payload.map(row => {
    const id = typeof row?.id === 'string' ? row.id : Number.isSafeInteger(row?.id) ? String(row.id) : ''
    const resourceId = row?.resource_id === null ? null : typeof row?.resource_id === 'string' ? row.resource_id : Number.isSafeInteger(row?.resource_id) ? String(row.resource_id) : ''
    const nullableString = value => value === null || typeof value === 'string'
    const time = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value))
    if (!/^[1-9]\d{0,18}$/.test(id) || BigInt(id) > 9223372036854775807n || ids.has(id) ||
        !['approved', 'rejected'].includes(row.status) || typeof row.reviewer !== 'string' || !row.reviewer.trim() ||
        typeof row.source_platform !== 'string' || !row.source_platform.trim() || typeof row.applicant_note !== 'string' ||
        !['applicant', 'reviewer_note'].every(key => nullableString(row[key])) ||
        (kind === 'ingestion' && !['name', 'abstract'].every(key => nullableString(row[key]))) ||
        (kind === 'deletion' && resourceId !== null && (!/^[1-9]\d{0,19}$/.test(resourceId) || BigInt(resourceId) > 18446744073709551615n)) ||
        !time(row.requested_at) || (row.reviewed_at !== null && !time(row.reviewed_at))) throw new Error('审核记录返回了无效的数据')
    ids.add(id)
    return Object.freeze({ id, resourceId: kind === 'deletion' ? resourceId : null, name: kind === 'deletion' ? resourceId ? `文件资源 #${resourceId}` : `删除申请 #${id}` : row.name?.trim() || `未命名文件 #${id}`, sourcePlatform: row.source_platform,
      summary: kind === 'deletion' ? null : row.abstract, applicant: row.applicant, applicantNote: row.applicant_note, requestedAt: row.requested_at,
      status: row.status, passport: parsePassports(row.passport), reviewer: row.reviewer, reviewerNote: row.reviewer_note, reviewedAt: row.reviewed_at })
  }).filter(row => kind === 'deletion' || row.reviewer === reviewer))
}
