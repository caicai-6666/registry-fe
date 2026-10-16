import { createRouter, createWebHistory } from 'vue-router'
import LoginView from './views/LoginView.vue'
import WorkspaceLayout from './layouts/WorkspaceLayout.vue'
import WorkspaceView from './views/WorkspaceView.vue'
import ReviewSquareView from './views/ReviewSquareView.vue'
import PersonnelView from './views/PersonnelView.vue'
import { getAuthSession } from './services/registryApi.js'
import { createAuthGuard } from './router/guards.js'

// 三个命名视图共用滑动轨道，路由决定当前可见的分区。
const registryViews = {
  'data-center': WorkspaceView,
  'review-square': ReviewSquareView,
  personnel: PersonnelView,
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'login', component: LoginView, meta: { guestOnly: true } },
    {
      path: '/',
      component: WorkspaceLayout,
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: { name: 'data-center' } },
        { path: 'data-center', name: 'data-center', components: registryViews, meta: { title: '数据中心' } },
        { path: 'review-square', name: 'review-square', components: registryViews, meta: { title: '审核广场' } },
        { path: 'personnel', name: 'personnel', components: registryViews, meta: { title: '人员管理' } },
      ],
    },
    { path: '/workspace', redirect: to => ({ name: 'data-center', query: to.query, hash: to.hash }) },
    { path: '/:pathMatch(.*)*', redirect: { name: 'data-center', params: {} } },
  ],
})

router.beforeEach(createAuthGuard(getAuthSession))

export default router
