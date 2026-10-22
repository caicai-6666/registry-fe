export function parseAvatarFilename(value) {
  if (value === null) return null
  if (typeof value !== 'string' || !/^[a-f0-9]{32}\.webp$/.test(value)) throw new Error('头像文件名无效')
  return value
}
