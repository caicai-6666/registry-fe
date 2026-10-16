export function parsePassports(value, { nullable = true } = {}) {
  if (value === null && nullable) return null
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string' || !item.trim() || Array.from(item).length > 512)) throw new Error('通行证必须为有效的字符串数组')
  // 保留业务值、顺序及重复项，不裁剪、不按逗号或 JSON 文本拆分。
  return Object.freeze([...value])
}
