import { createRouter, createWebHistory } from 'vue-router'
// 提前加载工作台布局代码，首次切换不等待模块下载；业务数据由内容区展示加载状态。
import WorkspaceView from './views/WorkspaceView.vue'
import ReviewSquareView from './views/ReviewSquareView.vue'
import PersonnelView from './views/PersonnelView.vue'

const WorkspaceLayout = () => import('./layouts/WorkspaceLayout.vue')

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
