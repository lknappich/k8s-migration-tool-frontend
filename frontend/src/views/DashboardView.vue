<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useClusterStore } from '@/stores/cluster'
import { useMigrationStore } from '@/stores/migration'

const router = useRouter()
const clusterStore = useClusterStore()
const migrationStore = useMigrationStore()

function navigateToSetup() { router.push('/setup') }
function navigateToResources() { router.push('/resources') }
function viewLastReport() {
  if (migrationStore.currentJob) {
    router.push(`/report/${migrationStore.currentJob.id}`)
  }
}
</script>

<template>
  <div class="h-full" v-if="clusterStore.configured">
    <div class="p-6 space-y-6">
      <div>
        <h1 class="text-xl font-semibold text-gray-100 mb-1">Dashboard</h1>
        <p class="text-sm text-gray-400">Cluster status and quick actions</p>
      </div>

      <div>
        <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Ready to Migrate</h2>
        <div class="grid grid-cols-2 gap-4">
          <div class="border border-gray-800 rounded-lg p-5 bg-gray-900">
            <div class="text-xs text-gray-500 mb-1">Source Cluster</div>
            <div class="text-lg font-semibold text-gray-100">{{ clusterStore.sourceInfo?.name || 'Unknown' }}</div>
            <div class="flex gap-6 mt-3">
              <div>
                <div class="text-xs text-gray-500">Version</div>
                <div class="text-sm text-gray-300 font-mono">{{ clusterStore.sourceInfo?.version || '-' }}</div>
              </div>
              <div>
                <div class="text-xs text-gray-500">Nodes</div>
                <div class="text-sm text-gray-300">{{ clusterStore.sourceInfo?.nodeCount ?? '-' }}</div>
              </div>
            </div>
          </div>
          <div class="border border-gray-800 rounded-lg p-5 bg-gray-900">
            <div class="text-xs text-gray-500 mb-1">Target Cluster</div>
            <div class="text-lg font-semibold text-gray-100">{{ clusterStore.targetInfo?.name || 'Unknown' }}</div>
            <div class="flex gap-6 mt-3">
              <div>
                <div class="text-xs text-gray-500">Version</div>
                <div class="text-sm text-gray-300 font-mono">{{ clusterStore.targetInfo?.version || '-' }}</div>
              </div>
              <div>
                <div class="text-xs text-gray-500">Nodes</div>
                <div class="text-sm text-gray-300">{{ clusterStore.targetInfo?.nodeCount ?? '-' }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Actions</h2>
        <div class="flex gap-4">
          <button
            @click="navigateToResources"
            class="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            <span class="text-base">&#9654;</span> Start New Migration
          </button>
          <button
            v-if="migrationStore.currentJob"
            @click="viewLastReport"
            class="flex items-center gap-2 px-5 py-3 border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-gray-100 rounded-lg text-sm font-semibold transition-colors"
          >
            View Last Report
          </button>
          <button
            @click="navigateToResources"
            class="flex items-center gap-2 px-5 py-3 border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-gray-100 rounded-lg text-sm font-semibold transition-colors"
          >
            Discover Resources
          </button>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="h-full flex items-center justify-center">
    <div class="text-center">
      <div class="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center mx-auto mb-4">
        <span class="text-2xl text-gray-500">&#8592;</span>
      </div>
      <p class="text-gray-400 text-lg mb-6">Connect your clusters to begin</p>
      <button
        @click="navigateToSetup"
        class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors"
      >
        Go to Setup
      </button>
    </div>
  </div>
</template>
