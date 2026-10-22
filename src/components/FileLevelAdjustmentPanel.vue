<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useFileLevelAdjustments } from '../composables/useFileLevelAdjustments.js'
import { useCatalog } from '../composables/useCatalog.js'
import { catalogYears, catalogPassportSuggestions, catalogTextSuggestions, filterCatalogFiles } from '../models/catalogFilters.js'
import CatalogFilters from './CatalogFilters.vue'
import PersonnelFilterSelect from './PersonnelFilterSelect.vue'
import RaisedActionButton from './RaisedActionButton.vue'
import RefreshButton from './RefreshButton.vue'
import FileLevelAdjustmentRow from './FileLevelAdjustmentRow.vue'
import ContentState from './ContentState.vue'
const props = defineProps({ active: Boolean, platforms: { type: Array, default: () => [] } })
const catalog = useCatalog(computed(() => props.active))
const date = ref({ year: null, month: null, day: null }), platform = ref(''), passport = ref(''), appliedPassport = ref('')
const text = ref({ name: '', summary: '', applicant: '', reviewerText: '' }), appliedText = ref({ ...text.value })
const drafts = reactive({})
const { updates, submit } = useFileLevelAdjustments(result => {
  drafts[result.resourceId] = result.fileLevel
  catalog.applyFileLevel(result.resourceId, result.fileLevel)
})
const updating = computed(() => Object.values(updates).some(update => update.pending))
const platformOptions = computed(() => [{ value: '', label: '全部平台' }, ...props.platforms.map(item => ({ value: item.code, label: item.name }))])
const years = computed(() => catalogYears(catalog.files.value))
const suggestions = computed(() => Object.fromEntries(['name', 'applicant', 'reviewerText'].map(field => [field, catalogTextSuggestions(catalog.files.value, field, text.value[field])])))
const passportSuggestions = computed(() => catalogPassportSuggestions(catalog.files.value, passport.value))
const files = computed(() => filterCatalogFiles(catalog.files.value, { platformCodes: platform.value ? [platform.value] : [], date: date.value, passportPrefix: appliedPassport.value, text: appliedText.value }).slice().sort((a, b) => Date.parse(b.ingestedAt) - Date.parse(a.ingestedAt)))
watch(catalog.files, (rows, previous) => {
  const oldLevels = new Map(previous.map(row => [row.id, row.fileLevel ?? '']))
  const ids = new Set(rows.map(row => row.id))
  Object.keys(drafts).forEach(id => { if (!ids.has(id)) delete drafts[id] })
  rows.forEach(row => { if (!(row.id in drafts) || drafts[row.id] === oldLevels.get(row.id)) drafts[row.id] = row.fileLevel ?? '' })
})
function setDraft(id, value) {
  if (updates[id]?.body) return
  drafts[id] = value
  delete updates[id]
}
function reset() {
  date.value = { year: null, month: null, day: null }; platform.value = ''; passport.value = ''; appliedPassport.value = ''
  text.value = { name: '', summary: '', applicant: '', reviewerText: '' }; appliedText.value = { ...text.value }
}
</script>
<template>
  <div class="level-adjustment" aria-label="文件等级调整">
    <section class="level-adjustment__filters" aria-label="文件筛选">
      <header><h2>文件筛选</h2><RaisedActionButton @click="reset">重置</RaisedActionButton></header>
      <div class="level-adjustment__filter-body">
        <PersonnelFilterSelect id="file-level-platform" v-model="platform" class="level-adjustment__platform" label="来源平台" :options="platformOptions" :active="active" />
        <CatalogFilters id-prefix="file-level" :value="date" :years="years" :text-filters="text" :text-suggestions="suggestions" :passport-prefix="passport" :passport-suggestions="passportSuggestions" @change="date = $event" @text-change="text[$event.field] = $event.value" @text-commit="appliedText[$event.field] = $event.value" @passport-change="passport = $event" @passport-commit="appliedPassport = $event" />
      </div>
    </section>
    <section class="level-adjustment__results" aria-label="文件等级筛选结果" :aria-busy="catalog.loading.value">
      <header><h2>筛选结果<span>{{ files.length }}</span></h2><RefreshButton label="刷新文件列表" :active="active" :loading="catalog.loading.value" :disabled="updating" @refresh="catalog.load" /></header>
      <p v-if="catalog.error.value" class="level-adjustment__error" role="alert">{{ catalog.error.value }}<button type="button" :disabled="updating" @click="catalog.load">重试</button></p>
      <ContentState :loading="catalog.loading.value" :empty="catalog.loaded.value && !catalog.error.value && !files.length" loading-label="正在加载文件列表"><div class="level-adjustment__scroll">
        <TransitionGroup name="level-result" tag="div"><FileLevelAdjustmentRow v-for="file in files" :key="file.id" :model-value="drafts[file.id]" @update:model-value="setDraft(file.id, $event)" :file="file" :platforms="platforms" :active="active" :update="updates[file.id]" :refreshing="catalog.loading.value" @submit="submit(file.id, drafts[file.id])" /></TransitionGroup>
      </div></ContentState>
    </section>
  </div>
