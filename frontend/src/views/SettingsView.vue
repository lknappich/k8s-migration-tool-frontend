<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useClusterStore } from '@/stores/cluster'
import { useSettingsStore } from '@/stores/settings'
import { useToastStore } from '@/stores/toasts'
import { api } from '@/composables/useApi'
import type { ConflictStrategy } from '@/types'

const clusterStore = useClusterStore()
const settingsStore = useSettingsStore()
const toastStore = useToastStore()

const newRegKey = ref('')
const newRegVal = ref('')
const newNsKey = ref('')
const newNsVal = ref('')

const availableModels = ref<string[]>([])
const testingConnection = ref(false)

async function fetchModels(): Promise<void> {
  try {
    availableModels.value = await api.getOllamaModels()
  } catch {
    availableModels.value = []
  }
}

async function testConnection(): Promise<void> {
  testingConnection.value = true
  try {
    await api.getOllamaStatus()
    toastStore.addToast('Ollama connection successful', 'info')
  } catch {
    toastStore.addToast('Ollama connection failed', 'error')
  }
  testingConnection.value = false
}

onMounted(() => {
  fetchModels()
})

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
      <h2 class="text-sm font-semibold text-gray-200 mb-1">AI Bundle Analysis</h2>
      <p class="text-xs text-gray-500 mb-4">Configure AI-powered bundling via Ollama</p>

      <div class="space-y-5">
        <div>
          <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Ollama Connection</h3>
          <div class="space-y-3">
            <div>
              <label class="text-xs text-gray-400 block mb-1">Mode</label>
              <div class="flex gap-2">
                <button
                  @click="settingsStore.ollamaMode = 'local'"
                  class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  :class="settingsStore.ollamaMode === 'local' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'"
                >Local</button>
                <button
                  @click="settingsStore.ollamaMode = 'cloud'"
                  class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  :class="settingsStore.ollamaMode === 'cloud' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'"
                >Cloud</button>
              </div>
            </div>
            <div>
              <label class="text-xs text-gray-400 block mb-1">{{ settingsStore.ollamaMode === 'local' ? 'Local URL' : 'Cloud URL' }}</label>
              <input v-if="settingsStore.ollamaMode === 'local'" v-model="settingsStore.ollamaLocalUrl" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 placeholder-gray-500 focus:border-indigo-500 focus:outline-none" placeholder="http://localhost:11434" />
              <input v-else v-model="settingsStore.ollamaCloudUrl" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 placeholder-gray-500 focus:border-indigo-500 focus:outline-none" placeholder="https://ollama.example.com" />
            </div>
            <div v-if="settingsStore.ollamaMode === 'cloud'">
              <label class="text-xs text-gray-400 block mb-1">API Key</label>
              <input v-model="settingsStore.ollamaApiKey" type="password" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 placeholder-gray-500 focus:border-indigo-500 focus:outline-none" placeholder="Enter API key" />
            </div>
            <div>
              <label class="text-xs text-gray-400 block mb-1">Model</label>
              <select v-model="settingsStore.ollamaModel" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none">
                <option value="">Auto-detect</option>
                <option v-for="m in availableModels" :key="m" :value="m">{{ m }}</option>
              </select>
            </div>
            <div class="flex gap-3">
              <button
                @click="testConnection"
                :disabled="testingConnection"
                class="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                {{ testingConnection ? 'Testing...' : 'Test Connection' }}
              </button>
              <button
                @click="fetchModels"
                class="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs transition-colors"
              >
                Refresh Models
              </button>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-800 pt-5">
          <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Bundle Analysis Settings</h3>
          <div class="space-y-4">
            <div>
              <label class="text-xs text-gray-400 block mb-1">Batch Size</label>
              <input v-model.number="settingsStore.batchSize" type="number" min="1" max="100" class="w-24 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none" />
            </div>
            <label class="flex items-center justify-between py-2">
              <div>
                <span class="text-sm text-gray-200">Auto-Analyze</span>
                <p class="text-xs text-gray-500">Automatically run bundle analysis after resource discovery</p>
              </div>
              <input v-model="settingsStore.autoAnalyze" type="checkbox" class="rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-600 scale-125" />
            </label>
            <label class="flex items-center justify-between py-2 border-t border-gray-800">
              <div>
                <span class="text-sm text-gray-200">Show AI Reasoning</span>
                <p class="text-xs text-gray-500">Display AI-generated rationale alongside bundle suggestions</p>
              </div>
              <input v-model="settingsStore.showAIReasoning" type="checkbox" class="rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-600 scale-125" />
            </label>
            <label class="flex items-center justify-between py-2 border-t border-gray-800">
              <div>
                <span class="text-sm text-gray-200">Show Confidence Scores</span>
                <p class="text-xs text-gray-500">Display confidence breakdowns for bundle groupings and dependencies</p>
              </div>
              <input v-model="settingsStore.showConfidence" type="checkbox" class="rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-600 scale-125" />
            </label>
            <label class="flex items-center justify-between py-2 border-t border-gray-800">
              <div>
                <span class="text-sm text-gray-200">Fallback to Static Analysis</span>
                <p class="text-xs text-gray-500">Use traditional pattern-based bundling when AI service is unreachable</p>
              </div>
              <input v-model="settingsStore.fallbackStatic" type="checkbox" class="rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-600 scale-125" />
            </label>
            <div class="border-t border-gray-800 pt-4">
              <label class="text-xs text-gray-400 block mb-1">Minimum Confidence Threshold</label>
              <select v-model="settingsStore.confidenceThreshold" class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none w-48">
                <option value="high">High (strict)</option>
                <option value="medium">Medium</option>
                <option value="low">Low (permissive)</option>
              </select>
            </div>
          </div>
        </div>
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
