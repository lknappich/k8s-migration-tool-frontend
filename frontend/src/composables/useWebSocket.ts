import { ref, onUnmounted } from 'vue'
import type { WSEvent } from '@/types'

export function useWebSocket(jobId: string, onEvent: (ev: WSEvent) => void) {
  const connected = ref(false)
  let ws: WebSocket | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let attempts = 0

  function connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const url = `${protocol}://${window.location.host}/api/migrate/${jobId}/live`

    ws = new WebSocket(url)
    ws.onopen = () => {
      connected.value = true
      attempts = 0
    }
    ws.onmessage = (msg) => {
      try {
        const ev: WSEvent = JSON.parse(msg.data)
        onEvent(ev)
      } catch {}
    }
    ws.onclose = () => {
      connected.value = false
      attempts++
      const delay = Math.min(1000 * Math.pow(2, attempts), 10000)
      reconnectTimer = setTimeout(connect, delay)
    }
    ws.onerror = () => {
      ws?.close()
    }
  }

  function disconnect() {
    if (reconnectTimer) clearTimeout(reconnectTimer)
    ws?.close()
    connected.value = false
  }

  onUnmounted(disconnect)

  return { connected, connect, disconnect }
}
