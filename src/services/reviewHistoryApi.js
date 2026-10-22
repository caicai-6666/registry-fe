import { parseFileLevelHistory } from '../models/fileLevelHistory.js'
import { parseFileLevelAdjustmentJson } from '../models/fileLevelAdjustment.js'
import { registryApiRequest } from './registryApi.js'
import { parseReviewHistory, parseReviewHistoryJson } from '../models/reviewHistory.js'

export async function fetchMyIngestionHistory({ signal } = {}) {
  // 省略 reviewer 参数，由后端按 Bearer 登录身份查询自己的记录。
  const result = await registryApiRequest('/ingestion-review/history', { method: 'GET', signal, parseJson: parseReviewHistoryJson })
  return parseReviewHistory(result)
}

export async function fetchMyDeletionHistory({ signal } = {}) {
  // 后端按当前登录人关联删除审核员或原入库审核员，不再按响应 reviewer 过滤。
  const result = await registryApiRequest('/deletion-review/history', { method: 'GET', signal, parseJson: parseReviewHistoryJson })
  return parseReviewHistory(result, 'deletion')
}

export async function fetchFileLevelHistory({ signal } = {}) {
  // 管理员查看全部操作人的记录，不传 reviewer 或其他筛选参数。
  const result = await registryApiRequest('/catalog/file-level-history', { method: 'GET', signal, parseJson: parseFileLevelAdjustmentJson })
  return parseFileLevelHistory(result)
}
