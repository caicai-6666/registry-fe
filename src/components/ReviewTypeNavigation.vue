<script setup>
import { computed } from 'vue'
import ingestionReviewIcon from '../assets/ingestion-review.webp'
import deletionReviewIcon from '../assets/deletion-review.webp'
import levelSwitchIcon from '../assets/level-switch.webp'
const props = defineProps({ modelValue: { type: String, required: true }, active: Boolean })
const emit = defineEmits(['update:modelValue'])
const items = [
  { id: 'ingestion', label: '文件入库审核', accent: '#7468d5', iconSrc: ingestionReviewIcon },
  { id: 'deletion', label: '文件删除审核', accent: '#3da287', iconSrc: deletionReviewIcon },
  { id: 'file-level', label: '文件等级调整', accent: '#b18b4d', iconSrc: levelSwitchIcon },
]
const selectedIndex = computed(() => Math.max(0, items.findIndex(item => item.id === props.modelValue)))
</script>

<template>
  <nav class="review-type-nav" :class="{ 'is-active': active }" :style="{ '--review-accent': items[selectedIndex].accent, '--review-index': selectedIndex }" aria-label="审核类型">
    <span class="review-type-nav__slider" aria-hidden="true"></span>
    <button v-for="(item, index) in items" :key="item.id" type="button" class="review-type-nav__item" :class="{ 'is-selected': modelValue === item.id }" :style="{ '--item-accent': item.accent, '--enter-delay': `${220 + index * 120}ms` }" :aria-pressed="modelValue === item.id" @click="emit('update:modelValue', item.id)">
      <span class="review-type-nav__icon" :class="{ 'review-type-nav__icon--level-switch': item.id === 'file-level' }" aria-hidden="true"><img :src="item.iconSrc" alt="" draggable="false" /></span>
      <span class="review-type-nav__label">{{ item.label }}</span>
      <span class="review-type-nav__state" aria-hidden="true"><i></i></span>
    </button>
  </nav>
</template>

