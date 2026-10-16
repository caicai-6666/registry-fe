import { parsePassports } from './passport.js'
import { REGISTRY_API_BASE_PATH } from '../services/registryApi.js'

export function parseCatalogJson(text) {
  // 读取原始整数文本，避免 BIGINT ID 经 JavaScript number 四舍五入。
  return JSON.parse(text, (key, value, context) => {
    if (key !== 'id' || typeof value !== 'number') return value
    if (context?.source && /^[1-9]\d*$/.test(context.source)) return context.source
    if (!Number.isSafeInteger(value)) throw new Error('浏览器无法精确读取文件 ID')
    return String(value)
  })
}

export function parseCatalogList(payload) {
  if (!Array.isArray(payload)) throw new Error('文件目录返回了无效的数据')
  const ids = new Set()
  return Object.freeze(payload.map(row => {
    const id = typeof row?.id === 'string' ? row.id : Number.isSafeInteger(row?.id) ? String(row.id) : ''
    const nullableString = value => value === null || typeof value === 'string'
    if (!/^[1-9]\d{0,19}$/.test(id) || BigInt(id) > 18446744073709551615n || ids.has(id) ||
        typeof row.source_platform !== 'string' || !row.source_platform.trim() ||
        !['name', 'applicant', 'reviewer', 'abstract'].every(key => nullableString(row[key])) ||
        typeof row.ingested_at !== 'string' || !/^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/.test(row.ingested_at) || !Number.isFinite(Date.parse(row.ingested_at))) {
      throw new Error('文件目录返回了无效的数据')
    }
    ids.add(id)
    const date = new Date(row.ingested_at)
    const parts = Object.fromEntries(new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date).map(part => [part.type, part.value]))
    return Object.freeze({
      id, originalName: row.name, name: row.name?.trim() || `未命名文件 #${id}`, sourcePlatform: row.source_platform,
      reviewerIdentity: row.reviewer?.trim() || null, applicant: row.applicant?.trim() || '—', reviewer: row.reviewer?.trim() || '—',
      ingestedAt: date.toISOString(), ingestionLabel: `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`,
      summary: row.abstract, url: `${REGISTRY_API_BASE_PATH}/resource/file/${id}`,
      passport: parsePassports(row.passport === undefined ? null : row.passport),
    })
  }))
}
