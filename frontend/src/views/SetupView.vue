<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useClusterStore } from '@/stores/cluster'
import { useToastStore } from '@/stores/toasts'
import { api } from '@/composables/useApi'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'

const router = useRouter()
const store = useClusterStore()
const toastStore = useToastStore()

const sourceKubeconfig = ref('')
const targetKubeconfig = ref('')
const sourceInsecure = ref(false)
const targetInsecure = ref(false)
const loading = ref(false)
const error = ref('')
const connected = ref(false)

const sourceFile = ref<HTMLInputElement | null>(null)
const targetFile = ref<HTMLInputElement | null>(null)

async function handleFile(input: HTMLInputElement | null, target: 'source' | 'target') {
  if (!input?.files?.length) return
  const text = await input.files[0].text()
  if (target === 'source') sourceKubeconfig.value = text
  else targetKubeconfig.value = text
}

const canConnect = computed(() => sourceKubeconfig.value.trim() && targetKubeconfig.value.trim())

async function connect() {
  loading.value = true
  error.value = ''
  try {
    const result = await api.configure(
      sourceKubeconfig.value,
      targetKubeconfig.value,
      sourceInsecure.value || targetInsecure.value,
    )
    store.setConfig(result.source, result.target, result.sourceServer, result.targetServer)
    const resources = await api.getResources()
    store.setResources(resources)
    connected.value = true
    toastStore.addToast('Clusters connected successfully', 'success')
  } catch (e: unknown) {
    const msg = (e as { message?: string }).message || 'Connection failed'
    error.value = msg
    toastStore.addToast(msg, 'error')
  } finally {
    loading.value = false
  }
}

function goToDashboard() {
  router.push('/dashboard')
}
</script>

<template>
  <div class="p-6 space-y-6">
    <div>
      <h1 class="text-xl font-semibold text-gray-100 mb-1">Cluster Setup</h1>
      <p class="text-sm text-gray-400">Connect your source and target Kubernetes clusters</p>
    </div>

    <div class="flex items-center gap-0">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">1</div>
        <span class="text-sm font-medium text-gray-100">Connect Source</span>
      </div>
      <div class="w-12 h-px bg-gray-700 mx-3" />
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-400">2</div>
        <span class="text-sm font-medium text-gray-400">Connect Target</span>
      </div>
      <div class="w-12 h-px bg-gray-700 mx-3" />
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-400">3</div>
        <span class="text-sm font-medium text-gray-400">Review</span>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-6">
      <div class="border border-gray-800 rounded-lg p-6 bg-gray-900">
        <h2 class="text-sm font-semibold text-indigo-400 mb-4">Source Cluster</h2>
        <textarea
          v-model="sourceKubeconfig"
          placeholder="Paste source cluster kubeconfig..."
          class="w-full h-48 bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm font-mono resize-none text-gray-200 placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
        />
        <div class="flex items-center justify-between mt-3">
          <div>
            <input ref="sourceFile" type="file" accept=".yaml,.yml" class="hidden" @change="handleFile($event.target as HTMLInputElement, 'source')" />
            <button @click="sourceFile?.click()" class="text-xs text-gray-400 hover:text-indigo-400 transition-colors">
              Upload file
            </button>
          </div>
          <label class="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
            Skip TLS
            <input v-model="sourceInsecure" type="checkbox" class="rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-600" />
          </label>
        </div>
      </div>

      <div class="border border-gray-800 rounded-lg p-6 bg-gray-900">
        <h2 class="text-sm font-semibold text-emerald-400 mb-4">Target Cluster</h2>
        <textarea
          v-model="targetKubeconfig"
          placeholder="Paste target cluster kubeconfig..."
          class="w-full h-48 bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm font-mono resize-none text-gray-200 placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
        />
        <div class="flex items-center justify-between mt-3">
          <div>
            <input ref="targetFile" type="file" accept=".yaml,.yml" class="hidden" @change="handleFile($event.target as HTMLInputElement, 'target')" />
            <button @click="targetFile?.click()" class="text-xs text-gray-400 hover:text-indigo-400 transition-colors">
              Upload file
            </button>
          </div>
          <label class="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
            Skip TLS
            <input v-model="targetInsecure" type="checkbox" class="rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-600" />
          </label>
        </div>
      </div>
    </div>

    <div v-if="error" class="p-4 border border-red-800 rounded-lg bg-red-900/20 text-red-400 text-sm">
      {{ error }}
    </div>

    <LoadingSkeleton v-if="loading" :count="3" />

    <div v-if="!loading && !connected" class="flex gap-4">
      <button
        @click="connect"
        :disabled="!canConnect"
        class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:border-gray-700 disabled:border rounded-lg font-semibold text-sm text-white transition-colors"
      >
        Connect & Discover
      </button>
    </div>

    <div v-if="connected" class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div class="border border-gray-800 rounded-lg p-5 bg-gray-900">
          <div class="flex items-center gap-2 mb-3">
            <span class="w-2 h-2 rounded-full bg-emerald-400" />
            <span class="text-xs text-gray-400">Source Verified</span>
          </div>
          <div class="flex gap-6">
            <div>
              <div class="text-xs text-gray-500">Name</div>
              <div class="text-sm text-gray-200">{{ store.sourceInfo?.name }}</div>
            </div>
            <div>
              <div class="text-xs text-gray-500">Version</div>
              <div class="text-sm text-gray-200 font-mono">{{ store.sourceInfo?.version }}</div>
            </div>
            <div>
              <div class="text-xs text-gray-500">Nodes</div>
              <div class="text-sm text-gray-200">{{ store.sourceInfo?.nodeCount }}</div>
            </div>
          </div>
        </div>
        <div class="border border-gray-800 rounded-lg p-5 bg-gray-900">
          <div class="flex items-center gap-2 mb-3">
            <span class="w-2 h-2 rounded-full bg-emerald-400" />
            <span class="text-xs text-gray-400">Target Verified</span>
          </div>
          <div class="flex gap-6">
            <div>
              <div class="text-xs text-gray-500">Name</div>
              <div class="text-sm text-gray-200">{{ store.targetInfo?.name }}</div>
            </div>
            <div>
              <div class="text-xs text-gray-500">Version</div>
              <div class="text-sm text-gray-200 font-mono">{{ store.targetInfo?.version }}</div>
            </div>
            <div>
              <div class="text-xs text-gray-500">Nodes</div>
              <div class="text-sm text-gray-200">{{ store.targetInfo?.nodeCount }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex gap-4">
        <button
          @click="goToDashboard"
          class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          Continue to Dashboard
        </button>
      </div>
    </div>
  </div>
</template>
