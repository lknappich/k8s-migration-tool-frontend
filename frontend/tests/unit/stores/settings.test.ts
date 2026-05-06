import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import type { ConflictStrategy } from '@/types'

describe('settings store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('defaultConflict starts as "skip"', () => {
    const store = useSettingsStore()
    expect(store.defaultConflict).toBe('skip')
  })

  it('autoAddDeps starts false', () => {
    const store = useSettingsStore()
    expect(store.autoAddDeps).toBe(false)
  })

  it('warnExternal starts true', () => {
    const store = useSettingsStore()
    expect(store.warnExternal).toBe(true)
  })

  it('blockUnresolved starts false', () => {
    const store = useSettingsStore()
    expect(store.blockUnresolved).toBe(false)
  })

  it('defaultConflict can be changed', () => {
    const store = useSettingsStore()
    store.defaultConflict = 'overwrite' as ConflictStrategy
    expect(store.defaultConflict).toBe('overwrite')
  })

  it('autoAddDeps can be toggled', () => {
    const store = useSettingsStore()
    store.autoAddDeps = true
    expect(store.autoAddDeps).toBe(true)
  })

  it('warnExternal reflects state', () => {
    const store = useSettingsStore()
    store.warnExternal = false
    expect(store.warnExternal).toBe(false)
  })

  it('persists settings to localStorage', async () => {
    const store = useSettingsStore()
    store.defaultConflict = 'rename' as ConflictStrategy
    store.autoAddDeps = true
    store.warnExternal = false

    await nextTick()

    const raw = localStorage.getItem('k8s-migrate-settings')
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw!)
    expect(parsed.defaultConflict).toBe('rename')
    expect(parsed.autoAddDeps).toBe(true)
    expect(parsed.warnExternal).toBe(false)
  })

  it('loads persisted settings on new instance', () => {
    localStorage.setItem('k8s-migrate-settings', JSON.stringify({
      defaultConflict: 'overwrite',
      autoAddDeps: true,
      warnExternal: false,
      blockUnresolved: true,
      registryRewrite: {},
      namespaceRemap: {},
    }))

    setActivePinia(createPinia())
    const store = useSettingsStore()
    expect(store.defaultConflict).toBe('overwrite')
    expect(store.autoAddDeps).toBe(true)
    expect(store.warnExternal).toBe(false)
    expect(store.blockUnresolved).toBe(true)
  })

  it('registryRewrite can be added and removed', () => {
    const store = useSettingsStore()
    store.setRegistryRewrite('docker.io', 'harbor.internal')
    expect(store.registryRewrite['docker.io']).toBe('harbor.internal')

    store.removeRegistryRewrite('docker.io')
    expect(store.registryRewrite['docker.io']).toBeUndefined()
  })

  it('namespaceRemap can be added and removed', () => {
    const store = useSettingsStore()
    store.setNamespaceRemap('old-ns', 'new-ns')
    expect(store.namespaceRemap['old-ns']).toBe('new-ns')

    store.removeNamespaceRemap('old-ns')
    expect(store.namespaceRemap['old-ns']).toBeUndefined()
  })

  it('handles corrupt localStorage gracefully', () => {
    localStorage.setItem('k8s-migrate-settings', '{broken')

    setActivePinia(createPinia())
    const store = useSettingsStore()
    expect(store.defaultConflict).toBe('skip')
    expect(store.autoAddDeps).toBe(false)
  })
})
