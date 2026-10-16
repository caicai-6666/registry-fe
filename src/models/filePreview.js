// 前端展示描述使用 name、url、mimeType；后端响应待契约明确后单独映射。
export function resolveFileKind(file) {
  const mime = typeof file?.mimeType === 'string' ? file.mimeType.split(';')[0].trim().toLowerCase() : ''
  if (mime === 'application/pdf') return 'pdf'
  if (mime.startsWith('audio/')) return 'audio'
  if (mime.startsWith('video/')) return 'video'
  // 明确类型优先，只有缺省或通用二进制类型才回退到文件名。
  if (mime && mime !== 'application/octet-stream') return 'unsupported'
  const extension = typeof file?.name === 'string' ? file.name.split('.').at(-1).toLowerCase() : ''
  if (extension === 'pdf') return 'pdf'
  if (['mp3', 'wav', 'm4a', 'ogg'].includes(extension)) return 'audio'
  if (['mp4', 'webm', 'mov'].includes(extension)) return 'video'
  return 'unsupported'
}

export function filePreviewUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return ''
  try {
    const url = new URL(value, 'https://registry.invalid/')
    return ['http:', 'https:', 'blob:'].includes(url.protocol) ? value.trim() : ''
  } catch { return '' }
}
