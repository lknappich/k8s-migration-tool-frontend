import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useClusterStore } from '@/stores/cluster'
import type { ClusterInfo, DiscoveredResource, ResourceKind, ConflictStrategy } from '@/types'

function makeResource(kind: ResourceKind, name: string, namespace: string = 'default'): DiscoveredResource {
  return {
    kind,
    name,
    namespace,
    apiVersion: 'v1',
    raw: '{}',
    labels: { app: name },
    annotations: {},
  }
}

describe('cluster store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts unconfigured', () => {
    const store = useClusterStore()
    expect(store.configured).toBe(false)
    expect(store.sourceInfo).toBeNull()
    expect(store.resources).toEqual([])
  })

  it('setConfig updates cluster info', () => {
    const store = useClusterStore()
    const src: ClusterInfo = { name: 'source', version: '1.29', nodeCount: 3 }
    const tgt: ClusterInfo = { name: 'target', version: '1.29', nodeCount: 3 }
    store.setConfig(src, tgt, 'https://src:6443', 'https://tgt:6443')
    expect(store.configured).toBe(true)
    expect(store.sourceInfo).toEqual(src)
    expect(store.targetInfo).toEqual(tgt)
    expect(store.sourceServer).toBe('https://src:6443')
    expect(store.targetServer).toBe('https://tgt:6443')
  })

  it('setResources stores resources with _selected=false', () => {
    const store = useClusterStore()
    store.setResources([makeResource('Deployment', 'api-server')])
    expect(store.resources.length).toBe(1)
    expect((store.resources[0] as any)._selected).toBe(false)
  })

  it('toggleResource flips selection state', () => {
    const store = useClusterStore()
    store.setResources([makeResource('Deployment', 'api-server')])
    expect((store.resources[0] as any)._selected).toBe(false)
    store.toggleResource(0)
    expect((store.resources[0] as any)._selected).toBe(true)
    store.toggleResource(0)
    expect((store.resources[0] as any)._selected).toBe(false)
  })

  it('selectAll marks all resources', () => {
    const store = useClusterStore()
    store.setResources([
      makeResource('Deployment', 'one'),
      makeResource('Service', 'two'),
    ])
    store.selectAll()
    expect((store.resources[0] as any)._selected).toBe(true)
    expect((store.resources[1] as any)._selected).toBe(true)
    expect(store.selectedCount).toBe(2)
  })

  it('deselectAll unmarks all resources', () => {
    const store = useClusterStore()
    store.setResources([
      makeResource('Deployment', 'one'),
      makeResource('Service', 'two'),
    ])
    store.selectAll()
    store.deselectAll()
    expect((store.resources[0] as any)._selected).toBe(false)
    expect((store.resources[1] as any)._selected).toBe(false)
    expect(store.selectedCount).toBe(0)
  })

  it('selectAllKinds selects only matching kind', () => {
    const store = useClusterStore()
    store.setResources([
      makeResource('Deployment', 'deploy-a'),
      makeResource('Service', 'svc-a'),
      makeResource('Deployment', 'deploy-b'),
    ])
    store.selectAllKinds('Deployment')
    expect((store.resources[0] as any)._selected).toBe(true)
    expect((store.resources[1] as any)._selected).toBe(false)
    expect((store.resources[2] as any)._selected).toBe(true)
  })

  it('deselectAllKinds deselects only matching kind', () => {
    const store = useClusterStore()
    store.setResources([
      makeResource('Deployment', 'deploy-a'),
      makeResource('Service', 'svc-a'),
    ])
    store.selectAll()
    store.deselectAllKinds('Service')
    expect((store.resources[0] as any)._selected).toBe(true)
    expect((store.resources[1] as any)._selected).toBe(false)
  })

  it('getSelected returns selected as ResourceSelection[]', () => {
    const store = useClusterStore()
    store.setResources([
      makeResource('Deployment', 'api-server', 'prod'),
      makeResource('Service', 'api-server', 'prod'),
    ])
    store.selectAllKinds('Deployment')
    const sel = store.getSelected()
    expect(sel.length).toBe(1)
    expect(sel[0].kind).toBe('Deployment')
    expect(sel[0].name).toBe('api-server')
    expect(sel[0].namespace).toBe('prod')
    expect(sel[0].conflict).toBe('skip')
  })

  it('selectedCount computed reacts to selections', () => {
    const store = useClusterStore()
    store.setResources([
      makeResource('Deployment', 'one'),
      makeResource('Deployment', 'two'),
      makeResource('Service', 'three'),
    ])
    expect(store.selectedCount).toBe(0)
    store.toggleResource(0)
    store.toggleResource(1)
    expect(store.selectedCount).toBe(2)
  })
})
