<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import LoginView from './views/LoginView.vue'
import MolecularFieldBackground from './components/MolecularFieldBackground.vue'
import { AUTH_EXPIRED_EVENT } from './services/registryApi.js'

const router = useRouter()
const route = useRoute()
const mailboxOpen = ref(false)
const workspacePreparing = ref(false)

watch(() => route.fullPath, () => {
  mailboxOpen.value = false
  if (route.name === 'login') workspacePreparing.value = false
})

function handleAuthExpired() {
  mailboxOpen.value = false
  router.replace({
    name: 'login',
    query: { reason: 'expired', ...(route.meta.requiresAuth ? { redirect: route.fullPath } : {}) },
  })
}

window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired)
onBeforeUnmount(() => window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired))
</script>

<template>
  <main class="registry-page">
    <MolecularFieldBackground :paused="mailboxOpen" />
    <Transition name="login-ready">
      <LoginView v-if="route.name === 'login' || workspacePreparing" :preparing="workspacePreparing" @workspace-entry="workspacePreparing = $event" />
    </Transition>
    <div v-if="route.name !== 'login'" class="registry-workspace-stage" :class="{ 'is-preparing': workspacePreparing }" :inert="workspacePreparing" :aria-hidden="workspacePreparing">
      <RouterView @mailbox-change="mailboxOpen = $event" @ready="workspacePreparing = false" />
    </div>
  </main>
</template>

<style scoped>
.registry-workspace-stage { display: contents; }
.registry-workspace-stage.is-preparing { visibility: hidden; }
.login-ready-leave-active { transition: opacity .28s ease, transform .34s ease; pointer-events: none; }
.login-ready-leave-to { opacity: 0; transform: translateY(-10px); }
@media (prefers-reduced-motion: reduce) { .login-ready-leave-active { transition: none; } }
</style>
