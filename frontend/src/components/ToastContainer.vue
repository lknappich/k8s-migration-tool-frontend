<script setup lang="ts">
import { useToastStore } from '@/stores/toasts'

const toastStore = useToastStore()

function typeClasses(type: string): string {
  switch (type) {
    case 'success': return 'bg-emerald-900/80 border-emerald-700'
    case 'error':   return 'bg-red-900/80 border-red-700'
    case 'warning': return 'bg-amber-900/80 border-amber-700'
    case 'info':    return 'bg-indigo-900/80 border-indigo-700'
    default:        return 'bg-gray-800 border-gray-700'
  }
}
</script>

<template>
  <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
    <div
      v-for="toast in toastStore.toasts"
      :key="toast.id"
      :class="typeClasses(toast.type)"
      class="border rounded-lg px-4 py-3 text-sm shadow-lg flex items-start gap-3 animate-slide-in backdrop-blur-sm"
    >
      <span class="flex-1 text-gray-100">{{ toast.message }}</span>
      <button
        @click="toastStore.removeToast(toast.id)"
        class="text-gray-400 hover:text-gray-200 font-bold leading-none shrink-0"
      >
        &times;
      </button>
    </div>
  </div>
</template>
