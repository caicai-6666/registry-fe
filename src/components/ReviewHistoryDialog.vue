<script setup>
import FileLevelHistoryList from './FileLevelHistoryList.vue'
import ContentState from './ContentState.vue'
import RefreshButton from './RefreshButton.vue'
import PassportValues from './PassportValues.vue'
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useReviewHistory } from '../composables/useReviewHistory.js'
import { fetchMyDeletionHistory, fetchFileLevelHistory } from '../services/reviewHistoryApi.js'
import { platformDisplayName } from '../models/platform.js'
import { formatReviewTime } from '../models/reviewHistory.js'

const props = defineProps({ open: Boolean, platforms: { type: Array, default: () => [] } })
const emit = defineEmits(['close'])
const dialogRef = ref(null)
const kind = ref('ingestion')
const sessionActive = computed(() => props.open)
const histories = {
  ingestion: useReviewHistory(computed(() => props.open && kind.value === 'ingestion'), undefined, { sessionActive }),
  changes: useReviewHistory(computed(() => props.open && kind.value === 'changes'), fetchFileLevelHistory, { sessionActive }),
  deletion: useReviewHistory(computed(() => props.open && kind.value === 'deletion'), fetchMyDeletionHistory, { sessionActive }),
}
const history = computed(() => histories[kind.value])
const selectedIds = reactive({ ingestion: '', deletion: '' })
const selectedId = computed({ get: () => selectedIds[kind.value], set: id => { selectedIds[kind.value] = id } })
const kindLabel = computed(() => ({ ingestion: '入库审核', deletion: '删除审核', changes: '变更记录' })[kind.value])
function statusLabel(status) { return kind.value === 'deletion' ? status === 'approved' ? '已批准删除' : '已拒绝删除' : status === 'approved' ? '已通过' : '已拒绝' }
const selected = computed(() => history.value.records.value.find(row => row.id === selectedId.value))
for (const [reviewKind, state] of Object.entries(histories)) {
  if (reviewKind === 'changes') continue
  watch(state.records, records => { if (!records.some(row => row.id === selectedIds[reviewKind])) selectedIds[reviewKind] = records[0]?.id || '' })
}
watch(() => props.open, open => { if (open) kind.value = 'ingestion' }, { flush: 'sync' })

function syncDialog() {
  const dialog = dialogRef.value
  if (!dialog) return
  if (props.open && !dialog.open) dialog.showModal()
  else if (!props.open && dialog.open) dialog.close()
}

function closeOnBackdrop(event) {
  if (event.target !== dialogRef.value) return
  const bounds = dialogRef.value.getBoundingClientRect()
  if (
    event.clientX < bounds.left || event.clientX > bounds.right ||
    event.clientY < bounds.top || event.clientY > bounds.bottom
  ) emit('close')
}

watch(() => props.open, syncDialog, { flush: 'post' })
onMounted(syncDialog)
onBeforeUnmount(() => dialogRef.value?.close())
</script>

