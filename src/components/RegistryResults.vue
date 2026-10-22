<script setup>
import { computed, ref, watch } from 'vue'
import { groupCatalogByMonth } from '../models/catalogTimeline.js'
import { platformDisplayName } from '../models/platform.js'
import ContentState from './ContentState.vue'
import RefreshButton from './RefreshButton.vue'
import RegistryFilePreview from './RegistryFilePreview.vue'

const props = defineProps({
  active: { type: Boolean, default: true },
  platforms: { type: Array, default: () => [] },
  files: { type: Array, default: () => [] },
  loading: Boolean,
  loaded: Boolean,
  error: { type: String, default: '' },
})
defineEmits(['retry', 'refresh'])
const files = computed(() => props.files)
const timelineEntries = computed(() => groupCatalogByMonth(files.value).flatMap(group => [
  { key: `month:${group.key}`, kind: 'month', label: group.label },
  ...group.files.map(file => ({ key: `file:${file.id}`, kind: 'file', file })),
]))
function platformName(code) { return platformDisplayName(props.platforms, code) }
const previewFile = ref(null)
watch(() => props.active, active => { if (!active) previewFile.value = null })
watch(files, entries => { if (previewFile.value) previewFile.value = entries.find(file => file.id === previewFile.value.id) || null })
function preserveLeavingPosition(element) {
  element.style.left = `${element.offsetLeft}px`
  element.style.top = `${element.offsetTop}px`
  element.style.width = `${element.offsetWidth}px`
  element.inert = true
}
function restorePosition(element) {
  for (const property of ['left', 'top', 'width']) element.style.removeProperty(property)
  element.inert = false
}
</script>

<template>
  <section class="registry-results" aria-label="筛选结果" :aria-busy="loading">
    <div class="registry-results__toolbar">
      <RefreshButton label="刷新文件列表" :loading="loading" :active="active" @refresh="$emit('refresh')" />
    </div>
    <div class="registry-results__body">
      <div v-if="error" class="registry-results__notice" role="alert"><span>{{ error }}</span><button type="button" @click="$emit('retry')">重试</button></div>
      <ContentState :loading="loading" :empty="!error && loaded && !files.length" loading-label="正在加载文件列表"><TransitionGroup name="catalog-file" tag="ul" class="registry-results__list" aria-label="文件列表" @before-leave="preserveLeavingPosition" @enter="restorePosition" @leave-cancelled="restorePosition">
        <li v-for="entry in timelineEntries" :key="entry.key" :class="entry.kind === 'month' ? 'registry-month' : 'registry-file'">
          <h3 v-if="entry.kind === 'month'" class="registry-month__title">{{ entry.label }}</h3>
          <template v-else>
          <button type="button" class="registry-file__trigger" :aria-label="`预览 ${entry.file.name}`" @click="previewFile = entry.file"></button>
          <div class="registry-file__info">
            <h3 :title="entry.file.name">{{ entry.file.name }}</h3>
            <div class="registry-file__identity">
              <span class="registry-file__platform" :title="platformName(entry.file.sourcePlatform)">{{ platformName(entry.file.sourcePlatform) }}</span>
              <span class="registry-file__time"><span>入库时间</span><time :datetime="entry.file.ingestedAt">{{ entry.file.ingestionLabel }}</time></span>
            </div>
          </div>
          <dl class="registry-file__people">
            <div><dt>申请人</dt><dd>{{ entry.file.applicant }}</dd></div>
            <div><dt>审核人</dt><dd>{{ entry.file.reviewer }}</dd></div>
          </dl>
          </template>
        </li>
      </TransitionGroup></ContentState>
    </div>
    <RegistryFilePreview :file="previewFile" @close="previewFile = null" />
  </section>
</template>

