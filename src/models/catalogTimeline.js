export function groupCatalogByMonth(files) {
  // 使用实际时间排序，按本地月份归组，与列表显示及日期筛选保持一致。
  const sorted = [...files].sort((left, right) => Date.parse(right.ingestedAt) - Date.parse(left.ingestedAt))
  const groups = new Map()
  for (const file of sorted) {
    const date = new Date(file.ingestedAt)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const key = `${year}-${String(month).padStart(2, '0')}`
    if (!groups.has(key)) groups.set(key, { key, label: `${year} 年 ${month} 月`, files: [] })
    groups.get(key).files.push(file)
  }
  return [...groups.values()]
}
