import { getAccessToken, registryApiFileRequest } from './registryApi.js'
import { parseAvatarFilename } from '../models/avatar.js'

const pending = new Map()

export function fetchPersonnelAvatar(filename) {
  if (!parseAvatarFilename(filename)) return Promise.reject(new Error('头像文件名不能为空'))
  const token = getAccessToken()
  const key = `${token}:${filename}`
  if (pending.has(key)) return pending.get(key)
  const request = registryApiFileRequest(`/resource/avatar/${filename}`, { method: 'GET', cache: 'default' }).then(({ blob }) => {
    if (getAccessToken() !== token) throw new Error('头像请求的登录凭据已变化')
    if (blob.type !== 'image/webp' || !blob.size) throw new Error('头像服务返回了无效的图片')
    return blob
  }).finally(() => pending.delete(key))
  // 合并并发读取；成功缓存及凭据隔离遵循后端 Cache-Control 与 Vary 响应头。
  pending.set(key, request)
  return request
}
