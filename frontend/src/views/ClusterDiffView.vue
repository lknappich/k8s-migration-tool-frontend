<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useClusterStore } from '@/stores/cluster'
import { useToastStore } from '@/stores/toasts'
import { api } from '@/composables/useApi'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import type { DiffResource } from '@/types'

const router = useRouter()
const clusterStore = useClusterStore()
const toastStore = useToastStore()

const loading = ref(true)
const diffResources = ref<DiffResource[]>([])
const sourceResources = ref<DiffResource[]>([])
const targetResources = ref<DiffResource[]>([])

const filterKind = ref('')
const filterNamespace = ref('')
const filterSearch = ref('')
const filterBundle = ref('')

const selectedModal = ref<DiffResource | null>(null)
const expandedNamespaces = ref<Set<string>>(new Set())

const sourceOnly = computed(() =>
  diffResources.value.filter(r => r.diffStatus === 'sourceOnly'),
)

const driftItems = computed(() =>
  diffResources.value.filter(r => r.diffStatus === 'drift'),
)

const targetOnly = computed(() =>
  diffResources.value.filter(r => r.diffStatus === 'targetOnly'),
)

const matchItems = computed(() =>
  diffResources.value.filter(r => r.diffStatus === 'match'),
)

function applyColumnFilters(items: DiffResource[]): DiffResource[] {
  return items.filter(r => {
    if (filterKind.value && r.kind !== filterKind.value) return false
    if (filterNamespace.value && r.namespace !== filterNamespace.value) return false
    if (filterSearch.value && !r.name.toLowerCase().includes(filterSearch.value.toLowerCase())) return false
    if (filterBundle.value && r.bundleBundle !== filterBundle.value) return false
    return true
  })
}

function groupByNamespace(items: DiffResource[]): Record<string, DiffResource[]> {
  const grps: Record<string, DiffResource[]> = {}
  for (const r of items) {
    const ns = r.namespace || '_cluster-scoped_'
    if (!grps[ns]) grps[ns] = []
    grps[ns].push(r)
  }
  return grps
}

function toggleNamespace(ns: string): void {
  const set = new Set(expandedNamespaces.value)
  if (set.has(ns)) set.delete(ns)
  else set.add(ns)
  expandedNamespaces.value = set
}

function statusColor(status: string): string {
  switch (status) {
    case 'sourceOnly': return 'border-blue-600/30 bg-blue-600/5'
    case 'targetOnly': return 'border-red-600/30 bg-red-600/5'
    case 'drift': return 'border-amber-600/30 bg-amber-600/5'
    case 'match': return 'border-emerald-600/30 bg-emerald-600/5'
    default: return 'border-gray-700 bg-gray-900'
  }
}

function statusBadgeColor(status: string): string {
  switch (status) {
    case 'sourceOnly': return 'bg-blue-900/50 text-blue-300 border-blue-700/50'
    case 'targetOnly': return 'bg-red-900/50 text-red-300 border-red-700/50'
    case 'drift': return 'bg-amber-900/50 text-amber-300 border-amber-700/50'
    case 'match': return 'bg-emerald-900/50 text-emerald-300 border-emerald-700/50'
    default: return 'bg-gray-800 text-gray-400 border-gray-700'
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'sourceOnly': return 'Source Only'
    case 'targetOnly': return 'Target Only'
    case 'drift': return 'Drift'
    case 'match': return 'Match'
    default: return status
  }
}

function selectResource(r: DiffResource): void {
  r._selected = !r._selected
}

function openDiffModal(r: DiffResource): void {
  selectedModal.value = r
}

function closeDiffModal(): void {
  selectedModal.value = null
}

function migrateSelected(): void {
  const selected = diffResources.value.filter(r => r._selected && r.diffStatus !== 'targetOnly')
  if (selected.length === 0) {
    toastStore.addToast('Select at least one resource to migrate', 'warning')
    return
  }
  clusterStore.setResources(selected.map(r => ({
    kind: r.kind,
    name: r.name,
    namespace: r.namespace,
    apiVersion: r.apiVersion,
    raw: r.raw,
    labels: r.labels,
    annotations: r.annotations,
  })))
  for (let i = 0; i < clusterStore.resources.length; i++) {
    if (selected.some(s => s.name === (clusterStore.resources[i] as unknown as DiffResource).name && s.kind === (clusterStore.resources[i] as unknown as DiffResource).kind)) {
      (clusterStore.resources[i] as unknown as DiffResource)._selected = true
    }
  }
  toastStore.addToast(`${selected.length} resources added to plan`, 'info')
  router.push('/plan')
}

