import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ClusterInfo, DiscoveredResource, ResourceSelection, MigrationPlan, ConflictStrategy } from '@/types'

export const useClusterStore = defineStore('cluster', () => {
  const configured = ref(false)
  const sourceInfo = ref<ClusterInfo | null>(null)
  const targetInfo = ref<ClusterInfo | null>(null)
  const sourceServer = ref('')
  const targetServer = ref('')
  const resources = ref<DiscoveredResource[]>([])

  const selectedCount = computed(() =>
    resources.value.filter(r => (r as any)._selected).length
  )

  function setConfig(source: ClusterInfo, target: ClusterInfo, srvSource: string = '', srvTarget: string = '') {
    sourceInfo.value = source
    targetInfo.value = target
    sourceServer.value = srvSource
    targetServer.value = srvTarget
    configured.value = true
  }

  function setResources(list: DiscoveredResource[]) {
    resources.value = list.map(r => ({ ...r, _selected: false }))
  }

  function toggleResource(index: number) {
    const r = resources.value[index] as any
    r._selected = !r._selected
  }

  function selectAllKinds(kind: string) {
    resources.value.forEach((r: any) => {
      if (r.kind === kind) r._selected = true
    })
  }

  function deselectAllKinds(kind: string) {
    resources.value.forEach((r: any) => {
      if (r.kind === kind) r._selected = false
    })
  }

  function selectAll() {
    resources.value.forEach((r: any) => r._selected = true)
  }

  function deselectAll() {
    resources.value.forEach((r: any) => r._selected = false)
  }

  function getSelected(): ResourceSelection[] {
    return resources.value
      .filter((r: any) => r._selected)
      .map(r => ({
        kind: r.kind,
        name: r.name,
        namespace: r.namespace,
        conflict: 'skip' as ConflictStrategy,
      }))
  }

  function getSelectionPlan(defaultConflict: ConflictStrategy = 'skip'): MigrationPlan {
    return {
      resources: getSelected(),
      defaultConflict,
    }
  }

  return {
    configured, sourceInfo, targetInfo, sourceServer, targetServer, resources, selectedCount,
    setConfig, setResources, toggleResource,
    selectAllKinds, deselectAllKinds,
    selectAll, deselectAll, getSelected, getSelectionPlan,
  }
})
