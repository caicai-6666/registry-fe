<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { platformDisplayName } from '../models/platform.js'
import { formatReviewTime } from '../models/reviewHistory.js'
import DecisionConfirmButton from './DecisionConfirmButton.vue'
import PassportValues from './PassportValues.vue'
import PassportSelector from './PassportSelector.vue'
const props = defineProps({ kind: { type: String, default: 'ingestion' }, application: { type: Object, required: true }, platforms: { type: Array, default: () => [] }, passportOptions: { type: Array, default: () => [] }, passportError: { type: String, default: '' }, decision: { type: Object, default: null }, busy: Boolean, active: { type: Boolean, default: true } })
const emit = defineEmits(['preview', 'decide', 'retry', 'reload-passports'])
const drafts = reactive({}), passportDrafts = reactive({})
const selectedPassports = computed({ get: () => props.decision?.body?.passport || passportDrafts[props.application.id] || [], set: values => { passportDrafts[props.application.id] = values } })
const note = computed({ get: () => props.decision?.body?.note ?? drafts[props.application.id] ?? '', set: value => { drafts[props.application.id] = value } })
const locked = computed(() => props.busy || Boolean(props.decision?.body))
const canDecide = computed(() => !locked.value && !!note.value.trim() && Array.from(note.value).length <= 10000)
const confirming = ref(null)
const submittedAction = ref(null)
const loadingAction = computed(() => props.decision?.pending ? props.decision.body.approved : props.busy ? submittedAction.value : null)
watch(() => props.decision?.pending, pending => { if (pending) submittedAction.value = props.decision.body.approved }, { flush: 'sync' })
watch(() => props.application.id, () => { submittedAction.value = null }, { flush: 'sync' })
let confirmationTimer
watch(confirming, value => {
  clearTimeout(confirmationTimer)
  if (value !== null) confirmationTimer = setTimeout(() => { confirming.value = null }, 3000)
}, { flush: 'sync' })
onBeforeUnmount(() => clearTimeout(confirmationTimer))
const actions = [{ approved: false, label: '拒绝' }, { approved: true, label: '通过' }]
watch([() => props.application.id, note, selectedPassports, locked, () => props.active], () => { confirming.value = null }, { flush: 'sync' })
function decide(approved) {
  if (!canDecide.value) return
  if (confirming.value !== approved) { confirming.value = approved; return }
  submittedAction.value = approved
  confirming.value = null
  emit('decide', { approved, note: note.value, ...(props.kind === 'ingestion' ? { passport: selectedPassports.value } : {}) })
}
</script>
<template>
  <div class="ingestion-detail">
    <div class="ingestion-detail__body">
      <section class="ingestion-detail__section"><div class="ingestion-detail__summary-heading"><h4>文件摘要</h4><button type="button" class="ingestion-detail__preview-file" @click="$emit('preview')"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Zm0 0v6h6M8 14h8M8 17h5" /></svg>文件预览</button></div><p>{{ application.summary || '暂无摘要' }}</p></section>
      <section class="ingestion-detail__section"><h4>申请信息</h4><dl><div><dt>来源平台</dt><dd>{{ platformDisplayName(platforms, application.sourcePlatform) }}</dd></div><div v-if="kind === 'deletion'"><dt>资源编号</dt><dd>{{ application.resourceId }}</dd></div><div><dt>申请人</dt><dd>{{ application.applicant || '—' }}</dd></div><div><dt>申请时间</dt><dd>{{ formatReviewTime(application.requestedAt) }}</dd></div></dl></section>
      <section class="ingestion-detail__section"><h4>{{ kind === 'deletion' ? '删除原因' : '申请人备注' }}</h4><p>{{ application.applicantNote || '申请人未填写备注' }}</p></section>
      <section v-if="kind === 'deletion'" class="ingestion-detail__section"><h4>原通行证</h4><p><PassportValues :values="application.passport" /></p></section><section v-else class="ingestion-detail__section"><h4>通行证建议</h4><div v-if="application.passportRecommendations?.length" class="ingestion-detail__recommendations"><article v-for="item in application.passportRecommendations" :key="item.passport"><strong>{{ item.passport }}</strong><p>{{ item.reason }}</p></article></div><p v-else class="ingestion-detail__muted">{{ application.passportRecommendations === null ? '暂无推荐信息' : '暂无推荐通行证' }}</p></section>
    </div>
    <form class="ingestion-detail__review" @submit.prevent @keydown.esc="confirming = null">
      <fieldset v-if="kind === 'ingestion'" class="ingestion-detail__passport-field" :disabled="locked"><PassportSelector v-model="selectedPassports" :options="passportOptions" /></fieldset><p v-if="kind === 'ingestion' && passportError" class="ingestion-detail__error" role="alert">现存通行证加载失败：{{ passportError }} <button type="button" :disabled="busy" @click="$emit('reload-passports')">重新加载</button></p>
      <p v-if="kind === 'deletion' && passportError" class="ingestion-detail__error" role="alert">文件信息加载失败：{{ passportError }} <button type="button" :disabled="busy" @click="$emit('reload-passports')">重新加载</button></p><div class="ingestion-detail__note-heading"><label :for="`review-note-${application.id}`">审核员备注 <span aria-hidden="true">*</span></label><span :id="`review-note-hint-${application.id}`" class="ingestion-detail__note-hint">通过与拒绝均需填写备注</span><small>{{ Array.from(note).length }} / 10000</small></div>
      <textarea :id="`review-note-${application.id}`" v-model="note" :disabled="locked" :aria-describedby="`review-note-hint-${application.id}`" aria-required="true" required maxlength="10000" rows="3" placeholder="请填写审核意见，通过与拒绝均需填写…"></textarea>
      <p v-if="decision?.error" class="ingestion-detail__error" role="alert">{{ decision.error }}</p>
      <p v-if="decision?.body && !decision.pending" class="ingestion-detail__feedback">提交结果尚未确认，已保留原审核决定、备注{{ kind === 'ingestion' ? '及通行证' : '' }}，请按原请求重试。</p>
      <div class="ingestion-detail__actions"><button v-if="decision?.body && !decision.pending" type="button" class="ingestion-detail__approve" :disabled="busy" @click="$emit('retry')">重试原审核决定</button><DecisionConfirmButton v-for="action in actions" :key="String(action.approved)" :label="action.label" :confirming="confirming === action.approved" :loading="loadingAction === action.approved" :disabled="!canDecide" :class="action.approved ? 'ingestion-detail__approve' : 'ingestion-detail__reject'" @activate="decide(action.approved)" /></div>
    </form>
  </div>
