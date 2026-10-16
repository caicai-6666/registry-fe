<script setup>
import { onBeforeUnmount, ref, useId, watch } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  triggerLabel: { type: String, required: true },
  secondary: Boolean,
  active: { type: Boolean, default: true },
})
const expanded = ref(false)
const tooltipId = useId()
let closeTimer
function show() {
  clearTimeout(closeTimer)
  if (props.active) expanded.value = true
}
function hide() {
  clearTimeout(closeTimer)
  expanded.value = false
}
function scheduleHide() {
  clearTimeout(closeTimer)
  closeTimer = setTimeout(hide, 140)
}
function handleFocusOut(event) {
  if (!event.currentTarget.contains(event.relatedTarget)) scheduleHide()
}
function handleEscape(event) {
  if (!expanded.value) return
  event.preventDefault()
  event.stopPropagation()
  hide()
}
watch(() => props.active, active => { if (!active) hide() })
onBeforeUnmount(() => clearTimeout(closeTimer))
</script>

<template>
  <div class="file-info" :class="{ 'is-secondary': secondary }" @mouseenter="show" @mouseleave="scheduleHide" @keydown.esc="handleEscape" @focusin="show" @focusout="handleFocusOut">
    <button class="file-info__trigger" type="button" :aria-label="triggerLabel" :aria-expanded="expanded" :aria-controls="expanded ? tooltipId : undefined" :disabled="!active" @focus="show" @click="show">
      <slot name="icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.7 8a3.3 3.3 0 0 1 6.6 0c0 2.2-3.3 2.3-3.3 4.6" /><circle cx="12" cy="17" r=".9" /></svg></slot>
    </button>
    <Transition name="info-bubble">
      <div v-if="expanded" :id="tooltipId" class="file-info__bubble" role="region" :aria-label="title" @mouseenter="show">
        <h3>{{ title }}</h3>
        <div class="file-info__content"><slot /></div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.file-info { position: absolute; z-index: 4; top: 76px; left: 20px; }
.file-info.is-secondary { left: 68px; }
.file-info__trigger { display: grid; place-items: center; width: 38px; height: 38px; padding: 8px; border: 1px solid #ffffffb3; border-radius: 50%; background: linear-gradient(145deg, #f0f5fb, #d5e1ef); color: #466483; box-shadow: 0 4px 14px #243c5926, inset 0 1px #fff; cursor: pointer; transition: background .18s, transform .18s; }
.file-info__trigger:hover, .file-info__trigger[aria-expanded="true"] { background: #e8f0fa; transform: translateY(-1px); }
.file-info__trigger:focus-visible { outline: 2px solid #829fbe; outline-offset: 3px; }
.file-info__trigger svg { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; }
.file-info__trigger :deep(svg) { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.file-info__trigger circle { fill: currentColor; stroke: none; }
.file-info__bubble { position: absolute; top: calc(100% + 12px); left: 0; box-sizing: border-box; width: min(380px, calc(100vw - 100px)); padding: 20px; border: 1px solid #ffffffc4; border-radius: 14px; background: #f1f5faf7; color: #354960; box-shadow: 0 16px 44px #152a4433, 0 3px 8px #152a4414; backdrop-filter: blur(18px); }
.file-info__bubble::before { content: ''; position: absolute; top: -12px; left: 0; width: 100%; height: 12px; }
.file-info__bubble::after { content: ''; position: absolute; top: -5px; left: 14px; width: 9px; height: 9px; transform: rotate(45deg); background: #f1f5fa; border-top: 1px solid #ffffffc4; border-left: 1px solid #ffffffc4; }
.file-info__bubble h3 { margin: 0 0 12px; font-size: 14px; font-weight: 600; }
.file-info__content { margin: 0; max-height: min(300px, calc(100dvh - 276px)); overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; white-space: pre-wrap; overflow-wrap: anywhere; font-size: 13px; line-height: 1.9; }
.info-bubble-enter-active, .info-bubble-leave-active { transition: opacity .18s ease, transform .2s ease; }
.info-bubble-enter-from, .info-bubble-leave-to { opacity: 0; transform: translateY(5px); }
@media (prefers-reduced-motion: reduce) { .file-info__trigger, .info-bubble-enter-active, .info-bubble-leave-active { transition: none; } }
</style>
