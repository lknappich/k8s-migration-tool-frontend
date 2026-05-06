<script setup lang="ts">
import { ref } from 'vue'
import { useClusterStore } from '@/stores/cluster'
import { useSettingsStore } from '@/stores/settings'
import { useToastStore } from '@/stores/toasts'
import type { ConflictStrategy } from '@/types'

const clusterStore = useClusterStore()
const settingsStore = useSettingsStore()
const toastStore = useToastStore()

const newRegKey = ref('')
const newRegVal = ref('')
const newNsKey = ref('')
const newNsVal = ref('')

function addRegistryRewrite(): void {
  const key = newRegKey.value.trim()
  const val = newRegVal.value.trim()
  if (!key || !val) return
  settingsStore.setRegistryRewrite(key, val)
  newRegKey.value = ''
  newRegVal.value = ''
}

function addNamespaceRemap(): void {
  const key = newNsKey.value.trim()
  const val = newNsVal.value.trim()
  if (!key || !val) return
  settingsStore.setNamespaceRemap(key, val)
  newNsKey.value = ''
  newNsVal.value = ''
}

function disconnectClusters(): void {
  clusterStore.configured = false
  clusterStore.sourceInfo = null
  clusterStore.targetInfo = null
  clusterStore.resources = []
  toastStore.addToast('Clusters disconnected', 'info')
}
</script>

