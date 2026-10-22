<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { platformDisplayName } from '../models/platform.js'
import DecisionConfirmButton from './DecisionConfirmButton.vue'
const props = defineProps({ file: { type: Object, required: true }, platforms: { type: Array, default: () => [] }, modelValue: { type: String, default: '' }, active: Boolean, update: { type: Object, default: null }, refreshing: Boolean })
const emit = defineEmits(['update:modelValue', 'submit'])
const level = computed({ get: () => props.modelValue, set: value => emit('update:modelValue', String(value)) })
const valid = computed(() => /^\d+$/.test(level.value) && Number(level.value) <= 100)
const changed = computed(() => valid.value && String(Number(level.value)) !== props.file.fileLevel)
const confirming = ref(false)
const locked = computed(() => !!props.update?.body)
const pending = computed(() => !!props.update?.pending)
let timer
function resetConfirmation() { clearTimeout(timer); confirming.value = false }
function requestUpdate() {
  if (pending.value || props.refreshing || (!changed.value && !props.update?.body)) return
  if (!confirming.value) { confirming.value = true; timer = setTimeout(resetConfirmation, 3000); return }
  resetConfirmation()
  emit('submit')
}
watch([level, () => props.active], () => { resetConfirmation() })
onBeforeUnmount(resetConfirmation)
</script>
<template>
  <article class="level-row">
    <div class="level-row__info"><h3>{{ file.name }}</h3><p>{{ platformDisplayName(platforms, file.sourcePlatform) }}<span>·</span>{{ file.ingestionLabel }}</p></div>
    <div class="level-row__editor">
      <div class="level-row__controls"><input :value="Math.min(100, Math.max(0, Number(level) || 0))" @input="level = $event.target.value" :disabled="locked" type="range" min="0" max="100" step="1" :aria-label="`${file.name}等级滑块`" :style="{ '--progress': `${Math.min(100, Math.max(0, Number(level) || 0))}%` }" /><input v-model="level" :disabled="locked" type="number" min="0" max="100" step="1" placeholder="—" :aria-label="`${file.name}文件等级`" :aria-invalid="!valid" /><DecisionConfirmButton :label="update?.body && !pending ? '重试原更新' : '更新'" confirm-label="确认更新" loading-label="更新中" loading-aria-label="正在更新文件等级" :loading="pending" :confirming="confirming" :disabled="refreshing || (!changed && !update?.body)" @activate="requestUpdate" /></div>
      <p v-if="level !== '' && !valid" class="level-row__feedback" role="alert">请输入 0–100 的整数等级</p><p v-else-if="update?.error" class="level-row__feedback" role="alert">{{ update.error }}</p><p v-else-if="update?.notice" class="level-row__feedback is-success" role="status">{{ update.notice }}</p>
    </div>
  </article>
</template>
<style scoped>
.level-row { display: flex; align-items: center; flex-wrap: wrap; gap: 18px 24px; padding: 24px 0; border-bottom: 1px solid #87998c20; }
.level-row__info { flex: 1 1 180px; min-width: 0; }
.level-row h3 { margin: 0 0 9px; color: #435749; font-size: 14px; font-weight: 550; overflow-wrap: anywhere; }
.level-row__info p { display: flex; flex-wrap: wrap; gap: 7px; margin: 0; color: #96a099; font-size: 11px; line-height: 1.6; }
.level-row__editor { flex: 1 1 270px; max-width: 350px; min-width: 0; }
.level-row__controls { display: flex; align-items: center; gap: 12px; }
.level-row input[type=range] { appearance: none; height: 5px; flex: 1; min-width: 40px; margin: 10px 0; border-radius: 8px; background: linear-gradient(to right, #b9a273 var(--progress), #e8e8df var(--progress)); cursor: pointer; }
.level-row input[type=range]::-webkit-slider-thumb { appearance: none; width: 16px; height: 16px; border: 3px solid white; border-radius: 50%; background: #ad9669; box-shadow: 0 2px 6px #8e784d30; }
.level-row input[type=range]::-moz-range-thumb { width: 10px; height: 10px; border: 3px solid white; border-radius: 50%; background: #ad9669; }
.level-row input[type=number] { width: 62px; min-width: 0; height: 32px; padding: 0 6px; border: 1px solid #dce3dc; border-radius: 8px; background: #ffffffb3; color: #596c5e; font: inherit; font-size: 12px; text-align: center; }
.level-row__controls button { width: 84px; flex: none; height: 33px; border: 1px solid #dce4dc; border-radius: 8px; background: #edf2ed; color: #647c6b; font: inherit; font-size: 12px; cursor: pointer; }
.level-row__controls button:disabled { opacity: .5; cursor: default; }
.level-row input:disabled { opacity: .6; cursor: default; }
.level-row__feedback.is-success { color: #72917a; }
.level-row input:focus-visible { outline: 2px solid #baa77e; outline-offset: 3px; }
.level-row__feedback { margin: 9px 0 0; color: #b08860; font-size: 11px; line-height: 1.6; }
@media(max-width: 760px) { .level-row__editor { max-width: none; } }
</style>
