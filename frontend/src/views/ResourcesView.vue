<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useClusterStore } from '@/stores/cluster'
import { useToastStore } from '@/stores/toasts'
import { api } from '@/composables/useApi'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import type { ResourceGroupSummary } from '@/types'

const router = useRouter()
const store = useClusterStore()
const toastStore = useToastStore()

const filterKind = ref('')
const filterNamespace = ref('')
const filterName = ref('')
const expandedKinds = ref<Set<string>>(new Set())
const loading = ref(false)
const groups = ref<ResourceGroupSummary[]>([])
const groupsLoading = ref(false)
const expandedGroups = ref<Set<string>>(new Set())

const groupedResources = computed(() => {
  const grps: Record<string, unknown[]> = {}
  for (const r of store.resources as unknown[]) {
    const rAny = r as Record<string, unknown>
    const key = rAny.kind as string
    if (!grps[key]) grps[key] = []
    grps[key].push(r)
  }
  return grps
})

const filteredKinds = computed(() => {
  if (!filterKind.value) return Object.keys(groupedResources.value).sort()
  return Object.keys(groupedResources.value).filter(k =>
    k.toLowerCase().includes(filterKind.value.toLowerCase()),
  ).sort()
})

function filteredResources(kind: string): Record<string, unknown>[] {
  return groupedResources.value[kind].filter((r) => {
    const rAny = r as Record<string, unknown>
    if (filterNamespace.value && rAny.namespace && !(rAny.namespace as string).includes(filterNamespace.value)) return false
    if (filterName.value && !(rAny.name as string).toLowerCase().includes(filterName.value.toLowerCase())) return false
    return true
  }) as Record<string, unknown>[]
}

function toggleKind(kind: string) {
  const set = new Set(expandedKinds.value)
  if (set.has(kind)) set.delete(kind)
  else set.add(kind)
  expandedKinds.value = set
}

function kindSelectedCount(kind: string): number {
  return (groupedResources.value[kind] as Record<string, unknown>[]).filter(r => r._selected).length
}

function kindTotalCount(kind: string): number {
  return groupedResources.value[kind].length
}

function kindAllSelected(kind: string): boolean {
  return kindSelectedCount(kind) === kindTotalCount(kind)
}

function toggleSelectAllKind(kind: string) {
  if (kindAllSelected(kind)) store.deselectAllKinds(kind)
  else store.selectAllKinds(kind)
}

function toggleGroup(groupName: string) {
  const set = new Set(expandedGroups.value)
  if (set.has(groupName)) set.delete(groupName)
  else set.add(groupName)
  expandedGroups.value = set
}

function selectAllInGroup(groupName: string) {
  const kinds = groups.value.find(g => g.name === groupName)?.kindBreakdown
  if (!kinds) return
  for (const [kind, _count] of Object.entries(kinds)) {
    store.selectAllKinds(kind)
  }
}

function deselectAllInGroup(groupName: string) {
  const kinds = groups.value.find(g => g.name === groupName)?.kindBreakdown
  if (!kinds) return
  for (const [kind, _count] of Object.entries(kinds)) {
    store.deselectAllKinds(kind)
  }
}

function reviewPlan() {
  toastStore.addToast(`Reviewing plan with ${store.selectedCount} resources`, 'info')
  router.push('/plan')
}

function handleKeydown(e: KeyboardEvent) {
  const mod = e.ctrlKey || e.metaKey
  if (mod && e.shiftKey && e.key.toLowerCase() === 'a') {
    e.preventDefault()
    store.deselectAll()
  } else if (mod && e.key.toLowerCase() === 'a') {
    e.preventDefault()
    store.selectAll()
  } else if (e.key === 'Enter') {
    if (store.selectedCount > 0) {
      e.preventDefault()
      reviewPlan()
    }
  }
}

