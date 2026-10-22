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
    <div class="catalog-text-filter__control wave-group" :class="{ 'is-filled': value.length > 0 }" @focusout="closeSuggestions" @keydown.esc="suggestionsOpen = false">
      <input :id="id" class="input" type="text" :value="value" :placeholder="placeholder" autocomplete="off" spellcheck="false" @focus="suggestionsOpen = true" @input="suggestionsOpen = true; $emit('change', $event.target.value)" />
      <span class="bar" aria-hidden="true"></span>
      <label :for="id" class="label"><span v-for="(character, index) in Array.from(label)" :key="index" class="label-char" :style="{ '--index': index }">{{ character }}</span></label>
      <button v-if="value" class="catalog-text-filter__clear" type="button" :aria-label="`清空${label}筛选`" @click="select('')"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m5 5 6 6m0-6-6 6" /></svg></button>
      <Transition name="filter-suggestions">
      <div v-if="suggestionsOpen && value.trim() && suggestions.length" class="catalog-text-filter__suggestions" role="group" :aria-label="`${label}输入提示`"><button v-for="suggestion in suggestions" :key="suggestion" type="button" @click="select(suggestion)">{{ suggestion }}</button></div>
      </Transition>
    </div>
  </div>
</template>
<style scoped>
/* From Uiverse.io by AbanoubMagdy1；筛选可为空，使用值状态代替 required/:valid。 */
.catalog-text-filter { min-width: 0; padding-top: 12px; }
.wave-group { position: relative; min-width: 0; }
.wave-group .input { display: block; width: 100%; min-width: 0; height: 40px; padding: 10px 34px 8px 5px; border: 0; border-bottom: 1px solid #aab8af; border-radius: 0; background: transparent; color: #3e5146; font: inherit; font-size: 13px; }
.wave-group .input:focus { outline: none; }
.wave-group .input::placeholder { color: #a3ada7; opacity: 0; transition: opacity .2s ease; }
.wave-group .input:focus::placeholder { opacity: 1; }
.wave-group .label { position: absolute; display: flex; top: 10px; left: 5px; color: #8b9990; font-size: 13px; font-weight: 400; line-height: 20px; pointer-events: none; }
.wave-group .label-char { transition: transform .2s ease, font-size .2s ease, color .2s ease; transition-delay: calc(var(--index) * .05s); }
.wave-group .input:focus ~ .label .label-char, .wave-group.is-filled .label .label-char { transform: translateY(-22px); font-size: 11px; color: #5264ae; }
.wave-group .bar { position: relative; display: block; width: 100%; }
.wave-group .bar::before, .wave-group .bar::after { position: absolute; bottom: 0; width: 0; height: 2px; content: ''; background: #5264ae; transition: width .2s ease; }
.wave-group .bar::before { left: 50%; }
.wave-group .bar::after { right: 50%; }
.wave-group .input:focus ~ .bar::before, .wave-group .input:focus ~ .bar::after { width: 50%; }
.catalog-text-filter__clear { position: absolute; top: 8px; right: 3px; display: grid; place-items: center; width: 24px; height: 24px; padding: 0; border: 0; border-radius: 6px; background: transparent; color: #94a198; cursor: pointer; transition: color .18s, background .18s; }
.catalog-text-filter__clear:hover { color: #4b6655; background: #edf2ef; }
.catalog-text-filter__clear svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.3; stroke-linecap: round; }
.catalog-text-filter__suggestions { position: absolute; z-index: 5; top: calc(100% + 6px); left: 0; right: 0; max-height: 180px; padding: 5px; overflow: auto; border: 1px solid #e3e9e5; border-radius: 9px; background: #fff; box-shadow: 0 8px 24px #314b3a12; scrollbar-width: thin; }
.catalog-text-filter__suggestions button { display: block; width: 100%; padding: 8px 9px; border: 0; border-radius: 5px; background: transparent; color: #53665b; font: inherit; font-size: 12px; line-height: 1.6; text-align: left; overflow-wrap: anywhere; cursor: pointer; }
.catalog-text-filter__suggestions button:hover { background: #f0f5f2; color: #365341; }
.catalog-text-filter__control button:focus-visible { outline: 2px solid #97b2a1; outline-offset: 1px; }
.filter-suggestions-enter-active, .filter-suggestions-leave-active { transition: opacity .14s, transform .18s; }
.filter-suggestions-enter-from, .filter-suggestions-leave-to { opacity: 0; transform: translateY(-4px); }
.filter-suggestions-leave-active { pointer-events: none; }
@media (prefers-reduced-motion: reduce) { .wave-group .label-char, .wave-group .bar::before, .wave-group .bar::after, .wave-group .input::placeholder, .catalog-text-filter__clear, .filter-suggestions-enter-active, .filter-suggestions-leave-active { transition: none; transition-delay: 0s; } }
</style>
