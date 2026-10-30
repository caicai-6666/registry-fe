// 公开路径跟随页面基础路径；开发请求携带 /dev，由网关与 Vite 原样转发。
const PUBLIC_BASE_PATH = import.meta.env?.BASE_URL || '/knowledge-accumulation/registry/'
export const REGISTRY_API_BASE_PATH = `${PUBLIC_BASE_PATH}api`
export const ACCESS_DENIED_EVENT = 'registry-access-denied'
export const KNOWLEDGE_ENTRY_PATH = PUBLIC_BASE_PATH.slice(0, -'registry/'.length)
export const AUTH_EXPIRED_EVENT = 'registry-auth-expired'
const REQUEST_TIMEOUT_MS = 15000

export class RegistryApiError extends Error {
  constructor(message, status = 0) {
    super(message)
    this.name = 'RegistryApiError'
    this.status = status
  }
}

// 统一入口负责登录和 token 生命周期；每次请求读取最新共享值。
export function getAccessToken() {
  try {
    const token = localStorage.getItem('access_token')
    return typeof token === 'string' && /^[\x21-\x7e]+$/.test(token) ? token : null
  } catch {
    return null
  }
}

function apiPath(path) {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) {
    throw new TypeError('API 路径必须为注册中心接口的相对路径')
  }
  const url = new URL(`${REGISTRY_API_BASE_PATH}${path}`, 'http://registry.invalid')
  if (!url.pathname.startsWith(`${REGISTRY_API_BASE_PATH}/`) || url.hash) {
    throw new TypeError('API 路径不能离开注册中心接口范围')
  }
  return `${url.pathname}${url.search}`
}

async function requestJson(path, { signal, parseJson, timeoutMs = REQUEST_TIMEOUT_MS, cache = 'no-store', ...init } = {}, binary = false) {
  const url = apiPath(path)
  const controller = new AbortController()
  let timedOut = false
  const abort = () => controller.abort()
  if (signal?.aborted) abort()
  else signal?.addEventListener('abort', abort, { once: true })
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)

  try {
    const response = await fetch(url, { ...init, signal: controller.signal, cache })
    let payload
    if (binary && response.ok) {
      const mediaType = response.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase()
      if (mediaType === 'application/json' || mediaType === 'text/html') throw new RegistryApiError('文件服务返回了无效的原件响应', response.status)
      payload = { blob: await response.blob(), contentDisposition: response.headers.get('Content-Disposition') }
    } else {
      payload = await (parseJson && response.ok ? response.text().then(parseJson) : response.json()).catch(error => {
        if (controller.signal.aborted) throw error
        return null
      })
    }
    return { response, payload }
  } catch (error) {
    if (timedOut) throw new RegistryApiError('请求超时，请稍后重试')
    if (signal?.aborted) throw error
    if (error instanceof TypeError) throw new RegistryApiError('无法连接注册中心服务，请稍后重试')
    throw error
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', abort)
  }
}

function responseError(response, payload) {
  const fallback = response.status === 401 ? '登录凭据无效或已过期'
    : response.status === 403 ? '暂无注册中心访问权限'
    : response.status === 422 ? '请求参数格式不正确，请重试'
      : `注册中心服务暂时不可用（${response.status}）`
  const detail = typeof payload?.detail === 'string' ? payload.detail.trim() : typeof payload?.detail?.message === 'string' ? payload.detail.message.trim() : ''
  const error = new RegistryApiError(detail || fallback, response.status)
  error.detail = payload?.detail
  return error
}

export async function fetchCurrentUser({ signal } = {}) {
  const user = await registryApiRequest('/auth/me', { method: 'GET', signal })
  if (typeof user?.userid !== 'string' || !user.userid.trim() || typeof user.username !== 'string' || !user.username.trim()) {
    throw new RegistryApiError('身份服务返回了无效的用户资料')
  }
  return Object.freeze({ userid: user.userid, username: user.username })
}

// 业务接口使用统一入口签发的用户 access_token，凭据仅发送到注册中心 API。
async function authenticatedRequest(path, init = {}, binary = false) {
  const accessToken = getAccessToken()
  if (!accessToken) {
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT))
    throw new RegistryApiError('登录状态已失效，请返回知识沉淀入口', 401)
  }
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${accessToken}`)
  const { response, payload } = await requestJson(path, { ...init, headers }, binary)
  if (response.status === 401) {
    // 旧请求不影响统一入口已经更换的新凭据，也不清理共享存储。
    if (getAccessToken() === accessToken) {
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT))
    }
    throw new RegistryApiError('登录状态已失效，请返回知识沉淀入口', 401)
  }
  if (response.status === 403 && getAccessToken() === accessToken) {
    // 权限不足保留登录态，交由入口提供返回路径，不触发重复登录。
    window.dispatchEvent(new Event(ACCESS_DENIED_EVENT))
  }
  if (!response.ok) throw responseError(response, payload)
  if (payload === null) throw new RegistryApiError('注册中心服务返回了无效的 JSON 响应', response.status)
  return payload
}

export function registryApiRequest(path, init = {}) {
  return authenticatedRequest(path, init)
}

export function registryApiFileRequest(path, init = {}) {
  return authenticatedRequest(path, init, true)
}
