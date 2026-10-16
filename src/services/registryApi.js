// 与页面公开基础路径一致：开发经 /dev 映射，生产使用 /registry。
export const REGISTRY_API_BASE_PATH = `${import.meta.env?.DEV ? '/dev' : ''}/registry/api`
export const AUTH_EXPIRED_EVENT = 'registry-auth-expired'
const AUTH_STORAGE_KEY = REGISTRY_API_BASE_PATH.startsWith('/dev/')
  ? 'registry-development-reviewer-session.v1' : 'registry-reviewer-session.v1'
const REQUEST_TIMEOUT_MS = 15000
let memorySession = null

export class RegistryApiError extends Error {
  constructor(message, status = 0) {
    super(message)
    this.name = 'RegistryApiError'
    this.status = status
  }
}

function normalizeSession(value) {
  if (!value || typeof value !== 'object') return null
  const loginCode = typeof value.loginCode === 'string' ? value.loginCode.trim() : ''
  const userName = typeof value.userName === 'string' ? value.userName.trim() : ''
  return loginCode && userName ? { loginCode, userName } : null
}

export function getAuthSession() {
  if (memorySession) return memorySession
  try {
    // 旧 mock 会话不能作为真实登录凭据恢复。
    sessionStorage.removeItem('registry.mock-auth-session.v1')
    memorySession = normalizeSession(JSON.parse(sessionStorage.getItem(AUTH_STORAGE_KEY)))
    if (!memorySession) sessionStorage.removeItem(AUTH_STORAGE_KEY)
  } catch {
    // 会话存储不可用时使用页面内存。
    try { sessionStorage.removeItem(AUTH_STORAGE_KEY) } catch {}
  }
  return memorySession
}

function saveAuthSession(session) {
  memorySession = session
  try {
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
  } catch {
    // 不保存原始人员密钥；存储不可用时刷新需重新登录。
  }
  return session
}

export function clearAuthSession() {
  memorySession = null
  try {
    sessionStorage.removeItem(AUTH_STORAGE_KEY)
  } catch {
    // 内存会话已清除，存储限制不阻断退出。
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

async function requestJson(path, { signal, parseJson, ...init } = {}, binary = false) {
  const url = apiPath(path)
  const controller = new AbortController()
  let timedOut = false
  const abort = () => controller.abort()
  if (signal?.aborted) abort()
  else signal?.addEventListener('abort', abort, { once: true })
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(url, { ...init, signal: controller.signal, cache: 'no-store' })
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
  const fallback = response.status === 401 ? '审核用户密钥无效'
    : response.status === 422 ? '密钥格式不正确，请检查后重试'
      : `注册中心服务暂时不可用（${response.status}）`
  const detail = typeof payload?.detail === 'string' ? payload.detail.trim() : ''
  return new RegistryApiError(detail || fallback, response.status)
}

export async function loginWithSecretKey(secretKey, { signal } = {}) {
  const { response, payload } = await requestJson('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret_key: secretKey }),
    signal,
  })
  if (!response.ok) throw responseError(response, payload)
  if (signal?.aborted) throw new DOMException('登录已取消', 'AbortError')
  const session = normalizeSession({ loginCode: payload?.login_code, userName: payload?.user_name })
  if (!session) throw new RegistryApiError('登录服务返回了无效的会话信息', response.status)
  return saveAuthSession(session)
}

// 后续 JSON 业务接口通过此入口携带免登码，避免将凭据发到其他平台。
async function authenticatedRequest(path, init = {}, binary = false) {
  const session = getAuthSession()
  if (!session) throw new RegistryApiError('登录状态已失效，请重新登录', 401)
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${session.loginCode}`)
  const { response, payload } = await requestJson(path, { ...init, headers }, binary)
  if (response.status === 401) {
    // 已退出或重新登录后，旧请求的 401 不清除新会话。
    if (getAuthSession()?.loginCode === session.loginCode) {
      clearAuthSession()
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT))
    }
    throw new RegistryApiError('登录状态已失效，请重新登录', 401)
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
