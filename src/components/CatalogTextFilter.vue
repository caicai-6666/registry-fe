<script setup>
import { ref } from 'vue'
const props = defineProps({ id: { type: String, required: true }, label: { type: String, required: true }, value: { type: String, default: '' }, placeholder: { type: String, default: '' }, suggestions: { type: Array, default: () => [] } })
const emit = defineEmits(['change', 'commit'])
const suggestionsOpen = ref(false)
function select(value) { emit('change', value); emit('commit', value); suggestionsOpen.value = false }
function closeSuggestions(event) {
  if (event.currentTarget.contains(event.relatedTarget)) return
  suggestionsOpen.value = false
  emit('commit', props.value)
}
</script>
<template>
  <div class="catalog-text-filter">
    <label :for="id">{{ label }}</label>
    <div class="catalog-text-filter__control" @focusout="closeSuggestions" @keydown.esc="suggestionsOpen = false">
      <input :id="id" type="text" :value="value" :placeholder="placeholder" autocomplete="off" spellcheck="false" @focus="suggestionsOpen = true" @input="suggestionsOpen = true; $emit('change', $event.target.value)" />
      <button v-if="value" class="catalog-text-filter__clear" type="button" :aria-label="`清空${label}筛选`" @click="select('')"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m5 5 6 6m0-6-6 6" /></svg></button>
      <Transition name="filter-suggestions">
      <div v-if="suggestionsOpen && value.trim() && suggestions.length" class="catalog-text-filter__suggestions" role="group" :aria-label="`${label}输入提示`"><button v-for="suggestion in suggestions" :key="suggestion" type="button" @click="select(suggestion)">{{ suggestion }}</button></div>
      </Transition>
    </div>
  </div>
</template>
<style scoped>
.catalog-text-filter { display: flex; align-items: center; gap: 16px; min-width: 0; }
.catalog-text-filter > label { flex: 0 0 56px; color: #7c8981; white-space: nowrap; font-size: 12px; line-height: 20px; }
.catalog-text-filter__control { position: relative; display: flex; align-items: center; flex: 1; height: 38px; min-width: 0; border: 1px solid #dfe6e1; border-radius: 8px; background: #ffffff8c; transition: border-color .2s, background .2s, box-shadow .2s; }
.catalog-text-filter__control:hover { border-color: #c5d1c9; background: #ffffffbd; }
.catalog-text-filter__control:focus-within { border-color: #97b2a1; background: #fff; box-shadow: 0 0 0 3px #789b8410; }
.catalog-text-filter__control input { width: 100%; min-width: 0; height: 100%; padding: 0 11px; border: 0; outline: none; background: transparent; color: #3e5146; font: inherit; font-size: 12px; }
.catalog-text-filter__control input::placeholder { color: #a3ada7; }
.catalog-text-filter__clear { display: grid; place-items: center; flex: none; width: 24px; height: 24px; margin-right: 6px; padding: 0; border: 0; border-radius: 6px; background: transparent; color: #94a198; cursor: pointer; transition: color .18s, background .18s; }
.catalog-text-filter__clear:hover { color: #4b6655; background: #edf2ef; }
.catalog-text-filter__clear svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.3; stroke-linecap: round; }
.catalog-text-filter__suggestions { position: absolute; z-index: 5; top: calc(100% + 6px); left: 0; right: 0; max-height: 180px; padding: 5px; overflow: auto; border: 1px solid #e3e9e5; border-radius: 9px; background: #fff; box-shadow: 0 8px 24px #314b3a12; scrollbar-width: thin; }
.catalog-text-filter__suggestions button { display: block; width: 100%; padding: 8px 9px; border: 0; border-radius: 5px; background: transparent; color: #53665b; font: inherit; font-size: 12px; line-height: 1.6; text-align: left; overflow-wrap: anywhere; cursor: pointer; }
.catalog-text-filter__suggestions button:hover { background: #f0f5f2; color: #365341; }
.catalog-text-filter__control button:focus-visible { outline: 2px solid #97b2a1; outline-offset: 1px; }
.filter-suggestions-enter-active, .filter-suggestions-leave-active { transition: opacity .14s, transform .18s; }
.filter-suggestions-enter-from, .filter-suggestions-leave-to { opacity: 0; transform: translateY(-4px); }
.filter-suggestions-leave-active { pointer-events: none; }
@media (prefers-reduced-motion: reduce) { .catalog-text-filter__control, .catalog-text-filter__clear, .filter-suggestions-enter-active, .filter-suggestions-leave-active { transition: none; } }
</style>
