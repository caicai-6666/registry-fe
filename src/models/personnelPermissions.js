export function createPersonnelPermissionDraft(user) {
  return user.platformAccess.filter(platform => platform.isSubManagementPlatform || platform.isManagementEntry).map(platform => ({
    code: platform.code, name: platform.name,
    isSubManagementPlatform: platform.isSubManagementPlatform,
    isManagementEntry: platform.isManagementEntry,
    level: platform.authorized ? platform.level : '',
    administrator: platform.isAdmin === true,
    administratorKnown: platform.isAdmin !== null,
  }))
}
export function permissionLevelError(value) {
  if (value === '') return ''
  return /^(0|[1-9]\d*)$/.test(value) && BigInt(value) <= 100n ? '' : '请输入 0–100 的整数等级'
}

export function createPersonnelPermissionPatch(user, draft) {
  const original = new Map(createPersonnelPermissionDraft(user).map(row => [row.code, row]))
  const permissions = [], administrators = []
  for (const row of draft) {
    const before = original.get(row.code)
    if (!before) throw new Error('平台信息已变化，请重新打开员工权限。')
    if (before.isSubManagementPlatform && row.level !== before.level) {
      if (permissionLevelError(row.level)) throw new Error('请输入 0–100 的整数等级')
      permissions.push([row.code, row.level === '' ? null : Number(row.level)])
    }
    if (before.isManagementEntry && row.administrator !== before.administrator) {
      if (!before.administratorKnown || typeof row.administrator !== 'boolean') throw new Error('管理员资料尚未取得，请刷新后重试。')
      administrators.push([row.code, row.administrator])
    }
  }
  if (!permissions.length && !administrators.length) throw new Error('请先修改需要更新的权限。')
  return { userid: user.userid, platform_permissions: Object.fromEntries(permissions), platform_admins: Object.fromEntries(administrators) }
}
