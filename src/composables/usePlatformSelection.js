import { computed, readonly, shallowRef, watch } from 'vue'

export function usePlatformSelection(platforms) {
  const selectedCodes = shallowRef(Object.freeze([]))
  const availableCodes = computed(() => platforms.value.map(platform => platform.code))

  // 保留仍存在的平台选择，不把新平台自动加入筛选。
  watch(availableCodes, codes => {
    const remaining = selectedCodes.value.filter(code => codes.includes(code))
    if (remaining.length !== selectedCodes.value.length) selectedCodes.value = Object.freeze(remaining)
  }, { flush: 'sync' })

  function toggle(code) {
    if (!availableCodes.value.includes(code)) return
    selectedCodes.value = Object.freeze(selectedCodes.value.includes(code)
      ? selectedCodes.value.filter(selected => selected !== code)
      : [...selectedCodes.value, code])
  }

  function setAll(checked) {
    selectedCodes.value = Object.freeze(checked ? [...availableCodes.value] : [])
  }

  return Object.freeze({ selectedCodes: readonly(selectedCodes), toggle, setAll })
}
