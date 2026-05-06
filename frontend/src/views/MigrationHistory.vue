<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useClusterStore } from '@/stores/cluster'
import { api } from '@/composables/useApi'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import type { MigrationHistoryItem } from '@/types'

const router = useRouter()
const clusterStore = useClusterStore()

const loading = ref(true)
const items = ref<MigrationHistoryItem[]>([])

const filterStatus = ref('')
const filterDateStart = ref('')
const filterDateEnd = ref('')

const filteredItems = computed(() => {
  return items.value.filter(item => {
    if (filterStatus.value && item.status !== filterStatus.value) return false
    if (filterDateStart.value && item.startedAt < filterDateStart.value) return false
    if (filterDateEnd.value && item.startedAt > filterDateEnd.value) return false
    return true
  })
})

function statusColor(status: string): string {
  switch (status) {
    case 'completed': return 'bg-emerald-900/50 text-emerald-300 border-emerald-700/30'
    case 'failed': return 'bg-red-900/50 text-red-300 border-red-700/30'
    case 'running': return 'bg-indigo-900/50 text-indigo-300 border-indigo-700/30'
    case 'cancelled': return 'bg-amber-900/50 text-amber-300 border-amber-700/30'
    default: return 'bg-gray-800 text-gray-400 border-gray-700'
  }
}

function navigateToReport(id: string): void {
  router.push(`/report/${id}`)
}

onMounted(async () => {
  try {
    const data = await api.getMigrationHistory()
    items.value = data as MigrationHistoryItem[]
  } catch {
    items.value = []
  }
  loading.value = false
})
</script>

<template>
  <div class="p-6 space-y-6">
    <div>
      <h1 class="text-xl font-semibold text-gray-100 mb-1">Migration History</h1>
      <p class="text-sm text-gray-400">{{ items.length }} migration jobs recorded</p>
    </div>

    <div class="flex gap-3 flex-wrap">
      <select v-model="filterStatus" class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none">
        <option value="">All Statuses</option>
        <option value="completed">Completed</option>
        <option value="failed">Failed</option>
        <option value="running">Running</option>
        <option value="cancelled">Cancelled</option>
      </select>
      <div class="flex items-center gap-2 text-xs text-gray-400">
        From:
        <input v-model="filterDateStart" type="date" class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none" />
      </div>
      <div class="flex items-center gap-2 text-xs text-gray-400">
        To:
        <input v-model="filterDateEnd" type="date" class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none" />
      </div>
    </div>

    <div v-if="loading">
      <LoadingSkeleton :count="5" />
    </div>

    <div v-else-if="filteredItems.length === 0" class="text-center py-16 text-gray-500">
      <div class="text-4xl mb-4">&#9776;</div>
      <p>No migrations yet. Start your first migration.</p>
      <button
        @click="router.push('/resources')"
        class="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors"
      >
        Discover Resources
      </button>
    </div>

    <div v-else class="border border-gray-800 rounded-lg overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-800">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Source</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Target</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Bundles</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Resources</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Success Rate</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Duration</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in filteredItems"
            :key="item.id"
            @click="navigateToReport(item.id)"
            class="border-t border-gray-800 hover:bg-gray-800/30 transition-colors cursor-pointer"
          >
            <td class="px-4 py-3 text-xs text-gray-300 font-mono">{{ item.startedAt.slice(0, 19) }}</td>
            <td class="px-4 py-3 text-xs text-gray-300">{{ item.sourceCluster }}</td>
            <td class="px-4 py-3 text-xs text-gray-300">{{ item.targetCluster }}</td>
            <td class="px-4 py-3 text-xs text-gray-400">{{ item.bundleCount }}</td>
            <td class="px-4 py-3 text-xs text-gray-400">{{ item.resourceCount }}</td>
            <td class="px-4 py-3 text-xs">
              <span :class="item.successRate >= 90 ? 'text-emerald-400' : item.successRate >= 50 ? 'text-amber-400' : 'text-red-400'">
                {{ item.successRate }}%
              </span>
            </td>
            <td class="px-4 py-3 text-xs text-gray-400 font-mono">{{ item.duration }}</td>
            <td class="px-4 py-3">
              <span class="text-xs px-2 py-0.5 rounded-full border" :class="statusColor(item.status)">
                {{ item.status }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
