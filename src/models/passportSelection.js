export function passportOptions(values) {
  return [...new Set(values.filter(value => typeof value === 'string' && value.trim()))].sort()
}
export function suggestPassports(options, selected, query = '') {
  const prefix = query.trim()
  return passportOptions(options).filter(value => !selected.includes(value) && value.startsWith(prefix)).slice(0, 20)
}
export function addExistingPassport(selected, value, options) {
  if (!passportOptions(options).includes(value) || selected.includes(value)) return selected
  return [...selected, value]
}
