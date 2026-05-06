import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/setup', component: () => import('../views/SetupView.vue') },
  { path: '/dashboard', component: () => import('../views/DashboardView.vue') },
  { path: '/diff', component: () => import('../views/ClusterDiffView.vue') },
  { path: '/resources', component: () => import('../views/ResourcesView.vue') },
  { path: '/bundles', component: () => import('../views/BundleExplorer.vue') },
  { path: '/bundles/:id', component: () => import('../views/BundleDetail.vue') },
  { path: '/plan', component: () => import('../views/PlanView.vue') },
  { path: '/migrate/:id', component: () => import('../views/ProgressView.vue') },
  { path: '/report/:id', component: () => import('../views/ReportView.vue') },
  { path: '/history', component: () => import('../views/MigrationHistory.vue') },
  { path: '/settings', component: () => import('../views/SettingsView.vue') },
]

export default createRouter({
  history: createWebHashHistory(),
  routes,
})
