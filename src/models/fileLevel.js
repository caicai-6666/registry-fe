// 等级尚无业务枚举；以十进制字符串保留完整 int64 精度。
export function parseFileLevel(value) {
  const text = typeof value === 'string' ? value.trim() : Number.isSafeInteger(value) ? String(value) : ''
  if (!/^-?\d+$/.test(text)) throw new Error('请填写整数文件等级')
  const level = BigInt(text)
  if (level < -9223372036854775808n || level > 9223372036854775807n) throw new Error('文件等级超出有符号 64 位整数范围')
  return String(level)
}

export function serializeIngestionDecision(body) {
  const { file_level: fileLevel, ...rest } = body
  if (fileLevel === undefined || fileLevel === null) return JSON.stringify(rest)
  // 校验后的十进制整数直接写入 JSON 数值，避免 Number 舍入或发送字符串。
  const level = parseFileLevel(fileLevel)
  return `${JSON.stringify(rest).slice(0, -1)},"file_level":${level}}`
}
