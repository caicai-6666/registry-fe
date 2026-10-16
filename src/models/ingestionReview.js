import { parsePassports } from './passport.js'
export function parsePendingIngestionReviews(payload) {
  if (!Array.isArray(payload)) throw new Error('入库申请返回了无效的数据')
  const ids = new Set()
  const nullableString = value => value === null || typeof value === 'string'
  return Object.freeze(payload.map(row => {
    const id = typeof row?.id === 'string' ? row.id : Number.isSafeInteger(row?.id) ? String(row.id) : ''
    if (!/^[1-9]\d{0,18}$/.test(id) || BigInt(id) > 9223372036854775807n || ids.has(id) ||
        typeof row.source_platform !== 'string' || !row.source_platform.trim() ||
        !['name', 'abstract', 'applicant', 'source_id'].every(key => nullableString(row[key])) || typeof row.applicant_note !== 'string' ||
        typeof row.requested_at !== 'string' || !/^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/.test(row.requested_at) || !Number.isFinite(Date.parse(row.requested_at)) ||
        (row.passport_recommendations !== null && (!Array.isArray(row.passport_recommendations) || row.passport_recommendations.some(item => typeof item?.passport !== 'string' || !item.passport.trim() || typeof item.reason !== 'string' || !item.reason.trim())))) throw new Error('入库申请返回了无效的数据')
    ids.add(id)
    return Object.freeze({ id, sourcePlatform: row.source_platform, sourceId: row.source_id, name: row.name?.trim() || `未命名文件 #${id}`,
      summary: row.abstract, applicant: row.applicant, applicantNote: row.applicant_note, requestedAt: row.requested_at,
      passportRecommendations: row.passport_recommendations === null ? null : Object.freeze(row.passport_recommendations.map(item => Object.freeze({ passport: item.passport, reason: item.reason }))),
    })
  }))
}

export function createIngestionDecision(approved, note, passport = null) {
  if (typeof approved !== 'boolean') throw new Error('审核结论无效')
  if (typeof note !== 'string' || !note.trim()) throw new Error('请填写审核员备注')
  if (Array.from(note).length > 10000) throw new Error('审核员备注不能超过 10000 字')
  const values = parsePassports(passport)
  // 空选择省略字段，让后端生成；拒绝始终提交空数组。
  return Object.freeze({ approved, note: note.trim(), ...(!approved ? { passport: Object.freeze([]) } : values?.length ? { passport: values } : {}) })
}

export function parseIngestionDecisionResult(row) {
  const id = typeof row?.id === 'string' ? row.id : Number.isSafeInteger(row?.id) ? String(row.id) : ''
  const resourceId = row?.resource_id === null ? null : typeof row?.resource_id === 'string' ? row.resource_id : Number.isSafeInteger(row?.resource_id) ? String(row.resource_id) : ''
  if (!/^[1-9]\d{0,18}$/.test(id) || BigInt(id) > 9223372036854775807n || !['approved', 'rejected'].includes(row.status) ||
      (row.status === 'approved' && (!/^[1-9]\d{0,19}$/.test(resourceId || '') || BigInt(resourceId) > 18446744073709551615n)) ||
      (row.status === 'rejected' && resourceId !== null) || typeof row.reviewer !== 'string' || !row.reviewer.trim() || typeof row.reviewer_note !== 'string' ||
      typeof row.reviewed_at !== 'string' || !/^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/.test(row.reviewed_at) || !Number.isFinite(Date.parse(row.reviewed_at)) ||
      typeof row.result_message_id !== 'string' || !row.result_message_id.trim()) throw new Error('入库审核结果返回了无效的数据')
  const passport = parsePassports(row.passport, { nullable: false })
  if ((row.status === 'approved') !== (passport.length > 0)) throw new Error('入库审核结果的通行证与状态不一致')
  return Object.freeze({ id, resourceId, status: row.status, passport, reviewer: row.reviewer, reviewerNote: row.reviewer_note, reviewedAt: row.reviewed_at, resultMessageId: row.result_message_id })
}