<style scoped>
/* 参照 flame-sport-pheno-manage-fe 的 WorkspaceModuleLayout 侧栏。 */
.review-type-nav { position: relative; isolation: isolate; display: flex; flex-direction: column; gap: 9px; min-width: 0; padding: 14px; overflow: hidden; background: #fafcfcdc; border: 1px solid #ffffffeb; border-radius: 27px; box-shadow: inset 0 1px #ffffffdb, 0 18px 40px #34424e17; }
.review-type-nav::before { position: absolute; z-index: 0; top: -82px; left: -72px; width: 210px; height: 210px; background: radial-gradient(circle, color-mix(in srgb, var(--review-accent) 18%, transparent), transparent 68%); border-radius: 50%; content: ''; pointer-events: none; }
.review-type-nav__slider { position: absolute; z-index: 1; top: 14px; right: 14px; left: 14px; height: 74px; border: 1px solid color-mix(in srgb, var(--review-accent) 25%, transparent); border-radius: 18px; background: radial-gradient(circle, color-mix(in srgb, var(--review-accent) 32%, transparent) 0 12%, transparent 54%), radial-gradient(circle, #3dae8e3d 0 10%, transparent 50%), linear-gradient(118deg, #ffffffbd 0%, color-mix(in srgb, var(--review-accent) 16%, white) 48%, #e0f3ecd6 100%); background-size: 75% 170%, 78% 160%, 190% 190%; box-shadow: inset 0 1px #ffffffe6, 0 10px 24px color-mix(in srgb, var(--review-accent) 18%, transparent); pointer-events: none; transform: translate3d(0, calc(var(--review-index) * 83px), 0); transition: transform 620ms cubic-bezier(.16, 1, .3, 1), border-color 420ms ease, box-shadow 420ms ease; animation: review-selected-flow 5.8s ease-in-out infinite alternate; animation-play-state: paused; }
.is-active .review-type-nav__slider { animation-play-state: running; }
.review-type-nav__item { position: relative; z-index: 2; mix-blend-mode: multiply; display: grid; grid-template-columns: 38px minmax(0, 1fr) 20px; align-items: center; gap: 10px; flex: 0 0 74px; width: 100%; min-width: 0; height: 74px; padding: 10px; color: #68746d; font: inherit; text-align: left; background: transparent; border: 1px solid transparent; border-radius: 18px; cursor: pointer; transform: translate3d(0, 0, 0); transition: background-color 420ms, border-color 420ms, color 360ms, transform 480ms cubic-bezier(.16, 1, .3, 1); }
.is-active .review-type-nav__item { animation: review-nav-enter 900ms cubic-bezier(.16, 1, .3, 1) var(--enter-delay) backwards; }
.review-type-nav__icon { position: relative; display: grid; place-items: center; width: 38px; height: 38px; color: var(--item-accent); background: transparent; border: 1px solid transparent; border-radius: 12px; transition: background-color 360ms, box-shadow 420ms, transform 480ms cubic-bezier(.16, 1, .3, 1); }
.review-type-nav__icon img { position: absolute; top: 50%; left: 50%; width: 56px; height: 56px; max-width: none; object-fit: contain; transform: translate(-50%, -50%); mix-blend-mode: multiply; pointer-events: none; }
.review-type-nav__icon--level-switch img { width: 38px; height: 38px; }
.review-type-nav__label { position: relative; font-size: 14px; font-weight: 650; white-space: nowrap; }
.review-type-nav__state { display: grid; place-items: center; width: 20px; height: 20px; color: var(--item-accent); border: 1px solid transparent; border-radius: 50%; transition: background-color 360ms, border-color 360ms; }
.review-type-nav__state i { width: 5px; height: 5px; background: currentColor; border-radius: 50%; opacity: .38; transition: opacity 360ms; }
.is-selected { color: #2d3932; }
.is-selected .review-type-nav__icon { background: transparent; }
.is-selected .review-type-nav__state { background: color-mix(in srgb, var(--item-accent) 11%, transparent); border-color: color-mix(in srgb, var(--item-accent) 14%, transparent); }
.is-selected .review-type-nav__state i { opacity: 1; }
.review-type-nav__item:focus-visible { outline: 3px solid color-mix(in srgb, var(--item-accent) 30%, transparent); outline-offset: 2px; }
@keyframes review-selected-flow { 0% { background-position: -35% 5%, 125% 95%, 0% 50%; } 50% { background-position: 62% 70%, 45% 12%, 52% 45%; } 100% { background-position: 128% 22%, -32% 78%, 100% 56%; } }
@keyframes review-nav-enter { from { filter: blur(4px); opacity: 0; transform: translate3d(-42px, 0, 0) scale(.96); } to { filter: blur(0); opacity: 1; transform: translate3d(0, 0, 0) scale(1); } }
@media (hover: hover) { .review-type-nav__item:hover:not(.is-selected) { color: #3d4942; background: #ffffffcc; border-color: #ffffffe0; transform: translateX(3px); } .review-type-nav__item:hover .review-type-nav__icon { transform: rotate(-3deg) scale(1.035); } }
@media (max-width: 760px) {
  .review-type-nav { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 9px; padding: 10px; border-radius: 20px; }
  .review-type-nav__item { height: 72px; min-height: 72px; grid-template-columns: minmax(0, 1fr); grid-template-rows: 32px 20px; justify-items: center; gap: 3px; padding: 6px 2px; text-align: center; }
  .review-type-nav__icon { width: 30px; height: 34px; border-radius: 10px; }
  .review-type-nav__label { position: relative; font-size: 11px; }
  .review-type-nav__icon img { width: 44px; height: 44px; }
  .review-type-nav__icon--level-switch img { width: 30px; height: 30px; }
  .review-type-nav__state { display: none; }
  .review-type-nav__slider { top: 10px; left: 10px; right: auto; width: calc((100% - 38px) / 3); height: 72px; transform: translate3d(calc(var(--review-index) * (100% + 9px)), 0, 0); border-radius: 18px; }
}
@media (prefers-reduced-motion: reduce) { .review-type-nav__slider, .is-active .review-type-nav__item { animation: none; } .review-type-nav__slider, .review-type-nav__item, .review-type-nav__icon, .review-type-nav__state, .review-type-nav__state i { transition: none; } }
</style>
