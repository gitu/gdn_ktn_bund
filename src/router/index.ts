import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// Import view components
import HomeView from '../views/HomeView.vue'
import EnrichedDataView from '../views/EnrichedDataView.vue'
import ComparisonView from '../views/ComparisonView.vue'
import CsvTestView from '../views/CsvTestView.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: HomeView,
    meta: {
      title: 'Home',
      icon: 'mdi-home'
    }
  },
  {
    path: '/enriched-data',
    name: 'EnrichedData',
    component: EnrichedDataView,
    meta: {
      title: 'Enriched Data',
      icon: 'mdi-chart-line'
    }
  },
  {
    path: '/comparison',
    name: 'Comparison',
    component: ComparisonView,
    meta: {
      title: 'Comparison Tool',
      icon: 'mdi-compare'
    }
  },
  {
    path: '/csv-test',
    name: 'CsvTest',
    component: CsvTestView,
    meta: {
      title: 'CSV Test',
      icon: 'mdi-file-table'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// Navigation guards
router.beforeEach((to, _from, next) => {
  // Update document title
  if (to.meta.title) {
    document.title = `${to.meta.title} - Swiss Financial Data Viewer`
  }
  next()
})

export default router
