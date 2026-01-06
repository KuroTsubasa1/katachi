<template>
  <div id="app" class="h-screen w-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
import { useCanvasStore } from '~/stores/canvas'
import { useAuthStore } from '~/stores/auth'
import { useSync } from '~/composables/useSync'
import { watch } from 'vue'

const canvasStore = useCanvasStore()
const authStore = useAuthStore()
const router = useRouter()
const { startSync, startPolling, stopPolling, initWebSocket, joinBoard, leaveBoard } = useSync()

onMounted(async () => {
  // Check authentication
  await authStore.checkAuth()

  // Redirect to login if not authenticated
  if (!authStore.isAuthenticated && router.currentRoute.value.path !== '/login' && router.currentRoute.value.path !== '/register') {
    router.push('/login')
    return
  }

  // Load from localStorage (offline fallback)
  canvasStore.loadFromLocalStorage()

  // If authenticated, sync with server and start real-time updates
  if (authStore.isAuthenticated) {
    await startSync()

    // Initialize WebSocket for real-time updates
    const ws = initWebSocket()

    // Join board when WebSocket connects
    ws.on('connected', () => {
      console.log('[App] WebSocket connected, joining current board')
      if (canvasStore.currentBoard) {
        joinBoard(canvasStore.currentBoard.id)
      }
    })

    // Start polling as fallback (will skip if WebSocket connected)
    startPolling()
  }

  // Create default board if none exist
  if (canvasStore.boards.length === 0) {
    canvasStore.createBoard('My First Board')
  }

  // Auto-save on any state change
  watch(
    () => [
      canvasStore.boards,
      canvasStore.currentBoard,
      canvasStore.viewport,
      canvasStore.globalDrawingPaths,
      canvasStore.snapToGrid,
      canvasStore.darkMode
    ],
    () => {
      canvasStore.saveToLocalStorage()
    },
    { deep: true }
  )

  // Watch for board changes to join/leave via WebSocket
  watch(
    () => canvasStore.currentBoard?.id,
    (newBoardId, oldBoardId) => {
      if (oldBoardId && oldBoardId !== newBoardId) {
        leaveBoard(oldBoardId)
      }
      if (newBoardId && newBoardId !== oldBoardId) {
        joinBoard(newBoardId)
      }
    }
  )
})

onUnmounted(() => {
  // Clean up polling when component unmounts
  stopPolling()

  // Leave board via WebSocket
  if (canvasStore.currentBoard) {
    leaveBoard(canvasStore.currentBoard.id)
  }
})
</script>
