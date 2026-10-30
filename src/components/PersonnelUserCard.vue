<script setup>
import { personnelDepartment } from '../models/personnel.js'
import { ref, watch } from 'vue'
import { fetchPersonnelAvatar } from '../services/avatarApi.js'
defineEmits(['open'])
const props = defineProps({ user: { type: Object, required: true } })
const avatarUrl = ref(''), avatarReady = ref(false)
watch(() => props.user.avatarFilename, (filename, _, onCleanup) => {
  let disposed = false, objectUrl = ''
  avatarUrl.value = ''; avatarReady.value = false
  onCleanup(() => { disposed = true; if (objectUrl) URL.revokeObjectURL(objectUrl) })
  if (!filename) return
  void fetchPersonnelAvatar(filename).then(blob => {
    if (disposed) return
    objectUrl = URL.createObjectURL(blob)
    avatarUrl.value = objectUrl
  }).catch(() => { /* 头像缺失或服务失败时保留姓名首字；鉴权错误由统一请求层处理。 */ })
}, { immediate: true })
</script>
<template>
  <button type="button" class="personnel-user" aria-haspopup="dialog" :aria-label="`查看${user.username}的权限，${personnelDepartment(user)}`" @click="$emit('open')">
    <span class="personnel-user__avatar" aria-hidden="true">
      <span>{{ Array.from(user.username)[0] }}</span>
      <img v-if="avatarUrl" :src="avatarUrl" alt="" :class="{ 'is-ready': avatarReady }" @load="avatarReady = true" @error="avatarReady = false" />
    </span>
    <span class="personnel-user__info"><strong class="personnel-user__name">{{ user.username }}</strong><span class="personnel-user__department">{{ personnelDepartment(user) }}</span></span>
    <span v-if="user.isPlatformAdmin" class="personnel-user__admin" :title="`平台管理员：${user.platformAccess.filter(platform => platform.isAdmin).map(platform => platform.name).join('、')}`" aria-label="平台管理员"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m10 2 6 2.5V10c0 4-6 7-6 7s-6-3-6-7V4.5L10 2Z"/><path d="m7 9 2 2 4-4"/></svg></span>
  </button>
</template>
<style scoped>
.personnel-user { width: 100%; text-align: left; font: inherit; cursor: pointer; display: flex; align-items: center; gap: 16px; min-height: 112px; padding: 22px; border: 1px solid #91a59829; border-radius: 18px; background: linear-gradient(120deg, #ffffffb3, #f3f7f4a6); box-shadow: inset 0 1px #fff, 0 5px 18px #405a4910; transition: border-color .2s, background .2s, box-shadow .2s; }
.personnel-user:hover { border-color: #a4bfad; background: linear-gradient(120deg, #fff, #eef5f0); box-shadow: 0 7px 22px #405a491a; }
.personnel-user:focus-visible { outline: 2px solid #92ae9d; outline-offset: 4px; }
.personnel-user__avatar { display: grid; place-items: center; flex: none; width: 56px; height: 56px; overflow: hidden; border-radius: 17px; background: #e5ede7; color: #7a9584; font-size: 22px; font-weight: 500; }
.personnel-user__info { min-width: 0; flex: 1; }
.personnel-user__avatar { position: relative; }
.personnel-user__avatar img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity .25s ease; }
.personnel-user__avatar img.is-ready { opacity: 1; }
.personnel-user__name { display: block; margin: 0; color: #344e3e; font-size: 15px; font-weight: 550; overflow-wrap: anywhere; }
.personnel-user__department { display: block; margin: 9px 0 0; color: #96a298; font-size: 12px; overflow-wrap: anywhere; }
.personnel-user__admin { align-self: flex-start; flex: none; display: grid; place-items: center; width: 25px; height: 25px; border: 1px solid #a79ac12e; border-radius: 8px; background: #ede9f366; color: #9a88b2; }
.personnel-user__admin svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.3; stroke-linecap: round; stroke-linejoin: round; }
@media (prefers-reduced-motion: reduce) { .personnel-user { transition: none; } }
@media (prefers-reduced-motion: reduce) { .personnel-user__avatar img { transition: none; } }
</style>
