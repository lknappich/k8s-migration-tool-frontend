<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useClusterStore } from '@/stores/cluster'
import ToastContainer from '@/components/ToastContainer.vue'

const route = useRoute()
const clusterStore = useClusterStore()

function isActive(path: string): boolean {
  return route.path.startsWith(path)
}

const navItems = [
  { path: '/setup', label: 'Setup', icon: '\u2699' },
  { path: '/dashboard', label: 'Dashboard', icon: '\u25A0' },
  { path: '/diff', label: 'Cluster Diff', icon: '\u21C4' },
  { path: '/resources', label: 'Resources', icon: '\u2630' },
  { path: '/bundles', label: 'Bundles', icon: '\u25A6' },
  { path: '/history', label: 'History', icon: '\u29D6' },
  { path: '/settings', label: 'Settings', icon: '\u2699' },
]

const activeClasses = 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20'
const inactiveClasses = 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
</script>

<template>
  <div class="h-screen flex bg-gray-950">
    <aside class="w-64 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
      <div class="px-6 py-5 border-b border-gray-800">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-sm font-bold text-white">K8</div>
          <span class="font-semibold text-gray-100 text-base">K8s Migrate</span>
        </div>
      </div>
      <nav class="flex-1 px-3 py-4 space-y-1">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
          :class="isActive(item.path) ? activeClasses : inactiveClasses"
        >
          <span class="text-lg w-6 text-center">{{ item.icon }}</span>
          {{ item.label }}
        </router-link>
      </nav>
      <div class="px-4 py-3 border-t border-gray-800 text-xs text-gray-500">
        v0.1.0
      </div>
    </aside>

    <div class="flex-1 flex flex-col overflow-hidden">
      <header class="h-14 border-b border-gray-800 flex items-center px-6 shrink-0 bg-gray-900/50">
        <div class="flex-1" />
        <div class="flex items-center gap-3">
          <span v-if="clusterStore.configured" class="flex items-center gap-1.5 text-xs">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span class="text-gray-400">Connected</span>
          </span>
          <span v-else class="flex items-center gap-1.5 text-xs">
            <span class="w-2 h-2 rounded-full bg-gray-600" />
            <span class="text-gray-500">Not configured</span>
          </span>
        </div>
      </header>

      <main class="flex-1 overflow-auto">
        <router-view />
      </main>
    </div>

    <ToastContainer />
  </div>
</template>
