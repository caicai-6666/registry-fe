<script setup>
import CatalogTextFilter from './CatalogTextFilter.vue'
import CatalogDateFilter from './CatalogDateFilter.vue'
defineProps({ idPrefix: { type: String, default: 'catalog' }, value: { type: Object, required: true }, years: { type: Array, required: true }, passportPrefix: { type: String, default: '' }, passportSuggestions: { type: Array, default: () => [] }, textFilters: { type: Object, required: true }, textSuggestions: { type: Object, required: true } })
defineEmits(['change', 'passport-change', 'passport-commit', 'text-change', 'text-commit'])
const fileFields = [
  { key: 'name', label: '文件名' },
  { key: 'summary', label: '文件摘要' },
]
const peopleFields = [
  { key: 'applicant', label: '申请人' },
  { key: 'reviewerText', label: '审核人' },
]
</script>
<template>
  <div class="catalog-filters">
    <div class="catalog-filters__time"><span class="catalog-filters__label">入库时间</span><CatalogDateFilter :value="value" :years="years" @change="$emit('change', $event)" /></div>
    <div class="catalog-filters__section">
      <CatalogTextFilter v-for="field in fileFields" :key="field.key" :id="`${idPrefix}-filter-${field.key}`" :label="field.label" :value="textFilters[field.key]" :placeholder="field.key === 'name' ? '搜索文件名称' : '搜索摘要内容'" :suggestions="textSuggestions[field.key] || []" @change="$emit('text-change', { field: field.key, value: $event })" @commit="$emit('text-commit', { field: field.key, value: $event })" />
    </div>
    <div class="catalog-filters__section">
      <CatalogTextFilter :id="`${idPrefix}-passport-prefix`" label="通行证" :value="passportPrefix" placeholder="输入通行证前缀" :suggestions="passportSuggestions" @change="$emit('passport-change', $event)" @commit="$emit('passport-commit', $event)" />
      <CatalogTextFilter v-for="field in peopleFields" :key="field.key" :id="`${idPrefix}-filter-${field.key}`" :label="field.label" :value="textFilters[field.key]" :placeholder="`搜索${field.label}`" :suggestions="textSuggestions[field.key] || []" @change="$emit('text-change', { field: field.key, value: $event })" @commit="$emit('text-commit', { field: field.key, value: $event })" />
    </div>

  </div>
</template>
<style scoped>
.catalog-filters { display: grid; gap: 20px; min-width: 0; }
.catalog-filters__time { display: flex; align-items: center; gap: 16px; min-width: 0; }
.catalog-filters__label { flex: 0 0 56px; color: #7c8981; white-space: nowrap; font-size: 12px; line-height: 20px; }
.catalog-filters__time :deep(.catalog-date-filter) { flex: 1; width: auto; min-width: 0; max-width: none; }
.catalog-filters__section { display: grid; gap: 12px; padding-top: 20px; border-top: 1px solid #8b9e911c; }
@media (max-width: 640px) { .catalog-filters__time :deep(.catalog-date-filter) { gap: 8px; } }
</style>