</template>
<style scoped>
.level-adjustment { grid-column: 2 / 4; display: grid; grid-template-columns: subgrid; gap: inherit; min-width: 0; min-height: 0; }
.level-adjustment__filters, .level-adjustment__results { display: flex; flex-direction: column; min-width: 0; min-height: 0; overflow: hidden; border: 1px solid #ffffffeb; border-radius: 27px; background: #fafcfcdb; box-shadow: inset 0 1px #fff, 0 18px 40px #34424e0d; animation: level-panel-in .32s ease both; }
.level-adjustment header { display: flex; justify-content: space-between; align-items: center; gap: 12px; min-height: 88px; padding: 20px 22px; border-bottom: 1px solid #668b7017; }
.level-adjustment h2 { margin: 0; color: #354f40; font-size: 15px; font-weight: 600; }
.level-adjustment h2 span { margin-left: 10px; color: #a3aca5; font-size: 12px; font-weight: 400; font-variant-numeric: tabular-nums; }
.level-adjustment header > button:not(.refresh-button) { font-size: 12px; }
.level-adjustment__filter-body { padding: 24px 20px; overflow: auto; scrollbar-width: thin; }
.level-adjustment__platform { margin-bottom: 28px; }
.level-adjustment__platform :deep(.personnel-select__panel) { max-height: 230px; }
.level-adjustment__filters :deep(.catalog-filters__time) { flex-direction: column; align-items: stretch; gap: 10px; }
.level-adjustment__filters :deep(.catalog-filters__label) { flex-basis: auto; }
.level-adjustment__scroll { flex: 1; min-height: 0; position: relative; padding: 0 24px; overflow: auto; scrollbar-width: thin; }
.level-adjustment__error { color: #af8065; padding: 0 22px; font-size: 12px; }
.level-adjustment__error button { border: 0; background: transparent; color: inherit; cursor: pointer; }
.level-result-enter-active, .level-result-leave-active, .level-result-move { transition: opacity .25s, transform .32s; }
.level-result-enter-from { opacity: 0; transform: translateX(18px); }.level-result-leave-to { opacity: 0; transform: translateX(-18px); }.level-result-leave-active { position: absolute; pointer-events: none; }
@keyframes level-panel-in { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: none; } }
@media(max-width: 760px) { .level-adjustment { grid-column: 1; grid-template-columns: minmax(0,1fr); gap: 14px; } .level-adjustment__filter-body { max-height: 430px; } .level-adjustment__results { min-height: 360px; } .level-adjustment__scroll { max-height: 600px; } }
@media(prefers-reduced-motion: reduce) { .level-adjustment__filters, .level-adjustment__results { animation: none; } .level-result-enter-active, .level-result-leave-active, .level-result-move { transition: none; } }
</style>
