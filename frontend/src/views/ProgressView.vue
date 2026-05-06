<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMigrationStore } from '@/stores/migration'
import { useToastStore } from '@/stores/toasts'
import { useWebSocket } from '@/composables/useWebSocket'
import { api } from '@/composables/useApi'
import type { WSEvent } from '@/types'

const route = useRoute()
const router = useRouter()
const store = useMigrationStore()
const toastStore = useToastStore()

const jobId = route.params.id as string
const completed = ref(false)
const paused = ref(false)

function onEvent(ev: WSEvent) {
  if (ev.status || ev.message) {
    store.addLog({
      resource: ev.resource || '',
      namespace: ev.namespace || '',
      kind: ev.kind || '',
      status: ev.status || '',
      message: ev.message || '',
      timestamp: ev.timestamp,
    })
    if (ev.progress) store.updateProgress(ev.progress)
  }
  if (ev.event === 'migration_completed') {
    completed.value = true
    const hasFailures = ev.progress && ev.progress.failed > 0
    if (hasFailures) {
      toastStore.addToast('Migration had failures', 'warning')
    } else {
      toastStore.addToast('Migration completed!', 'success')
    }
  }
  if (ev.event === 'migration_cancelled') {
    completed.value = true
    toastStore.addToast('Migration cancelled', 'info')
  }
}

const { connected, connect } = useWebSocket(jobId, onEvent)

onMounted(async () => {
  try {
    const job = await api.getJob(jobId) as unknown
    store.setJob(job as never)
  } catch { /* silently fail */ }
  connect()
  if (!connected.value) connect()
})

const progressPct = computed(() => {
  if (!store.currentJob?.progress.total) return 0
  return Math.round((store.currentJob.progress.completed / store.currentJob.progress.total) * 100)
})

function statusColor(status: string): string {
  if (status === 'success') return 'text-emerald-400'
  if (status === 'skipped') return 'text-amber-400'
  if (status === 'failed') return 'text-red-400'
  return 'text-gray-400'
}

async function cancelMigration() {
  try {
    await api.cancelJob(jobId)
  } catch { /* silently fail */ }
}

function viewReport() {
  router.push(`/report/${jobId}`)
}
</script>

<template>
  <div class="p-6 space-y-6">
    <div>
      <div class="flex items-center gap-2 text-xs text-gray-500 mb-2">
        <router-link to="/dashboard" class="hover:text-gray-300 transition-colors">Dashboard</router-link>
        <span>/</span>
        <router-link to="/plan" class="hover:text-gray-300 transition-colors">Plan</router-link>
        <span>/</span>
        <span class="text-gray-100">Migration Progress</span>
      </div>
      <h1 class="text-xl font-semibold text-gray-100 mb-1">Migration Progress</h1>
      <p class="text-sm text-gray-400 font-mono">Job: {{ jobId }}</p>
    </div>

    <div class="border border-gray-800 rounded-lg p-5 bg-gray-900">
      <div class="flex justify-between text-sm mb-2">
        <span class="text-gray-300 font-semibold">{{ progressPct }}%</span>
        <span v-if="store.currentJob" class="text-gray-400">
          {{ store.currentJob.progress.completed }} / {{ store.currentJob.progress.total }}
        </span>
      </div>
      <div class="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
        <div class="h-full bg-indigo-600 transition-all duration-300 rounded-full" :style="{ width: progressPct + '%' }" />
      </div>
      <div class="flex gap-6 mt-3 text-xs">
        <span class="text-emerald-400">Success: {{ store.currentJob?.progress.success || 0 }}</span>
        <span class="text-amber-400">Skipped: {{ store.currentJob?.progress.skipped || 0 }}</span>
        <span class="text-red-400">Failed: {{ store.currentJob?.progress.failed || 0 }}</span>
      </div>
      <div class="mt-2">
        <span v-if="connected" class="text-xs text-emerald-400 flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
        </span>
        <span v-else class="text-xs text-red-400">Disconnected</span>
      </div>
    </div>

    <div class="flex gap-4">
      <button
        v-if="!completed"
        @click="cancelMigration"
        class="px-4 py-2 border border-red-800 text-red-400 rounded-lg text-sm hover:bg-red-900/20 transition-colors"
      >
        Cancel Migration
      </button>
      <button
        @click="viewReport"
        class="px-4 py-2 bg-indigo-600/10 border border-indigo-600/20 text-indigo-400 rounded-lg text-sm hover:bg-indigo-600/20 transition-colors"
      >
        View Report
      </button>
    </div>

    <div class="border border-gray-800 rounded-lg bg-gray-900 overflow-hidden">
      <div class="max-h-96 overflow-y-auto">
        <div
          v-for="(log, i) in store.logs"
          :key="i"
          class="px-4 py-2.5 border-b border-gray-800 text-sm font-mono hover:bg-gray-800/30 transition-colors"
        >
          <span class="text-gray-500">{{ log.timestamp.slice(11, 19) }}</span>
          <span class="ml-3" :class="statusColor(log.status)">[{{ log.status.toUpperCase() }}]</span>
          <span class="ml-2 text-gray-300">{{ log.resource || log.kind || 'Migration' }}</span>
          <span v-if="log.message" class="ml-2 text-gray-500">{{ log.message }}</span>
        </div>
        <div v-if="store.logs.length === 0" class="px-4 py-8 text-center text-gray-500">
          Waiting for events...
        </div>
      </div>
    </div>
  </div>
</template>
