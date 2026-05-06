<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useClusterStore } from '@/stores/cluster'
import { useToastStore } from '@/stores/toasts'
import { api } from '@/composables/useApi'
import type { ConflictStrategy, ResourceSelection } from '@/types'

const router = useRouter()
const clusterStore = useClusterStore()
const toastStore = useToastStore()

const defaultConflict = ref<ConflictStrategy>('skip')
const loading = ref(false)
const error = ref('')

const migrationOrder = [
  'Namespace', 'ServiceAccount', 'Role', 'RoleBinding', 'ClusterRole', 'ClusterRoleBinding',
  'CRD', 'ConfigMap', 'Secret', 'PersistentVolume', 'PersistentVolumeClaim',
  'Deployment', 'StatefulSet', 'DaemonSet', 'Job', 'CronJob',
  'Service', 'Ingress', 'NetworkPolicy', 'CustomResource', 'HelmRelease',
]

const selectedByKind = computed(() => {
  const plan = clusterStore.getSelectionPlan(defaultConflict.value)
  const grps: Record<string, ResourceSelection[]> = {}
  for (const r of plan.resources) {
    if (!grps[r.kind]) grps[r.kind] = []
    grps[r.kind].push(r)
  }
  return grps
})

const orderedKinds = computed(() =>
  migrationOrder.filter(k => selectedByKind.value[k]),
)

const totalSelected = computed(() =>
  Object.values(selectedByKind.value).reduce((sum, arr) => sum + arr.length, 0),
)

function setConflict(kind: string, conflict: ConflictStrategy) {
  for (const r of selectedByKind.value[kind] || []) {
    r.conflict = conflict
  }
}

async function startMigration() {
  loading.value = true
  error.value = ''
  try {
    const plan = {
      resources: Object.values(selectedByKind.value).flat(),
      defaultConflict: defaultConflict.value,
    }
    const result = await api.startMigration(plan)
    toastStore.addToast('Migration started', 'success')
    router.push(`/migrate/${result.id}`)
  } catch (e: unknown) {
    const msg = (e as { message?: string }).message || 'Failed to start migration'
    error.value = msg
    toastStore.addToast(msg, 'error')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="p-6 space-y-6">
    <div>
      <div class="flex items-center gap-2 text-xs text-gray-500 mb-2">
        <router-link to="/dashboard" class="hover:text-gray-300 transition-colors">Dashboard</router-link>
        <span>/</span>
        <router-link to="/resources" class="hover:text-gray-300 transition-colors">Resources</router-link>
        <span>/</span>
        <span class="text-gray-100">Migration Plan</span>
      </div>
      <h1 class="text-xl font-semibold text-gray-100 mb-1">Migration Plan</h1>
      <p class="text-sm text-gray-400">{{ totalSelected }} resources selected across {{ orderedKinds.length }} types</p>
    </div>

    <div class="flex items-center gap-4">
      <span class="text-sm text-gray-400">Default conflict strategy:</span>
      <select v-model="defaultConflict" class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none">
        <option value="skip">Skip</option>
        <option value="overwrite">Overwrite</option>
        <option value="rename">Rename</option>
      </select>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div
        v-for="kind in orderedKinds"
        :key="kind"
        class="border border-gray-800 rounded-lg p-4 bg-gray-900"
      >
        <div class="flex items-center gap-3 mb-3">
          <span class="font-mono font-semibold text-sm text-gray-100 flex-1">{{ kind }}</span>
          <span class="text-xs text-gray-500">{{ selectedByKind[kind]?.length || 0 }} resources</span>
        </div>
        <select
          @change="setConflict(kind, ($event.target as HTMLSelectElement).value as ConflictStrategy)"
          class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:border-indigo-500 focus:outline-none"
        >
          <option value="skip">Skip on conflict</option>
          <option value="overwrite">Overwrite on conflict</option>
          <option value="rename">Rename on conflict</option>
        </select>
      </div>
    </div>

    <div v-if="error" class="p-4 border border-red-800 rounded-lg bg-red-900/20 text-red-400 text-sm">
      {{ error }}
    </div>

    <button
      @click="startMigration"
      :disabled="loading || totalSelected === 0"
      class="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-800 disabled:text-gray-500 rounded-lg font-semibold text-sm text-white transition-colors"
    >
      {{ loading ? 'Starting...' : 'Start Migration' }}
    </button>
  </div>
</template>
