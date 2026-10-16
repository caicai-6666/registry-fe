<script setup>
import { computed, inject, reactive, ref, shallowRef, watch } from 'vue'
import sleepIcon from '../assets/sleep.webp'
import { REGISTRY_API_BASE_PATH } from '../services/registryApi.js'
import { PLATFORM_DIRECTORY_KEY } from '../services/platformDirectory.js'
import { useReviewApplications } from '../composables/useReviewApplications.js'
import ReviewApplicationList from '../components/ReviewApplicationList.vue'
import ReviewApplicationDetail from '../components/ReviewApplicationDetail.vue'
import RegistryFilePreview from '../components/RegistryFilePreview.vue'
import RefreshButton from '../components/RefreshButton.vue'
import ReviewTypeNavigation from '../components/ReviewTypeNavigation.vue'
const emit = defineEmits(['initial-ready'])
const props = defineProps({ active: Boolean })
const previewFile = ref(null)
function previewApplication(application) {
  previewFile.value = { id: `${reviewKind.value}-${application.id}`, name: application.name, summary: application.summary, ...(reviewKind.value === 'deletion' ? { passport: application.passport } : {}), url: `${REGISTRY_API_BASE_PATH}/resource/${reviewKind.value === 'deletion' ? `file/${application.resourceId}` : `ingestion/${application.id}`}` }
}
watch(() => props.active, active => { if (!active) previewFile.value = null })
const reviewKind = ref('ingestion')
const platformSnapshot = inject(PLATFORM_DIRECTORY_KEY)
const ingestionActive = computed(() => props.active && reviewKind.value === 'ingestion')
const reviewActive = computed(() => props.active)
const reviews = {
  ingestion: useReviewApplications(ingestionActive, 'ingestion'),
  deletion: useReviewApplications(computed(() => props.active && reviewKind.value === 'deletion'), 'deletion'),
}
const state = computed(() => reviews[reviewKind.value])
const applications = computed(() => state.value.applications.value)
const options = computed(() => state.value.options.value)
const loading = computed(() => state.value.loading.value)
const loaded = computed(() => state.value.loaded.value)
const error = computed(() => state.value.error.value)
watch([loaded, error, loading], ([loaded, error, loading]) => {
  if (props.active && !loading && (loaded || error)) emit('initial-ready')
}, { flush: 'post' })
const passportError = computed(() => state.value.passportError.value)
const decisions = computed(() => state.value.decisions)
function load() { return state.value.load() }
function submit(id, input) { return state.value.submit(id, input) }
const selectedIds = reactive({ ingestion: '', deletion: '' })
const selectedId = computed({ get: () => selectedIds[reviewKind.value], set: id => { selectedIds[reviewKind.value] = id } })
watch(applications, rows => { if (!rows.some(row => row.id === selectedId.value)) selectedId.value = rows[0]?.id || '' })
const selectedApplication = computed(() => applications.value.find(application => application.id === selectedId.value))
const displayedApplication = shallowRef(null)
const detailVisible = ref(true)
watch(selectedApplication, application => {
  if (Boolean(displayedApplication.value) !== Boolean(application) || displayedApplication.value && !applications.value.some(row => row.id === displayedApplication.value.id)) detailVisible.value = false
  else if (detailVisible.value) displayedApplication.value = application || null
})
function finishDetailLeave() {
  displayedApplication.value = selectedApplication.value || null
  detailVisible.value = true
}
watch(reviewActive, active => { if (!active) finishDetailLeave() })
watch(reviewKind, finishDetailLeave, { flush: 'sync' })
const submitting = computed(() => Object.values(reviews).some(review => Object.values(review.decisions).some(item => item.pending)))
const reviewLabel = computed(() => reviewKind.value === 'ingestion' ? '文件入库审核' : '文件删除审核')
</script>