<template>
  <div class="p-6 space-y-8">
    <div>
      <h1 class="text-xl font-semibold text-gray-100 mb-1">Settings</h1>
      <p class="text-sm text-gray-400">Configure migration tool preferences</p>
    </div>

    <section class="border border-gray-800 rounded-lg p-5 bg-gray-900">
      <h2 class="text-sm font-semibold text-gray-200 mb-1">Cluster Connections</h2>
      <p class="text-xs text-gray-500 mb-4">Manage connected Kubernetes clusters</p>

      <div v-if="clusterStore.configured" class="space-y-2">
        <div class="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
          <div>
            <span class="text-sm text-gray-200">{{ clusterStore.sourceInfo?.name || 'Source' }}</span>
            <span class="text-xs text-gray-500 ml-3">v{{ clusterStore.sourceInfo?.version || '-' }}</span>
          </div>
          <span class="text-xs text-emerald-400 flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Connected
          </span>
        </div>
        <div class="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
          <div>
            <span class="text-sm text-gray-200">{{ clusterStore.targetInfo?.name || 'Target' }}</span>
            <span class="text-xs text-gray-500 ml-3">v{{ clusterStore.targetInfo?.version || '-' }}</span>
          </div>
          <span class="text-xs text-emerald-400 flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Connected
          </span>
        </div>
        <button
          @click="disconnectClusters"
          class="px-4 py-2 border border-red-800 text-red-400 rounded-lg text-sm hover:bg-red-900/20 transition-colors"
        >
          Disconnect All
        </button>
      </div>
      <div v-else class="text-sm text-gray-500">No clusters connected.</div>
    </section>

    <section class="border border-gray-800 rounded-lg p-5 bg-gray-900">
      <h2 class="text-sm font-semibold text-gray-200 mb-1">Migration Defaults</h2>
      <p class="text-xs text-gray-500 mb-4">Configure default behavior for migration operations</p>
      <div class="space-y-4">
        <div>
          <label class="text-xs text-gray-400 block mb-1">Default Conflict Strategy</label>
          <select
            :value="settingsStore.defaultConflict"
            @change="settingsStore.defaultConflict = ($event.target as HTMLSelectElement).value as ConflictStrategy"
            class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none w-48"
          >
            <option value="skip">Skip</option>
            <option value="overwrite">Overwrite</option>
            <option value="rename">Rename</option>
          </select>
        </div>
      </div>
    </section>

    <section class="border border-gray-800 rounded-lg p-5 bg-gray-900">
      <h2 class="text-sm font-semibold text-gray-200 mb-1">Bundle Resolution</h2>
      <p class="text-xs text-gray-500 mb-4">Configure how dependencies are resolved for bundles</p>
      <div class="space-y-4">
        <label class="flex items-center justify-between py-2">
          <div>
            <span class="text-sm text-gray-200">Auto-add Dependencies</span>
            <p class="text-xs text-gray-500">Automatically include missing internal dependencies</p>
          </div>
          <input v-model="settingsStore.autoAddDeps" type="checkbox" class="rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-600 scale-125" />
        </label>
        <label class="flex items-center justify-between py-2 border-t border-gray-800">
          <div>
            <span class="text-sm text-gray-200">Warn on External Dependencies</span>
            <p class="text-xs text-gray-500">Show warnings when bundles reference resources outside the selected set</p>
          </div>
          <input v-model="settingsStore.warnExternal" type="checkbox" class="rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-600 scale-125" />
        </label>
        <label class="flex items-center justify-between py-2 border-t border-gray-800">
          <div>
            <span class="text-sm text-gray-200">Block on Unresolved Dependencies</span>
            <p class="text-xs text-gray-500">Prevent migration if any dependencies cannot be resolved</p>
          </div>
          <input v-model="settingsStore.blockUnresolved" type="checkbox" class="rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-600 scale-125" />
        </label>
      </div>
    </section>

    <section class="border border-gray-800 rounded-lg p-5 bg-gray-900">
      <h2 class="text-sm font-semibold text-gray-200 mb-1">Image Registry Rewrite</h2>
      <p class="text-xs text-gray-500 mb-4">Map source image registries to target registries</p>
      <div class="space-y-2 mb-4">
        <div
          v-for="(val, key) in settingsStore.registryRewrite"
          :key="key"
          class="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2 text-sm"
        >
          <span class="font-mono text-gray-300 flex-1">{{ key }}</span>
          <span class="text-gray-500">&rarr;</span>
          <span class="font-mono text-gray-300 flex-1">{{ val }}</span>
          <button @click="settingsStore.removeRegistryRewrite(key)" class="text-red-400 hover:text-red-300 text-xs">&times;</button>
        </div>
        <div v-if="Object.keys(settingsStore.registryRewrite).length === 0" class="text-xs text-gray-500 py-2">No registry rewrites configured.</div>
      </div>
      <div class="flex gap-2">
        <input v-model="newRegKey" placeholder="Old registry" class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 placeholder-gray-500 focus:border-indigo-500 focus:outline-none flex-1" />
        <input v-model="newRegVal" placeholder="New registry" class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 placeholder-gray-500 focus:border-indigo-500 focus:outline-none flex-1" />
        <button @click="addRegistryRewrite" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors">Add</button>
      </div>
    </section>

    <section class="border border-gray-800 rounded-lg p-5 bg-gray-900">
      <h2 class="text-sm font-semibold text-gray-200 mb-1">Namespace Remapping</h2>
      <p class="text-xs text-gray-500 mb-4">Map source namespaces to target namespaces</p>
      <div class="space-y-2 mb-4">
        <div
          v-for="(val, key) in settingsStore.namespaceRemap"
          :key="key"
          class="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2 text-sm"
        >
          <span class="font-mono text-gray-300 flex-1">{{ key }}</span>
          <span class="text-gray-500">&rarr;</span>
          <span class="font-mono text-gray-300 flex-1">{{ val }}</span>
          <button @click="settingsStore.removeNamespaceRemap(key)" class="text-red-400 hover:text-red-300 text-xs">&times;</button>
        </div>
        <div v-if="Object.keys(settingsStore.namespaceRemap).length === 0" class="text-xs text-gray-500 py-2">No namespace remaps configured.</div>
      </div>
      <div class="flex gap-2">
        <input v-model="newNsKey" placeholder="Old namespace" class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 placeholder-gray-500 focus:border-indigo-500 focus:outline-none flex-1" />
        <input v-model="newNsVal" placeholder="New namespace" class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 placeholder-gray-500 focus:border-indigo-500 focus:outline-none flex-1" />
        <button @click="addNamespaceRemap" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors">Add</button>
      </div>
    </section>

    <section class="border border-gray-800 rounded-lg p-5 bg-gray-900">
      <h2 class="text-sm font-semibold text-gray-200 mb-1">Theme</h2>
      <p class="text-xs text-gray-500 mb-3">Choose your preferred interface theme</p>
      <div class="flex items-center gap-4">
        <span class="text-sm bg-indigo-900/30 text-indigo-300 px-3 py-1 rounded-full border border-indigo-700/30">Dark (only)</span>
        <span class="text-xs text-gray-500">Light theme coming soon</span>
      </div>
    </section>

    <section class="border border-gray-800 rounded-lg p-5 bg-gray-900">
      <h2 class="text-sm font-semibold text-gray-200 mb-1">About</h2>
      <div class="space-y-2 text-sm text-gray-400">
        <div><span class="text-gray-500">Version:</span> v0.1.0</div>
        <div><span class="text-gray-500">License:</span> MIT</div>
        <div>
          <span class="text-gray-500">GitHub:</span>
          <a href="#" class="text-indigo-400 hover:text-indigo-300 transition-colors">k8s-migration</a>
        </div>
      </div>
    </section>
  </div>
</template>