<template>
  <Teleport to="body">
    <dialog ref="dialogRef" class="review-log" aria-labelledby="review-history-title" @cancel.prevent="emit('close')" @close="emit('close')" @click="closeOnBackdrop">
      <div class="review-log__shell">
        <header class="review-log__header">
          <div><span class="review-log__eyebrow">{{ kind === 'changes' ? '文件等级变更' : '我的审核记录' }}</span><h2 id="review-history-title">审核记录</h2></div>
          <div class="review-log__filters" role="group" aria-label="审核记录类型">
            <button type="button" :class="{ 'is-active': kind === 'ingestion' }" :aria-pressed="kind === 'ingestion'" @click="kind = 'ingestion'">入库审核</button>
            <button type="button" :class="{ 'is-active': kind === 'deletion' }" :aria-pressed="kind === 'deletion'" @click="kind = 'deletion'">删除审核</button>
            <button type="button" :class="{ 'is-active': kind === 'changes' }" :aria-pressed="kind === 'changes'" @click="kind = 'changes'">变更记录</button>
          </div>
          <div class="review-log__actions">
            <RefreshButton :key="kind" label="刷新审核记录" :loading="history.loading.value" :active="open" @refresh="history.load" />
            <button type="button" aria-label="关闭审核记录" @click="emit('close')"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></button>
          </div>
        </header>
        <Transition name="review-log-content" mode="out-in">
          <div :key="kind" class="review-log__pane" :aria-busy="history.loading.value">
            <p v-if="history.error.value" class="review-log__error" role="alert">{{ history.error.value }} <button type="button" @click="history.load">重试</button></p>
            <ContentState v-if="kind === 'changes'" :loading="history.loading.value" :empty="history.loaded.value && !history.error.value && !history.records.value.length" loading-label="正在加载变更记录"><FileLevelHistoryList :records="history.records.value" :platforms="platforms" /></ContentState>
            <div v-else class="review-log__body">
              <section class="review-log__list" :aria-label="`${kindLabel}记录列表`">
                <ContentState :loading="history.loading.value" :empty="history.loaded.value && !history.error.value && !history.records.value.length" loading-label="正在加载审核记录列表">
                <button v-for="record in history.records.value" :key="record.id" type="button" class="review-log__item" :class="{ 'is-selected': selectedId === record.id }" :aria-pressed="selectedId === record.id" @click="selectedId = record.id">
                  <strong>{{ record.name }}</strong><span class="review-log__item-meta">{{ platformDisplayName(platforms, record.sourcePlatform) }}</span><span class="review-log__badge" :class="`is-${record.status}`">{{ statusLabel(record.status) }}</span>
                </button></ContentState>
              </section>
              <section class="review-log__detail" aria-label="审核记录详情">
                <ContentState :loading="history.loading.value" :empty="!selected && !history.error.value" detail loading-label="正在加载审核记录详情"><Transition name="review-log-detail" mode="out-in">
                  <div v-if="selected" :key="selected.id" class="review-log__content">
                    <section class="review-log__block"><h4>文件摘要</h4><p>{{ selected.summary || '暂无摘要' }}</p></section>
                    <section class="review-log__block"><h4>申请信息</h4><dl><div><dt>来源平台</dt><dd>{{ platformDisplayName(platforms, selected.sourcePlatform) }}</dd></div><div><dt>申请人</dt><dd>{{ selected.applicant || '—' }}</dd></div><div><dt>申请时间</dt><dd>{{ formatReviewTime(selected.requestedAt) }}</dd></div></dl></section>
                    <section v-if="kind === 'deletion'" class="review-log__block"><h4>删除原因</h4><p>{{ selected.applicantNote || '申请人未填写删除原因' }}</p></section>
                    <section v-if="kind === 'deletion'" class="review-log__block"><h4>审核反馈</h4><p>{{ selected.reviewerNote === null ? '暂无审核备注' : selected.reviewerNote || '审核人未填写备注' }}</p><dl><div><dt>删除审核人</dt><dd>{{ selected.reviewer }}</dd></div><div><dt>审核时间</dt><dd>{{ formatReviewTime(selected.reviewedAt) }}</dd></div><div><dt>资源编号</dt><dd>{{ selected.resourceId || '—' }}</dd></div></dl></section>
                    <section class="review-log__block"><h4>文件等级</h4><p>{{ selected.fileLevel ?? '—' }}</p></section>
                    <section class="review-history-passport"><h4>{{ kind === 'deletion' ? '原通行证' : '通行证' }}</h4><p><PassportValues :values="selected.passport" /></p></section>
                  </div>
                </Transition></ContentState>
              </section>
            </div>
          </div>
        </Transition>
      </div>
    </dialog>
  </Teleport>
</template>