function exportReport(): void {
  const report = {
    sourceOnly: sourceOnly.value.map(r => ({ kind: r.kind, name: r.name, namespace: r.namespace })),
    drift: driftItems.value.map(r => ({ kind: r.kind, name: r.name, namespace: r.namespace })),
    targetOnly: targetOnly.value.map(r => ({ kind: r.kind, name: r.name, namespace: r.namespace })),
    match: matchItems.value.map(r => ({ kind: r.kind, name: r.name, namespace: r.namespace })),
    summary: {
      sourceOnlyCount: sourceOnly.value.length,
      driftCount: driftItems.value.length,
      targetOnlyCount: targetOnly.value.length,
      matchCount: matchItems.value.length,
      total: diffResources.value.length,
    },
    exportedAt: new Date().toISOString(),
  }
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `cluster-diff-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(async () => {
  if (!clusterStore.configured) {
    loading.value = false
    return
  }
  try {
    const result = await api.getDiff()
    const diff = result.diff as Record<string, unknown>
    const summary = result.summary as Record<string, number>
    const all = [
      ...(diff.sourceOnly as unknown[] || []).map((r: unknown) => ({ ...(r as object), diffStatus: 'sourceOnly' as const, _selected: false })),
      ...(diff.drift as unknown[] || []).map((r: unknown) => ({ ...(r as object), diffStatus: 'drift' as const, _selected: false })),
      ...(diff.targetOnly as unknown[] || []).map((r: unknown) => ({ ...(r as object), diffStatus: 'targetOnly' as const, _selected: false })),
      ...(diff.match as unknown[] || []).map((r: unknown) => ({ ...(r as object), diffStatus: 'match' as const, _selected: false })),
    ] as DiffResource[]
    diffResources.value = all
    sourceResources.value = all.filter(r => r.diffStatus === 'sourceOnly' || r.diffStatus === 'drift' || r.diffStatus === 'match')
    targetResources.value = all.filter(r => r.diffStatus === 'targetOnly' || r.diffStatus === 'drift' || r.diffStatus === 'match')
    for (const ns of new Set(all.map(r => r.namespace || '_cluster-scoped_'))) {
      expandedNamespaces.value.add(ns)
    }
  } catch {
    toastStore.addToast('Failed to load diff data', 'error')
  }
  loading.value = false
})

const uniqueKinds = computed(() => [...new Set(diffResources.value.map(r => r.kind))].sort())
const uniqueNamespaces = computed(() => [...new Set(diffResources.value.map(r => r.namespace))].filter(Boolean).sort())
const uniqueBundles = computed(() => [...new Set(diffResources.value.map(r => r.bundleBundle))].filter(Boolean).sort())

const selectedSourceCount = computed(() =>
  diffResources.value.filter(r => r._selected && r.diffStatus !== 'targetOnly').length,
)
</script>

<template>
  <div class="p-4 space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold text-gray-100 mb-1">Cluster Diff</h1>
        <p class="text-sm text-gray-400">Compare source and target cluster resources</p>
      </div>
      <div class="flex gap-3">
        <button
          @click="exportReport"
          class="px-4 py-2 border border-gray-700 hover:border-gray-600 rounded-lg text-sm text-gray-300 hover:text-gray-100 transition-colors"
        >
          Export Report
        </button>
        <button
          @click="migrateSelected"
          :disabled="selectedSourceCount === 0"
          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-800 disabled:text-gray-500 rounded-lg text-sm font-semibold text-white transition-colors"
        >
          Migrate Selected ({{ selectedSourceCount }})
        </button>
      </div>
    </div>

    <div class="flex gap-3 flex-wrap">
      <select v-model="filterKind" class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none">
        <option value="">All Kinds</option>
        <option v-for="k in uniqueKinds" :key="k" :value="k">{{ k }}</option>
      </select>
      <select v-model="filterNamespace" class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none">
        <option value="">All Namespaces</option>
        <option v-for="ns in uniqueNamespaces" :key="ns" :value="ns">{{ ns }}</option>
      </select>
      <input v-model="filterSearch" placeholder="Search name..." class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 placeholder-gray-500 focus:border-indigo-500 focus:outline-none w-48" />
      <select v-model="filterBundle" class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none">
        <option value="">All Bundles</option>
        <option v-for="b in uniqueBundles" :key="b" :value="b">{{ b }}</option>
      </select>
    </div>

    <div v-if="loading">
      <LoadingSkeleton :count="6" />
    </div>

    <div v-else class="grid grid-cols-3 gap-4 flex-1 min-h-0" style="height: calc(100vh - 220px);">
      <div class="border border-blue-900/30 rounded-lg overflow-hidden flex flex-col bg-gray-900/50">
        <div class="px-4 py-3 border-b border-blue-900/20 bg-blue-950/20">
          <span class="font-semibold text-blue-300 text-sm">Source Only</span>
          <span class="text-xs text-blue-400/60 ml-2">({{ applyColumnFilters(sourceOnly).length }})</span>
        </div>
        <div class="flex-1 overflow-y-auto">
          <div v-if="applyColumnFilters(sourceOnly).length === 0" class="p-4 text-center text-gray-500 text-sm">No source-only resources</div>
          <template v-for="(items, ns) in groupByNamespace(applyColumnFilters(sourceOnly))" :key="ns">
            <div
              @click="toggleNamespace(ns)"
              class="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 border-b border-gray-800 cursor-pointer hover:bg-gray-800 transition-colors sticky top-0 z-10"
            >
              <span class="text-xs transition-transform" :class="{ 'rotate-90': expandedNamespaces.has(ns) }">&#9654;</span>
              <span class="text-xs text-gray-400 font-semibold">{{ ns === '_cluster-scoped_' ? 'Cluster-scoped' : ns }}</span>
              <span class="text-xs text-gray-600">({{ items.length }})</span>
            </div>
            <div v-if="expandedNamespaces.has(ns)">
              <div
                v-for="r in items"
                :key="`${r.kind}-${(r as unknown as { namespace: string }).namespace}-${r.name}`"
                @click="openDiffModal(r)"
                class="flex items-center gap-2 px-3 py-2 border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors cursor-pointer"
                :class="statusColor(r.diffStatus || '')"
              >
                <input
                  type="checkbox"
                  :checked="r._selected"
                  @click.stop="selectResource(r)"
                  class="rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-600 shrink-0"
                />
                <span class="font-mono text-xs text-gray-300 flex-1 truncate">{{ r.name }}</span>
                <span class="text-xs text-gray-500 shrink-0">{{ r.kind }}</span>
                <span v-if="r.bundleBundle" class="text-xs bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded-md shrink-0">{{ r.bundleBundle }}</span>
              </div>
            </div>
          </template>
        </div>
      </div>

      <div class="border border-amber-900/30 rounded-lg overflow-hidden flex flex-col bg-gray-900/50">
        <div class="px-4 py-3 border-b border-amber-900/20 bg-amber-950/20">
          <span class="font-semibold text-amber-300 text-sm">Out of Sync</span>
          <span class="text-xs text-amber-400/60 ml-2">({{ applyColumnFilters(driftItems).length }})</span>
        </div>
        <div class="flex-1 overflow-y-auto">
          <div v-if="applyColumnFilters(driftItems).length === 0" class="p-4 text-center text-gray-500 text-sm">No drift detected</div>
          <template v-for="(items, ns) in groupByNamespace(applyColumnFilters(driftItems))" :key="ns">
            <div
              @click="toggleNamespace(ns)"
              class="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 border-b border-gray-800 cursor-pointer hover:bg-gray-800 transition-colors sticky top-0 z-10"
            >
              <span class="text-xs transition-transform" :class="{ 'rotate-90': expandedNamespaces.has(ns) }">&#9654;</span>
              <span class="text-xs text-gray-400 font-semibold">{{ ns === '_cluster-scoped_' ? 'Cluster-scoped' : ns }}</span>
              <span class="text-xs text-gray-600">({{ items.length }})</span>
            </div>
            <div v-if="expandedNamespaces.has(ns)">
              <div
                v-for="r in items"
                :key="`${r.kind}-${(r as unknown as { namespace: string }).namespace}-${r.name}`"
                @click="openDiffModal(r)"
                class="flex items-center gap-2 px-3 py-2 border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors cursor-pointer"
                :class="statusColor(r.diffStatus || '')"
              >
                <input
                  type="checkbox"
                  :checked="r._selected"
                  @click.stop="selectResource(r)"
                  class="rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-600 shrink-0"
                />
                <span class="font-mono text-xs text-gray-300 flex-1 truncate">{{ r.name }}</span>
                <span class="text-xs text-gray-500 shrink-0">{{ r.kind }}</span>
                <span v-if="r.bundleBundle" class="text-xs bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded-md shrink-0">{{ r.bundleBundle }}</span>
              </div>
            </div>
          </template>
        </div>
      </div>

      <div class="border border-red-900/30 rounded-lg overflow-hidden flex flex-col bg-gray-900/50">
        <div class="px-4 py-3 border-b border-red-900/20 bg-red-950/20">
          <span class="font-semibold text-red-300 text-sm">Target Only</span>
          <span class="text-xs text-red-400/60 ml-2">({{ applyColumnFilters(targetOnly).length }})</span>
        </div>
        <div class="flex-1 overflow-y-auto">
          <div v-if="applyColumnFilters(targetOnly).length === 0" class="p-4 text-center text-gray-500 text-sm">No target-only resources</div>
          <template v-for="(items, ns) in groupByNamespace(applyColumnFilters(targetOnly))" :key="ns">
            <div
              @click="toggleNamespace(ns)"
              class="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 border-b border-gray-800 cursor-pointer hover:bg-gray-800 transition-colors sticky top-0 z-10"
            >
              <span class="text-xs transition-transform" :class="{ 'rotate-90': expandedNamespaces.has(ns) }">&#9654;</span>
              <span class="text-xs text-gray-400 font-semibold">{{ ns === '_cluster-scoped_' ? 'Cluster-scoped' : ns }}</span>
              <span class="text-xs text-gray-600">({{ items.length }})</span>
            </div>
            <div v-if="expandedNamespaces.has(ns)">
              <div
                v-for="r in items"
                :key="`${r.kind}-${(r as unknown as { namespace: string }).namespace}-${r.name}`"
                @click="openDiffModal(r)"
                class="flex items-center gap-2 px-3 py-2 border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors cursor-pointer"
                :class="statusColor(r.diffStatus || '')"
              >
                <input
                  type="checkbox"
                  :checked="r._selected"
                  @click.stop="selectResource(r)"
                  class="rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-600 shrink-0"
                />
                <span class="font-mono text-xs text-gray-300 flex-1 truncate">{{ r.name }}</span>
                <span class="text-xs text-gray-500 shrink-0">{{ r.kind }}</span>
                <span v-if="r.bundleBundle" class="text-xs bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded-md shrink-0">{{ r.bundleBundle }}</span>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <div v-if="selectedModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60" @click.self="closeDiffModal">
      <div class="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-5xl max-h-[80vh] flex flex-col mx-4">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div>
            <span class="font-semibold text-gray-100">{{ selectedModal.kind }} / {{ selectedModal.name }}</span>
            <span v-if="selectedModal.namespace" class="text-xs text-gray-500 ml-2">ns: {{ selectedModal.namespace }}</span>
          </div>
          <button @click="closeDiffModal" class="text-gray-400 hover:text-gray-200 text-xl">&times;</button>
        </div>
        <div class="flex-1 overflow-hidden grid grid-cols-2 gap-0">
          <div class="border-r border-gray-800 overflow-y-auto">
            <div class="px-4 py-2 text-xs font-semibold text-indigo-400 bg-gray-800/50 border-b border-gray-800 sticky top-0">Source</div>
            <pre class="p-4 text-xs font-mono text-gray-300 whitespace-pre-wrap">{{ selectedModal.raw }}</pre>
          </div>
          <div class="overflow-y-auto">
            <div class="px-4 py-2 text-xs font-semibold text-emerald-400 bg-gray-800/50 border-b border-gray-800 sticky top-0">Target</div>
            <pre class="p-4 text-xs font-mono text-gray-300 whitespace-pre-wrap">{{ selectedModal.raw }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
