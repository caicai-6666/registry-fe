<script setup>
import CatalogTextFilter from './CatalogTextFilter.vue'
import CatalogDateFilter from './CatalogDateFilter.vue'
defineProps({ value: { type: Object, required: true }, years: { type: Array, required: true }, passportPrefix: { type: String, default: '' }, passportSuggestions: { type: Array, default: () => [] }, textFilters: { type: Object, required: true }, textSuggestions: { type: Object, required: true } })
defineEmits(['change', 'passport-change', 'passport-commit', 'text-change', 'text-commit', 'reset'])
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
      <CatalogTextFilter v-for="field in fileFields" :key="field.key" :id="`catalog-filter-${field.key}`" :label="field.label" :value="textFilters[field.key]" :placeholder="field.key === 'name' ? '搜索文件名称' : '搜索摘要内容'" :suggestions="textSuggestions[field.key] || []" @change="$emit('text-change', { field: field.key, value: $event })" @commit="$emit('text-commit', { field: field.key, value: $event })" />
    </div>
    <div class="catalog-filters__section">
      <CatalogTextFilter id="catalog-passport-prefix" label="通行证" :value="passportPrefix" placeholder="输入通行证前缀" :suggestions="passportSuggestions" @change="$emit('passport-change', $event)" @commit="$emit('passport-commit', $event)" />
      <CatalogTextFilter v-for="field in peopleFields" :key="field.key" :id="`catalog-filter-${field.key}`" :label="field.label" :value="textFilters[field.key]" :placeholder="`搜索${field.label}`" :suggestions="textSuggestions[field.key] || []" @change="$emit('text-change', { field: field.key, value: $event })" @commit="$emit('text-commit', { field: field.key, value: $event })" />
    </div>
    <div class="catalog-filters__footer">
      <button type="button" class="catalog-filters__reset" @click="$emit('reset')"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 7a6 6 0 1 1-.3 5M4 3v4h4" /></svg>重置</button>
    </div>
  </div>
</template>
<style scoped>
.catalog-filters { display: grid; gap: 20px; min-width: 0; }
.catalog-filters__time { display: flex; align-items: center; gap: 16px; min-width: 0; }
.catalog-filters__label { flex: 0 0 56px; color: #7c8981; white-space: nowrap; font-size: 12px; line-height: 20px; }
.catalog-filters__time :deep(.catalog-date-filter) { flex: 1; width: auto; min-width: 0; max-width: none; }
.catalog-filters__section { display: grid; gap: 12px; padding-top: 20px; border-top: 1px solid #8b9e911c; }
.catalog-filters__footer { display: flex; justify-content: flex-end; padding: 0 0 6px; }
/* 延续用户提供的 adamgiebl 渐变与按压效果，收敛尺寸和阴影。 */
.catalog-filters__reset { display: inline-flex; align-items: center; justify-content: center; gap: 7px; height: 34px; padding: 0 16px; border: 0; border-radius: 8px; background: radial-gradient(100% 100% at 100% 0%, #8dbce9 0%, #667cc9 100%); color: #fff; font: inherit; font-size: 12px; cursor: pointer; box-shadow: 0 2px 5px #46568a1c, inset 0 -1px #3a416f26; transition: background .18s, box-shadow .18s, transform .18s; }
.catalog-filters__reset svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.catalog-filters__reset:hover { box-shadow: 0 4px 9px #46568a26, inset 0 -1px #3a416f40; transform: translateY(-1px); }
.catalog-filters__reset:active { box-shadow: inset 0 2px 5px #3a416f33; transform: translateY(0); }
.catalog-filters__reset:focus-visible { outline: 2px solid #7488c6; outline-offset: 3px; }
@media (prefers-reduced-motion: reduce) { .catalog-filters__reset { transition: none; } }
@media (max-width: 640px) { .catalog-filters__time :deep(.catalog-date-filter) { gap: 8px; } }
</style>
