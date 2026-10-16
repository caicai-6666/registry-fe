<script setup>
import { ref, shallowRef, watch } from 'vue'
import emptyIcon from '../assets/empty.webp'
import { platformDisplayName } from '../models/platform.js'
const props = defineProps({ empty: Boolean, disabled: Boolean, applications: { type: Array, required: true }, selectedId: { type: String, default: '' }, platforms: { type: Array, default: () => [] } })
defineEmits(['select'])
const displayedApplications = shallowRef(props.applications)
const emptyVisible = ref(props.empty && !props.applications.length)
const leavingEmpty = ref(false)
watch([() => props.applications, () => props.empty], ([rows, empty]) => {
  if (emptyVisible.value && (rows.length || !empty)) {
    leavingEmpty.value = true
    emptyVisible.value = false
  }
  if (leavingEmpty.value) return
  displayedApplications.value = rows
  emptyVisible.value = empty && !rows.length
})
function finishEmptyLeave() {
  leavingEmpty.value = false
  displayedApplications.value = props.applications
  emptyVisible.value = props.empty && !props.applications.length
}
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
  <div class="review-application-panel">
  <TransitionGroup name="review-application" tag="div" class="review-applications" @before-leave="preserveLeavingPosition" @enter="restorePosition" @leave-cancelled="restorePosition">
    <button v-for="application in displayedApplications" :key="application.id" type="button" :disabled="disabled" class="review-application" :class="{ 'is-selected': selectedId === application.id }" :aria-pressed="selectedId === application.id" @click="$emit('select', application.id)">
      <strong>{{ application.name }}</strong>
      <span class="review-application__platform"><span class="review-application__source-label">来源</span>{{ platformDisplayName(platforms, application.sourcePlatform) }}</span>
    </button>
  </TransitionGroup>
  <Transition name="application-empty" @after-leave="finishEmptyLeave">
    <div v-if="emptyVisible" class="review-applications__empty" role="status"><img :src="emptyIcon" alt="" /><p>空空如也</p></div>
  </Transition>
  </div>
</template>
<style scoped>
.review-application-panel { position: relative; min-height: 100%; }
.review-applications__empty { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; padding: 20px; pointer-events: none; }
.review-applications__empty img { display: block; width: 112px; max-width: 60%; height: auto; object-fit: contain; }
.review-applications__empty p { margin: 0; color: #99a59d; font-size: 12px; line-height: 1.6; letter-spacing: .12em; }
.application-empty-enter-active { transition: opacity .32s ease .34s; }
.application-empty-leave-active { transition: opacity .24s ease; }
.application-empty-enter-from, .application-empty-leave-to { opacity: 0; }
.review-applications { position: relative; display: grid; align-content: start; gap: 10px; padding: 14px; }
.review-application { display: grid; gap: 12px; width: 100%; min-width: 0; padding: 17px 16px; text-align: left; color: #526457; background: #f4f7f480; border: 1px solid transparent; border-radius: 17px; cursor: pointer; transition: background .25s, border-color .25s, box-shadow .25s; }
.review-application:hover { background: #ffffffc9; }
.review-application.is-selected { background: #fff; border-color: #9f98cc55; box-shadow: 0 6px 18px #574f8310; }
.review-application:focus-visible { outline: 2px solid #9389c7; outline-offset: 2px; }
.review-application__platform {
  display: flex;
  align-items: baseline;
  justify-content: flex-start;
  gap: 7px;
  color: #718378;
  font-size: 11px;
  font-weight: 500;
  line-height: 1.7;
  text-align: left;
  overflow-wrap: anywhere;
}
.review-application__source-label { flex: none; color: #9ca79f; font-size: 10px; font-weight: 400; }
.review-application strong { color: #354b3e; font-size: 13px; line-height: 1.8; font-weight: 600; overflow-wrap: anywhere; }
.review-application-enter-active { transition: opacity .3s ease, transform .4s cubic-bezier(.22, 1, .36, 1); }
.review-application-enter-from { opacity: 0; transform: translateY(10px); }
.review-application-leave-active { position: absolute; pointer-events: none; z-index: 1; transition: opacity .28s ease, transform .34s cubic-bezier(.4, 0, .6, 1); }
.review-application-leave-to { opacity: 0; transform: translateX(-32px); }
.review-application-move { transition: transform .46s cubic-bezier(.22, 1, .36, 1), background .25s, border-color .25s, box-shadow .25s; }
@media (prefers-reduced-motion: reduce) { .review-application, .review-application-enter-active, .review-application-leave-active, .review-application-move, .application-empty-enter-active, .application-empty-leave-active { transition: none; } }
</style>