<template>
  <section class="review-square" aria-label="审核广场">
    <ReviewTypeNavigation v-model="reviewKind" :active="active" />
    <section class="review-square__list" :aria-label="`${reviewLabel}申请列表`">
      <header class="review-square__header"><h2>申请列表</h2><RefreshButton class="review-square__refresh" :label="reviewKind === 'ingestion' ? '刷新入库申请' : '刷新删除申请'" :loading="loading" :disabled="submitting || !detailVisible" :active="active" @refresh="load" /></header>
      <Transition name="review-square-content" mode="out-in" @before-leave="element => { element.inert = true }">
        <div :key="reviewKind" class="review-square__list-body"><p v-if="error" class="review-square__status" role="alert">{{ error }}<button type="button" :disabled="loading || submitting" @click="load">重试</button></p><p v-else-if="loading && !loaded" class="review-square__status" role="status">正在加载申请…</p><ReviewApplicationList :empty="loaded && !error && !applications.length" :applications="applications" :selected-id="selectedId" :platforms="platformSnapshot.platforms" :disabled="submitting || !detailVisible" @select="selectedId = $event" /></div>
      </Transition>
    </section>
    <section class="review-square__detail" :aria-label="`${reviewLabel}申请详情`">
      <header class="review-square__header"><h2>申请详情</h2></header>
      <Transition name="review-square-content" mode="out-in" @after-enter="finishDetailLeave" @before-leave="element => { element.inert = true }">
        <div :key="reviewKind" class="review-square__detail-body"><Transition name="review-square-detail" @before-leave="element => { element.inert = true }" @before-enter="element => { element.inert = false }" @leave-cancelled="element => { element.inert = false }" @after-leave="finishDetailLeave"><div v-show="detailVisible" class="review-square__detail-content"><ReviewApplicationDetail v-if="displayedApplication" :kind="reviewKind" :application="displayedApplication" :platforms="platformSnapshot.platforms" :active="active" :passport-options="options" :passport-error="passportError" :decision="decisions[displayedApplication.id]" :busy="submitting || !detailVisible" @reload-passports="load" @decide="submit(selectedId, $event)" @retry="submit(selectedId)" @preview="previewApplication(displayedApplication)" /><div v-else class="review-square__placeholder">
          <img :src="sleepIcon" alt="暂无申请详情" />
        </div></div></Transition></div>
      </Transition>
    </section>
  </section>
  <RegistryFilePreview :file="previewFile" @close="previewFile = null" />
</template>

<style scoped>
.review-square { display: grid; grid-template-columns: clamp(224px, 18vw, 254px) clamp(250px, 23vw, 320px) minmax(0, 1fr); gap: 18px; height: 100%; min-height: 560px; padding: 24px; }
.review-square__list, .review-square__detail { position: relative; display: flex; flex-direction: column; min-width: 0; min-height: 0; overflow: hidden; border: 1px solid #ffffffeb; border-radius: 27px; background: #fafcfcdb; box-shadow: inset 0 1px #ffffffdb, 0 18px 40px #34424e0d; }
.review-square__detail { background: radial-gradient(circle at 90% 8%, #7468d50a, transparent 30%), radial-gradient(circle at 7% 92%, #3da2870a, transparent 28%), #fafcfcd9; }
.review-square__header { position: relative; display: flex; flex-direction: column; justify-content: center; gap: 7px; min-height: 88px; flex: none; padding: 20px 22px; border-bottom: 1px solid #668b7017; }
.review-square__header h2 { margin: 0; color: #354f40; font-size: 15px; font-weight: 600; }
.review-square__header > span { color: #89968e; font-size: 11px; }
.review-square__detail-content { display: flex; flex: 1; flex-direction: column; min-height: 0; }
.review-square__detail-body { display: flex; flex: 1; min-height: 0; flex-direction: column; }
.review-square__refresh { position: absolute; right: 22px; }
.review-square__status { padding: 12px 20px; color: #89988e; font-size: 12px; line-height: 1.8; overflow-wrap: anywhere; }
.review-square__status button { margin-left: 8px; border: 0; background: transparent; color: #807197; cursor: pointer; }
.review-square__list-body { flex: 1; min-height: 0; overflow: auto; }
.review-square__placeholder { display: flex; flex: 1; flex-direction: column; justify-content: center; align-items: center; gap: 16px; min-height: 200px; padding: 24px; color: #a7b5aa; }
.review-square__placeholder img { display: block; width: 128px; max-width: 45%; height: auto; object-fit: contain; }
.review-square-content-enter-active, .review-square-content-leave-active { transition: opacity 320ms ease, transform 420ms cubic-bezier(.16, 1, .3, 1); }
.review-square-content-enter-from { opacity: 0; transform: translate3d(16px, 0, 0); }
.review-square-content-leave-to { opacity: 0; transform: translate3d(-10px, 0, 0); }
.review-square-detail-enter-active { transition: opacity .34s ease; }
.review-square-detail-leave-active { transition: opacity .26s ease; pointer-events: none; }
.review-square-detail-enter-from, .review-square-detail-leave-to { opacity: 0; }
@media (max-width: 1100px) and (min-width: 761px) { .review-square { grid-template-columns: 224px 240px minmax(0, 1fr); gap: 12px; padding: 18px; } }
@media (max-width: 760px) { .review-square { grid-template-columns: minmax(0, 1fr); grid-template-rows: auto 200px minmax(300px, 1fr); height: auto; min-height: 100%; gap: 14px; padding: 16px; } .review-square__list, .review-square__detail { border-radius: 20px; } .review-square__header { min-height: 68px; padding: 16px 18px; } }
@media (prefers-reduced-motion: reduce) { .review-square-content-enter-active, .review-square-content-leave-active, .review-square-detail-enter-active, .review-square-detail-leave-active { transition: none; } }
</style>
