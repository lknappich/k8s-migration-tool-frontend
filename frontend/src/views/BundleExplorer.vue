<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useClusterStore } from '@/stores/cluster'
import { useToastStore } from '@/stores/toasts'
import { api } from '@/composables/useApi'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import type { Bundle, BundleAnalysis, BundleFeedback } from '@/types'

const router = useRouter()
const clusterStore = useClusterStore()
const toastStore = useToastStore()

const bundles = ref<Bundle[]>([])
const analysis = ref<BundleAnalysis | null>(null)
const loading = ref(false)
const resolving = ref(false)
const selectedBundles = ref<Set<string>>(new Set())
const expandedBundles = ref<Set<string>>(new Set())
const feedbackBundle = ref<Bundle | null>(null)
const feedbackAction = ref<BundleFeedback['action']>('merge')
const feedbackDetail = ref('')
const submittingFeedback = ref(false)

const filterNamespace = ref('')
const filterWarnings = ref(false)
const filterMissing = ref(false)

const filteredBundles = computed(() => {
  return bundles.value.filter(b => {
    if (filterNamespace.value && b.namespace !== filterNamespace.value) return false
    if (filterWarnings.value && b.warnings.length === 0) return false
    if (filterMissing.value && b.externalDependencies.length === 0) return false
    return true
  })
})

const uniqueNamespaces = computed(() =>
  [...new Set(bundles.value.map(b => b.namespace))].filter(Boolean).sort(),
)

function toggleExpand(id: string): void {
  const set = new Set(expandedBundles.value)
  if (set.has(id)) set.delete(id)
  else set.add(id)
  expandedBundles.value = set
}

function toggleSelect(id: string): void {
  const set = new Set(selectedBundles.value)
  if (set.has(id)) set.delete(id)
  else set.add(id)
  selectedBundles.value = set
}

function selectAll(): void {
  const set = new Set<string>()
  for (const b of filteredBundles.value) {
    set.add(b.id)
  }
  selectedBundles.value = set
}

function deselectAll(): void {
  selectedBundles.value = new Set()
}

function depCount(deps: unknown[]): { required: number; optional: number } {
  const required = deps.filter((d: unknown) => (d as { required: boolean }).required).length
  const optional = deps.length - required
  return { required, optional }
}

function openFeedback(bundle: Bundle): void {
  feedbackBundle.value = bundle
  feedbackAction.value = 'merge'
  feedbackDetail.value = ''
}

function closeFeedback(): void {
  feedbackBundle.value = null
}

async function submitFeedback(): Promise<void> {
  if (!feedbackBundle.value) return
  submittingFeedback.value = true
  try {
    await api.sendBundleFeedback({
      bundleName: feedbackBundle.value.name,
      action: feedbackAction.value,
      details: { comment: feedbackDetail.value },
    })
    toastStore.addToast('Feedback submitted', 'info')
    closeFeedback()
  } catch {
    toastStore.addToast('Failed to submit feedback', 'error')
  }
  submittingFeedback.value = false
}

function confidenceColor(c: string): string {
  switch (c) {
    case 'high': return 'bg-emerald-400'
    case 'medium': return 'bg-amber-400'
    case 'low': return 'bg-red-400'
    default: return 'bg-gray-500'
  }
}

function confidenceLabel(c: string): string {
  switch (c) {
    case 'high': return 'h'
    case 'medium': return 'm'
    case 'low': return 'l'
    default: return '?'
  }
}

function navigateToBundle(id: string): void {
  router.push(`/bundles/${id}`)
}

function migrateBundles(): void {
  const selected = bundles.value.filter(b => selectedBundles.value.has(b.id))
  if (selected.length === 0) {
    toastStore.addToast('Select at least one bundle to migrate', 'warning')
    return
  }
  const allResources = selected.flatMap(b => b.resources)
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
  toastStore.addToast(`${allResources.length} resources from ${selected.length} bundles added to plan`, 'info')
  router.push('/plan')
}

onMounted(async () => {
  loading.value = true
  const selections = clusterStore.getSelected()
  if (selections.length === 0) {
    toastStore.addToast('No resources selected. Go to Resources to select first.', 'warning')
    loading.value = false
    return
  }
  try {
    analysis.value = await api.resolveBundles(selections)
    bundles.value = analysis.value.bundles
  } catch {
    toastStore.addToast('Failed to resolve bundles', 'error')
    bundles.value = []
  }
  loading.value = false
})
</script>

