import { registryApiRequest, getAuthSession } from './registryApi.js'
import { parseReviewHistory, parseReviewHistoryJson } from '../models/reviewHistory.js'

export async function fetchMyIngestionHistory({ signal } = {}) {
  const reviewer = getAuthSession()?.userName || ''
  // 省略 reviewer 参数，由后端按 Bearer 登录身份查询自己的记录。
  const result = await registryApiRequest('/ingestion-review/history', { method: 'GET', signal, parseJson: parseReviewHistoryJson })
  return parseReviewHistory(result, reviewer)
}

export async function fetchMyDeletionHistory({ signal } = {}) {
  // 后端按当前登录人关联删除审核员或原入库审核员，不再按响应 reviewer 过滤。
  const result = await registryApiRequest('/deletion-review/history', { method: 'GET', signal, parseJson: parseReviewHistoryJson })
  return parseReviewHistory(result, null, 'deletion')
}
