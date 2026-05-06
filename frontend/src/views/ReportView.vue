<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/composables/useApi'
import type { MigrationJob, ResourceResult } from '@/types'

const route = useRoute()
const jobId = route.params.id as string
const job = ref<MigrationJob | null>(null)
const loading = ref(true)
const filterStatus = ref('')

onMounted(async () => {
  try {
    job.value = await api.getJob(jobId) as MigrationJob
  } catch { /* silently fail */ }
  loading.value = false
})

function filteredResults(): ResourceResult[] {
  if (!job.value) return []
  if (!filterStatus.value) return job.value.results
  return job.value.results.filter(r => r.status === filterStatus.value)
}

function statusColor(status: string): string {
  if (status === 'success') return 'text-emerald-400'
  if (status === 'skipped') return 'text-amber-400'
  if (status === 'failed') return 'text-red-400'
  return 'text-gray-400'
}

async function downloadReport(format: string) {
  try {
    const data = await api.getReport(jobId, format)
    const blob = new Blob([typeof data === 'string' ? data : JSON.stringify(data, null, 2)], {
      type: format === 'yaml' ? 'application/x-yaml' : 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `migration-${jobId}.${format}`
    a.click()
    URL.revokeObjectURL(url)
  } catch { /* silently fail */ }
}
</script>

<template>
  <div class="p-6 space-y-6">
    <div>
      <div class="flex items-center gap-2 text-xs text-gray-500 mb-2">
        <router-link to="/dashboard" class="hover:text-gray-300 transition-colors">Dashboard</router-link>
        <span>/</span>
        <span class="text-gray-100">Migration Report</span>
      </div>
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-semibold text-gray-100 mb-1">Migration Report</h1>
          <p class="text-sm text-gray-400 font-mono">Job: {{ jobId }}</p>
        </div>
        <div class="flex gap-3">
          <button @click="downloadReport('json')" class="px-4 py-2 border border-gray-700 hover:border-gray-600 rounded-lg text-sm text-gray-300 hover:text-gray-100 transition-colors">
            Download JSON
          </button>
          <button @click="downloadReport('yaml')" class="px-4 py-2 border border-gray-700 hover:border-gray-600 rounded-lg text-sm text-gray-300 hover:text-gray-100 transition-colors">
            Download YAML
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-gray-400 py-12 text-center text-sm">Loading report...</div>

    <div v-else-if="job" class="space-y-6">
      <div class="grid grid-cols-4 gap-4">
        <div class="border border-gray-800 rounded-lg p-5 bg-gray-900 text-center">
          <div class="text-3xl font-bold text-emerald-400">{{ job.progress.success }}</div>
          <div class="text-xs text-gray-500 mt-1">Success</div>
        </div>
        <div class="border border-gray-800 rounded-lg p-5 bg-gray-900 text-center">
          <div class="text-3xl font-bold text-amber-400">{{ job.progress.skipped }}</div>
          <div class="text-xs text-gray-500 mt-1">Skipped</div>
        </div>
        <div class="border border-gray-800 rounded-lg p-5 bg-gray-900 text-center">
          <div class="text-3xl font-bold text-red-400">{{ job.progress.failed }}</div>
          <div class="text-xs text-gray-500 mt-1">Failed</div>
        </div>
        <div class="border border-gray-800 rounded-lg p-5 bg-gray-900 text-center">
          <div class="text-3xl font-bold text-gray-200">{{ job.progress.total }}</div>
          <div class="text-xs text-gray-500 mt-1">Total</div>
        </div>
      </div>

      <div class="flex items-center gap-4">
        <span class="text-sm text-gray-400">Filter status:</span>
        <select v-model="filterStatus" class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none">
          <option value="">All Statuses</option>
          <option value="success">Success</option>
          <option value="skipped">Skipped</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div class="border border-gray-800 rounded-lg overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-800">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Kind</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Namespace</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Message</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in filteredResults()" :key="i" class="border-t border-gray-800 hover:bg-gray-800/30 transition-colors">
              <td class="px-4 py-2.5 font-mono text-xs text-gray-300">{{ r.kind }}</td>
              <td class="px-4 py-2.5 font-mono text-xs text-gray-300">{{ r.name }}</td>
              <td class="px-4 py-2.5 text-xs text-gray-500">{{ r.namespace || '-' }}</td>
              <td class="px-4 py-2.5 text-xs font-semibold" :class="statusColor(r.status)">{{ r.status }}</td>
              <td class="px-4 py-2.5 text-xs text-gray-500 max-w-xs truncate">{{ r.message }}</td>
            </tr>
          </tbody>
        </table>
        <div v-if="filteredResults().length === 0" class="px-4 py-8 text-center text-gray-500 text-sm">
          No results found
        </div>
      </div>
    </div>
  </div>
</template>
