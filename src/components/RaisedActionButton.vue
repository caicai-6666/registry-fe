<script setup>
defineProps({ loading: Boolean, disabled: Boolean })
</script>
<template>
  <button type="button" class="raised-action-button" :disabled="disabled || loading" :aria-busy="loading || undefined">
    <span v-if="loading" class="raised-action-button__spinner" aria-hidden="true"></span>
    <slot v-else name="icon" />
    <slot />
  </button>
</template>
<style scoped>
/* From Uiverse.io by elijahgummer，尺寸适配平台顶部操作行。 */
.raised-action-button { display: inline-flex; align-items: center; justify-content: center; gap: 7px; height: 30px; font: inherit; background-color: #f0f0f0; border: 0; color: #242424; border-radius: .5em; font-size: 12px; padding: .375em 1em; font-weight: 600; text-shadow: 0 .0625em 0 #fff; box-shadow: inset 0 .0625em 0 0 #f4f4f4, 0 .0625em 0 0 #efefef, 0 .125em 0 0 #ececec, 0 .25em 0 0 #e0e0e0, 0 .3125em 0 0 #dedede, 0 .375em 0 0 #dcdcdc, 0 .425em 0 0 #cacaca, 0 .425em .5em 0 #cecece; transition: translate .15s ease, box-shadow .15s ease; cursor: pointer; }
.raised-action-button :deep(svg) { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.raised-action-button:active:not(:disabled) { translate: 0 .225em; box-shadow: inset 0 .03em 0 0 #f4f4f4, 0 .03em 0 0 #efefef, 0 .0625em 0 0 #ececec, 0 .125em 0 0 #e0e0e0, 0 .125em 0 0 #dedede, 0 .2em 0 0 #dcdcdc, 0 .225em 0 0 #cacaca, 0 .225em .375em 0 #cecece; }
.raised-action-button:focus-visible { outline: 2px solid #8a9a90; outline-offset: 6px; }
@media (prefers-reduced-motion: reduce) { .raised-action-button { transition: none; } }

.raised-action-button { white-space: nowrap; }
.raised-action-button:disabled { cursor: default; opacity: .65; }
.raised-action-button__spinner { width: 14px; height: 14px; flex: none; border: 1.5px solid #b8b8b8; border-top-color: #555; border-radius: 50%; animation: raised-action-spin .8s linear infinite; }
@keyframes raised-action-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .raised-action-button__spinner { animation: none; } }
</style>
