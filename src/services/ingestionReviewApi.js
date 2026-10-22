import { serializeIngestionDecision } from '../models/fileLevel.js'
import { registryApiRequest } from './registryApi.js'
import { parseReviewHistoryJson } from '../models/reviewHistory.js'
import { createIngestionDecision, parseIngestionDecisionResult, parsePendingIngestionReviews } from '../models/ingestionReview.js'

export async function fetchPendingIngestionReviews({ signal } = {}) {
  return parsePendingIngestionReviews(await registryApiRequest('/ingestion-review/list', { method: 'GET', signal, parseJson: parseReviewHistoryJson }))
}

export async function submitIngestionDecision(reviewId, { approved, note, passport = null, file_level: fileLevel = null }, { signal } = {}) {
  const id = typeof reviewId === 'string' ? reviewId : Number.isSafeInteger(reviewId) ? String(reviewId) : ''
  if (!/^[1-9]\d{0,18}$/.test(id) || BigInt(id) > 9223372036854775807n) throw new Error('入库审核 ID 无效')
  const body = createIngestionDecision(approved, note, passport, fileLevel)
  const response = await registryApiRequest(`/ingestion-review/${id}/decision`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: serializeIngestionDecision(body), signal, parseJson: parseReviewHistoryJson })
  const result = parseIngestionDecisionResult(response)
  if (result.id !== id || (result.status === 'approved') !== approved || (approved && result.fileLevel !== body.file_level)) throw new Error('入库审核结果与提交的申请不一致')
  return result
}
