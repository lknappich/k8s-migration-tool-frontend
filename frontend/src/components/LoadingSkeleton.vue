<script setup lang="ts">
withDefaults(defineProps<{ count?: number }>(), { count: 3 })
</script>

<template>
  <div class="space-y-3">
    <div
      v-for="n in count"
      :key="n"
      class="bg-gray-700 rounded-lg animate-pulse h-12"
    />
  </div>
</template>
