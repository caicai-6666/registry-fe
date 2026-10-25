<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import PlatformCard from './PlatformCard.vue'

const props = defineProps({
  snapshot: { type: Object, default: null },
  selectedPlatformCodes: { type: Array, default: () => [] },
})
defineEmits(['toggle-platform', 'select-all-platforms'])
const platforms = computed(() => props.snapshot?.subManagementPlatforms ?? [])
const allSelected = computed(() => platforms.value.length > 0 && platforms.value.every(platform => props.selectedPlatformCodes.includes(platform.code)))
const partlySelected = computed(() => !allSelected.value && platforms.value.some(platform => props.selectedPlatformCodes.includes(platform.code)))
const now = ref(Date.now())
let countdownTimer = null

function stopCountdown() {
  clearInterval(countdownTimer)
  countdownTimer = null
}

watch(() => props.snapshot?.nextSyncAt, nextSyncAt => {
  stopCountdown()
  now.value = Date.now()
  if (!nextSyncAt || Date.parse(nextSyncAt) <= now.value) return
  // 此计时器只更新倒计时显示；接口请求仍由后端同步计划调度。
  countdownTimer = setInterval(() => {
    now.value = Date.now()
    if (Date.parse(props.snapshot?.nextSyncAt) <= now.value) stopCountdown()
  }, 1000)
}, { immediate: true })
onBeforeUnmount(stopCountdown)

const countdownText = computed(() => {
  if (!props.snapshot?.nextSyncAt || props.snapshot.scheduleError) return '--:--'
  const seconds = Math.max(0, Math.ceil((Date.parse(props.snapshot.nextSyncAt) - now.value) / 1000))
  const parts = [Math.floor(seconds / 60) % 60, seconds % 60]
  if (seconds >= 3600) parts.unshift(Math.floor(seconds / 3600))
  return parts.map(value => String(value).padStart(2, '0')).join(':')
})
const emptyMessage = computed(() => {
  if (!props.snapshot) return '平台状态待接入'
  if (props.snapshot.error) return '暂时无法获取平台状态'
  if (!props.snapshot.updatedAt && props.snapshot.isRefreshing) return '正在获取平台状态…'
  return props.snapshot.updatedAt ? '暂无子平台' : '等待获取平台状态'
})

function preserveLeavingPosition(element) {
  element.style.left = `${element.offsetLeft}px`
  element.style.top = `${element.offsetTop}px`
}
</script>

