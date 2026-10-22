<script setup>
import { computed, ref, watch } from 'vue'
import { useCatalog } from '../composables/useCatalog.js'
import { catalogYears, catalogPassportSuggestions, catalogTextSuggestions, filterCatalogFiles } from '../models/catalogFilters.js'
import RaisedActionButton from './RaisedActionButton.vue'
import CatalogFilters from './CatalogFilters.vue'
import PlatformOverview from './PlatformOverview.vue'
import RegistryResults from './RegistryResults.vue'

const props = defineProps({
  active: { type: Boolean, default: true },
  platformSnapshot: { type: Object, default: null },
  selectedPlatformCodes: { type: Array, default: () => [] },
})
const emit = defineEmits(['toggle-platform', 'select-all-platforms', 'initial-ready'])
const catalog = useCatalog(computed(() => props.active))
const dateFilter = ref({ year: null, month: null, day: null })
const passportPrefix = ref('')
const appliedPassportPrefix = ref('')
const textFilters = ref({ name: '', summary: '', applicant: '', reviewerText: '' })
const appliedTextFilters = ref({ ...textFilters.value })
const textSuggestions = computed(() => Object.fromEntries(['name', 'applicant', 'reviewerText'].map(field => [field, catalogTextSuggestions(catalog.files.value, field, textFilters.value[field])])))
const passportSuggestions = computed(() => catalogPassportSuggestions(catalog.files.value, passportPrefix.value))
const years = computed(() => catalogYears(catalog.files.value))
const filteredFiles = computed(() => filterCatalogFiles(catalog.files.value, { platformCodes: props.selectedPlatformCodes, date: dateFilter.value, passportPrefix: appliedPassportPrefix.value, text: appliedTextFilters.value }))
watch([catalog.loaded, catalog.error, catalog.loading], ([loaded, error, loading]) => {
  if (props.active && !loading && (loaded || error)) emit('initial-ready')
}, { flush: 'post' })
function resetFilters() {
  dateFilter.value = { year: null, month: null, day: null }
  passportPrefix.value = ''
  textFilters.value = { name: '', summary: '', applicant: '', reviewerText: '' }
  appliedPassportPrefix.value = ''
  appliedTextFilters.value = { ...textFilters.value }
  emit('select-all-platforms', false)
}
watch(years, available => { if (dateFilter.value.year !== null && !available.includes(dateFilter.value.year)) dateFilter.value = { year: null, month: null, day: null } })
</script>

<template>
  <section class="data-center-panel" aria-label="数据中心内容区域">
    <aside class="data-center-panel__filters" aria-label="文件筛选">
    <PlatformOverview :snapshot="platformSnapshot" :selected-platform-codes="selectedPlatformCodes" @toggle-platform="$emit('toggle-platform', $event)" @select-all-platforms="$emit('select-all-platforms', $event)">
      <template #actions><RaisedActionButton class="catalog-filters__reset" @click="resetFilters"><template #icon><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 7a6 6 0 1 1-.3 5M4 3v4h4" /></svg></template>重置</RaisedActionButton></template>
    </PlatformOverview>

    <section class="data-center-region" aria-label="筛选条件">
      <CatalogFilters :value="dateFilter" :years="years" :text-filters="textFilters" :text-suggestions="textSuggestions" @text-change="textFilters[$event.field] = $event.value" :passport-prefix="passportPrefix" :passport-suggestions="passportSuggestions" @change="dateFilter = $event" @passport-change="passportPrefix = $event" @passport-commit="appliedPassportPrefix = $event" @text-commit="appliedTextFilters[$event.field] = $event.value" />
    </section>

    </aside>
    <RegistryResults class="data-center-panel__results" :active="active" :platforms="platformSnapshot?.platforms || []" :files="filteredFiles" :loading="catalog.loading.value" :loaded="catalog.loaded.value" :error="catalog.error.value" @retry="catalog.load" @refresh="catalog.load" />
  </section>
</template>

<style scoped>

.data-center-panel { display: grid; grid-template-columns: clamp(380px, 33vw, 460px) minmax(0, 1fr); height: 100%; min-height: 560px; padding: 26px 28px 24px; }
.data-center-panel__filters { position: relative; display: flex; flex-direction: column; gap: 24px; min-width: 0; min-height: 0; padding-right: 28px; overflow: auto; scrollbar-width: thin; }
.data-center-panel__filters::after { position: absolute; top: 0; bottom: 0; right: 0; width: 1px; content: ''; pointer-events: none; background: linear-gradient(transparent, #91a59833 8%, #91a59833 92%, transparent); }
.data-center-panel__filters :deep(.platform-overview) { flex: 0 0 auto; max-height: min(40vh, 300px); }
.data-center-region { position: relative; flex: none; min-width: 0; padding-top: 22px; }
.data-center-region::before { position: absolute; top: 0; right: 0; left: 0; height: 1px; content: ''; pointer-events: none; background: linear-gradient(90deg, transparent, #91a5982e 12%, #91a5982e 88%, transparent); }
.data-center-panel > .data-center-panel__results { min-height: 0; padding: 0 0 0 28px; }
@media (max-width: 900px) {
  .data-center-panel { grid-template-columns: minmax(0, 1fr); grid-template-rows: auto minmax(280px, 1fr); height: auto; min-height: 100%; gap: 24px; }
  .data-center-panel__filters { overflow: visible; padding: 0 0 24px; }
  .data-center-panel__filters::after { top: auto; left: 0; width: auto; height: 1px; background: linear-gradient(90deg, transparent, #91a59833 8%, #91a59833 92%, transparent); }
  .data-center-panel > .data-center-panel__results { min-height: 280px; padding: 0; }
}
@media (max-width: 640px) { .data-center-panel { padding: 20px 18px; } }
</style>
