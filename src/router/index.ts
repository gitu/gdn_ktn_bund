import AppLayout from '@/layout/AppLayout.vue';
import {createRouter, createWebHistory} from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: AppLayout,
      children: [
        {
          path: '/',
          name: 'home',
          component: HomeView,
        },
        {
          path: '/about',
          name: 'about',
          component: () => import('@/views/AboutView.vue'),
        },
        {
          path: '/financial-comparison',
          name: 'financial-comparison',
          component: () => import('@/views/FinancialDataComparisonView.vue'),
        },
      ],
    },
  ],
})

export default router
