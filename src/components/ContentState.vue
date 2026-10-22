<script setup>
import { computed, ref, watch } from 'vue'
import emptyIcon from '../assets/empty.webp'
import sleepIcon from '../assets/sleep.webp'
const props = defineProps({ loading: Boolean, empty: Boolean, detail: Boolean, loadingLabel: { type: String, default: '正在加载' } })
const state = computed(() => props.loading ? 'loading' : props.empty ? 'empty' : 'content')
const contentVisible = ref(state.value === 'content')
watch(state, value => { if (value !== 'content') contentVisible.value = false })
function finishFeedbackLeave() { if (state.value === 'content') contentVisible.value = true }
</script>
<template>
  <div class="content-state" :aria-busy="loading">
    <div class="content-state__content" :class="{ 'is-concealed': !contentVisible }" :inert="!contentVisible" :aria-hidden="!contentVisible"><slot /></div>
    <Transition name="content-feedback" mode="out-in" appear @after-leave="finishFeedbackLeave">
      <div v-if="state !== 'content'" :key="state" class="content-state__feedback" :class="{ 'is-empty': state === 'empty' }" role="status" :aria-label="state === 'loading' ? loadingLabel : detail ? '暂无详情' : '空空如也'">
        <i v-if="state === 'loading'" class="content-state__spinner" aria-hidden="true"></i>
        <template v-else><img :src="detail ? sleepIcon : emptyIcon" alt="" /><p v-if="!detail">空空如也</p><slot name="empty-actions" /></template>
      </div>
    </Transition>
  </div>
</template>
<style scoped>
.content-state { position: relative; display: flex; flex: 1; flex-direction: column; min-width: 0; min-height: 0; overflow: hidden; }
.content-state__content { display: flex; flex: 1; flex-direction: column; min-width: 0; min-height: 0; opacity: 1; visibility: visible; overflow: auto; transition: opacity .24s ease, visibility 0s; }
.content-state__content.is-concealed { opacity: 0; visibility: hidden; transition: opacity .24s ease, visibility 0s .24s; }
.content-state__feedback { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 14px; padding: 16px; min-width: 0; }
.content-state__feedback img { display: block; width: 112px; max-width: 60%; max-height: 65%; object-fit: contain; }
.content-state__feedback p { margin: 0; color: #99a59d; font-size: 12px; line-height: 1.6; letter-spacing: .12em; }
.content-state__spinner { width: 30px; height: 30px; flex: none; border: 2.5px solid #e0e6e2; border-top-color: #9388b8; border-radius: 50%; animation: content-state-spin .8s linear infinite; }
.content-feedback-enter-active { transition: opacity .28s ease; }
.content-feedback-enter-active.is-empty { transition-delay: .24s; }
.content-feedback-leave-active { transition: opacity .2s ease; pointer-events: none; }
.content-feedback-enter-from, .content-feedback-leave-to { opacity: 0; }
@keyframes content-state-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .content-state__content, .content-state__content.is-concealed, .content-feedback-enter-active, .content-feedback-leave-active { transition: none; } .content-state__spinner { animation: none; } }
</style>
