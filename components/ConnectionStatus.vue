<template>
  <div
    class="connection-status flex items-center gap-2 px-2 py-1 rounded text-xs"
    :class="statusClass"
    :title="statusTooltip"
  >
    <div class="status-dot w-2 h-2 rounded-full" :class="dotClass"></div>
    <span class="hidden sm:inline">{{ statusText }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useWebSocket } from '~/composables/useWebSocket'

const ws = useWebSocket()

const statusText = computed(() => {
  switch (ws.status.value) {
    case 'connected':
      return 'Real-time'
    case 'connecting':
      return 'Connecting...'
    case 'disconnected':
      return 'Polling'
    case 'error':
      return 'Reconnecting'
    default:
      return 'Offline'
  }
})

const statusClass = computed(() => {
  switch (ws.status.value) {
    case 'connected':
      return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
    case 'connecting':
      return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
    case 'disconnected':
      return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
    case 'error':
      return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
    default:
      return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200'
  }
})

const dotClass = computed(() => {
  switch (ws.status.value) {
    case 'connected':
      return 'bg-green-500 animate-pulse'
    case 'connecting':
      return 'bg-yellow-500 animate-pulse'
    case 'disconnected':
      return 'bg-blue-500'
    case 'error':
      return 'bg-red-500 animate-pulse'
    default:
      return 'bg-gray-500'
  }
})

const statusTooltip = computed(() => {
  switch (ws.status.value) {
    case 'connected':
      return 'Connected via WebSocket - Real-time updates'
    case 'connecting':
      return `Connecting to WebSocket server... (attempt ${ws.reconnectAttempts.value})`
    case 'disconnected':
      return 'Using polling mode (5-second updates)'
    case 'error':
      return `Connection error - Reconnecting... (attempt ${ws.reconnectAttempts.value})`
    default:
      return 'Offline'
  }
})
</script>
