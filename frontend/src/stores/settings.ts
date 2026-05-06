import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { ConflictStrategy } from '@/types'

const STORAGE_KEY = 'k8s-migrate-settings'

interface StoredSettings {
  defaultConflict: ConflictStrategy
  autoAddDeps: boolean
  warnExternal: boolean
  blockUnresolved: boolean
  registryRewrite: Record<string, string>
  namespaceRemap: Record<string, string>
}

function loadSettings(): StoredSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as StoredSettings
  } catch { /* corrupt data, use defaults */ }
  return {
    defaultConflict: 'skip',
    autoAddDeps: false,
    warnExternal: true,
    blockUnresolved: false,
    registryRewrite: {},
    namespaceRemap: {},
  }
}

function persist(settings: StoredSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch { /* storage full or unavailable */ }
}

export const useSettingsStore = defineStore('settings', () => {
  const loaded = loadSettings()

  const defaultConflict = ref<ConflictStrategy>(loaded.defaultConflict)
  const autoAddDeps = ref(loaded.autoAddDeps)
  const warnExternal = ref(loaded.warnExternal)
  const blockUnresolved = ref(loaded.blockUnresolved)
  const registryRewrite = ref<Record<string, string>>(loaded.registryRewrite)
  const namespaceRemap = ref<Record<string, string>>(loaded.namespaceRemap)

  watch(
    [defaultConflict, autoAddDeps, warnExternal, blockUnresolved, registryRewrite, namespaceRemap],
    () => {
      persist({
        defaultConflict: defaultConflict.value,
        autoAddDeps: autoAddDeps.value,
        warnExternal: warnExternal.value,
        blockUnresolved: blockUnresolved.value,
        registryRewrite: { ...registryRewrite.value },
        namespaceRemap: { ...namespaceRemap.value },
      })
    },
    { deep: true },
  )

  function setRegistryRewrite(key: string, value: string): void {
    registryRewrite.value = { ...registryRewrite.value, [key]: value }
  }

  function removeRegistryRewrite(key: string): void {
    const next = { ...registryRewrite.value }
    delete next[key]
    registryRewrite.value = next
  }

  function setNamespaceRemap(key: string, value: string): void {
    namespaceRemap.value = { ...namespaceRemap.value, [key]: value }
  }

  function removeNamespaceRemap(key: string): void {
    const next = { ...namespaceRemap.value }
    delete next[key]
    namespaceRemap.value = next
  }

  return {
    defaultConflict,
    autoAddDeps,
    warnExternal,
    blockUnresolved,
    registryRewrite,
    namespaceRemap,
    setRegistryRewrite,
    removeRegistryRewrite,
    setNamespaceRemap,
    removeNamespaceRemap,
  }
})
