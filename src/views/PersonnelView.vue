<script setup>
import { useWorkspacePage } from '../composables/useWorkspacePage.js'
import { computed, inject, nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import CatalogTextFilter from '../components/CatalogTextFilter.vue'
import PersonnelFilterSelect from '../components/PersonnelFilterSelect.vue'
import PersonnelPermissionsDialog from '../components/PersonnelPermissionsDialog.vue'
import PersonnelUserCard from '../components/PersonnelUserCard.vue'
import ContentState from '../components/ContentState.vue'
import { PERSONNEL_DIRECTORY_KEY } from '../composables/usePersonnelDirectory.js'
import { refreshOrganization, updatePersonnelPermissions } from '../services/personnelApi.js'
import { getAccessToken } from '../services/registryApi.js'
import { createPersonnelPermissionPatch } from '../models/personnelPermissions.js'
import { PLATFORM_DIRECTORY_KEY, PLATFORM_REFRESH_KEY } from '../services/platformDirectory.js'
import DecisionConfirmButton from '../components/DecisionConfirmButton.vue'
import RefreshButton from '../components/RefreshButton.vue'
import { buildPersonnelUsers, filterPersonnelUsers, findPersonnelUsers, personnelLocatorLabel } from '../models/personnel.js'
const { active, pageRoot } = useWorkspacePage('personnel')
let locating = false
const emit = defineEmits(['initial-ready'])
const directory = inject(PERSONNEL_DIRECTORY_KEY)
const platformSnapshot = inject(PLATFORM_DIRECTORY_KEY)
const refreshPlatforms = inject(PLATFORM_REFRESH_KEY)
const permissionUser = shallowRef(null), permissionError = ref(''), permissionFeedback = ref(''), permissionPending = ref(false), permissionConflict = ref(false)
let permissionFeedbackTimer
watch(permissionFeedback, message => {
  clearTimeout(permissionFeedbackTimer)
  if (message) permissionFeedbackTimer = setTimeout(() => { permissionFeedback.value = '' }, 3000)
}, { flush: 'sync' })
onBeforeUnmount(() => clearTimeout(permissionFeedbackTimer))
function openPermissions(user) {
  if (permissionPending.value || organizationRefreshing.value || directory.loading.value) return
  permissionError.value = ''; permissionFeedback.value = ''; permissionConflict.value = false; permissionUser.value = user
}
async function reloadPermissionDirectory() {
  directory.invalidate()
  // 已在途的平台查询可能早于权限提交，等待其完成后再读取新快照。
  if (platformSnapshot.value.isRefreshing) await refreshPlatforms()
  await Promise.all([directory.load(), refreshPlatforms()])
}
async function updatePermissions(draft) {
  if (permissionPending.value || permissionConflict.value || organizationRefreshing.value || !permissionUser.value) return
  const user = permissionUser.value, token = getAccessToken()
  permissionError.value = ''; permissionFeedback.value = ''
  permissionPending.value = true
  try {
    await updatePersonnelPermissions(createPersonnelPermissionPatch(user, draft))
    if (token !== getAccessToken()) return
    permissionUser.value = null
    if (active.value) permissionFeedback.value = `${user.username}的权限已更新。`
    await reloadPermissionDirectory()
  } catch (error) {
    if (token !== getAccessToken()) return
    permissionError.value = error.message || '权限更新失败，请稍后重试。'
    permissionConflict.value = error.status === 409
    if (error.status === 409 || error.status === 0 || error.status === 200 || error.status >= 500) {
      await reloadPermissionDirectory()
    }
  } finally { permissionPending.value = false }
}
watch(() => active.value, active => {
  if (!active) { permissionUser.value = null; permissionFeedback.value = '' }
})
const organizationRefreshing = ref(false), organizationFeedback = ref(''), organizationError = ref('')
const confirmingRefresh = ref(false)
let confirmationTimer
watch(confirmingRefresh, confirming => {
  clearTimeout(confirmationTimer)
  if (confirming) confirmationTimer = setTimeout(() => { confirmingRefresh.value = false }, 3000)
}, { flush: 'sync' })
watch([() => active.value, organizationRefreshing], () => { confirmingRefresh.value = false }, { flush: 'sync' })
onBeforeUnmount(() => clearTimeout(confirmationTimer))
function refreshDirectory() {
  if (organizationRefreshing.value || permissionPending.value || directory.loading.value) return
  void directory.load(); void refreshPlatforms()
}
async function runOrganizationRefresh() {
  if (organizationRefreshing.value || permissionPending.value) return
  organizationRefreshing.value = true
  organizationFeedback.value = ''; organizationError.value = ''
  try {
    const result = await refreshOrganization()
    organizationFeedback.value = `已刷新 ${result.refreshed_users} 位员工、${result.refreshed_departments} 个部门。`
    directory.invalidate()
    await Promise.all([directory.load(), refreshPlatforms()])
  } catch (error) {
    organizationError.value = error.message || '组织架构刷新失败，请稍后重试。'
  } finally { organizationRefreshing.value = false }
}
function confirmOrganizationRefresh() {
  if (organizationRefreshing.value || permissionPending.value) return
  if (!confirmingRefresh.value) { confirmingRefresh.value = true; return }
  void runOrganizationRefresh()
}
const administratorsReady = computed(() => platformSnapshot.value.updatedAt !== null)
const users = computed(() => buildPersonnelUsers(directory.records.value, directory.departments.value, administratorsReady.value ? platformSnapshot.value.allPlatforms : null))
watch([directory.loaded, directory.error, directory.loading], ([loaded, error, loading]) => {
  if (active.value && !loading && (loaded || error)) emit('initial-ready')
}, { flush: 'post' })
const administratorPlatforms = computed(() => administratorsReady.value ? platformSnapshot.value.allPlatforms.filter(platform => platform.isManagementEntry) : [])
const department = ref(''), administratorPlatform = ref(''), locatorQuery = ref(''), appliedQuery = ref(''), locatedId = ref('')
const departments = computed(() => {
  const options = new Map(directory.departments.value.map(unit => [unit.id, unit]))
  for (const user of users.value) for (const unit of user.departments) if (!options.has(unit.id)) options.set(unit.id, unit)
  return [...options.values()]
})
watch(departments, units => { if (department.value && !units.some(unit => unit.id === department.value)) department.value = '' })
watch(administratorPlatforms, platforms => {
  if (administratorPlatform.value && !platforms.some(platform => platform.code === administratorPlatform.value)) administratorPlatform.value = ''
})
const departmentOptions = computed(() => [{ value: '', label: '全部部门' }, ...departments.value.map(unit => ({ value: unit.id, label: unit.name }))])
const administratorOptions = computed(() => [{ value: '', label: '不启用' }, ...administratorPlatforms.value.map(platform => ({ value: platform.code, label: platform.name }))])
const scopedUsers = computed(() => filterPersonnelUsers(users.value, { department: department.value, administratorPlatform: administratorPlatform.value }))
const visibleUsers = computed(() => filterPersonnelUsers(users.value, { username: appliedQuery.value, department: department.value, administratorPlatform: administratorPlatform.value }))
const locatorSuggestions = computed(() => findPersonnelUsers(scopedUsers.value, locatorQuery.value).slice(0, 20).map(personnelLocatorLabel))
const rows = new Map()
watch([department, administratorPlatform], () => { locatedId.value = '' })
function resetFilters() {
  department.value = ''; administratorPlatform.value = ''; locatorQuery.value = ''; appliedQuery.value = ''; locatedId.value = ''
}
function handleLocatorEnter(event) {
  if (event.target.tagName !== 'INPUT') return
  event.preventDefault()
  void locateUser(locatorQuery.value)
}
function preserveLeavingPosition(element) {
  element.style.width = `${element.offsetWidth}px`
  element.style.left = `${element.offsetLeft}px`
  element.style.top = `${element.offsetTop}px`
}
async function locateUser(query) {
  if (locating) return
  appliedQuery.value = query
  locatedId.value = ''
  const target = visibleUsers.value.length === 1 ? visibleUsers.value[0] : null
  if (!target || !query.trim()) return
  locating = true
  try {
    await nextTick()
    locatedId.value = target.userid
    await nextTick()
    const element = rows.get(target.userid)
    element?.focus({ preventScroll: true })
    element?.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  } finally { locating = false }
}
</script>
<template>
  <section ref="pageRoot" class="workspace-route-panel" :inert="!active" :aria-hidden="!active">
    <section class="personnel" aria-label="人员管理">
      <header class="personnel__filters" aria-label="人员筛选">
        <div @keydown.enter="handleLocatorEnter"><CatalogTextFilter id="personnel-username" label="用户名" :value="locatorQuery" placeholder="输入用户名筛选" :suggestions="locatorSuggestions" @change="locatorQuery = $event; locatedId = ''" @commit="locateUser" /></div>
        <PersonnelFilterSelect id="personnel-department" v-model="department" label="所属部门" :options="departmentOptions" :disabled="!directory.loaded.value" :active="active" />
        <PersonnelFilterSelect id="personnel-administrator" v-model="administratorPlatform" label="平台管理员" :options="administratorOptions" :disabled="!administratorsReady" :active="active" />
        <DecisionConfirmButton class="personnel__organization-refresh" raised label="刷新组织架构" confirm-label="确认刷新" loading-label="刷新中" loading-aria-label="正在刷新组织架构" :confirming="confirmingRefresh" :loading="organizationRefreshing" :disabled="directory.loading.value || permissionPending" @activate="confirmOrganizationRefresh" @keydown.esc="confirmingRefresh = false"><template #icon><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 7a6 6 0 1 1-.3 5M4 3v4h4" /></svg></template></DecisionConfirmButton>
      </header>
      <p v-if="organizationError" class="personnel__notice" role="alert">{{ organizationError }}</p>
      <p v-else-if="organizationFeedback" class="personnel__notice personnel__notice--success" role="status">{{ organizationFeedback }}</p>
      <p v-if="permissionError && !permissionUser" class="personnel__notice" role="alert">{{ permissionError }}</p>
      <p v-if="directory.error.value" class="personnel__notice" role="alert">{{ directory.error.value }} <button type="button" :disabled="directory.loading.value || organizationRefreshing || permissionPending" @click="refreshDirectory">重试</button></p>
      <p v-if="platformSnapshot.error" class="personnel__notice" role="status">管理员信息更新失败：{{ platformSnapshot.error }}{{ administratorsReady ? '，暂按最近一次结果展示。' : '，管理员筛选暂不可用。' }} <button type="button" :disabled="directory.loading.value || organizationRefreshing || permissionPending" @click="refreshDirectory">重试</button></p>
      <div class="personnel__list-heading"><div><h2>成员列表</h2></div><div class="personnel__list-actions"><span v-if="directory.loaded.value" aria-live="polite">{{ visibleUsers.length }} 位成员</span><RefreshButton :loading="directory.loading.value" :disabled="organizationRefreshing || permissionPending" label="刷新人员列表" :active="active" @refresh="refreshDirectory" /></div></div>
      <PersonnelPermissionsDialog :user="permissionUser" :pending="permissionPending" :error="permissionError" :can-submit="!organizationRefreshing && !permissionConflict" @close="permissionUser = null" @update="updatePermissions" />
      <ContentState class="personnel__results" :loading="directory.loading.value" :empty="directory.loaded.value && !directory.error.value && !visibleUsers.length" loading-label="正在加载成员列表">
        <TransitionGroup name="personnel-row" tag="ul" class="personnel__list" aria-label="用户列表" @before-leave="preserveLeavingPosition">
          <li v-for="user in visibleUsers" :key="user.userid" :ref="element => element ? rows.set(user.userid, element) : rows.delete(user.userid)" tabindex="-1" :class="{ 'is-located': locatedId === user.userid }" :data-user-id="user.userid"><PersonnelUserCard :user="user" @open="openPermissions(user)" /></li>
        </TransitionGroup>
        <template #empty-actions><button v-if="users.length" type="button" class="personnel__reset-filters" @click="resetFilters">清空筛选</button></template>
      </ContentState>
    </section>
    <Teleport to="body">
      <div role="status" aria-live="polite" aria-atomic="true">
        <Transition name="permission-toast">
          <div v-if="permissionFeedback" class="permission-toast">
            <span class="permission-toast__icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m6.5 12 3.5 3.5 7.5-7.5" /></svg></span>
            <span class="permission-toast__message">{{ permissionFeedback }}</span>
          </div>
        </Transition>
      </div>
    </Teleport>
  </section>
</template>
<style scoped>
.permission-toast { position: fixed; z-index: 1000; top: max(20px, env(safe-area-inset-top)); left: 50%; display: flex; align-items: center; gap: 12px; width: max-content; max-width: min(440px, calc(100vw - 32px)); padding: 10px 18px 10px 10px; color: #52665c; background: #fcfffcf5; border: 1px solid #e0ece2; border-radius: 21px; box-shadow: 0 10px 30px #47735118, inset 0 1px #fff; backdrop-filter: blur(14px); transform: translateX(-50%); pointer-events: none; font-size: 13px; line-height: 1.6; }
.permission-toast__icon { display: grid; place-items: center; flex: none; width: 34px; height: 34px; border: 2px solid #fff; border-radius: 50%; color: #fff; background: #78b58c; box-shadow: 0 2px 6px #6a9d7633, inset 0 1px #ffffff70; }
.permission-toast__icon svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
.permission-toast__message { min-width: 0; overflow-wrap: anywhere; }
.permission-toast-enter-active, .permission-toast-leave-active { transition: opacity .2s ease, transform .24s cubic-bezier(.22, 1, .36, 1); }
.permission-toast-enter-from, .permission-toast-leave-to { opacity: 0; transform: translate(-50%, -8px); }
.personnel__reset-filters { padding: 5px 12px; border: 0; background: transparent; color: #7f9387; font-size: 11px; cursor: pointer; }
.personnel { display: flex; flex-direction: column; height: 100%; min-height: 0; padding: 28px; }
.personnel__filters { display: grid; grid-template-columns: minmax(220px, 1.35fr) repeat(2, minmax(150px, 1fr)) auto; gap: 28px; flex: none; padding: 0 4px 28px; border-bottom: 1px solid #91a59826; }
.personnel__organization-refresh { width: 132px; align-self: end; margin-bottom: 5px; }
.personnel__filters > div { min-width: 0; }
.personnel__notice { margin: 14px 4px 0; color: #a17c61; font-size: 12px; line-height: 1.6; }
.personnel__notice--success { color: #61806b; }
.personnel__list-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex: none; padding: 26px 4px 20px; }
.personnel__list-heading > div { display: flex; align-items: center; gap: 12px; }
.personnel__list-heading h2 { margin: 0; color: #506458; font-size: 13px; font-weight: 550; }
.personnel__list-heading > span { color: #96a298; font-size: 11px; font-variant-numeric: tabular-nums; }
.personnel__list-actions { display: flex; align-items: center; gap: 14px; color: #96a298; font-size: 11px; }
.personnel__notice button { border: 0; background: transparent; color: #7b6c94; font: inherit; cursor: pointer; }
.personnel__results { position: relative; flex: 1; min-height: 0; overflow-y: auto; padding: 3px 4px 14px; scrollbar-width: thin; }
.personnel__list { position: relative; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin: 0; padding: 0; list-style: none; }
.personnel__list > li { min-width: 0; border-radius: 18px; outline: none; }
.personnel__list > li.is-located :deep(.personnel-user) { border-color: #96b4a0; background: linear-gradient(120deg, #f3f8f4, #eaf3ee); box-shadow: 0 0 0 3px #8aa8951f; animation: personnel-locate .8s ease; }
.personnel-row-enter-active { transition: opacity .25s ease, transform .3s ease; }
.personnel-row-leave-active { position: absolute; pointer-events: none; transition: opacity .18s ease; }
.personnel-row-move { transition: transform .3s ease; }
.personnel-row-enter-from { opacity: 0; transform: translateY(10px); }
.personnel-row-leave-to { opacity: 0; }
@keyframes personnel-locate { 0% { box-shadow: 0 0 0 0 #8aa89566; } 100% { box-shadow: 0 0 0 3px #8aa8951f; } }
@media (max-width: 1100px) { .personnel__list { grid-template-columns: repeat(2, minmax(0, 1fr)); } .personnel__filters { grid-template-columns: minmax(220px, 1.35fr) repeat(2, minmax(150px, 1fr)); gap: 20px; } .personnel__organization-refresh { grid-column: 1 / -1; justify-self: end; margin: 0 0 5px; } }
@media (max-width: 760px) { .personnel { padding: 20px 18px; min-height: 100%; height: auto; } .personnel__filters { grid-template-columns: 1fr; gap: 24px; padding-bottom: 24px; } .personnel__results { min-height: 240px; overflow: visible; } .personnel__list { grid-template-columns: 1fr; gap: 12px; } }
@media (prefers-reduced-motion: reduce) { .permission-toast-enter-active, .permission-toast-leave-active, .personnel-row-enter-active, .personnel-row-leave-active, .personnel-row-move { transition: none; } .personnel__list > li.is-located :deep(.personnel-user) { animation: none; } }
</style>
