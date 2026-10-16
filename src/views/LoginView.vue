<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LoginCard from '../components/LoginCard.vue'
import { loginWithSecretKey } from '../services/registryApi.js'
import { getLoginDestination } from '../router/guards.js'

defineProps({ preparing: Boolean })
const emit = defineEmits(['workspace-entry'])
const route = useRoute()
const router = useRouter()
const loginError = ref('')
const loginNotice = ref(route.query.reason === 'expired' ? '登录状态已失效，请重新登录' : '')
const loginLoading = ref(false)
let loginController = null

watch(() => route.fullPath, () => {
  if (route.name !== 'login') return
  loginLoading.value = false
  loginError.value = ''
  loginNotice.value = route.query.reason === 'expired' ? '登录状态已失效，请重新登录' : ''
})

async function login(password) {
  if (loginLoading.value) return
  loginLoading.value = true
  loginError.value = ''
  loginNotice.value = ''
  const controller = new AbortController()
  loginController = controller
  try {
    await loginWithSecretKey(password, { signal: controller.signal })
    if (loginController === controller) {
      emit('workspace-entry', true)
      const failure = await router.replace(getLoginDestination(router, route.query.redirect))
      if (failure) emit('workspace-entry', false)
    }
  } catch (error) {
    if (loginController === controller) {
      emit('workspace-entry', false)
      if (error.name !== 'AbortError') loginError.value = error.message
    }
  } finally {
    if (loginController === controller) {
      loginController = null
      if (route.name === 'login') loginLoading.value = false
    }
  }
}

onBeforeUnmount(() => {
  loginController?.abort()
  loginController = null
})
</script>

<template>
  <section class="registry-page__login">
    <LoginCard
      :loading="loginLoading"
      :preparing="preparing"
      :error="loginError"
      :notice="loginNotice"
      @input="loginError = ''; loginNotice = ''"
      @submit="login"
    />
  </section>
</template>
