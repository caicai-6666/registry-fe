<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
const props = defineProps({ open: Boolean, label: { type: String, default: '文件' } })
const emit = defineEmits(['close', 'closed'])
const dialog = ref(null)
const closing = ref(false)
let closeTimer = null
function finishClose() {
  dialog.value?.close()
  closing.value = false
  emit('closed')
}
function syncDialog() {
  clearTimeout(closeTimer)
  if (!dialog.value) return
  if (props.open) {
    closing.value = false
    if (!dialog.value.open) dialog.value.showModal()
  } else if (dialog.value.open) {
    closing.value = true
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) finishClose()
    else closeTimer = setTimeout(finishClose, 280)
  }
}
watch(() => props.open, syncDialog, { flush: 'post' })
onMounted(syncDialog)
onBeforeUnmount(() => { clearTimeout(closeTimer); dialog.value?.close() })
</script>

<template>
  <dialog ref="dialog" class="file-preview-dialog" :class="{ 'is-closing': closing }" :aria-label="`预览 ${label}`" @cancel.prevent="emit('close')" @click="($event.target === dialog) && emit('close')">
    <section class="file-preview-dialog__surface">
      <slot />
      <button type="button" class="file-preview-dialog__close" aria-label="关闭文件预览" autofocus @click="emit('close')">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
      </button>
    </section>
  </dialog>
</template>

<style scoped>
.file-preview-dialog { position: fixed; inset: 0; width: 100%; height: 100%; max-width: none; max-height: none; margin: 0; padding: clamp(24px, 4vw, 56px); overflow: hidden; background: transparent; border: 0; color: #40594c; }
.file-preview-dialog[open] { display: grid; place-items: center; }
.file-preview-dialog::backdrop { background: rgb(7 12 10 / 42%); backdrop-filter: blur(20px) saturate(.78) brightness(.84); animation: preview-glass-in .36s ease both; }
.file-preview-dialog__surface { position: relative; width: min(1180px, 100%); height: min(820px, 100%); min-width: 0; min-height: 0; border: 1px solid #ffffff52; border-radius: 20px; background: #dfe3e1; box-shadow: 0 34px 100px #010302a3, 0 4px 20px #01030252, inset 0 1px #ffffff66; animation: preview-surface-in .42s cubic-bezier(.16,1,.3,1) both; }
.file-preview-dialog.is-closing .file-preview-dialog__surface { animation: preview-surface-out .28s ease both; pointer-events: none; }
.file-preview-dialog.is-closing::backdrop { animation: preview-glass-out .28s ease both; }
.file-preview-dialog__close { position: absolute; z-index: 5; top: -16px; right: -16px; display: grid; place-items: center; width: 38px; height: 38px; padding: 0; color: #edf4f0; cursor: pointer; background: rgb(18 30 25 / 88%); border: 1px solid #ffffff36; border-radius: 50%; box-shadow: 0 10px 28px #01030275, inset 0 1px #ffffff1f; backdrop-filter: blur(14px); transition: transform .26s, background .18s; }
.file-preview-dialog__close:hover { background: rgb(43 59 52 / 94%); transform: scale(1.06); }
.file-preview-dialog__close:focus-visible { outline: 2px solid #aaa0ed; outline-offset: 3px; }
.file-preview-dialog__close svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-width: 1.7; }
@keyframes preview-surface-in { from { opacity: 0; filter: blur(4px); transform: translateY(18px) scale(.975); } to { opacity: 1; filter: blur(0); transform: none; } }
@keyframes preview-surface-out { from { opacity: 1; transform: none; } to { opacity: 0; transform: translateY(18px) scale(.975); } }
@keyframes preview-glass-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes preview-glass-out { from { opacity: 1; } to { opacity: 0; } }
@media (max-width: 640px) { .file-preview-dialog { padding: 24px 10px 10px; } .file-preview-dialog__surface { border-radius: 13px; } .file-preview-dialog__close { top: -14px; right: 6px; width: 32px; height: 32px; } }
@media (prefers-reduced-motion: reduce) { .file-preview-dialog__surface, .file-preview-dialog::backdrop, .file-preview-dialog.is-closing .file-preview-dialog__surface { animation: none; } .file-preview-dialog__close { transition: none; } }
</style>
