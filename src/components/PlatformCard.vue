<script setup>
import { computed } from 'vue'
import { folderCoverStyle } from '../config/platformAppearance.js'

const props = defineProps({
  platform: { type: Object, required: true },
  stale: { type: Boolean, default: false },
  selected: { type: Boolean, default: false },
})
defineEmits(['toggle'])
const statusKey = computed(() => props.stale ? 'stale' : props.platform.isAlive ? 'online' : 'offline')
const statusText = computed(() => ({ online: '在线', offline: '离线', stale: '状态待更新' })[statusKey.value])
const coverStyle = computed(() => folderCoverStyle(props.platform.code))
</script>

<template>
  <article
    class="platform-card"
    :class="{ 'is-selected': selected }"
    :style="coverStyle"
    role="button"
    tabindex="0"
    :aria-pressed="selected"
    :aria-label="`${platform.name}，${statusText}`"
    :title="`${platform.name}\n${platform.description}`"
    @click="$emit('toggle')"
    @keydown.enter.prevent="$emit('toggle')"
    @keydown.space.prevent="$emit('toggle')"
  >
    <!-- Folder illustration adapted from Uiverse.io by Cobp, supplied by the user. -->
    <div class="platform-folder" aria-hidden="true">
      <div class="platform-folder__back"></div>
      <div class="platform-folder__paper platform-folder__paper--back"></div>
      <div class="platform-folder__paper platform-folder__paper--middle"></div>
      <div class="platform-folder__paper platform-folder__paper--front"></div>
      <div class="platform-folder__cover"></div>
    </div>
    <h3>{{ platform.name }}</h3>
    <div class="platform-card__status-slot">
      <Transition name="platform-status">
        <p :key="statusKey" class="platform-card__status" :class="`platform-card__status--${statusKey}`">
          <span class="platform-card__light" aria-hidden="true"></span>{{ statusText }}
        </p>
      </Transition>
    </div>
  </article>
</template>

<style scoped>
.platform-card { display: flex; flex-direction: column; align-items: center; width: var(--platform-card-width, 136px); min-width: 0; padding: 16px 8px 6px; border-radius: 14px; outline: none; cursor: pointer; }
.platform-card:focus-visible { background: #ffffff80; box-shadow: inset 0 0 0 2px #9b895a80; }
.platform-folder { position: relative; width: var(--platform-folder-width, 110px); height: 74px; perspective: 1500px; transform-origin: bottom; }
.platform-folder__back, .platform-folder__paper, .platform-folder__cover { position: absolute; border-radius: 8px; transform-origin: bottom; transition: transform .3s ease, box-shadow .3s ease; }
.platform-folder__back { inset: 0; background: var(--folder-back); border-top-left-radius: 0; transform-origin: top; }
.platform-folder__back::after { position: absolute; bottom: 99%; left: 0; width: 37px; height: 8px; content: ''; background: var(--folder-back); border-radius: 10px 10px 0 0; }
.platform-folder__back::before { position: absolute; top: -7px; left: 34px; width: 8px; height: 8px; content: ''; background: var(--folder-back); clip-path: polygon(0 35%, 0 100%, 50% 100%); }
.platform-folder__paper { inset: 3px; background: #a1a1aa; }
.platform-folder__paper--middle { background: #d4d4d8; }
.platform-folder__paper--front { background: #e4e4e7; }
.platform-folder__cover { right: 0; bottom: 0; left: 0; height: 72px; background: linear-gradient(to top, var(--folder-base), var(--folder-highlight)); border-top-right-radius: 0; }
.platform-folder__cover::after { position: absolute; right: 0; bottom: 99%; width: 67px; height: 8px; content: ''; background: var(--folder-highlight); border-radius: 10px 10px 0 0; }
.platform-folder__cover::before { position: absolute; top: -5px; right: 65px; width: 6px; height: 6px; content: ''; background: var(--folder-highlight); clip-path: polygon(100% 14%, 50% 100%, 100% 100%); }
.platform-card.is-selected .platform-folder__back { box-shadow: 0 12px 24px #0000001f; }
.platform-card.is-selected .platform-folder__paper--back { transform: rotateX(-20deg); }
.platform-card.is-selected .platform-folder__paper--middle { transform: rotateX(-30deg); }
.platform-card.is-selected .platform-folder__paper--front { transform: rotateX(-38deg); }
.platform-card.is-selected .platform-folder__cover { transform: rotateX(-46deg) translateY(1px); box-shadow: inset 0 12px 24px var(--folder-highlight), inset 0 -12px 24px var(--folder-back); }
.platform-card h3 { display: -webkit-box; min-height: 18px; margin: 10px 0 0; overflow: hidden; color: #42483f; font-size: 13px; font-weight: 500; line-height: 18px; text-align: center; overflow-wrap: anywhere; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.platform-card__status-slot { display: grid; place-items: center; width: 100%; height: 16px; margin-top: 4px; }
.platform-card__status { display: flex; grid-area: 1 / 1; align-items: center; gap: 6px; margin: 0; color: #8a908b; font-size: 11px; line-height: 16px; }
.platform-card__light { flex: 0 0 6px; width: 6px; height: 6px; background: #a0a7a1; border-radius: 50%; }
.platform-card__status--online { color: #52896d; }
.platform-card__status--online .platform-card__light { background: #62a37e; animation: platform-online-breathe 2.4s ease-in-out infinite; }
.platform-card__status--stale { color: #9b854b; }
.platform-card__status--stale .platform-card__light { background: #b49d62; }
.platform-status-enter-active, .platform-status-leave-active { transition: opacity .24s ease; }
.platform-status-enter-from, .platform-status-leave-to { opacity: 0; }
@keyframes platform-online-breathe {
  0%, 100% { opacity: .6; box-shadow: 0 0 0 0 #62a37e00; }
  50% { opacity: 1; box-shadow: 0 0 0 4px #62a37e24; }
}
@media (prefers-reduced-motion: reduce) {
  .platform-folder__back, .platform-folder__paper, .platform-folder__cover { transition: none; }
  .platform-card__status--online .platform-card__light { animation: none; }
  .platform-status-enter-active, .platform-status-leave-active { transition: none; }
}
</style>
