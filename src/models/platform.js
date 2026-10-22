import { parseAvatarFilename } from './avatar.js'
export const PLATFORM_CODE_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/

export class PlatformDataError extends Error {
  constructor(message = '平台列表返回了无效的数据') {
    super(message)
    this.name = 'PlatformDataError'
  }
}

// 只保存公开平台信息；isAlive 表示登录会话有效，不代表业务健康。
export class PlatformInfo {
  constructor({ code, name, description, isAlive, admins = [] }) {
    if (typeof code !== 'string' || !PLATFORM_CODE_PATTERN.test(code) ||
        typeof name !== 'string' || !name.trim() ||
        typeof description !== 'string' || !description.trim() ||
        typeof isAlive !== 'boolean') {
      throw new PlatformDataError()
    }
    if (!Array.isArray(admins)) throw new PlatformDataError('平台管理员资料无效')
    const ids = new Set()
    this.admins = Object.freeze(admins.map(admin => {
      if (!admin || typeof admin.userid !== 'string' || !admin.userid.trim() || ids.has(admin.userid) || typeof admin.name !== 'string' || !admin.name.trim()) throw new PlatformDataError('平台管理员资料无效')
      ids.add(admin.userid)
      return Object.freeze({ userid: admin.userid, name: admin.name, avatarFilename: parseAvatarFilename(admin.avatar_url) })
    }))
    this.code = code
    this.name = name
    this.description = description
    this.isAlive = isAlive
    Object.freeze(this)
  }

  static fromApi(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value) || !Array.isArray(value.admins)) throw new PlatformDataError()
    return new PlatformInfo({
      code: value.code,
      name: value.name,
      description: value.description,
      isAlive: value.is_alive,
      admins: value.admins,
    })
  }
}

export function parsePlatformList(payload, { includeRegistry = false } = {}) {
  if (!Array.isArray(payload)) throw new PlatformDataError()
  const codes = new Set()
  const platforms = payload.map(value => {
    const platform = PlatformInfo.fromApi(value)
    if (codes.has(platform.code)) throw new PlatformDataError('平台列表包含重复的平台代号')
    codes.add(platform.code)
    return platform
  })
  // 注册中心自身不作为来源平台参与概览、全选及文件筛选。
  return Object.freeze(platforms.filter(platform => includeRegistry || platform.code !== 'registry'))
}

export function parsePlatformSyncTime(payload) {
  const value = payload?.next_sync_at
  if (value === null) return null
  if (typeof value !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) ||
      !Number.isFinite(Date.parse(value))) {
    throw new PlatformDataError('平台同步时间返回了无效的数据')
  }
  return new Date(value).toISOString()
}

export function platformDisplayName(platforms, code) {
  return platforms.find(platform => platform.code === code)?.name || code
}