</template>
<style scoped>
.ingestion-detail { display: flex; flex: 1; flex-direction: column; min-height: 0; }
.ingestion-detail__body { flex: 1; min-height: 0; overflow: auto; padding: 24px 28px; }
.ingestion-detail__section + .ingestion-detail__section { margin-top: 24px; }
.ingestion-detail h4 { margin: 0; color: #536659; font-size: 12px; font-weight: 600; }
.ingestion-detail__section > p, .ingestion-detail__recommendations p { margin: 10px 0 0; color: #697b6e; font-size: 12px; line-height: 1.9; white-space: pre-wrap; overflow-wrap: anywhere; }
.ingestion-detail__summary-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.ingestion-detail__preview-file { display: inline-flex; align-items: center; gap: 6px; flex: none; padding: 6px 10px; border: 1px solid #a99ac833; border-radius: 8px; background: #f1eef780; color: #807197; font: inherit; font-size: 11px; cursor: pointer; transition: background .2s; }
.ingestion-detail__preview-file:hover { background: #eae4f4; }
.ingestion-detail__preview-file:focus-visible { outline: 2px solid #9389c7; outline-offset: 2px; }
.ingestion-detail__preview-file svg { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linejoin: round; stroke-linecap: round; }
.ingestion-detail dl { display: grid; gap: 12px; margin: 14px 0 0; font-size: 12px; }
.ingestion-detail dl > div { display: flex; gap: 18px; }
.ingestion-detail dt { flex: 0 0 60px; color: #96a298; }
.ingestion-detail dd { margin: 0; color: #586d5e; overflow-wrap: anywhere; }
.ingestion-detail__recommendations { display: grid; gap: 9px; margin-top: 12px; }
.ingestion-detail__recommendations article { padding: 14px 16px; border-radius: 12px; border: 1px solid #9d94c52b; background: linear-gradient(120deg, #f0edf780, #eef5f080); }
.ingestion-detail__recommendations strong { color: #71668e; font-size: 12px; font-weight: 500; overflow-wrap: anywhere; }
.ingestion-detail__recommendations p { margin-top: 5px; font-size: 11px; }
.ingestion-detail__review { flex: none; padding: 20px 28px 22px; border-top: 1px solid #668b701a; background: #f7faf8e6; }
.ingestion-detail__passport-field { min-width: 0; margin: 0; padding: 0; border: 0; }
.ingestion-detail__passport-field:disabled { opacity: .65; }
.ingestion-detail__error button { border: 0; background: transparent; color: #807197; font: inherit; cursor: pointer; }
.ingestion-detail__note-heading { display: flex; flex-wrap: wrap; align-items: baseline; gap: 5px 12px; margin-bottom: 10px; }
.ingestion-detail__note-heading label { color: #536659; font-size: 12px; font-weight: 600; }
.ingestion-detail__note-heading label > span { color: #b5747c; }
.ingestion-detail__note-hint { color: #9aa69d; font-size: 10px; line-height: 1.6; }
.ingestion-detail__note-heading small { margin-left: auto; color: #9ca59f; font-size: 10px; font-variant-numeric: tabular-nums; }
.ingestion-detail textarea { display: block; width: 100%; min-height: 82px; max-height: 150px; padding: 12px 14px; resize: vertical; border: 1px solid #a1b2a53b; border-radius: 12px; background: #fff; color: #455e4d; font: inherit; font-size: 12px; line-height: 1.8; }
.ingestion-detail textarea::placeholder { color: #a1aca4; }
.ingestion-detail textarea:focus { outline: 2px solid #9d94c533; outline-offset: 2px; border-color: #a69bcd; }
.ingestion-detail__actions { display: flex; justify-content: flex-end; align-items: center; gap: 10px; margin-top: 14px; }
.ingestion-detail__actions button { flex: none; padding: 9px 24px; border-radius: 10px; font: inherit; font-size: 12px; cursor: pointer; transition: background .2s, box-shadow .2s, opacity .2s; }
.ingestion-detail__reject { border: 1px solid #d2b7ba66; background: #fff; color: #ae6b73; }
.ingestion-detail__approve { border: 1px solid #729d8255; background: #78a088; color: #fff; box-shadow: 0 4px 10px #557f641c; }
.ingestion-detail__actions button:disabled { opacity: .45; cursor: default; box-shadow: none; }
.ingestion-detail__actions button:focus-visible { outline: 2px solid #9389c7; outline-offset: 2px; }
.ingestion-detail__approve:hover:not(:disabled) { background: #638e74; }
.ingestion-detail__reject:hover:not(:disabled) { background: #fbf1f2; }
.ingestion-detail__feedback, .ingestion-detail__error { margin: 10px 0 0; font-size: 11px; line-height: 1.8; color: #78816f; }
.ingestion-detail__error { color: #ad6872; }
@media (max-width: 760px) { .ingestion-detail__body { overflow: visible; padding: 20px 18px; } .ingestion-detail__review { padding: 18px; } .ingestion-detail__actions { flex-wrap: wrap; } .ingestion-detail__note-hint { order: 3; flex-basis: 100%; } .ingestion-detail__actions button { flex: 1; } }
@media (prefers-reduced-motion: reduce) { .ingestion-detail__actions button { transition: none; } }
</style>
