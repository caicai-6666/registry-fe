<script setup>
import { onBeforeUnmount, provide, ref, shallowRef, watch } from 'vue'
import FilePreviewDialog from './file-preview/FilePreviewDialog.vue'
import FileRenderer from './file-preview/FileRenderer.vue'
import FileInfoPopover from './file-preview/FileInfoPopover.vue'
import PassportValues from './PassportValues.vue'
import FileSummaryPopover from './file-preview/FileSummaryPopover.vue'
import { fetchPreviewResource } from '../services/catalogApi.js'
import { createFileResourceCache, FILE_RESOURCE_CACHE_KEY } from '../services/fileResourceCache.js'
const props = defineProps({ file: { type: Object, default: null } })
defineEmits(['close'])
const resourceCache = createFileResourceCache({ fetchFile: fetchPreviewResource })
provide(FILE_RESOURCE_CACHE_KEY, resourceCache)
onBeforeUnmount(resourceCache.clear)
// 关闭动画期间保留当前渲染器，退出完成后再释放阅读器和 Worker。
const contentDisplayed = ref(false)
const displayedFile = shallowRef(props.file)
watch(() => props.file, file => { if (file && file !== displayedFile.value) { contentDisplayed.value = false; displayedFile.value = file } })
function closed() { displayedFile.value = null; contentDisplayed.value = false }
</script>

<template>
  <FilePreviewDialog :open="Boolean(file)" :label="displayedFile?.name || '文件'" @close="$emit('close')" @closed="closed">
    <FileRenderer v-if="displayedFile" :key="displayedFile.id || displayedFile.url" :file="displayedFile" @loading="contentDisplayed = false" @displayed="contentDisplayed = true" />
    <Transition name="preview-tools"><div v-if="displayedFile && file && contentDisplayed" class="preview-tools">
    <FileSummaryPopover v-if="displayedFile" :key="displayedFile.id || displayedFile.url" :summary="displayedFile.summary" :active="Boolean(file)" />
    <FileInfoPopover v-if="displayedFile && displayedFile.passport !== undefined" :key="`passports-${displayedFile.id || displayedFile.url}`" title="通行证" trigger-label="查看文件通行证" :active="Boolean(file)" secondary>
      <template #icon><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v5a2 2 0 0 0 0 4v5H4v-5a2 2 0 0 0 0-4V5ZM9 5v3m0 3v2m0 3v3M13 10h3m-3 4h3" /></svg></template>
      <PassportValues :values="displayedFile.passport" />
    </FileInfoPopover>
    </div></Transition>
  </FilePreviewDialog>
</template>

<style scoped>
.preview-tools { position: absolute; inset: 0; z-index: 4; pointer-events: none; }
.preview-tools :deep(.file-info) { pointer-events: auto; }
.preview-tools-enter-active { transition: opacity .32s ease, transform .36s cubic-bezier(.22, 1, .36, 1); }
.preview-tools-leave-active { transition: opacity .14s ease; pointer-events: none; }
.preview-tools-enter-from { opacity: 0; transform: translateY(4px); }
.preview-tools-leave-to { opacity: 0; }
@media (prefers-reduced-motion: reduce) { .preview-tools-enter-active, .preview-tools-leave-active { transition: none; } }
</style>
