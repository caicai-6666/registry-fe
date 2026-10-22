<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { createPlatformDirectory, PLATFORM_DIRECTORY_KEY, PLATFORM_REFRESH_KEY } from '../services/platformDirectory.js'
import ReviewHistoryDialog from '../components/ReviewHistoryDialog.vue'
import logoUrl from '../assets/logo.webp'
import mailboxUrl from '../assets/mailbox.webp'
import { fetchCurrentUser, getAccessToken, KNOWLEDGE_ENTRY_PATH } from '../services/registryApi.js'

const emit = defineEmits(['mailbox-change', 'ready'])
const route = useRoute()
const userName = ref('')
const identityController = new AbortController()
onMounted(() => {
  const token = getAccessToken()
  void fetchCurrentUser({ signal: identityController.signal }).then(user => {
    if (getAccessToken() === token) userName.value = user.username.trim()
  }).catch(() => { /* 用户资料失败不阻塞业务，401/403 由统一入口处理。 */ })
})
onBeforeUnmount(() => identityController.abort())
const mailboxOpen = ref(false)
const platformDirectory = createPlatformDirectory()
const platformSnapshot = platformDirectory.state
provide(PLATFORM_DIRECTORY_KEY, platformSnapshot)
provide(PLATFORM_REFRESH_KEY, () => platformDirectory.refresh())
function updatePlatformMonitoring() {
  if ((['data-center', 'review-square', 'personnel'].includes(route.name) || mailboxOpen.value) && document.visibilityState !== 'hidden') {
    void platformDirectory.start().then(() => { platformsReady = true; void revealWhenReady() })
  }
  else platformDirectory.stop()
}
watch([() => route.name, mailboxOpen], updatePlatformMonitoring)
onMounted(() => { document.addEventListener('visibilitychange', updatePlatformMonitoring); updatePlatformMonitoring() })
onBeforeUnmount(() => { document.removeEventListener('visibilitychange', updatePlatformMonitoring); platformDirectory.stop() })
const workspaceElement = ref(null)
let disposed = false
let pageReady = false
let platformsReady = false
let revealing = false
let imageTimer
function handleInitialReady() { pageReady = true; void revealWhenReady() }
async function revealWhenReady() {
  if (!pageReady || !platformsReady || revealing || disposed) return
  revealing = true
  await nextTick()
  const element = workspaceElement.value
  if (!element) return
  const images = [...element.querySelectorAll('img')]
  await Promise.race([
    Promise.allSettled(images.map(image => image.decode())),
    new Promise(resolve => { imageTimer = setTimeout(resolve, 5000) }),
  ])
  clearTimeout(imageTimer)
  // 仅等待有限的入场动画，呼吸灯等循环动画不阻塞进入。
  await Promise.allSettled((element.getAnimations?.({ subtree: true }) || [])
    .filter(animation => animation.effect?.getComputedTiming().iterations !== Infinity)
    .map(animation => animation.finished))
  await nextTick()
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  if (!disposed) emit('ready')
}
onMounted(() => { void revealWhenReady() })
onBeforeUnmount(() => { disposed = true; clearTimeout(imageTimer) })
const navigationItems = [
  { name: 'data-center', label: '数据中心' },
  { name: 'review-square', label: '审核广场' },
  { name: 'personnel', label: '人员管理' },
]
const activeSection = computed(() => Math.max(0, navigationItems.findIndex(item => item.name === route.name)))
const pageTransition = ref('workspace-slide-forward')
watch(activeSection, (index, previous) => { pageTransition.value = index >= previous ? 'workspace-slide-forward' : 'workspace-slide-backward' }, { flush: 'sync' })

watch(mailboxOpen, open => emit('mailbox-change', open), { flush: 'sync' })
watch(() => route.fullPath, () => { mailboxOpen.value = false })
onBeforeUnmount(() => emit('mailbox-change', false))

</script>

<template>
  <Transition name="workspace-enter" appear @before-leave="element => { element.inert = true }">
    <section
      ref="workspaceElement"
      class="workspace"
      aria-labelledby="workspace-title"
      data-molecular-field-block
    >
      <header class="workspace__header">
        <div class="workspace__brand">
          <span class="workspace__logo-wrap">
            <img :src="logoUrl" alt="" draggable="false" />
          </span>
          <h1 id="workspace-title">注册中心</h1>
        </div>

        <nav class="workspace__nav" :style="{ '--navigation-index': activeSection }" aria-label="注册中心导航">
          <span class="workspace__nav-slider" aria-hidden="true"></span>
          <RouterLink v-for="(item, index) in navigationItems" :key="item.name" :to="{ name: item.name }" :style="{ gridColumn: index + 1 }" class="workspace__nav-item">{{ item.label }}</RouterLink>
        </nav>

        <div class="workspace__identity">
          <span v-if="userName" class="workspace__user" :title="userName">{{ userName }}</span>
          <button
            type="button"
            class="workspace__mailbox"
            aria-label="打开审核记录"
            aria-haspopup="dialog"
            :aria-expanded="mailboxOpen"
            title="审核记录"
            @click="mailboxOpen = true"
          >
            <img :src="mailboxUrl" alt="" draggable="false" />
          </button>
          <a
            :href="KNOWLEDGE_ENTRY_PATH"
            class="workspace__return"
            aria-label="返回知识沉淀"
            title="返回知识沉淀"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 7 4 12l5 5M4 12h11M14 5h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-4" />
            </svg>
          </a>
        </div>
      </header>

      <div class="workspace__content" role="region" :aria-label="`${route.meta.title}内容`">
        <RouterView v-slot="{ Component, route: pageRoute }">
          <Transition :name="pageTransition" @before-enter="element => { element.inert = false }" @before-leave="element => { element.inert = true }" @leave-cancelled="element => { element.inert = false }">
            <KeepAlive :max="3">
              <component :is="Component" :key="pageRoute.name" @initial-ready="handleInitialReady" />
            </KeepAlive>
          </Transition>
        </RouterView>
      </div>
    </section>
  </Transition>
  <ReviewHistoryDialog :open="mailboxOpen" :platforms="platformSnapshot.platforms" @close="mailboxOpen = false" />
</template>
