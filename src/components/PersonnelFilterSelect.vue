<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
const props = defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  modelValue: { type: String, default: '' },
  options: { type: Array, required: true },
  disabled: Boolean,
  active: Boolean,
})
const emit = defineEmits(['update:modelValue'])
const root = ref(null), open = ref(false), highlighted = ref(0)
const selected = computed(() => props.options.find(option => option.value === props.modelValue))
const highlightedId = computed(() => `${props.id}-option-${highlighted.value}`)
let typed = '', typedAt = 0
function revealHighlighted() {
  void nextTick(() => {
    if (open.value) root.value?.querySelector(`[id="${highlightedId.value}"]`)?.scrollIntoView({ block: 'nearest' })
  })
}
function expand() {
  if (props.disabled) return
  highlighted.value = Math.max(0, props.options.findIndex(option => option.value === props.modelValue))
  open.value = true
  revealHighlighted()
}
function choose(index) {
  const option = props.options[index]
  if (!option) return
  emit('update:modelValue', option.value)
  open.value = false
  root.value?.querySelector('button')?.focus({ preventScroll: true })
}
function handleKeydown(event) {
  if (props.disabled) return
  if (event.key === 'Tab') { open.value = false; return }
  if (event.key === 'Escape') { if (open.value) event.stopPropagation(); open.value = false; return }
  if (['Enter', ' '].includes(event.key)) {
    event.preventDefault()
    if (open.value) choose(highlighted.value)
    else expand()
    return
  }
  if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
    event.preventDefault()
    if (!open.value) { expand(); return }
    const last = props.options.length - 1
    highlighted.value = event.key === 'Home' ? 0 : event.key === 'End' ? last : Math.max(0, Math.min(last, highlighted.value + (event.key === 'ArrowDown' ? 1 : -1)))
    revealHighlighted()
  } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
    if (!open.value) expand()
    typed = Date.now() - typedAt > 700 ? event.key : typed + event.key
    typedAt = Date.now()
    const index = props.options.findIndex(option => option.label.toLocaleLowerCase().startsWith(typed.toLocaleLowerCase()))
    if (index >= 0) { highlighted.value = index; revealHighlighted() }
  }
}
function outside(event) { if (!root.value?.contains(event.target)) open.value = false }
watch(() => [props.disabled, props.active], () => { if (props.disabled || !props.active) open.value = false })
watch(() => props.options, () => { if (open.value) expand() })
onMounted(() => document.addEventListener('pointerdown', outside))
onBeforeUnmount(() => document.removeEventListener('pointerdown', outside))
</script>
<template>
  <div ref="root" class="personnel-select" :class="{ 'is-open': open, 'is-disabled': disabled }" @focusout="event => { if (!event.currentTarget.contains(event.relatedTarget)) open = false }">
    <label :id="`${id}-label`" :for="id">{{ label }}</label>
    <button :id="id" class="personnel-select__trigger" type="button" role="combobox" :disabled="disabled" :aria-labelledby="`${id}-label ${id}-value`" aria-haspopup="listbox" :aria-expanded="open" :aria-controls="`${id}-listbox`" :aria-activedescendant="open ? highlightedId : undefined" @click="open ? open = false : expand()" @keydown="handleKeydown">
      <span :id="`${id}-value`" class="personnel-select__value">{{ selected?.label || options[0]?.label }}</span>
      <svg class="personnel-select__chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="m4.5 6.5 3.5 3.5 3.5-3.5" /></svg>
    </button>
    <Transition name="personnel-select-panel">
      <div v-if="open" :id="`${id}-listbox`" class="personnel-select__panel" role="listbox" :aria-labelledby="`${id}-label`" @mousedown.prevent>
        <div v-for="(option, index) in options" :id="`${id}-option-${index}`" :key="option.value" class="personnel-select__option" :class="{ 'is-selected': option.value === modelValue, 'is-highlighted': index === highlighted }" role="option" :aria-selected="option.value === modelValue" @pointermove="highlighted = index" @click="choose(index)">
          <span>{{ option.label }}</span><svg v-if="option.value === modelValue" viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8 3 3 6-6" /></svg>
        </div>
      </div>
    </Transition>
  </div>
</template>
<style scoped>
.personnel-select { position: relative; display: flex; flex-direction: column; justify-content: flex-end; gap: 7px; min-width: 0; padding-top: 2px; }
.personnel-select label { padding-left: 5px; color: #8b9990; font-size: 11px; line-height: 14px; cursor: pointer; }
.personnel-select__trigger { display: flex; align-items: center; justify-content: space-between; gap: 12px; width: 100%; height: 31px; padding: 0 5px 7px; border: 0; border-bottom: 1px solid #aab8af; border-radius: 0; background: transparent; color: #52685a; font: inherit; font-size: 13px; text-align: left; cursor: pointer; transition: border-color .2s, color .2s; }
.personnel-select__value { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.personnel-select__chevron { flex: none; width: 16px; height: 16px; color: #8d9f93; fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; transition: transform .22s ease, color .2s; }
.personnel-select__trigger:hover, .is-open .personnel-select__trigger { border-color: #779d87; color: #355e46; }
.is-open .personnel-select__chevron { transform: rotate(180deg); color: #58866b; }
.personnel-select__trigger:focus-visible { outline: 2px solid #9ab5a477; outline-offset: 4px; border-radius: 3px; }
.is-disabled { opacity: .5; }
.personnel-select__trigger:disabled { cursor: default; }
.personnel-select__panel { position: absolute; z-index: 12; top: calc(100% + 10px); right: 0; left: 0; max-height: 258px; padding: 6px; overflow-y: auto; overscroll-behavior: contain; border: 1px solid #e1e9e3; border-radius: 13px; background: #fcfefdFA; box-shadow: 0 14px 36px #314b3a14, 0 3px 9px #314b3a08, inset 0 1px #fff; backdrop-filter: blur(18px); scrollbar-width: thin; scrollbar-color: #c9d6cd transparent; transform-origin: top; }
.personnel-select__option { display: flex; align-items: center; justify-content: space-between; gap: 14px; min-height: 38px; padding: 9px 11px; border-radius: 8px; color: #667b6e; font-size: 12px; line-height: 1.5; cursor: pointer; transition: background .15s, color .15s; }
.personnel-select__option > span { min-width: 0; overflow-wrap: anywhere; }
.personnel-select__option.is-highlighted { background: #eff4f0; color: #3e624d; }
.personnel-select__option.is-selected { background: #e8f1eb; color: #3f7455; font-weight: 550; }
.personnel-select__option svg { flex: none; width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.personnel-select-panel-enter-active { transition: opacity .16s ease, transform .22s cubic-bezier(.2,.8,.2,1); }
.personnel-select-panel-leave-active { transition: opacity .12s ease, transform .14s ease; pointer-events: none; }
.personnel-select-panel-enter-from, .personnel-select-panel-leave-to { opacity: 0; transform: translateY(-5px) scale(.985); }
@media (prefers-reduced-motion: reduce) { .personnel-select__trigger, .personnel-select__chevron, .personnel-select__option, .personnel-select-panel-enter-active, .personnel-select-panel-leave-active { transition: none; } }
</style>
