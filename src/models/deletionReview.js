import { parsePassports } from './passport.js'

export function parsePendingDeletionReviews(payload) {
  if (!Array.isArray(payload)) throw new Error('删除申请返回了无效的数据')
  const ids = new Set()
  return Object.freeze(payload.map(row => {
    const id = typeof row?.id === 'string' ? row.id : Number.isSafeInteger(row?.id) ? String(row.id) : ''
    const resourceId = typeof row?.resource_id === 'string' ? row.resource_id : Number.isSafeInteger(row?.resource_id) ? String(row.resource_id) : ''
    if (!/^[1-9]\d{0,18}$/.test(id) || BigInt(id) > 9223372036854775807n || ids.has(id) ||
        !/^[1-9]\d{0,19}$/.test(resourceId) || BigInt(resourceId) > 18446744073709551615n ||
        typeof row.source_platform !== 'string' || !row.source_platform.trim() ||
        !['source_id', 'applicant'].every(key => row[key] === null || typeof row[key] === 'string') || typeof row.applicant_note !== 'string' ||
        typeof row.requested_at !== 'string' || !/^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/.test(row.requested_at) || !Number.isFinite(Date.parse(row.requested_at))) throw new Error('删除申请返回了无效的数据')
    ids.add(id)
    return Object.freeze({ id, resourceId, sourcePlatform: row.source_platform, sourceId: row.source_id, passport: parsePassports(row.passport), applicant: row.applicant, applicantNote: row.applicant_note, requestedAt: row.requested_at })
  }))
}

export function createDeletionDecision(approved, note) {
  if (typeof approved !== 'boolean') throw new Error('审核结论无效')
  if (typeof note !== 'string' || !note.trim()) throw new Error('请填写审核员备注')
  if (Array.from(note).length > 10000) throw new Error('审核员备注不能超过 10000 字')
  return Object.freeze({ approved, note: note.trim() })
}

export function parseDeletionDecisionResult(row) {
  const id = typeof row?.id === 'string' ? row.id : Number.isSafeInteger(row?.id) ? String(row.id) : ''
  const resourceId = typeof row?.resource_id === 'string' ? row.resource_id : Number.isSafeInteger(row?.resource_id) ? String(row.resource_id) : ''
  if (!/^[1-9]\d{0,18}$/.test(id) || BigInt(id) > 9223372036854775807n ||
      !/^[1-9]\d{0,19}$/.test(resourceId) || BigInt(resourceId) > 18446744073709551615n ||
      !['approved', 'rejected'].includes(row.status) || typeof row.approved !== 'boolean' || row.approved !== (row.status === 'approved') ||
      typeof row.reviewer !== 'string' || !row.reviewer.trim() || typeof row.reviewer_note !== 'string' ||
      typeof row.reviewed_at !== 'string' || !/^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/.test(row.reviewed_at) || !Number.isFinite(Date.parse(row.reviewed_at)) ||
      typeof row.result_message_id !== 'string' || !row.result_message_id.trim()) throw new Error('删除审核结果返回了无效的数据')
  return Object.freeze({ id, resourceId, status: row.status, approved: row.approved, reviewer: row.reviewer, reviewerNote: row.reviewer_note, reviewedAt: row.reviewed_at, resultMessageId: row.result_message_id })
}

export function attachDeletionResources(applications, catalog) {
  const files = new Map(catalog.map(file => [file.id, file]))
  return applications.map(application => {
    const file = files.get(application.resourceId)
    return { ...application, name: file?.name || `文件资源 #${application.resourceId}`, summary: file?.summary ?? null }
  })
}
