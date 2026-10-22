import { registryApiRequest } from './registryApi.js'
import { parseDepartmentList, parsePersonnelList, parsePersonnelJson } from '../models/personnel.js'
export async function fetchPersonnel({ signal } = {}) {
  return parsePersonnelList(await registryApiRequest('/user/user-list', { method: 'GET', signal, parseJson: parsePersonnelJson }))
}
export async function fetchDepartments({ signal } = {}) {
  return parseDepartmentList(await registryApiRequest('/user/department-list', { method: 'GET', signal, parseJson: parsePersonnelJson }))
}

export async function refreshOrganization() {
  try {
    // 后端同步执行，默认总时限 300 秒；不随工作台切换中止或自动重发。
    const result = await registryApiRequest('/user/refresh-all', { method: 'POST', timeoutMs: 330000, parseJson: parsePersonnelJson })
    const fields = ['refreshed_users', 'refreshed_departments', 'synced_names', 'pending_names']
    if (!result || fields.some(field => typeof result[field] !== 'string' || !/^(0|[1-9]\d*)$/.test(result[field])) || result.pending_names !== '0') {
      throw new Error('组织架构刷新结果无法确认，请先重新查看成员列表，稍后再尝试刷新组织架构。')
    }
    return Object.freeze(Object.fromEntries(fields.map(field => [field, result[field]])))
  } catch (error) {
    const detail = error.detail
    if (detail && typeof detail === 'object') {
      const state = detail.database_updated === true ? '数据库已更新。' : detail.database_updated === false ? '数据库尚未变更。' : '数据库提交结果尚未确认。'
      error.message = `${error.message} ${state}`
    } else if (error.status === 0 || error.status === 200 || error.status >= 500) {
      error.message += ' 后台可能仍在执行，请稍后重新查看成员列表；不会自动重复提交。'
    }
    throw error
  }
}