<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold text-gray-100 mb-1">Bundle Explorer</h1>
        <p class="text-sm text-gray-400">{{ bundles.length }} bundles resolved from selected resources</p>
      </div>
      <div class="flex gap-3">
        <button @click="selectAll" class="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors">Select All</button>
        <button @click="deselectAll" class="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors">Deselect All</button>
        <button
          @click="migrateBundles"
          :disabled="selectedBundles.size === 0"
          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-800 disabled:text-gray-500 rounded-lg text-sm font-semibold text-white transition-colors"
        >
          Migrate Bundles ({{ selectedBundles.size }})
        </button>
      </div>
    </div>

    <div class="flex gap-3 flex-wrap">
      <select v-model="filterNamespace" class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none">
        <option value="">All Namespaces</option>
        <option v-for="ns in uniqueNamespaces" :key="ns" :value="ns">{{ ns }}</option>
      </select>
      <label class="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
        <input v-model="filterWarnings" type="checkbox" class="rounded border-gray-600 bg-gray-700 text-amber-600 focus:ring-amber-600" />
        Has Warnings
      </label>
      <label class="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
        <input v-model="filterMissing" type="checkbox" class="rounded border-gray-600 bg-gray-700 text-red-600 focus:ring-red-600" />
        Has Missing Deps
      </label>
    </div>

    <div v-if="loading">
      <LoadingSkeleton :count="4" />
    </div>

    <div v-else-if="bundles.length === 0" class="text-center py-16 text-gray-500">
      <div class="text-4xl mb-4">&#9634;</div>
      <p>No bundles resolved. Select resources first.</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <div
        v-for="bundle in filteredBundles"
        :key="bundle.id"
        class="border rounded-lg overflow-hidden transition-colors"
        :class="selectedBundles.has(bundle.id) ? 'border-indigo-600/50 bg-gray-900' : 'border-gray-800 bg-gray-900'"
      >
        <div class="p-4">
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <input
                type="checkbox"
                :checked="selectedBundles.has(bundle.id)"
                @click.stop="toggleSelect(bundle.id)"
                class="rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-600 shrink-0"
              />
              <div class="min-w-0">
                <div class="font-semibold text-gray-100 text-sm truncate">{{ bundle.name }}</div>
                <div v-if="bundle.reasoning" class="text-xs text-gray-500 italic mt-0.5 line-clamp-2">{{ bundle.reasoning }}</div>
                <div class="text-xs text-gray-500 mt-0.5">{{ bundle.primaryKind }} / {{ bundle.primaryResource }}</div>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <div v-if="bundle.confidenceBreakdown" class="flex items-center gap-1" :title="'high: ' + bundle.confidenceBreakdown.high + ' medium: ' + bundle.confidenceBreakdown.medium + ' low: ' + bundle.confidenceBreakdown.low">
                <span v-if="bundle.confidenceBreakdown.high > 0" class="flex items-center gap-0.5">
                  <span class="w-2 h-2 rounded-full bg-emerald-400" />
                  <span class="text-[10px] text-emerald-400">{{ bundle.confidenceBreakdown.high }}</span>
                </span>
                <span v-if="bundle.confidenceBreakdown.medium > 0" class="flex items-center gap-0.5 ml-1">
                  <span class="w-2 h-2 rounded-full bg-amber-400" />
                  <span class="text-[10px] text-amber-400">{{ bundle.confidenceBreakdown.medium }}</span>
                </span>
                <span v-if="bundle.confidenceBreakdown.low > 0" class="flex items-center gap-0.5 ml-1">
                  <span class="w-2 h-2 rounded-full bg-red-400" />
                  <span class="text-[10px] text-red-400">{{ bundle.confidenceBreakdown.low }}</span>
                </span>
              </div>
              <span class="text-xs px-2 py-0.5 rounded-md shrink-0"
                :class="{
                  'bg-emerald-900/50 text-emerald-300 border border-emerald-700/30': bundle.status === 'ready',
                  'bg-amber-900/50 text-amber-300 border border-amber-700/30': bundle.status === 'warning',
                  'bg-red-900/50 text-red-300 border border-red-700/30': bundle.status === 'error',
                  'bg-gray-800 text-gray-400 border border-gray-700': true,
                }"
              >
                {{ bundle.status }}
              </span>
            </div>
          </div>

          <div class="flex gap-3 text-xs text-gray-400 mb-3">
            <span>{{ bundle.resources.length }} resources</span>
            <span class="text-gray-600">|</span>
            <span>{{ depCount(bundle.dependencies).required }} req / {{ depCount(bundle.dependencies).optional }} opt deps</span>
            <span class="text-gray-600">|</span>
            <span>{{ bundle.externalDependencies.length }} external</span>
          </div>

          <div class="flex gap-2">
            <span v-if="bundle.warnings.length > 0" class="text-xs bg-amber-900/30 text-amber-400 px-2 py-0.5 rounded-full">
              {{ bundle.warnings.length }} warnings
            </span>
            <span v-if="bundle.externalDependencies.length > 0" class="text-xs bg-red-900/30 text-red-400 px-2 py-0.5 rounded-full">
              {{ bundle.externalDependencies.length }} missing
            </span>
          </div>

          <div class="flex gap-2 mt-3">
            <button
              @click="toggleExpand(bundle.id)"
              class="px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors"
            >
              {{ expandedBundles.has(bundle.id) ? 'Collapse' : 'Dependencies' }}
            </button>
            <button
              @click="navigateToBundle(bundle.id)"
              class="px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors"
            >
              Details
            </button>
            <button
              @click="openFeedback(bundle)"
              class="px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-amber-400 rounded transition-colors ml-auto"
            >
              I disagree
            </button>
          </div>
        </div>

        <div v-if="expandedBundles.has(bundle.id)" class="border-t border-gray-800">
          <div class="p-4 space-y-1">
            <div class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Internal Dependencies</div>
            <div
              v-for="dep in bundle.dependencies"
              :key="`${dep.resourceKind}-${dep.name}`"
              class="flex items-center gap-2 text-xs pl-2 py-0.5"
              :class="dep.confidence === 'low' ? 'border border-dashed border-red-800/40 rounded px-2' : ''"
            >
              <span :class="dep.migratable ? 'text-emerald-400' : 'text-amber-400'">&#9679;</span>
              <span v-if="dep.confidence" class="w-2 h-2 rounded-full shrink-0" :class="confidenceColor(dep.confidence)" :title="dep.confidence + ' confidence'" />
              <span class="text-gray-300">{{ dep.name }}</span>
              <span class="text-gray-600">({{ dep.type }})</span>
              <span v-if="!dep.required" class="text-gray-600">optional</span>
              <span v-if="dep.confidence === 'low'" class="text-red-400/70 ml-1">&#9888;</span>
            </div>

            <div v-if="bundle.externalDependencies.length > 0" class="mt-3">
              <div class="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">External / Missing</div>
              <div
                v-for="dep in bundle.externalDependencies"
                :key="`ext-${dep.resourceKind}-${dep.name}`"
                class="flex items-center gap-2 text-xs pl-2 py-0.5"
                :class="dep.confidence === 'low' ? 'border border-dashed border-red-800/40 rounded px-2' : ''"
              >
                <span class="text-red-400">&#9679;</span>
                <span v-if="dep.confidence" class="w-2 h-2 rounded-full shrink-0" :class="confidenceColor(dep.confidence)" :title="dep.confidence + ' confidence'" />
                <span class="text-gray-300">{{ dep.name }}</span>
                <span class="text-gray-600">({{ dep.type }})</span>
                <span class="text-red-400/80 italic">{{ dep.description }}</span>
              </div>
            </div>

            <div v-if="bundle.warnings.length > 0" class="mt-3">
              <div class="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">Warnings</div>
              <div
                v-for="(w, i) in bundle.warnings"
                :key="i"
                class="flex items-center gap-2 text-xs text-amber-400/80 pl-2"
              >
                <span>&#9888;</span>
                {{ w }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="feedbackBundle" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60" @click.self="closeFeedback">
      <div class="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold text-gray-100 text-sm">Bundle Feedback</h3>
          <button @click="closeFeedback" class="text-gray-400 hover:text-gray-200 text-xl">&times;</button>
        </div>
        <p class="text-xs text-gray-500 mb-4">Bundle: <span class="text-gray-200">{{ feedbackBundle.name }}</span></p>
        <div class="space-y-3">
          <div>
            <label class="text-xs text-gray-400 block mb-1">Action</label>
            <select v-model="feedbackAction" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none">
              <option value="merge">Merge with another bundle</option>
              <option value="split">Split into separate bundles</option>
              <option value="add_resource">Add resource to bundle</option>
              <option value="remove_resource">Remove resource from bundle</option>
            </select>
          </div>
          <div>
            <label class="text-xs text-gray-400 block mb-1">Details (optional)</label>
            <textarea v-model="feedbackDetail" rows="3" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 placeholder-gray-500 focus:border-indigo-500 focus:outline-none" placeholder="Explain what should change..." />
          </div>
          <button
            @click="submitFeedback"
            :disabled="submittingFeedback"
            class="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            {{ submittingFeedback ? 'Submitting...' : 'Submit Feedback' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
