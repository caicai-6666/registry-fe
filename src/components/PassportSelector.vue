<script setup>
import { computed, nextTick, ref, useId, watch } from 'vue'
import { addExistingPassport, suggestPassports } from '../models/passportSelection.js'
const props = defineProps({ modelValue: { type: Array, required: true }, options: { type: Array, required: true } })
const emit = defineEmits(['update:modelValue'])
const id = useId()
const addButton = ref(null), searchInput = ref(null), selectionViewport = ref(null)
async function showPicker() { open.value = true; await nextTick(); searchInput.value?.focus() }
async function dismissPicker() { open.value = false; query.value = ''; await nextTick(); addButton.value?.focus() }
const query = ref(''), open = ref(false), highlighted = ref(-1)
const suggestions = computed(() => suggestPassports(props.options, props.modelValue, query.value))
watch(suggestions, () => { highlighted.value = -1 })
function add(value) {
  emit('update:modelValue', addExistingPassport(props.modelValue, value, props.options))
  query.value = ''; highlighted.value = -1; void dismissPicker()
}
watch(() => props.modelValue, async (values, previous) => {
  if (!values.some(value => !previous.includes(value))) return
  await nextTick()
  selectionViewport.value?.scrollTo({ left: selectionViewport.value.scrollWidth, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
}, { flush: 'post' })
function preserveLeavingPosition(element) {
  element.style.left = `${element.offsetLeft}px`
  element.style.top = `${element.offsetTop}px`
  element.inert = true
}
function restoreEnteringPosition(element) { element.style.removeProperty('left'); element.style.removeProperty('top'); element.inert = false }
function scrollSelection(direction) {
  selectionViewport.value?.scrollBy({ left: direction * 240, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
}
function move(direction) {
  open.value = true
  if (suggestions.value.length) highlighted.value = highlighted.value < 0 ? direction > 0 ? 0 : suggestions.value.length - 1 : (highlighted.value + direction + suggestions.value.length) % suggestions.value.length
}
function choose() { if (open.value && highlighted.value >= 0) add(suggestions.value[highlighted.value]) }
function close(event) { if (!event.currentTarget.contains(event.relatedTarget)) open.value = false }
</script>
<template>
  <section class="passport-selector" @focusout="close" @keydown.esc.stop.prevent="dismissPicker">
    <div class="passport-selector__heading"><label :for="`${id}-add`">通行证 <small>可选 · 支持多选</small></label><p :id="`${id}-hint`" class="passport-selector__hint">{{ modelValue.length ? `已选择 ${modelValue.length} 个现存通行证` : '未选择时，由后台自动生成新的通行证' }}</p></div>
    <div class="passport-selector__field" :class="{ 'is-empty': !modelValue.length }">
      <div ref="selectionViewport" class="passport-selector__viewport" role="region" aria-label="已选通行证，可左右滚动" tabindex="0" @keydown.left.prevent="scrollSelection(-1)" @keydown.right.prevent="scrollSelection(1)">
        <TransitionGroup name="passport-chip" tag="div" class="passport-selector__selected" aria-label="已选通行证" @before-leave="preserveLeavingPosition" @enter="restoreEnteringPosition" @leave-cancelled="restoreEnteringPosition">
          <span v-for="value in modelValue" :key="value"><span>{{ value }}</span><button type="button" :aria-label="`移除通行证 ${value}`" @click="emit('update:modelValue', modelValue.filter(item => item !== value))">×</button></span>
        </TransitionGroup>
      </div>
      <button :id="`${id}-add`" ref="addButton" type="button" class="passport-selector__add" aria-label="新增通行证" :aria-describedby="`${id}-hint`" :aria-expanded="open" :aria-controls="`${id}-picker`" @click="open ? dismissPicker() : showPicker()">＋</button>
      <Transition name="passport-picker"><div v-if="open" :id="`${id}-picker`" class="passport-selector__picker">
        <input :id="`${id}-input`" ref="searchInput" v-model="query" type="text" role="combobox" aria-label="搜索现存通行证" aria-autocomplete="list" :aria-expanded="open" :aria-controls="`${id}-suggestions`" :aria-activedescendant="highlighted >= 0 ? `${id}-option-${highlighted}` : undefined" autocomplete="off" placeholder="输入前缀，搜索现存通行证…" @keydown.down.prevent="move(1)" @keydown.up.prevent="move(-1)" @keydown.enter.prevent="choose" />
        <div :id="`${id}-suggestions`" class="passport-selector__suggestions" role="listbox" aria-label="现存通行证提示">
          <button v-for="(value, index) in suggestions" :id="`${id}-option-${index}`" :key="value" type="button" role="option" tabindex="-1" :aria-selected="highlighted === index" :class="{ 'is-highlighted': highlighted === index }" @mousedown.prevent @click="add(value)">{{ value }}<span aria-hidden="true">＋</span></button>
          <p v-if="!suggestions.length">未找到匹配的现存通行证</p>
        </div>
      </div></Transition>
    </div>
  </section>
</template>
<style scoped>
.passport-selector { min-width: 0; margin-bottom: 18px; }
.passport-selector__heading { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 4px 12px; margin-bottom: 9px; }
.passport-selector__heading > label { display: flex; align-items: baseline; gap: 10px; color: #536659; font-size: 12px; font-weight: 600; }
.passport-selector small { color: #99a69d; font-size: 10px; font-weight: 400; }
.passport-selector__field { position: relative; display: flex; align-items: center; gap: 10px; height: 44px; }
.passport-selector__field.is-empty { gap: 0; }
.passport-selector__picker:focus-within { border-color: #a69bcd; }
.passport-selector input { display: block; width: 100%; min-width: 0; padding: 10px 12px; color: #455e4d; font: inherit; font-size: 12px; border: 0; border-radius: inherit; background: transparent; outline: none; }
.passport-selector input::placeholder { color: #a1aca4; }
.passport-selector__viewport { flex: 0 1 auto; min-width: 0; max-width: calc(100% - 42px); height: 44px; overflow-x: auto; overflow-y: hidden; padding: 6px 0; overscroll-behavior-x: contain; scrollbar-width: none; }
.passport-selector__viewport::-webkit-scrollbar { display: none; }
.passport-selector__viewport:focus-visible { outline: 2px solid #9389c7; outline-offset: 2px; border-radius: 7px; }
.passport-selector__selected { position: relative; display: flex; flex-wrap: nowrap; gap: 7px; align-items: center; width: max-content; min-height: 30px; }
.passport-selector__selected > span { flex: none; height: 30px; white-space: nowrap; display: inline-flex; align-items: center; gap: 7px; min-width: 0; padding: 3px 7px 3px 9px; color: #71668e; background: #f1eef7; border: 1px solid #b5a9d12e; border-radius: 7px; font-size: 11px; overflow-wrap: anywhere; }
.passport-selector__selected > span > span { min-width: 0; }
.passport-selector__selected > span > button { flex: none; padding: 0 3px; border: 0; border-radius: 4px; color: #998ba9; background: transparent; font-size: 16px; cursor: pointer; }
.passport-selector__selected button:focus-visible { outline: 2px solid #9389c7; }
.passport-selector__add { display: grid; place-items: center; flex: none; width: 32px; height: 30px; padding: 0; border: 1px dashed #b2a7cd; border-radius: 8px; background: #f8f6fb; color: #9788b4; font-size: 21px; line-height: 1; cursor: pointer; }
.passport-selector__add:hover { background: #eee9f7; border-color: #9989ba; }
.passport-selector__picker { position: absolute; z-index: 4; bottom: calc(100% + 8px); left: 0; width: min(100%, 420px); min-width: min(260px, 100%); overflow: hidden; border: 1px solid #b4b4c336; border-radius: 11px; background: #fbfcfb; box-shadow: 0 8px 24px #34423b24; }
.passport-selector__picker input { border-bottom: 1px solid #a1b2a526; border-radius: 0; padding: 13px 14px; }
.passport-selector__suggestions { max-height: 180px; padding: 5px; overflow: auto; }
.passport-selector__suggestions button { display: flex; justify-content: space-between; align-items: center; gap: 12px; width: 100%; padding: 10px; border: 0; border-radius: 7px; background: transparent; color: #596c5e; font: inherit; font-size: 12px; text-align: left; overflow-wrap: anywhere; cursor: pointer; }
.passport-selector__suggestions button > span { flex: none; color: #a194b8; }
.passport-selector__suggestions button:hover, .passport-selector__suggestions .is-highlighted { background: #f0edf6; }
.passport-selector__suggestions p, .passport-selector__hint { margin: 8px 0 0; color: #98a39b; font-size: 10px; line-height: 1.6; }
.passport-selector__hint { margin: 0; }
.passport-selector__suggestions p { margin: 0; padding: 10px; }
.passport-chip-enter-active { transition: opacity .22s ease, transform .44s cubic-bezier(.34, 1.56, .64, 1); }
.passport-chip-leave-active { position: absolute; pointer-events: none; transition: opacity .2s ease, transform .28s cubic-bezier(.4, 0, .6, 1); }
.passport-chip-enter-from { opacity: 0; transform: translate3d(14px, 4px, 0) scale(.86); }
.passport-chip-leave-to { opacity: 0; transform: translate3d(-8px, -3px, 0) scale(.88); }
.passport-chip-move { transition: transform .44s cubic-bezier(.22, 1.24, .36, 1); }
.passport-picker-enter-active { transition: opacity .18s ease, transform .28s cubic-bezier(.34, 1.35, .64, 1); transform-origin: bottom left; }
.passport-picker-leave-active { pointer-events: none; transition: opacity .14s ease, transform .18s ease; transform-origin: bottom left; }
.passport-picker-enter-from, .passport-picker-leave-to { opacity: 0; transform: translateY(5px) scale(.97); }
@media (max-width: 1100px) { .passport-selector__heading { display: grid; grid-template-columns: minmax(0, 1fr); min-height: 36px; } }
@media (prefers-reduced-motion: reduce) { .passport-chip-enter-active, .passport-chip-leave-active, .passport-chip-move, .passport-picker-enter-active, .passport-picker-leave-active { transition: none; } }
</style>
