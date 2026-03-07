import { createRouter, createWebHistory } from 'vue-router'
import Auth from '../views/Auth.vue'
import Chat from '../views/Chat.vue'
import Profile from '../views/Profile.vue' // 新增

const routes = [
  { path: '/', component: Auth },
  { path: '/chat', component: Chat },
  { path: '/profile', component: Profile },// 新增
   // Admin routes
  {
      path: '/admin',
      component: () => import('@/views/admin/Admin.vue'),
      redirect: '/admin/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'admin-dashboard',
          component: () => import('@/views/admin/Dashboard.vue'),
        },
        {
          path: 'conversations',
          name: 'admin-conversations',
          component: () => import('@/views/admin/Conversation.vue'),
        },
        {
          path: 'expert-review',
          name: 'admin-expert-review',
          component: () => import('@/views/admin/ExpertReview.vue'),
        },
        {
          path: 'qa-management',
          name: 'admin-qa-management',
          component: () => import('@/views/admin/QAManagement.vue'),
        },
        {
          path: 'settings-server',
          name: 'admin-settings-server',
          component: () => import('@/views/admin/Dashboard.vue'), // Reuse dashboard for now
        },
        {
          path: 'settings-notification',
          name: 'admin-settings-notification',
          component: () => import('@/views/admin/Dashboard.vue'), // Reuse dashboard for now
        },
      ]
  }

]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫：保护私有页面
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('access_token')
  if ((to.path === '/chat' || to.path === '/profile') && !token) {
    next('/')
  } else {
    next()
  }
})

export default router