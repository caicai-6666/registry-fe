import { createRouter, createWebHistory } from 'vue-router'

const WorkspaceLayout = () => import('./layouts/WorkspaceLayout.vue')
const WorkspaceView = () => import('./views/WorkspaceView.vue')
const ReviewSquareView = () => import('./views/ReviewSquareView.vue')
const PersonnelView = () => import('./views/PersonnelView.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: WorkspaceLayout,
      children: [
        { path: '', redirect: { name: 'data-center' } },
        { path: 'data-center', name: 'data-center', component: WorkspaceView, meta: { title: '数据中心' } },
        { path: 'review-square', name: 'review-square', component: ReviewSquareView, meta: { title: '审核广场' } },
        { path: 'personnel', name: 'personnel', component: PersonnelView, meta: { title: '人员管理' } },
      ],
    },
    { path: '/workspace', redirect: to => ({ name: 'data-center', query: to.query, hash: to.hash }) },
    { path: '/:pathMatch(.*)*', redirect: { name: 'data-center', params: {} } },
  ],
})


export default router