onMounted(async () => {
  if (!store.configured) {
    loading.value = true
    setTimeout(() => { loading.value = false }, 800)
    return
  }
  groupsLoading.value = true
  try {
    groups.value = await api.getGroups()
  } catch {
    groups.value = []
  }
  groupsLoading.value = false
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="p-6 space-y-4">
    <div>
      <h1 class="text-xl font-semibold text-gray-100 mb-1">Resource Explorer</h1>
      <p class="text-sm text-gray-400">Select resources to include in the migration</p>
    </div>

    <div v-if="loading">
      <LoadingSkeleton :count="6" />
    </div>

    <template v-else>
      <div class="flex items-center justify-between">
        <div class="flex gap-4 flex-1">
          <input v-model="filterKind" placeholder="Filter kind..." class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-indigo-500 focus:outline-none flex-1" />
          <input v-model="filterNamespace" placeholder="Filter namespace..." class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-indigo-500 focus:outline-none flex-1" />
          <input v-model="filterName" placeholder="Search name..." class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-indigo-500 focus:outline-none flex-1" />
        </div>
        <div class="flex gap-3 ml-4 shrink-0">
          <button @click="store.selectAll()" class="px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors">Select All</button>
          <button @click="store.deselectAll()" class="px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors">Deselect All</button>
          <button
            @click="reviewPlan"
            :disabled="store.selectedCount === 0"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-800 disabled:text-gray-500 rounded-lg text-sm font-semibold transition-colors text-white"
          >
            Review Plan ({{ store.selectedCount }})
          </button>
        </div>
      </div>

      <div v-if="groups.length > 0 && !filterKind && !filterNamespace && !filterName" class="space-y-3">
        <div v-for="group in groups" :key="group.name" class="border border-gray-800 rounded-lg bg-gray-900 overflow-hidden">
          <div
            @click="toggleGroup(group.name)"
            class="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-800/50 transition-colors"
          >
            <div class="flex-1">
              <div class="font-semibold text-gray-100 text-sm">{{ group.name }}</div>
              <div class="text-xs text-gray-500 mt-0.5">{{ group.resourceCount }} resources</div>
            </div>
            <div class="flex flex-wrap gap-1.5 items-center">
              <span v-for="(count, kind) in group.kindBreakdown" :key="kind" class="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-md">
                {{ kind }}: {{ count }}
              </span>
            </div>
            <div class="flex gap-2">
              <button
                @click.stop="selectAllInGroup(group.name)"
                class="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors"
              >
                Select All
              </button>
              <button
                @click.stop="deselectAllInGroup(group.name)"
                class="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors"
              >
                Deselect
              </button>
            </div>
            <span class="text-sm text-gray-500 transition-transform" :class="{ 'rotate-90': expandedGroups.has(group.name) }">&#9654;</span>
          </div>

          <div v-if="expandedGroups.has(group.name)" class="border-t border-gray-800">
            <div v-for="kind in Object.keys(group.kindBreakdown).sort()" :key="kind" class="border-b border-gray-800 last:border-b-0">
              <div
                @click="toggleKind(kind)"
                class="flex items-center gap-3 px-5 py-2.5 cursor-pointer hover:bg-gray-800/50 transition-colors"
              >
                <input
                  type="checkbox"
                  :checked="kindAllSelected(kind)"
                  @click.stop="toggleSelectAllKind(kind)"
                  class="rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-600"
                />
                <span class="font-semibold text-sm text-gray-300 flex-1">{{ kind }}</span>
                <span class="text-xs text-gray-500">({{ kindSelectedCount(kind) }}/{{ kindTotalCount(kind) }})</span>
                <span class="text-xs transition-transform" :class="{ 'rotate-90': expandedKinds.has(kind) }">&#9654;</span>
              </div>

              <div v-if="expandedKinds.has(kind)" class="border-t border-gray-800">
                <div
                  v-for="(r, i) in filteredResources(kind)"
                  :key="`${r.namespace}-${r.name}`"
                  class="flex items-center gap-3 px-5 py-2 hover:bg-gray-800/50 transition-colors text-sm"
                >
                  <input
                    type="checkbox"
                    :checked="r._selected as boolean"
                    @click.stop="store.toggleResource(store.resources.indexOf(r as never))"
                    class="rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-600"
                  />
                  <span class="flex-1 font-mono text-gray-300">{{ r.name }}</span>
                  <span v-if="r.namespace" class="text-gray-500 text-xs">ns: {{ r.namespace }}</span>
                  <span v-if="(r.labels as Record<string, string>)?.app" class="text-gray-500 text-xs bg-gray-800 px-2 py-0.5 rounded-md">{{ (r.labels as Record<string, string>).app }}</span>
                </div>
                <div v-if="filteredResources(kind).length === 0" class="px-5 py-3 text-gray-500 text-sm">
                  No resources match filters
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="space-y-2">
        <div v-for="kind in filteredKinds" :key="kind" class="border border-gray-800 rounded-lg bg-gray-900 overflow-hidden">
          <div
            @click="toggleKind(kind)"
            class="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-800/50 transition-colors"
          >
            <input
              type="checkbox"
              :checked="kindAllSelected(kind)"
              @click.stop="toggleSelectAllKind(kind)"
              class="rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-600"
            />
            <span class="font-semibold flex-1 text-sm text-gray-200">{{ kind }}</span>
            <span class="text-xs text-gray-500">({{ kindSelectedCount(kind) }}/{{ kindTotalCount(kind) }})</span>
            <span class="text-xs transition-transform" :class="{ 'rotate-90': expandedKinds.has(kind) }">&#9654;</span>
          </div>

          <div v-if="expandedKinds.has(kind)" class="border-t border-gray-800">
            <div
              v-for="(r, i) in filteredResources(kind)"
              :key="`${r.namespace}-${r.name}`"
              class="flex items-center gap-3 px-4 py-2 hover:bg-gray-800/50 transition-colors text-sm"
            >
              <input
                type="checkbox"
                :checked="r._selected as boolean"
                @click.stop="store.toggleResource(store.resources.indexOf(r as never))"
                class="rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-600"
              />
              <span class="flex-1 font-mono text-gray-300">{{ r.name }}</span>
              <span v-if="r.namespace" class="text-gray-500 text-xs">ns: {{ r.namespace }}</span>
              <span v-if="(r.labels as Record<string, string>)?.app" class="text-gray-500 text-xs bg-gray-800 px-2 py-0.5 rounded-md">{{ (r.labels as Record<string, string>).app }}</span>
            </div>
            <div v-if="filteredResources(kind).length === 0" class="px-4 py-3 text-gray-500 text-sm">
              No resources match filters
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
