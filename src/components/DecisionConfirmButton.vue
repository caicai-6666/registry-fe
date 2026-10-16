<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
const props = defineProps({ label: { type: String, required: true }, confirming: Boolean, disabled: Boolean, loading: Boolean })
const emit = defineEmits(['activate'])
const settling = ref(false)
let timer
watch(() => props.confirming, confirming => {
  clearTimeout(timer)
  settling.value = confirming && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (settling.value) timer = setTimeout(() => { settling.value = false }, 420)
}, { flush: 'sync' })
function activate() {
  if (props.disabled || props.loading || settling.value) return
  // 首次点击立即拦住连点，确认文字完成滑入后才允许提交。
  if (!props.confirming) settling.value = true
  emit('activate')
}
onBeforeUnmount(() => clearTimeout(timer))
</script>
<template>
  <button type="button" class="decision-confirm" :class="{ 'is-confirming': confirming || loading, 'is-loading': loading }" :aria-label="loading ? `正在提交${label}决定` : confirming ? `确认${label}` : label" :disabled="disabled || loading" :aria-disabled="disabled || loading || settling" :aria-busy="loading" @click="activate">
    <span class="decision-confirm__viewport" aria-hidden="true"><span class="decision-confirm__track"><span>{{ label }}</span><span>确认{{ label }}</span><span class="decision-confirm__loading"><i class="decision-confirm__spinner"></i>提交中</span></span></span>
  </button>
</template>
<style scoped>
.decision-confirm { width: 104px; }
.decision-confirm.is-confirming, .decision-confirm.is-confirming:hover:not(:disabled) { background: #edb34b; border-color: #dda039; color: #684613; box-shadow: 0 4px 10px #bf8b321c; }
.decision-confirm__viewport { display: block; height: 18px; overflow: hidden; }
.decision-confirm__track { display: flex; flex-direction: column; transform: translateY(0); transition: transform .42s cubic-bezier(.22, 1, .36, 1); }
.decision-confirm__track > span { display: flex; flex: none; height: 18px; line-height: 18px; align-items: center; justify-content: center; white-space: nowrap; }
.is-confirming .decision-confirm__track { transform: translateY(-18px); }
.is-loading .decision-confirm__track { transform: translateY(-36px); }
.decision-confirm.is-loading:disabled { opacity: 1; }
.decision-confirm__loading { gap: 6px; }
.decision-confirm__spinner { flex: none; width: 12px; height: 12px; border: 1.5px solid #68461330; border-top-color: currentColor; border-radius: 50%; animation: decision-loading .75s linear infinite; }
@keyframes decision-loading { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .decision-confirm__track { transition: none; } .decision-confirm__spinner { animation: none; } }
</style>
