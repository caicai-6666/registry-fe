export const PLATFORM_DIRECTORY_KEY = Symbol('registry-platform-directory')
export const PLATFORM_REFRESH_KEY = Symbol('registry-platform-refresh')
import { readonly, shallowRef } from 'vue'
import { parsePlatformList, parsePlatformSyncTime } from '../models/platform.js'
import { registryApiRequest } from './registryApi.js'

const SYNC_SETTLE_DELAY_MS = 1000
const MAX_TIMEOUT_MS = 2147483647
const MAX_RECOVERY_DELAY_MS = 30000

export function createPlatformDirectory({
  fetchList = init => registryApiRequest('/platform/list', { ...init, method: 'GET' }),
  fetchSyncTime = init => registryApiRequest('/platform/sync-time', { ...init, method: 'GET' }),
} = {}) {
  const state = shallowRef(Object.freeze({
    platforms: Object.freeze([]), allPlatforms: Object.freeze([]), subManagementPlatforms: Object.freeze([]), updatedAt: null, nextSyncAt: null,
    isStale: true, isRefreshing: false, error: null, scheduleError: null,
  }))
  let running = false
  let timer = null
  let request = null
  let recoveryDelay = 1000

  function update(changes) {
    state.value = Object.freeze({ ...state.value, ...changes })
  }

  function isCurrent(current) {
    return running && request === current && !current.controller.signal.aborted
  }

  function fail(error, current, changes) {
    if (!isCurrent(current)) return
    update(changes)
    if (error?.status === 401) stop()
  }

  async function loadList(current) {
    try {
      const payload = await fetchList({ signal: current.controller.signal })
      if (!isCurrent(current)) return
      const allPlatforms = parsePlatformList(payload, { includeRegistry: true })
      const platforms = Object.freeze(allPlatforms.filter(platform => platform.code !== 'registry'))
      const subManagementPlatforms = Object.freeze(platforms.filter(platform => platform.isSubManagementPlatform))
      update({ allPlatforms, platforms, subManagementPlatforms, updatedAt: new Date().toISOString(), isStale: false, error: null })
    } catch (error) {
      fail(error, current, { isStale: true, error: error instanceof Error ? error.message : '平台状态查询失败，请稍后重试' })
    }
  }

  async function loadPlan(current) {
    try {
      const payload = await fetchSyncTime({ signal: current.controller.signal })
      if (!isCurrent(current)) return false
      const nextSyncAt = parsePlatformSyncTime(payload)
      update({ nextSyncAt, scheduleError: null })
      return nextSyncAt !== null && Date.parse(nextSyncAt) > Date.now()
    } catch (error) {
      fail(error, current, { nextSyncAt: null, scheduleError: error instanceof Error ? error.message : '无法获取下次平台同步时间' })
      return false
    }
  }

  function refresh({ scheduleOnly = false } = {}) {
    if (!running) return Promise.resolve(state.value)
    if (request) return request.promise
    clearTimeout(timer)
    timer = null
    const current = { controller: new AbortController(), promise: null }
    request = current
    update({ isRefreshing: true })
    current.promise = Promise.resolve().then(async () => {
      if (!isCurrent(current)) return
      if (scheduleOnly) {
        // 后台正在同步或计划不可用时，仅重查计划；出现新计划后再读最新列表。
        if (await loadPlan(current) && isCurrent(current)) await loadList(current)
      } else {
        await Promise.all([loadList(current), loadPlan(current)])
      }
    }).finally(() => {
      if (request !== current) return
      request = null
      update({ isRefreshing: false })
      if (running) scheduleNext()
    }).then(() => state.value)
    return current.promise
  }

  function waitUntil(target) {
    const remaining = target - Date.now()
    timer = setTimeout(() => {
      timer = null
      if (!running) return
      // 分段等待长计划，避免浏览器计时器溢出；系统时间回拨时重新计算。
      if (target > Date.now()) waitUntil(target)
      else {
        void refresh({ scheduleOnly: true })
      }
    }, Math.min(MAX_TIMEOUT_MS, Math.max(0, remaining)))
  }

  function scheduleNext() {
    clearTimeout(timer)
    const planned = state.value.nextSyncAt === null ? null : Date.parse(state.value.nextSyncAt)
    if (planned !== null && planned > Date.now()) {
      recoveryDelay = 1000
      // 计划不是完成时间，稍后读取；后台未完成时会进入计划恢复流程。
      waitUntil(planned + SYNC_SETTLE_DELAY_MS)
    } else {
      timer = setTimeout(() => { timer = null; void refresh({ scheduleOnly: true }) }, recoveryDelay)
      recoveryDelay = Math.min(recoveryDelay * 2, MAX_RECOVERY_DELAY_MS)
    }
  }

  function start() {
    if (running) return request?.promise ?? Promise.resolve(state.value)
    running = true
    return refresh()
  }

  function stop() {
    running = false
    clearTimeout(timer)
    timer = null
    request?.controller.abort()
    request = null
    recoveryDelay = 1000
    update({ isRefreshing: false, isStale: true, nextSyncAt: null })
  }

  return Object.freeze({ state: readonly(state), start, stop, refresh })
}
