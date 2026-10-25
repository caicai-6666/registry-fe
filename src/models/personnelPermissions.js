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
