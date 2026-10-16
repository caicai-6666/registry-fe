export function daysInMonth(year, month) {
  if (month === 2) return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28
  return [4,6,9,11].includes(month) ? 30 : 31
}

export function updateCatalogDateFilter(current, field, value) {
  if (!['year','month','day'].includes(field)) return current
  if (value !== null && (!Number.isInteger(value) || value < 1 || field === 'month' && value > 12 || field === 'day' && value > 31)) return current
  const next = { ...current, [field]: value }
  if (next.year === null) return { year: null, month: null, day: null }
  if (next.month === null) next.day = null
  else if (next.day !== null) next.day = Math.min(next.day, daysInMonth(next.year, next.month))
  return next
}

export function catalogYears(files) {
  return [...new Set(files.map(file => new Date(file.ingestedAt).getFullYear()).filter(Number.isFinite))].sort((a,b) => a-b)
}

export function catalogPassportSuggestions(files, prefix = '') {
  const query = prefix.trim()
  return [...new Set(files.flatMap(file => file.passport ?? []).filter(passport => typeof passport === 'string' && passport.length > 0 && passport.startsWith(query)))].sort().slice(0, 20)
}

const textFilterFields = { name: 'name', summary: 'summary', applicant: 'applicant', reviewerText: 'reviewer' }
function normalizeQuery(value) { return typeof value === 'string' ? value.trim().toLocaleLowerCase() : '' }

// 每个空格分隔的关键词都需匹配；关键词内部允许按原文顺序跳字。
function textMatchScore(value, query) {
  const text = normalizeQuery(value)
  const terms = normalizeQuery(query).split(/\s+/).filter(Boolean)
  if (!terms.length) return 0
  if (!text || text === '—') return Infinity
  let score = 0
  for (const term of terms) {
    if (text === term) continue
    const start = text.indexOf(term)
    if (start >= 0) {
      score += (start === 0 ? 1 : 2) + (text.length - term.length) / (text.length + 1)
      continue
    }
    let cursor = 0
    let first = -1
    for (const character of term) {
      const position = text.indexOf(character, cursor)
      if (position < 0) return Infinity
      if (first < 0) first = position
      cursor = position + character.length
    }
    score += 3 + (cursor - first - term.length) / (text.length + 1)
  }
  return score
}

export function catalogTextSuggestions(files, field, query = '') {
  if (!['name', 'applicant', 'reviewerText'].includes(field) || !normalizeQuery(query)) return []
  const key = textFilterFields[field]
  return [...new Set(files.map(file => file[key]?.trim()).filter(value => value && value !== '—'))]
    .map(value => ({ value, score: textMatchScore(value, query) }))
    .filter(entry => Number.isFinite(entry.score))
    .sort((a, b) => a.score - b.score || (a.value < b.value ? -1 : a.value > b.value ? 1 : 0))
    .slice(0, 20).map(entry => entry.value)
}

export function filterCatalogFiles(files, { platformCodes = [], date = {}, reviewer = null, passportPrefix = '', text = {} } = {}) {
  const prefix = passportPrefix.trim()
  const queries = Object.entries(textFilterFields).map(([field, key]) => [key, normalizeQuery(text[field])]).filter(([, query]) => query)
  return files.filter(file => {
    if (queries.some(([key, query]) => !Number.isFinite(textMatchScore(file[key], query)))) return false
    if (prefix && !file.passport?.some(value => value.startsWith(prefix))) return false
    if (platformCodes.length && !platformCodes.includes(file.sourcePlatform)) return false
    if (reviewer !== null && (!reviewer.trim() || file.reviewerIdentity !== reviewer.trim())) return false
    if (date.year !== null && date.year !== undefined) {
      // 与入库时间显示采用同一浏览器本地时区。
      const time = new Date(file.ingestedAt)
      if (time.getFullYear() !== date.year) return false
      if (date.month && time.getMonth() + 1 !== date.month) return false
      if (date.day && time.getDate() !== date.day) return false
    }
    return true
  })
}
