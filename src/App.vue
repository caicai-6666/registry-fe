<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import RegistryLoading from './components/RegistryLoading.vue'
import MolecularFieldBackground from './components/MolecularFieldBackground.vue'
import { AUTH_EXPIRED_EVENT, ACCESS_DENIED_EVENT, KNOWLEDGE_ENTRY_PATH, getAccessToken } from './services/registryApi.js'

const router = useRouter()
const route = useRoute()
const mailboxOpen = ref(false)
const workspacePreparing = ref(true)
const initialRouteReady = ref(false)
const startupError = ref('')
const accessIssue = ref(null)
const accessIssueTitle = computed(() => accessIssue.value === 'missing' ? '请从知识沉淀入口进入' : accessIssue.value === 'expired' ? '登录状态已失效' : '暂无注册中心访问权限')
const accessIssueMessage = computed(() => accessIssue.value === 'denied' ? '请返回知识沉淀入口，选择可访问的平台。' : '请返回知识沉淀入口后重新进入注册中心。')
const entryBusy = computed(() => !initialRouteReady.value || workspacePreparing.value)
function finishWorkspaceEntry() { workspacePreparing.value = false }

router.isReady().then(() => {
  if (!getAccessToken()) { accessIssue.value = 'missing'; finishWorkspaceEntry() }
  initialRouteReady.value = true
}).catch(() => {
  initialRouteReady.value = true
  startupError.value = '页面初始化失败，请重新加载'
})
function reload() { window.location.reload() }

watch(() => route.fullPath, () => {
  mailboxOpen.value = false
})

function handleAuthExpired() {
  accessIssue.value = 'expired'
  mailboxOpen.value = false
  finishWorkspaceEntry()
}

function handleAccessDenied() {
  accessIssue.value = 'denied'
  mailboxOpen.value = false
  finishWorkspaceEntry()
}
window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired)
window.addEventListener(ACCESS_DENIED_EVENT, handleAccessDenied)
onBeforeUnmount(() => {
  window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired)
  window.removeEventListener(ACCESS_DENIED_EVENT, handleAccessDenied)
})
</script>

<template>
  <main class="registry-page">
    <MolecularFieldBackground :paused="mailboxOpen" />
    <div v-if="initialRouteReady && !startupError && !accessIssue" class="registry-workspace-stage" :class="{ 'is-ready': !entryBusy, 'is-preparing': entryBusy }" :inert="entryBusy" :aria-hidden="entryBusy">
      <RouterView @mailbox-change="mailboxOpen = $event" @ready="finishWorkspaceEntry" />
    </div>
    <Transition name="access-denied" appear>
      <section v-if="accessIssue" class="registry-access-denied" role="alert" aria-labelledby="access-denied-title" data-molecular-field-block>
        <h1 id="access-denied-title">{{ accessIssueTitle }}</h1>
        <p>{{ accessIssueMessage }}</p>
        <a :href="KNOWLEDGE_ENTRY_PATH">返回知识沉淀</a>
      </section>
    </Transition>
    <Transition name="entry-loading">
      <div v-if="!accessIssue && (entryBusy || startupError)" class="registry-entry-loading">
        <RegistryLoading v-if="!startupError" />
        <div v-else class="registry-entry-error" role="alert"><p>{{ startupError }}</p><button type="button" @click="reload">重新加载</button></div>
      </div>
    </Transition>
  </main>
</template>

<style scoped>
.registry-access-denied { position: absolute; top: 50%; left: 50%; translate: -50% -50%; z-index: 2; width: min(440px, calc(100% - 48px)); margin: auto; padding: 38px 32px; border: 1px solid #ffffffdb; border-radius: 24px; background: #ffffffc9; box-shadow: 0 22px 60px #33473d1c; backdrop-filter: blur(22px); text-align: center; }
.registry-access-denied h1 { margin: 0; color: #2e4538; font-size: 22px; font-weight: 500; }
.registry-access-denied p { margin: 16px 0 26px; color: #75877b; font-size: 13px; line-height: 1.8; }
/* From Uiverse.io by ke1221 */
.registry-access-denied a { display: inline-flex; justify-content: center; color: #090909; padding: .7em 1.7em; font-size: 18px; border-radius: .5em; background: #e8e8e8; cursor: pointer; border: 1px solid #e8e8e8; text-decoration: none; transition: color .3s, box-shadow .3s; box-shadow: 6px 6px 12px #c5c5c5, -6px -6px 12px #fff; }
.registry-access-denied a:active { color: #666; box-shadow: inset 4px 4px 12px #c5c5c5, inset -4px -4px 12px #fff; }
.registry-access-denied a:focus-visible { outline: 2px solid #7d9e89; outline-offset: 4px; }
.access-denied-enter-active { transition: opacity .3s ease, transform .3s ease; }
.access-denied-enter-from { opacity: 0; transform: translateY(8px); }
.registry-workspace-stage { position: absolute; inset: 0; opacity: 0; visibility: hidden; pointer-events: none; transition: opacity .55s ease; }
.registry-workspace-stage.is-ready { opacity: 1; visibility: visible; pointer-events: auto; }
.registry-entry-loading { position: absolute; z-index: 3; inset: 0; display: grid; place-items: center; }
.registry-entry-error { color: #708378; text-align: center; font-size: 13px; }
.registry-entry-error button { margin-top: 8px; padding: 8px 18px; border: 1px solid #ccd8cf; border-radius: 8px; background: #fff; color: #486451; cursor: pointer; }
.entry-loading-leave-active { transition: opacity .28s ease; pointer-events: none; }
.entry-loading-leave-to { opacity: 0; }
@media (prefers-reduced-motion: reduce) { .registry-access-denied a, .access-denied-enter-active, .registry-workspace-stage, .entry-loading-leave-active { transition: none; } }
</style>
