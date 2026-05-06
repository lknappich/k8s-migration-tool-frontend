<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useClusterStore } from '@/stores/cluster'
import { useToastStore } from '@/stores/toasts'
import { api } from '@/composables/useApi'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import type { Bundle, Dependency, DependencyType } from '@/types'

const route = useRoute()
const router = useRouter()
const clusterStore = useClusterStore()
const toastStore = useToastStore()

const bundleId = route.params.id as string
const bundle = ref<Bundle | null>(null)
const loading = ref(true)
const selectedDep = ref<Dependency | null>(null)

function depNodeColor(dep: Dependency): string {
  if (!dep.migratable) return 'border-red-500 bg-red-900/30'
  if (dep.type === 'tlsSecret' || dep.type === 'imagePullSecret') return 'border-amber-500 bg-amber-900/30'
  return 'border-indigo-500 bg-indigo-900/30'
}

function depEdgeColor(dep: Dependency): string {
  if (!dep.migratable) return 'text-red-400'
  return 'text-gray-500'
}

function depEdgeLabel(type: DependencyType): string {
  switch (type) {
    case 'volume': return 'mounts volume'
    case 'configmap': return 'uses configmap'
    case 'secret': return 'uses secret'
    case 'serviceAccount': return 'uses serviceAccount'
    case 'service': return 'connected to'
    case 'ingress': return 'exposed by'
    case 'crd': return 'requires CRD'
    case 'storageClass': return 'uses storageClass'
    case 'ingressClass': return 'uses ingressClass'
    case 'hpa': return 'scaled by'
    case 'pdb': return 'protected by'
    case 'networkPolicy': return 'restricted by'
    case 'imagePullSecret': return 'pulls via'
    case 'rbac': return 'authorized by'
    case 'tlsSecret': return 'secured by'
    default: return type
  }
}

function navigateToMigrate(): void {
  if (!bundle.value) return
  const allResources = bundle.value.resources
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
  router.push('/plan')
}

onMounted(async () => {
  try {
    bundle.value = await api.getBundle(bundleId)
  } catch {
    toastStore.addToast('Failed to load bundle', 'error')
  }
  loading.value = false
})

const requiredDeps = computed(() =>
  bundle.value?.dependencies.filter(d => d.required) || [],
)

const optionalDeps = computed(() =>
  bundle.value?.dependencies.filter(d => !d.required) || [],
)

const allInternalDeps = computed(() =>
  bundle.value?.dependencies || [],
)

const rings = computed(() => {
  if (!bundle.value) return { inner: [], outer: [] }
  const req = requiredDeps.value
  const opt = optionalDeps.value
  const mid = Math.ceil(req.length / 2)
  return {
    inner: req.slice(0, mid),
    outer: [...req.slice(mid), ...opt],
  }
})
</script>

