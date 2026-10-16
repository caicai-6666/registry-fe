import { registryApiRequest, registryApiFileRequest, REGISTRY_API_BASE_PATH } from './registryApi.js'
import { parseCatalogJson, parseCatalogList } from '../models/catalogFile.js'

export async function fetchCatalog({ signal } = {}) {
  return parseCatalogList(await registryApiRequest('/catalog/list', { method: 'GET', signal, parseJson: parseCatalogJson }))
}

export async function fetchPreviewResource(url, init = {}) {
  const root = `${REGISTRY_API_BASE_PATH}/resource/`
  if (url.startsWith(root)) {
    const match = /^(file|ingestion)\/([1-9]\d{0,19})$/.exec(url.slice(root.length))
    if (!match || BigInt(match[2]) > (match[1] === 'ingestion' ? 9223372036854775807n : 18446744073709551615n)) throw new Error('文件资源 ID 无效')
    const resource = await registryApiFileRequest(`/resource/${match[1]}/${match[2]}`, { method: 'GET', signal: init.signal })
    return new Response(resource.blob, { headers: { 'Content-Type': resource.blob.type || 'application/octet-stream', 'Content-Disposition': resource.contentDisposition || '' } })
  }
  // 其他资源不携带人员免登码；本地 blob 和静态文件仍可使用通用展示器。
  return fetch(url, init)
}
