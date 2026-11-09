<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
const props = defineProps({ items: { type: Array, default: null }, state: { type: Object, default: null }, disabled: Boolean, refreshDisabled: Boolean, active: Boolean })
defineEmits(['regenerate', 'refresh'])
const now = ref(Date.now())
let timer
watch([() => props.state?.pending, () => props.active], ([pending, active]) => {
  clearInterval(timer)
  now.value = Date.now()
  if (pending && active) timer = setInterval(() => { now.value = Date.now() }, 1000)
}, { immediate: true })
onBeforeUnmount(() => clearInterval(timer))
const elapsed = computed(() => {
  const seconds = Math.max(0, Math.floor((now.value - (props.state?.startedAt || now.value)) / 1000))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
})
</script>
<template>
  <section class="passport-recommendations" aria-label="通行证建议">
    <div class="passport-recommendations__heading">
      <h4>通行证建议</h4>
      <button type="button" class="passport-recommendations__generate" :disabled="disabled || state?.pending || state?.needsRefresh" :aria-busy="!!state?.pending" @click="$emit('regenerate')">
        <svg v-if="!state?.pending" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 7a6 6 0 1 1-.3 5M4 3v4h4" /></svg>
        <i v-else class="passport-recommendations__spinner" aria-hidden="true"></i>
        {{ state?.pending ? '正在生成' : '重新生成建议' }}
      </button>
    </div>
    <div v-if="state?.pending" class="passport-recommendations__progress">
      <div role="status"><strong>正在生成通行证建议</strong><p>可能需要几分钟，可继续填写审核意见或切换申请。</p></div>
      <span class="passport-recommendations__elapsed">已等待 {{ elapsed }}</span>
    </div>
    <p v-if="state?.error" class="passport-recommendations__error" role="alert">{{ state.error }} <button v-if="state.needsRefresh" type="button" :disabled="refreshDisabled" @click="$emit('refresh')">刷新申请列表</button></p>
    <p v-else-if="state?.completed" class="passport-recommendations__success" role="status">{{ items?.length ? '建议已更新，已选通行证保持不变。' : '生成完成，本次未返回有效建议。已选通行证保持不变。' }}</p>
    <div :aria-busy="!!state?.pending">
      <p v-if="state?.pending && items?.length" class="passport-recommendations__hint">上次建议 · 生成完成后更新</p>
      <div v-if="items?.length" class="passport-recommendations__items"><article v-for="(item, index) in items" :key="index"><strong>{{ item.passport }}</strong><p>{{ item.reason }}</p></article></div>
      <p v-else-if="!state?.pending && !state?.completed" class="passport-recommendations__hint">{{ items === null ? '暂无推荐信息' : '暂无推荐通行证' }}</p>
    </div>
  </section>
</template>
<style scoped>
.passport-recommendations__heading { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
.passport-recommendations h4 { margin: 0; color: #536659; font-size: 12px; font-weight: 600; }
.passport-recommendations__generate { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-width: 116px; padding: 7px 10px; border: 1px solid #a99ac84d; border-radius: 8px; color: #71618d; background: #f1eef7; font: inherit; font-size: 11px; cursor: pointer; }
.passport-recommendations__generate:hover:not(:disabled) { background: #eae4f4; }
.passport-recommendations__generate:disabled { cursor: default; opacity: .55; }
.passport-recommendations__generate[aria-busy="true"] { opacity: 1; }
.passport-recommendations button:focus-visible { outline: 2px solid #9389c7; outline-offset: 3px; }
.passport-recommendations__generate svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
.passport-recommendations__spinner { width: 13px; height: 13px; border: 1.5px solid #b8accc66; border-top-color: #807197; border-radius: 50%; animation: recommendations-spin .8s linear infinite; }
.passport-recommendations__progress { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; min-height: 102px; margin-top: 12px; padding: 16px; border: 1px solid #a99ac833; border-radius: 12px; background: #f3f0f980; text-align: center; }
.passport-recommendations__progress strong { color: #71618d; font-size: 12px; font-weight: 500; }
.passport-recommendations__progress p, .passport-recommendations__hint { margin: 8px 0 0; color: #748078; font-size: 11px; line-height: 1.8; }
.passport-recommendations__elapsed { color: #807197; font-size: 11px; font-variant-numeric: tabular-nums; }
.passport-recommendations__items { display: grid; gap: 9px; margin-top: 12px; }
.passport-recommendations__items article { padding: 14px 16px; border-radius: 12px; border: 1px solid #9d94c52b; background: linear-gradient(120deg, #f0edf780, #eef5f080); }
.passport-recommendations__items strong { color: #71668e; font-size: 12px; font-weight: 500; overflow-wrap: anywhere; }
.passport-recommendations__items p { margin: 5px 0 0; color: #697b6e; font-size: 11px; line-height: 1.9; white-space: pre-wrap; overflow-wrap: anywhere; }
.passport-recommendations__error, .passport-recommendations__success { margin: 10px 0 0; color: #ad6872; font-size: 11px; line-height: 1.8; overflow-wrap: anywhere; }
.passport-recommendations__error button { padding: 0; border: 0; background: transparent; color: #71618d; font: inherit; cursor: pointer; text-decoration: underline; }
.passport-recommendations__error button:disabled { opacity: .55; cursor: default; }
.passport-recommendations__success { color: #61806b; }
@keyframes recommendations-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .passport-recommendations__spinner { animation: none; } }
</style>