<template>
  <div class="p-6 space-y-6">
    <div>
      <div class="flex items-center gap-2 text-xs text-gray-500 mb-2">
        <router-link to="/dashboard" class="hover:text-gray-300 transition-colors">Dashboard</router-link>
        <span>/</span>
        <router-link to="/bundles" class="hover:text-gray-300 transition-colors">Bundles</router-link>
        <span>/</span>
        <span class="text-gray-100">{{ bundle?.name || bundleId }}</span>
      </div>
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-semibold text-gray-100 mb-1">{{ bundle?.name || 'Bundle Detail' }}</h1>
          <p class="text-sm text-gray-400">
            {{ bundle?.primaryKind }} / {{ bundle?.primaryResource }}
            <span v-if="bundle?.namespace" class="ml-2 text-gray-500">ns: {{ bundle.namespace }}</span>
          </p>
        </div>
        <div class="flex gap-3">
          <button
            @click="navigateToMigrate"
            class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            Migrate This Bundle
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading">
      <LoadingSkeleton :count="4" />
    </div>

    <template v-else-if="bundle">
      <div class="border border-gray-800 rounded-lg p-6 bg-gray-900">
        <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">Dependency Graph</h2>

        <div class="flex flex-col items-center gap-0">
          <div class="flex flex-wrap gap-4 justify-center">
            <div
              v-for="dep in rings.inner"
              :key="`inner-${dep.name}`"
              class="flex flex-col items-center gap-1"
            >
              <div class="text-xs text-gray-500 rotate-[-30deg]">{{ depEdgeLabel(dep.type) }}</div>
              <div
                class="w-24 h-24 rounded-lg border-2 flex items-center justify-center text-xs cursor-pointer transition-all hover:scale-105 p-1 text-center"
                :class="depNodeColor(dep)"
                @click="selectedDep = dep"
              >
                <div>
                  <div class="font-mono text-gray-200 truncate text-[10px]">{{ dep.name }}</div>
                  <div class="text-gray-500 mt-0.5 text-[9px]">{{ dep.resourceKind }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="w-px h-6 bg-gray-700 my-1" />

          <div
            class="w-32 h-32 rounded-xl border-2 border-indigo-500 bg-indigo-950/40 flex items-center justify-center shadow-lg shadow-indigo-900/20 cursor-pointer hover:scale-105 transition-transform"
          >
            <div class="text-center p-2">
              <div class="font-semibold text-indigo-300 text-xs truncate">{{ bundle.primaryResource }}</div>
              <div class="text-indigo-400 text-[10px] mt-1">{{ bundle.primaryKind }}</div>
            </div>
          </div>

          <div v-if="rings.outer.length > 0" class="w-px h-6 bg-gray-700 my-1" />

          <div class="flex flex-wrap gap-4 justify-center">
            <div
              v-for="dep in rings.outer"
              :key="`outer-${dep.name}`"
              class="flex flex-col items-center gap-1"
            >
              <div class="text-xs text-gray-500 rotate-[-30deg]">{{ depEdgeLabel(dep.type) }}</div>
              <div
                class="w-24 h-24 rounded-lg border-2 flex items-center justify-center text-xs cursor-pointer transition-all hover:scale-105 p-1 text-center"
                :class="depNodeColor(dep)"
                @click="selectedDep = dep"
              >
                <div>
                  <div class="font-mono text-gray-200 truncate text-[10px]">{{ dep.name }}</div>
                  <div class="text-gray-500 mt-0.5 text-[9px]">{{ dep.resourceKind }}</div>
                </div>
              </div>
              <span v-if="!dep.required" class="text-[9px] text-gray-600">optional</span>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="border border-gray-800 rounded-lg p-4 bg-gray-900">
          <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Resource List</h3>
          <div class="space-y-1">
            <div
              v-for="r in bundle.resources"
              :key="`${r.kind}-${r.name}`"
              class="flex items-center gap-2 text-xs py-1"
            >
              <span class="text-indigo-400">&#9679;</span>
              <span class="font-mono text-gray-300">{{ r.name }}</span>
              <span class="text-gray-500">{{ r.kind }}</span>
            </div>
          </div>
        </div>

        <div class="border border-gray-800 rounded-lg p-4 bg-gray-900">
          <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Bundle Info</h3>
          <div class="space-y-2 text-xs text-gray-400">
            <div><span class="text-gray-500">Status:</span> {{ bundle.status }}</div>
            <div><span class="text-gray-500">Resources:</span> {{ bundle.resources.length }}</div>
            <div><span class="text-gray-500">Internal Deps:</span> {{ bundle.dependencies.length }}</div>
            <div><span class="text-gray-500">External Deps:</span> {{ bundle.externalDependencies.length }}</div>
            <div><span class="text-gray-500">Warnings:</span> {{ bundle.warnings.length }}</div>
          </div>
        </div>
      </div>

      <div v-if="bundle.externalDependencies.length > 0" class="border border-red-900/30 rounded-lg p-4 bg-red-950/10">
        <h3 class="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">
          External Dependencies ({{ bundle.externalDependencies.length }})
        </h3>
        <div class="space-y-2">
          <div
            v-for="dep in bundle.externalDependencies"
            :key="`ext-${dep.name}`"
            class="flex items-start gap-2 text-xs"
          >
            <span class="text-red-400 mt-0.5">&#9888;</span>
            <div>
              <div class="text-gray-300">{{ dep.name }} <span class="text-gray-500">({{ dep.type }})</span></div>
              <div class="text-gray-500">{{ dep.description }}</div>
              <div class="text-red-400/70 mt-0.5">{{ dep.migratable ? 'Can be auto-added' : 'Must exist on target' }}</div>
            </div>
          </div>
        </div>
        <button class="mt-3 px-3 py-1.5 text-xs bg-red-900/30 border border-red-800/50 text-red-300 rounded hover:bg-red-900/50 transition-colors">
          Add Missing Dependencies
        </button>
      </div>

      <div v-if="bundle.warnings.length > 0" class="border border-amber-900/30 rounded-lg p-4 bg-amber-950/10">
        <h3 class="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">Warnings</h3>
        <div
          v-for="(w, i) in bundle.warnings"
          :key="i"
          class="flex items-start gap-2 text-xs text-amber-400/80 mb-1"
        >
          <span class="mt-0.5">&#9654;</span>
          {{ w }}
        </div>
      </div>
    </template>

    <div v-else class="text-center py-16 text-gray-500">
      <p>Bundle not found.</p>
    </div>

    <div v-if="selectedDep" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60" @click.self="selectedDep = null">
      <div class="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold text-gray-100 text-sm">Dependency Details</h3>
          <button @click="selectedDep = null" class="text-gray-400 hover:text-gray-200 text-xl">&times;</button>
        </div>
        <div class="space-y-2 text-sm">
          <div><span class="text-gray-500">Name:</span> <span class="text-gray-200 font-mono">{{ selectedDep.name }}</span></div>
          <div><span class="text-gray-500">Kind:</span> <span class="text-gray-200">{{ selectedDep.resourceKind }}</span></div>
          <div><span class="text-gray-500">Namespace:</span> <span class="text-gray-200">{{ selectedDep.namespace || '-' }}</span></div>
          <div><span class="text-gray-500">Type:</span> <span class="text-gray-200">{{ selectedDep.type }}</span></div>
          <div><span class="text-gray-500">Required:</span> <span class="text-gray-200">{{ selectedDep.required ? 'Yes' : 'No' }}</span></div>
          <div><span class="text-gray-500">Migratable:</span> <span :class="selectedDep.migratable ? 'text-emerald-400' : 'text-red-400'">{{ selectedDep.migratable ? 'Yes' : 'No' }}</span></div>
          <div><span class="text-gray-500">Description:</span> <span class="text-gray-300">{{ selectedDep.description }}</span></div>
        </div>
      </div>
    </div>
  </div>
</template>
