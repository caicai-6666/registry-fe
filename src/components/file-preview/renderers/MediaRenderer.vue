<script setup>
import { ref } from 'vue'
defineProps({ src: { type: String, required: true }, label: String, kind: { type: String, required: true } })
const emit = defineEmits(['ready', 'displayed', 'error'])
const ready = ref(false)
function loaded() { ready.value = true; emit('ready'); if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) emit('displayed') }
</script>
<template>
  <section @transitionend.self="event => { if (event.propertyName === 'opacity' && ready) emit('displayed') }" @transitioncancel.self="() => { if (ready) emit('displayed') }" class="media-renderer" :class="{ 'is-ready': ready }">
    <h2>{{ label }}</h2>
    <component :is="kind === 'video' ? 'video' : 'audio'" :src="src" :aria-label="label" controls playsinline preload="metadata" @loadedmetadata="loaded" @error="emit('error', '媒体加载失败或浏览器不支持此编码，请尝试打开原件')" />
    <a :href="src" target="_blank" rel="noopener">在新窗口打开文件</a>
  </section>
</template>
<style scoped>
.media-renderer { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px; height: 100%; padding: 32px; opacity: 0; transition: opacity .5s ease; }
.media-renderer.is-ready { opacity: 1; }
.media-renderer h2 { margin: 0; color: #40594c; font-size: 15px; font-weight: 500; overflow-wrap: anywhere; text-align: center; }
.media-renderer video { width: 100%; min-height: 0; max-height: calc(100% - 100px); border-radius: 12px; background: #17231d; }
.media-renderer audio { width: min(520px, 100%); }
.media-renderer a { color: #52896d; font-size: 12px; }
@media (prefers-reduced-motion: reduce) { .media-renderer { transition: none; } }
</style>