<style scoped>
.registry-results { display: flex; flex-direction: column; min-width: 0; min-height: 0; padding: 20px 0 0; }
.registry-results__toolbar { display: flex; flex: none; justify-content: flex-end; padding: 3px 3px 14px; }
.registry-results__body { position: relative; flex: 1; min-height: 0; display: flex; flex-direction: column; padding: 3px; overflow: hidden; }
.registry-results__notice { display: flex; align-items: center; justify-content: center; gap: 12px; min-height: 80px; margin: 0; color: #89938d; font-size: 12px; }
.registry-results__notice button { padding: 6px 12px; border: 1px solid #d2dccf; border-radius: 7px; background: #f1f5ee; color: #597563; cursor: pointer; }
.registry-results__list { position: relative; display: grid; gap: 9px; margin: 0; padding: 0; list-style: none; }
.registry-month { min-width: 0; padding-top: 20px; }
.registry-month:first-child { padding-top: 0; }
.registry-month__title { display: flex; align-items: center; gap: 12px; margin: 7px 0 11px; color: #728277; font-size: 12px; font-weight: 400; line-height: 1.6; }
.registry-month__title::after { flex: 1; height: 1px; content: ''; background: #dce4de; }
.registry-file { position: relative; display: grid; grid-template-columns: minmax(0, 1fr) 128px; align-items: center; gap: 20px; padding: 14px 20px; background: linear-gradient(115deg, #f5f8f5, #f0f5f2 58%, #eaf1ee); border: 1px solid #72907e33; border-radius: 13px; box-shadow: inset 0 1px #ffffffe6, 0 6px 16px -10px #27433129; transition: border-color .22s, box-shadow .22s; }
.registry-file::before { position: absolute; top: 19px; bottom: 19px; left: -1px; width: 2px; border-radius: 2px; background: linear-gradient(#b5c9ba, #819e8c); content: ''; pointer-events: none; }
.registry-file__trigger { position: absolute; z-index: 1; inset: 0; width: 100%; height: 100%; padding: 0; cursor: pointer; background: transparent; border: 0; border-radius: inherit; }
.registry-file__trigger:focus-visible { outline: 2px solid #719480; outline-offset: 3px; }
.registry-file__info { min-width: 0; }
.registry-file h3 { margin: 0; color: #263f34; font-size: 14px; font-weight: 600; line-height: 1.6; overflow-wrap: anywhere; }
.registry-file__identity { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 14px; margin-top: 7px; color: #526b5d; font-size: 11px; line-height: 1.7; }
.registry-file__platform { max-width: 100%; padding: 0 7px; background: #e3ece4; border-radius: 5px; box-shadow: inset 0 0 0 1px #6a8c7317; overflow-wrap: anywhere; }
.registry-file__time { display: inline-flex; flex-wrap: wrap; gap: 6px; }
.registry-file__time > span { color: #788a7e; }
.registry-file time { white-space: nowrap; font-variant-numeric: tabular-nums; }
.registry-file__people { display: grid; gap: 6px; margin: 0; }
.registry-file__people > div { display: grid; grid-template-columns: 36px minmax(0, 1fr); align-items: baseline; gap: 10px; }
.registry-file dt { color: #718378; font-size: 11px; white-space: nowrap; }
.registry-file dd { margin: 0; color: #435d50; font-size: 12px; line-height: 1.6; text-align: right; overflow-wrap: anywhere; }
@media (hover: hover) { .registry-file:hover { border-color: #688e7766; box-shadow: inset 0 1px #fffffff2, 0 9px 20px -10px #27433130; } }
@media (max-width: 640px) {
  .registry-results { padding: 18px 0 0; }
  .registry-file { grid-template-columns: minmax(0, 1fr) 96px; gap: 12px; padding: 12px; }
  .registry-file h3 { font-size: 12px; }
  .registry-file__people > div { grid-template-columns: 33px minmax(0, 1fr); gap: 4px; }
  .registry-file dd { font-size: 11px; }
}
.catalog-file-enter-active { transition: opacity .3s ease, transform .4s cubic-bezier(.22, 1, .36, 1); }
.catalog-file-enter-from { opacity: 0; transform: translateX(24px); }
.catalog-file-leave-active { position: absolute; pointer-events: none; z-index: 1; transition: opacity .28s ease, transform .34s cubic-bezier(.4, 0, .6, 1); }
.catalog-file-leave-to { opacity: 0; transform: translateX(-24px); }
.catalog-file-move { transition: transform .46s cubic-bezier(.22, 1, .36, 1); }
@media (prefers-reduced-motion: reduce) { .registry-file, .catalog-file-enter-active, .catalog-file-leave-active, .catalog-file-move { transition: none; } }
</style>
