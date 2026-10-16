<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
const props = defineProps({ loading: Boolean, disabled: Boolean, active: { type: Boolean, default: true }, label: { type: String, default: '刷新' } })
defineEmits(['refresh'])
const spinning = ref(false)
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
watch(() => props.loading, busy => { if (busy && props.active) spinning.value = !motionPreference.matches }, { flush: 'sync', immediate: true })
watch(() => props.active, active => { spinning.value = active && props.loading && !motionPreference.matches }, { flush: 'sync' })
function finishTurn() { if (!props.loading) spinning.value = false }
function onMotionChange(event) { if (event.matches) spinning.value = false }
motionPreference.addEventListener('change', onMotionChange)
onBeforeUnmount(() => motionPreference.removeEventListener('change', onMotionChange))
</script>
<template>
  <button type="button" class="refresh-button" :aria-label="label" :disabled="disabled || loading || spinning" :aria-busy="loading" :title="loading ? '正在刷新' : label" @click="$emit('refresh')">
    <svg viewBox="0 0 24 24" :class="{ 'is-spinning': spinning }" aria-hidden="true" @animationiteration="finishTurn"><path d="M19.5 14.7A8 8 0 1 1 18.1 6.9L20 9M20 4.5V9h-4.5" /></svg>
  </button>
</template>
<style scoped>
.refresh-button { display: grid; place-items: center; flex: none; width: 34px; height: 34px; padding: 0; border: 0; border-radius: 50%; background: #fff; color: #597563; line-height: 1; box-shadow: 0 2px 5px #253b3010, 0 5px 14px #253b3012; cursor: pointer; transition: box-shadow .2s, color .2s, background .2s, transform .2s; }
.refresh-button:hover:not(:disabled) { color: #355442; background: #fafffc; box-shadow: 0 3px 7px #253b3014, 0 7px 18px #253b3018; }
.refresh-button:active:not(:disabled) { transform: scale(.94); box-shadow: 0 1px 4px #253b3014; }
.refresh-button:disabled { cursor: default; opacity: .7; }
.refresh-button:focus-visible { outline: 2px solid #608a73; outline-offset: 3px; }
.refresh-button svg { display: block; transform-origin: center; width: 17px; height: 17px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.is-spinning { animation: refresh-turn .8s linear infinite; }
@keyframes refresh-turn { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .refresh-button { transition: none; } .is-spinning { animation: none; } }
</style>
