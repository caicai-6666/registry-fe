<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { platformLogoUrl } from '../config/platformAppearance.js'
import DecisionConfirmButton from './DecisionConfirmButton.vue'
import { createPersonnelPermissionDraft, permissionLevelError } from '../models/personnelPermissions.js'
import { personnelDepartment } from '../models/personnel.js'
const props = defineProps({ user: { type: Object, default: null }, canSubmit: { type: Boolean, default: true }, notice: { type: String, default: '' }, pending: Boolean, error: { type: String, default: '' } })
const emit = defineEmits(['close', 'update'])
const dialog = ref(null), draft = ref([])
const updateButton = ref(null), confirmingUpdate = ref(false)
let confirmationTimer
let initial = ''
const dirty = computed(() => JSON.stringify(draft.value) !== initial)
const invalid = computed(() => draft.value.some(row => row.isSubManagementPlatform && permissionLevelError(row.level) || row.isManagementEntry && !row.administratorKnown))
const updateDisabled = computed(() => !props.canSubmit || invalid.value || !dirty.value || !draft.value.length)
watch(confirmingUpdate, confirming => {
  clearTimeout(confirmationTimer)
  if (confirming) confirmationTimer = setTimeout(() => { confirmingUpdate.value = false }, 3000)
}, { flush: 'sync' })
watch(draft, () => { confirmingUpdate.value = false }, { deep: true, flush: 'sync' })
watch([() => props.user?.userid, () => props.pending, () => props.canSubmit], () => { confirmingUpdate.value = false }, { flush: 'sync' })
function close() { if (!props.pending) emit('close') }
function syncDialog() {
  if (props.user && !dialog.value?.open) dialog.value?.showModal()
  else if (!props.user && dialog.value?.open) dialog.value.close()
}
watch(() => props.user?.userid, () => {
  draft.value = props.user ? createPersonnelPermissionDraft(props.user) : []
  initial = JSON.stringify(draft.value)
  void nextTick(syncDialog)
}, { immediate: true })
function submit() {
  if (props.pending || updateDisabled.value) return
  if (!confirmingUpdate.value) { confirmingUpdate.value = true; return }
  confirmingUpdate.value = false
  emit('update', draft.value.map(row => ({ ...row })))
}
function requestUpdate() { updateButton.value?.activate() }
function backdrop(event) {
  if (event.target !== dialog.value) return
  const rect = dialog.value.getBoundingClientRect()
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close()
}
onMounted(syncDialog)
onBeforeUnmount(() => { clearTimeout(confirmationTimer); dialog.value?.close() })
</script>
<template>
  <Teleport to="body">
    <dialog ref="dialog" class="personnel-permissions" aria-labelledby="personnel-permissions-title" @cancel.prevent="close" @click="backdrop">
      <form v-if="user" class="personnel-permissions__shell" @submit.prevent="requestUpdate" :aria-busy="pending">
        <header class="personnel-permissions__header"><div><span class="personnel-permissions__eyebrow">员工权限</span><h2 id="personnel-permissions-title">{{ user.username }}</h2><p>{{ personnelDepartment(user) }}<span>·</span>{{ user.userid }}</p></div><button class="personnel-permissions__close" type="button" aria-label="关闭员工权限" :disabled="pending" @click="close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></button></header>
        <div class="personnel-permissions__columns"><span>平台访问等级</span><span>平台管理员</span></div>
        <div class="personnel-permissions__body"><article v-for="(row, index) in draft" :key="row.code" class="personnel-permissions__row" :data-platform-code="row.code">
          <div class="personnel-permissions__permission"><div class="personnel-permissions__name"><span class="personnel-permissions__platform-icon" :class="{ 'has-logo': platformLogoUrl(row.code) }" aria-hidden="true"><img v-if="platformLogoUrl(row.code)" :src="platformLogoUrl(row.code)" alt="" draggable="false" /><svg v-else viewBox="0 0 20 20"><rect x="3" y="3" width="5" height="5" rx="1"/><rect x="12" y="3" width="5" height="5" rx="1"/><rect x="3" y="12" width="5" height="5" rx="1"/><rect x="12" y="12" width="5" height="5" rx="1"/></svg></span><div><h3>{{ row.name }}</h3><span>{{ row.code }}</span></div></div>
            <template v-if="row.isSubManagementPlatform">
            <div class="personnel-permissions__level"><input class="personnel-permissions__slider" :style="{ '--permission-progress': `${Math.max(0, Math.min(100, Number(row.level) || 0))}%` }" type="range" min="0" max="100" step="1" :value="permissionLevelError(row.level) ? 0 : row.level || 0" :disabled="pending" :aria-label="`${row.name}访问等级滑块`" @input="row.level = $event.target.value" /><input v-model="row.level" class="personnel-permissions__number" type="text" inputmode="numeric" placeholder="未授权" :disabled="pending" :aria-label="`${row.name}访问等级`" :aria-invalid="!!permissionLevelError(row.level)" :aria-describedby="`personnel-level-${index}-hint`" /></div>
            <p :id="`personnel-level-${index}-hint`" class="personnel-permissions__level-hint" :class="{ 'is-invalid': permissionLevelError(row.level) }">{{ permissionLevelError(row.level) || (row.level === '' ? '未授权 · 可输入 0–100' : '0–100 · 数值留空表示未授权') }}</p>
            </template>
          </div>
          <label v-if="row.isManagementEntry" class="personnel-permissions__administrator" :title="row.administratorKnown ? undefined : '管理员信息尚未取得'" :class="{ 'is-disabled': pending || !row.administratorKnown }"><input v-model="row.administrator" type="checkbox" :disabled="pending || !row.administratorKnown" :aria-label="`${row.name}平台管理员`" /><span class="personnel-permissions__checkmark" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="m3 8 3 3 7-7" /></svg></span></label>
        </article><p v-if="!draft.length" class="personnel-permissions__empty">暂无平台权限信息</p></div>
        <footer class="personnel-permissions__footer"><p v-if="error" class="is-invalid" role="alert">{{ error }}</p><p v-else>{{ pending ? '正在保存权限并同步，请稍候' : notice || (!canSubmit || invalid ? '请先补全有效的权限信息' : '修改后点击更新，并再次确认保存') }}</p><DecisionConfirmButton ref="updateButton" raised label="更新" confirm-label="确认更新" loading-label="更新中" loading-aria-label="正在更新员工权限" :confirming="confirmingUpdate" :loading="pending" :disabled="updateDisabled" @activate="submit" /></footer>
      </form>
    </dialog>
  </Teleport>
