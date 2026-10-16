<script setup>
import { computed, inject, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { resolveFileKind, filePreviewUrl } from '../../models/filePreview.js'
import { FILE_RESOURCE_CACHE_KEY } from '../../services/fileResourceCache.js'
import { fileRenderers } from './renderers.js'
const props = defineProps({ file: { type: Object, required: true } })
const emit = defineEmits(['displayed', 'loading'])
const resourceCache = inject(FILE_RESOURCE_CACHE_KEY)
const ready = ref(false)
const busy = ref(false)
const error = ref('')
const attempt = ref(0)
const renderer = shallowRef(null)
const resourceBlob = shallowRef(null)
const resolvedFile = shallowRef(null)
const src = ref('')
const originalUrl = computed(() => filePreviewUrl(props.file.url))
const loader = computed(() => resolvedFile.value && fileRenderers[resolveFileKind(resolvedFile.value)])
let generation = 0
function releaseUrl() { if (src.value) URL.revokeObjectURL(src.value); src.value = '' }
function savedFileName(header) {
  const encoded = header.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
  if (encoded) { try { return decodeURIComponent(encoded) } catch { /* 使用普通文件名回退。 */ } }
  return header.match(/filename="([^"]*)"/i)?.[1] || ''
}
watch([() => props.file, attempt], async () => {
  emit('loading')
  const current = ++generation
  releaseUrl()
  ready.value = false
  busy.value = true
  error.value = ''
  renderer.value = null
  resolvedFile.value = null
  resourceBlob.value = null
  if (!originalUrl.value) { busy.value = false; error.value = '文件地址不可用'; return }
  try {
    const blob = await resourceCache.load(originalUrl.value)
    if (current !== generation) return
    resourceBlob.value = blob
    src.value = URL.createObjectURL(blob)
    resolvedFile.value = { ...props.file, name: props.file.originalName || savedFileName(resourceCache.disposition(originalUrl.value)) || props.file.name, mimeType: blob.type }
    if (!loader.value) return
    const module = await loader.value()
    if (current === generation) renderer.value = module.default
  } catch (cause) {
    if (current === generation) error.value = cause.message || '文件加载失败，请重试'
  } finally { if (current === generation) busy.value = false }
}, { immediate: true })
onBeforeUnmount(() => { generation++; releaseUrl() })
function rendererError(message) { emit('loading'); resourceCache.invalidate(originalUrl.value); error.value = message }
function retry() { resourceCache.invalidate(originalUrl.value); attempt.value++ }
</script>

<template>
  <div class="file-renderer">
    <component :is="renderer" v-if="renderer && src && !error" :key="`${file.id || file.url}-${attempt}`" :src="src" :blob="resourceBlob" :kind="resolveFileKind(resolvedFile)" :label="file.name" @ready="ready = true" @displayed="emit('displayed')" @error="rendererError" />
    <Transition name="file-status">
    <div v-if="busy || !loader || error || !ready" class="file-renderer__status" :class="{ 'has-toolbar': renderer && src && !error }" role="status" :aria-busy="Boolean(!error && (busy || loader && !ready))">
      <span v-if="!error && (busy || loader && !ready)" class="file-renderer__spinner" aria-hidden="true"></span>
      <h2>{{ file.name }}</h2>
      <p>{{ error || (busy ? '正在加载文件…' : !loader ? '暂不支持此类型的内嵌预览' : '正在加载文件…') }}</p>
      <button v-if="error && originalUrl" type="button" @click="retry">重新加载</button>
      <a v-if="src" :href="src" target="_blank" rel="noopener">在新窗口打开文件</a>
    </div>
    </Transition>
  </div>
</template>

<style scoped>
.file-renderer { position: absolute; inset: 0; overflow: hidden; border-radius: inherit; }
.file-renderer__status { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 24px; background: #dfe3e1; text-align: center; }
.file-renderer__status.has-toolbar { top: 56px; }
.file-renderer h2 { margin: 0; font-size: 15px; font-weight: 500; overflow-wrap: anywhere; }
.file-renderer p { margin: 0; font-size: 13px; }
.file-renderer a { color: #52896d; font-size: 12px; }
.file-renderer button { padding: 8px 18px; border: 1px solid #9eb3a5; border-radius: 8px; color: #304e3d; background: #edf3ef; cursor: pointer; }
.file-renderer__spinner { width: 32px; height: 32px; border: 2px solid #779a852e; border-top-color: #719480; border-radius: 50%; animation: file-loading 1s linear infinite; }
@keyframes file-loading { to { transform: rotate(360deg); } }
.file-status-leave-active { transition: opacity .24s ease; pointer-events: none; }
.file-status-leave-to { opacity: 0; }
@media (prefers-reduced-motion: reduce) { .file-renderer__spinner { animation: none; } .file-status-leave-active { transition: none; } }
</style>
