import { registryApiRequest } from './registryApi.js'
import { parseReviewHistoryJson } from '../models/reviewHistory.js'
import { parsePendingDeletionReviews, createDeletionDecision, parseDeletionDecisionResult } from '../models/deletionReview.js'

export async function fetchPendingDeletionReviews({ signal } = {}) {
  const response = await registryApiRequest('/deletion-review/list', { method: 'GET', signal, parseJson: parseReviewHistoryJson })
  return parsePendingDeletionReviews(response)
}

export async function submitDeletionDecision(reviewId, input, { signal } = {}) {
  const id = typeof reviewId === 'string' ? reviewId : Number.isSafeInteger(reviewId) ? String(reviewId) : ''
  if (!/^[1-9]\d{0,18}$/.test(id) || BigInt(id) > 9223372036854775807n) throw new Error('删除审核 ID 无效')
  const body = createDeletionDecision(input.approved, input.note)
  const result = parseDeletionDecisionResult(await registryApiRequest(`/deletion-review/${id}/decision`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal, parseJson: parseReviewHistoryJson }))
  if (result.id !== id || result.approved !== body.approved) throw new Error('删除审核结果与提交的申请不一致')
  return result
}
