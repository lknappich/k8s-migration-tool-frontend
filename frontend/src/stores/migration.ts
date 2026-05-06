import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { MigrationJob, ResourceResult } from '@/types'

export const useMigrationStore = defineStore('migration', () => {
  const currentJob = ref<MigrationJob | null>(null)
  const logs = ref<{ resource: string; namespace: string; kind: string; status: string; message: string; timestamp: string }[]>([])

  function setJob(job: MigrationJob) {
    currentJob.value = job
  }

  function addLog(entry: typeof logs.value[0]) {
    logs.value.push(entry)
  }

  function clearLogs() {
    logs.value = []
  }

  function updateProgress(progress: MigrationJob['progress']) {
    if (currentJob.value) {
      currentJob.value.progress = progress
    }
  }

  return { currentJob, logs, setJob, addLog, clearLogs, updateProgress }
})
