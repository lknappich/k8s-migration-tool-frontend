<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useClusterStore } from '@/stores/cluster'
import { useMigrationStore } from '@/stores/migration'
import { api } from '@/composables/useApi'
import { useToastStore } from '@/stores/toasts'
import type { BundleAnalysisProgress } from '@/types'

const router = useRouter()
const clusterStore = useClusterStore()
const migrationStore = useMigrationStore()
const toastStore = useToastStore()

const analyzing = ref(false)
const analysisJobId = ref<string | null>(null)
const progress = ref<BundleAnalysisProgress | null>(null)
let pollTimer: ReturnType<typeof setInterval> | null = null

async function startAnalysis(): Promise<void> {
  analyzing.value = true
  progress.value = null
  try {
    const { jobId } = await api.startBundleAnalysis()
    analysisJobId.value = jobId
    pollTimer = setInterval(async () => {
      try {
        progress.value = await api.getBundleAnalysisStatus(jobId)
        if (progress.value.status === 'completed' || progress.value.status === 'failed') {
          clearInterval(pollTimer!)
          analyzing.value = false
          if (progress.value.status === 'completed') {
            const result = await api.getBundleResult(jobId)
            const bundles = result.bundles
            const allResources = bundles.flatMap(b => b.resources)
            clusterStore.setResources(allResources.map(r => ({
              kind: r.kind,
              name: r.name,
              namespace: r.namespace,
              apiVersion: '',
              raw: '',
              labels: {},
              annotations: {},
            })))
            for (let i = 0; i < clusterStore.resources.length; i++) {
              (clusterStore.resources[i] as unknown as Record<string, boolean>)._selected = true
            }
            toastStore.addToast(`AI analysis complete: ${bundles.length} bundles created`, 'info')
            router.push('/bundles')
          }
        }
      } catch {
        clearInterval(pollTimer!)
        analyzing.value = false
        progress.value = null
      }
    }, 2000)
  } catch {
    analyzing.value = false
    toastStore.addToast('Failed to start bundle analysis', 'error')
  }
}

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

      <div>
        <div class="border border-indigo-800/50 rounded-lg p-5 bg-indigo-900/10">
          <h2 class="text-sm font-semibold text-indigo-400 uppercase tracking-wider mb-3">AI Bundle Analysis</h2>
          <p class="text-xs text-gray-400 mb-4">Use AI to intelligently group resources into migration bundles based on naming conventions, label patterns, and resource relationships.</p>
          <button @click="startAnalysis" :disabled="analyzing" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 rounded-lg text-sm font-semibold transition-colors">
            {{ analyzing ? 'Analyzing...' : 'Analyze Bundles' }}
          </button>
          <div v-if="analyzing && progress" class="mt-4">
            <div class="flex items-center gap-2 mb-2">
              <div class="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div class="h-full bg-indigo-500 rounded-full transition-all duration-500" :style="{ width: progress.pct + '%' }" />
              </div>
              <span class="text-xs text-gray-400">{{ progress.pct }}%</span>
            </div>
            <p class="text-xs text-gray-500">{{ progress.phase }}: {{ progress.detail }}</p>
          </div>
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