<template>
  <section class="platform-overview" aria-label="平台概览" :aria-busy="snapshot?.isRefreshing || false">
    <header class="platform-overview__header">
      <!-- Checkbox adapted from Uiverse.io by byllzz, supplied by the user. -->
      <div class="platform-overview__actions">
      <label class="platform-select-all" :class="{ 'is-disabled': !platforms.length }">
        <span class="platform-select-all__control">
          <input type="checkbox" aria-label="全选平台" :checked="allSelected" :indeterminate.prop="partlySelected" :disabled="!platforms.length" @change="$emit('select-all-platforms', $event.target.checked)" />
          <span class="platform-select-all__checkmark" aria-hidden="true"></span>
        </span>
        <span class="platform-select-all__label">全选</span>
      </label>
      <slot name="actions" />
      </div>
      <p class="platform-overview__plan">
        <span>下次同步</span>
        <span class="platform-overview__countdown">{{ countdownText }}</span>
      </p>
    </header>
    <p v-if="snapshot?.error || snapshot?.scheduleError" class="platform-overview__error" role="status" :title="snapshot.error || snapshot.scheduleError">{{ snapshot.error || snapshot.scheduleError }}</p>
    <div class="platform-overview__body">
      <TransitionGroup name="platform-entity" tag="ul" class="platform-overview__list" aria-label="平台列表" @before-leave="preserveLeavingPosition">
        <li v-for="platform in platforms" :key="platform.code">
          <PlatformCard :platform="platform" :stale="snapshot.isStale" :selected="selectedPlatformCodes.includes(platform.code)" @toggle="$emit('toggle-platform', platform.code)" />
        </li>
      </TransitionGroup>
      <div v-if="!platforms.length" class="platform-overview__empty" role="status">
        <p>{{ emptyMessage }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.platform-overview { --platform-card-width: 136px; --platform-folder-width: 110px; display: flex; flex-direction: column; min-width: 0; min-height: 0; padding: 0; }
.platform-overview__header { display: flex; align-items: center; justify-content: space-between; gap: 10px 12px; flex-wrap: wrap; min-height: 34px; flex: 0 0 auto; }
.platform-overview__plan { display: grid; grid-template-columns: auto 72px; align-items: center; justify-content: end; gap: 8px; flex: 0 0 160px; width: 160px; height: 24px; margin: 0 0 0 auto; color: #89938d; font-size: 11px; line-height: 16px; white-space: nowrap; }
.platform-overview__actions { display: flex; align-items: center; gap: 14px; margin-inline-start: calc((var(--platform-card-width) - var(--platform-folder-width)) / 2); }
.platform-select-all { display: inline-flex; align-items: center; gap: 10px; flex-shrink: 0; cursor: pointer; user-select: none; }
.platform-select-all__control { position: relative; display: block; width: 1.5em; height: 1.5em; font-size: 16px; }
.platform-select-all input { position: absolute; z-index: 1; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; }
.platform-select-all__label { color: #606d64; font-size: 12px; }
.platform-select-all__checkmark { position: absolute; inset: 0; background: #fdfcf0; border: 3px solid #1a1a1a; border-radius: 8% 92% 12% 88% / 87% 11% 89% 13%; box-shadow: 3px 3px 0 #1a1a1a; transition: transform .2s cubic-bezier(.175,.885,.32,1.275), box-shadow .2s, background-color .2s, border-radius .2s; }
.platform-select-all:not(.is-disabled):hover .platform-select-all__checkmark { transform: scale(1.05) rotate(2deg); }
.platform-select-all input:checked ~ .platform-select-all__checkmark { background: #62a37e; border-radius: 92% 8% 88% 12% / 11% 87% 13% 89%; transform: scale(1.1) rotate(-2deg); }
.platform-select-all__checkmark::after { position: absolute; display: none; left: .36em; top: .09em; width: .3em; height: .7em; content: ''; border: solid #1a1a1a; border-width: 0 .25em .25em 0; border-radius: 2px; transform: rotate(40deg); }
.platform-select-all input:checked ~ .platform-select-all__checkmark::after { display: block; animation: platform-checkbox-splash .3s forwards; }
.platform-select-all input:indeterminate ~ .platform-select-all__checkmark { background: #a8cfb5; }
.platform-select-all input:indeterminate ~ .platform-select-all__checkmark::after { display: block; left: .18em; top: .5em; width: .7em; height: 0; border-width: .18em 0 0; transform: none; }
.platform-select-all:not(.is-disabled):active .platform-select-all__checkmark { transform: scale(.9) translateY(4px); box-shadow: 0 0 0 #1a1a1a; }
.platform-select-all input:focus-visible ~ .platform-select-all__checkmark { outline: 2px solid #62a37e; outline-offset: 5px; }
.platform-select-all.is-disabled { opacity: .45; cursor: default; }
.platform-select-all.is-disabled input { cursor: default; }
@keyframes platform-checkbox-splash {
  0% { transform: scale(0) rotate(40deg); opacity: 0; }
  70% { transform: scale(1.2) rotate(40deg); }
  100% { transform: scale(1) rotate(40deg); opacity: 1; }
}
.platform-overview__countdown { width: 72px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-variant-numeric: tabular-nums; text-align: right; }
.platform-overview__body { display: grid; flex: 1 1 auto; min-height: 0; margin-top: 20px; }
.platform-overview__list { position: relative; display: grid; grid-template-columns: repeat(auto-fill, minmax(var(--platform-card-width), 1fr)); align-content: start; grid-area: 1 / 1; gap: 6px; min-height: 0; margin: 0; padding: 0 0 8px; overflow: auto; list-style: none; -webkit-mask-image: linear-gradient(180deg, transparent, #000 12px, #000 calc(100% - 16px), transparent); mask-image: linear-gradient(180deg, transparent, #000 12px, #000 calc(100% - 16px), transparent); }
.platform-overview__list li { flex: 0 0 var(--platform-card-width); }
.platform-overview__empty { display: flex; grid-area: 1 / 1; flex-direction: column; align-items: center; justify-content: center; gap: 12px; min-height: 140px; color: #9aa49d; pointer-events: none; }
.platform-overview__empty p { margin: 0; font-size: 12px; }
.platform-overview__error { flex-shrink: 0; margin: 10px 0 0; overflow: hidden; color: #a2775e; font-size: 11px; line-height: 16px; white-space: nowrap; text-overflow: ellipsis; }
.platform-entity-enter-active, .platform-entity-leave-active { transition: opacity .24s ease; }
.platform-entity-move { transition: transform .24s ease; }
.platform-entity-leave-active { position: absolute; }
.platform-entity-enter-from, .platform-entity-leave-to { opacity: 0; }
@media (prefers-reduced-motion: reduce) {
  .platform-entity-enter-active, .platform-entity-leave-active, .platform-entity-move { transition: none; }
  .platform-select-all__checkmark { transition: none; }
  .platform-select-all input:checked ~ .platform-select-all__checkmark::after { animation: none; }
}
</style>
