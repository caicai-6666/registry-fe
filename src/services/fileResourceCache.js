export const FILE_RESOURCE_CACHE_KEY = Symbol('file-resource-cache')

// 每个展示器持有自己的页面内缓存；Blob 可复用，交给 PDF Worker 的字节每次独立复制。
export function createFileResourceCache({ fetchFile = (...args) => fetch(...args) } = {}) {
  const entries = new Map()

  function load(url) {
    const existing = entries.get(url)
    if (existing) return existing.promise
    const entry = { controller: new AbortController(), promise: null }
    entries.set(url, entry)
    entry.promise = Promise.resolve().then(async () => {
      const response = await fetchFile(url, { signal: entry.controller.signal, credentials: 'same-origin' })
      if (!response.ok) throw new Error(`文件加载失败（${response.status}），请重试`)
      entry.fileName = response.headers?.get('Content-Disposition') || ''
      const blob = await response.blob()
      // 清理或失效之后，晚到的响应不能重新填充缓存。
      if (entries.get(url) !== entry || entry.controller.signal.aborted) throw new DOMException('文件加载已取消', 'AbortError')
      return blob
    }).catch(error => {
      if (entries.get(url) === entry) entries.delete(url)
      throw error
    })
    return entry.promise
  }

  function invalidate(url) {
    entries.get(url)?.controller.abort()
    entries.delete(url)
  }

  function clear() {
    for (const entry of entries.values()) entry.controller.abort()
    entries.clear()
  }

  return Object.freeze({ load, invalidate, clear, disposition: url => entries.get(url)?.fileName || '' })
}
