import { parseAvatarFilename } from './avatar.js'
import { PLATFORM_CODE_PATTERN } from './platform.js'

function unsignedInteger(value, max = null) {
  const text = typeof value === 'string' ? value : Number.isSafeInteger(value) ? String(value) : ''
  if (!/^(0|[1-9]\d*)$/.test(text) || max !== null && BigInt(text) > max) throw new Error('人员目录整数无效')
  return text
}
export function parsePersonnelJson(text) {
  return JSON.parse(text, (_key, value, context) => {
    if (typeof value !== 'number') return value
    if (context?.source && /^(0|[1-9]\d*)$/.test(context.source)) return context.source
    if (!Number.isSafeInteger(value)) throw new Error('浏览器无法精确读取人员目录整数')
    return String(value)
  })
}
export function parseDepartmentList(payload) {
  if (!Array.isArray(payload)) throw new Error('部门列表返回了无效的数据')
  const ids = new Set()
  return Object.freeze(payload.map(row => {
    const id = unsignedInteger(row?.id, 18446744073709551615n)
    if (ids.has(id) || typeof row.name !== 'string' || !row.name.trim()) throw new Error('部门列表返回了无效的数据')
    ids.add(id)
    return Object.freeze({ id, name: row.name })
  }))
}
export function parsePersonnelList(payload) {
  if (!Array.isArray(payload)) throw new Error('用户列表返回了无效的数据')
  const ids = new Set()
  return Object.freeze(payload.map(row => {
    if (!row || typeof row.userid !== 'string' || !row.userid.trim() || ids.has(row.userid) ||
        !(row.name === null || typeof row.name === 'string' && row.name.trim()) ||
        !row.platform_permissions || typeof row.platform_permissions !== 'object' || Array.isArray(row.platform_permissions)) throw new Error('用户列表返回了无效的数据')
    ids.add(row.userid)
    const permissions = Object.fromEntries(Object.entries(row.platform_permissions).map(([code, value]) => {
      if (!PLATFORM_CODE_PATTERN.test(code)) throw new Error('用户平台权限无效')
      return [code, unsignedInteger(value)]
    }))
    return Object.freeze({ userid: row.userid, name: row.name, departmentId: unsignedInteger(row.department_id, 18446744073709551615n),
      avatarFilename: parseAvatarFilename(row.avatar_url), platformPermissions: Object.freeze(permissions) })
  }))
}

// 部门和管理员均按唯一 ID 关联，管理员名单与文件权限等级互不推导。
export function buildPersonnelUsers(records, departments, platforms = null) {
  const departmentNames = new Map(departments.map(row => [row.id, row.name]))
  const platformMap = new Map((platforms || []).map(platform => [platform.code, platform]))
  const management = new Map()
  for (const platform of platforms || []) for (const admin of platform.admins) {
    if (!management.has(admin.userid)) management.set(admin.userid, [])
    management.get(admin.userid).push(platform.code)
  }
  return Object.freeze(records.map(record => {
    const managedPlatforms = platforms === null ? null : Object.freeze([...(management.get(record.userid) || [])])
    const codes = new Set([...platformMap.keys(), ...Object.keys(record.platformPermissions)])
    const platformAccess = Object.freeze([...codes].map(code => Object.freeze({ code, name: platformMap.get(code)?.name || code,
      isAlive: platformMap.get(code)?.isAlive ?? null,
      isSubManagementPlatform: platformMap.get(code)?.isSubManagementPlatform === true,
      isManagementEntry: platformMap.get(code)?.isManagementEntry === true,
      authorized: Object.hasOwn(record.platformPermissions, code),
      level: record.platformPermissions[code] ?? null, isAdmin: managedPlatforms === null ? null : managedPlatforms.includes(code) })))
    return Object.freeze({ ...record, username: record.name?.trim() || record.userid, departmentName: departmentNames.get(record.departmentId) || `部门 #${record.departmentId}`,
      managedPlatforms, isPlatformAdmin: managedPlatforms === null ? null : managedPlatforms.length > 0, platformAccess })
  }))
}
export function personnelDepartment(user) { return user.departmentName }
export function personnelLocatorLabel(user) { return `${user.username} · ${personnelDepartment(user)} · ${user.userid}` }
export function findPersonnelUsers(users, query) {
  const text = query.trim().toLocaleLowerCase()
  if (!text) return []
  return users.filter(user => user.username.toLocaleLowerCase().includes(text) || user.userid.toLocaleLowerCase().includes(text))
    .sort((a, b) => Number(b.username.toLocaleLowerCase() === text) - Number(a.username.toLocaleLowerCase() === text))
}
export function filterPersonnelUsers(users, { username = '', department = '', administratorPlatform = '' } = {}) {
  const text = username.trim().toLocaleLowerCase()
  const selected = text ? users.find(user => personnelLocatorLabel(user) === username) : null
  return users.filter(user => (!text || (selected ? user.userid === selected.userid :
    user.username.toLocaleLowerCase().includes(text) || user.userid.toLocaleLowerCase().includes(text))) &&
    (!department || user.departmentId === department) &&
    (!administratorPlatform || user.managedPlatforms?.includes(administratorPlatform) === true))
}