<style scoped>
.review-log { width: min(1080px, calc(100vw - 48px)); max-width: none; max-height: none; height: min(780px, calc(100dvh - 64px)); padding: 0; border: 1px solid #ffffffc9; border-radius: 24px; color: #314b3d; background: #f4f8f5; box-shadow: 0 32px 100px #142b3455; overflow: hidden; }
.review-log::backdrop { background: #10251d66; backdrop-filter: blur(8px); }
.review-log__shell { height: 100%; display: flex; flex-direction: column; min-height: 0; }
.review-log__header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 23px 28px; border-bottom: 1px solid #526c5d1a; background: linear-gradient(130deg, #fff, #eaf2ed); }
.review-log__eyebrow { color: #7a9182; font-size: 11px; letter-spacing: .12em; }
.review-log h2 { margin: 6px 0 0; font-size: 21px; font-weight: 600; }
.review-log button { cursor: pointer; font: inherit; } .review-log button:disabled { cursor: default; opacity: .5; } .review-log button:focus-visible { outline: 2px solid #608a73; outline-offset: 3px; }
.review-log__filters { display: flex; align-self: flex-end; gap: 4px; padding: 4px; border: 1px solid #668b7020; border-radius: 12px; background: #e4ece680; }
.review-log__filters button { padding: 9px 16px; border: 0; border-radius: 8px; background: transparent; color: #7a8b80; font-size: 12px; white-space: nowrap; transition: background .2s, color .2s, box-shadow .2s; }
.review-log__filters button:hover { color: #3d6350; background: #ffffff80; }
.review-log__filters button.is-active { color: #355c46; background: #fff; box-shadow: 0 2px 8px #28473114; }
.review-log__actions { display: flex; align-items: center; flex: none; gap: 12px; margin-left: auto; }
.review-log__actions button {
  display: grid;
  place-items: center;
  flex: none;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: #fff;
  color: #597563;
  line-height: 1;
  box-shadow: 0 2px 5px #253b3010, 0 5px 14px #253b3012;
  transition: box-shadow .2s, color .2s, background .2s, transform .2s;
}
.review-log__actions button:hover:not(:disabled) { color: #355442; background: #fafffc; box-shadow: 0 3px 7px #253b3014, 0 7px 18px #253b3018; }
.review-log__actions button:active:not(:disabled) { transform: scale(.94); box-shadow: 0 1px 4px #253b3014; }
.review-log__actions button:disabled { opacity: .7; }
.review-log__actions svg { display: block; width: 17px; height: 17px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; transform-origin: center; }
.review-log__pane { display: flex; flex-direction: column; flex: 1; min-height: 0; }
.review-log-content-enter-active { transition: opacity .36s cubic-bezier(.22, 1, .36, 1); }
.review-log-content-leave-active { transition: opacity .24s ease; pointer-events: none; }
.review-log-content-enter-from, .review-log-content-leave-to { opacity: 0; }
.review-log-detail-enter-active { transition: opacity .34s ease; }
.review-log-detail-leave-active { transition: opacity .2s ease; pointer-events: none; }
.review-log-detail-enter-from, .review-log-detail-leave-to { opacity: 0; }
.review-log__body { display: grid; grid-template-columns: 290px minmax(0, 1fr); flex: 1; min-height: 0; }.review-log__list { display: flex; flex-direction: column; min-height: 0; padding: 16px 12px; overflow: auto; border-right: 1px solid #668b701f; background: #eaf0ec70; }
.review-log__item { flex: none; display: grid; gap: 9px; text-align: left; width: 100%; padding: 16px; margin-bottom: 9px; border: 1px solid transparent; border-radius: 14px; background: transparent; color: inherit; transition: background .2s, border-color .2s; }
.review-log__item:hover { background: #ffffffa8; }.review-log__item.is-selected { background: #fff; border-color: #91b29c6b; box-shadow: 0 4px 14px #4c6c5910; }.review-log__item strong { font-size: 13px; font-weight: 500; overflow-wrap: anywhere; }.review-log__item-meta { font-size: 10px; color: #7d8d82; }
.review-log__badge { justify-self: start; padding: 4px 8px; background: #e8eeea; border-radius: 6px; font-size: 11px; }.review-log .is-approved { color: #3c8864; }.review-log .is-rejected { color: #c52d38; font-weight: 600; }.review-log__item-error { color: #aa6f52; font-size: 11px; }
.review-log__badge.is-rejected { background: #ffeaec; box-shadow: inset 0 0 0 1px #e3485433; }
.review-log__detail { display: flex; flex-direction: column; min-height: 0; min-width: 0; overflow: auto; padding: 26px 28px; background: #ffffff91; }.review-log__content { display: grid; gap: 22px; }.review-log h3 { font-size: 19px; font-weight: 500; margin: 0 0 8px; overflow-wrap: anywhere; }.review-log__error button { flex: none; padding: 7px 11px; border-radius: 8px; border: 1px solid #668b702c; background: #fff; color: #4f765e; font-size: 12px; }
.review-log__stages .review-log__stage--rejected { background: #fff0f1; box-shadow: inset 0 0 0 1px #e3485433; }
.review-log h4 { margin: 0; font-size: 12px; font-weight: 600; }.review-log h4 small { margin-left: 8px; font-size: 11px; color: #899b8f; font-weight: 400; }.review-log__block > p { white-space: pre-wrap; overflow-wrap: anywhere; font-size: 13px; line-height: 1.8; margin: 10px 0 0; }
.review-log dl { margin: 12px 0 0; display: grid; gap: 10px; font-size: 11px; }.review-log dl > div { display: flex; gap: 16px; }.review-log dt { flex: 0 0 84px; color: #89968d; }.review-log dd { margin: 0; overflow-wrap: anywhere; }
.review-log__error { margin: 12px 20px; color: #a55c4e; font-size: 12px; line-height: 1.8; }.review-log__notice { margin: 10px 24px 0; color: #7b8e81; font-size: 11px; }
@media (max-width: 700px) { .review-log { width: calc(100vw - 20px); height: calc(100dvh - 24px); border-radius: 16px; }.review-log__header { padding: 18px; flex-wrap: wrap; }.review-log__filters { order: 3; width: 100%; }.review-log__filters button { flex: 1; }.review-log__body { grid-template-columns: 1fr; grid-template-rows: 180px minmax(0, 1fr); }.review-log__list { border-right: 0; border-bottom: 1px solid #668b701f; }.review-log__detail { padding: 20px 16px; } }

.review-history-passport { padding: 16px 18px; border: 1px solid #91aa9733; border-radius: 12px; background: #eef5ef; }
.review-history-passport p { margin: 10px 0 0; color: #435d50; font-size: 13px; line-height: 1.8; overflow-wrap: anywhere; }
@media (prefers-reduced-motion: reduce) { .review-log-content-enter-active, .review-log-content-leave-active, .review-log-detail-enter-active, .review-log-detail-leave-active, .review-log__item, .review-log__filters button, .review-log__actions button { transition: none; } }
</style>