</template>
<style scoped>
.personnel-permissions { width: min(760px, calc(100vw - 40px)); max-width: none; max-height: min(780px, calc(100dvh - 64px)); padding: 0; border: 1px solid #ffffffc9; border-radius: 26px; background: #f7faf8f7; color: #496452; box-shadow: 0 30px 110px #18382633; overflow: hidden; }
.personnel-permissions[open] { animation: personnel-permissions-in .24s ease both; }
.personnel-permissions::backdrop { background: #263c303d; backdrop-filter: blur(7px); }
.personnel-permissions__shell { display: flex; flex-direction: column; max-height: min(778px, calc(100dvh - 66px)); }
.personnel-permissions__header { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; padding: 28px 32px 24px; }
.personnel-permissions__eyebrow { color: #8fa296; font-size: 11px; letter-spacing: 2px; }
.personnel-permissions h2 { margin: 8px 0; color: #344e3e; font-size: 24px; font-weight: 550; overflow-wrap: anywhere; }
.personnel-permissions__header p { display: flex; flex-wrap: wrap; gap: 8px; margin: 0; color: #91a096; font-size: 12px; overflow-wrap: anywhere; }
.personnel-permissions__close { display: grid; place-items: center; flex: none; width: 30px; height: 30px; padding: 0; border: 0; border-radius: 9px; background: #eaf0ec; color: #7b9383; cursor: pointer; }
.personnel-permissions__close svg { width: 17px; height: 17px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; }
.personnel-permissions__columns { display: grid; grid-template-columns: 1fr 130px; gap: 28px; padding: 0 32px 12px; border-bottom: 1px solid #8fa39826; color: #94a49a; font-size: 11px; }
.personnel-permissions__columns > :last-child { text-align: center; }
.personnel-permissions__body { min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 0 32px; scrollbar-width: thin; }
.personnel-permissions__row { display: grid; grid-template-columns: minmax(0, 1fr) 130px; align-items: center; gap: 28px; padding: 22px 0; border-bottom: 1px solid #8fa3981c; }
.personnel-permissions__row:last-child { border-bottom: 0; }
.personnel-permissions__permission { min-width: 0; }
.personnel-permissions__name { display: flex; align-items: center; gap: 10px; }
.personnel-permissions__platform-icon { display: grid; place-items: center; flex: none; width: 33px; height: 33px; border-radius: 10px; background: #e9f0eb; color: #71917d; }
.personnel-permissions__platform-icon.has-logo { background: transparent; }
.personnel-permissions__platform-icon img { display: block; width: 32px; height: 32px; object-fit: contain; }
.personnel-permissions__platform-icon svg { width: 18px; height: 18px; fill: currentColor; }
.personnel-permissions h3 { margin: 0 0 3px; color: #476652; font-size: 14px; font-weight: 550; overflow-wrap: anywhere; }
.personnel-permissions__name > div { min-width: 0; }
.personnel-permissions__name div > span { overflow-wrap: anywhere; color: #9caaa1; font-size: 10px; }
.personnel-permissions__level { display: flex; align-items: center; gap: 18px; margin-top: 15px; }
.personnel-permissions__slider { flex: 1; min-width: 0; height: 6px; margin: 10px 0; appearance: none; border-radius: 9px; background: linear-gradient(to right, #8eae99 0 var(--permission-progress), #e0e9e3 var(--permission-progress) 100%); cursor: pointer; }
.personnel-permissions__slider::-webkit-slider-thumb { appearance: none; width: 16px; height: 16px; border: 3px solid #fff; border-radius: 50%; background: #83a48f; box-shadow: 0 2px 7px #52745c30; }
.personnel-permissions__slider::-moz-range-thumb { width: 10px; height: 10px; border: 3px solid #fff; border-radius: 50%; background: #83a48f; box-shadow: 0 2px 7px #52745c30; }
.personnel-permissions__slider:focus-visible { outline: 2px solid #9ab5a4; outline-offset: 5px; }
.personnel-permissions__number { width: 76px; height: 32px; padding: 0 8px; border: 1px solid #d9e5dd; border-radius: 8px; background: #ffffffb3; color: #557560; font: inherit; font-size: 13px; text-align: center; }
.personnel-permissions__number::placeholder { color: #a1ada5; font-size: 11px; }
.personnel-permissions__level-hint { margin: 9px 0 0; color: #a1ada5; font-size: 10px; line-height: 1.5; }
.personnel-permissions .is-invalid { color: #b77b5c; }
.personnel-permissions__administrator { display: flex; align-items: center; justify-content: center; gap: 9px; align-self: stretch; position: relative; border-left: 1px solid #8fa3981c; color: #7e9486; font-size: 12px; cursor: pointer; }
.personnel-permissions__administrator input { position: absolute; opacity: 0; width: 21px; height: 21px; }
.personnel-permissions__checkmark { display: grid; place-items: center; width: 21px; height: 21px; border: 1px solid #c3d2c7; border-radius: 6px; background: #fff; transition: background .2s, border-color .2s; }
.personnel-permissions__checkmark svg { width: 14px; height: 14px; fill: none; stroke: #fff; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; opacity: 0; transform: scale(.7); transition: opacity .16s, transform .2s; }
.personnel-permissions__administrator input:checked + span { background: #7a9f86; border-color: #7a9f86; }
.personnel-permissions__administrator input:checked + span svg { opacity: 1; transform: scale(1); }
.personnel-permissions__administrator.is-disabled { opacity: .5; cursor: default; }
.personnel-permissions__administrator input:focus-visible + span, .personnel-permissions__number:focus-visible, .personnel-permissions__close:focus-visible { outline: 2px solid #9ab5a4; outline-offset: 3px; }
.personnel-permissions__empty { padding: 36px 0; color: #9aaba0; text-align: center; font-size: 13px; }
.personnel-permissions__footer { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 22px 32px 26px; border-top: 1px solid #8fa39826; }
.personnel-permissions__footer p { margin: 0; color: #98a99d; font-size: 11px; line-height: 1.6; }
.personnel-permissions__footer button { min-width: 86px; flex: none; }
@keyframes personnel-permissions-in { from { opacity: 0; transform: translateY(12px) scale(.985); } to { opacity: 1; transform: none; } }
@media (max-width: 560px) { .personnel-permissions { width: calc(100vw - 24px); max-height: calc(100dvh - 36px); border-radius: 20px; } .personnel-permissions__shell { max-height: calc(100dvh - 38px); } .personnel-permissions__header { padding: 24px 20px; } .personnel-permissions__columns { padding: 0 20px 12px; grid-template-columns: 1fr 96px; gap: 12px; } .personnel-permissions__body { padding: 0 20px; } .personnel-permissions__row { grid-template-columns: minmax(0, 1fr) 96px; gap: 12px; } .personnel-permissions__administrator { flex-direction: column; gap: 8px; font-size: 11px; } .personnel-permissions__level { gap: 10px; } .personnel-permissions__number { width: 64px; } .personnel-permissions__footer { padding: 20px; } }
@media (prefers-reduced-motion: reduce) { .personnel-permissions[open] { animation: none; } .personnel-permissions__checkmark, .personnel-permissions__checkmark svg { transition: none; } }
</style>
