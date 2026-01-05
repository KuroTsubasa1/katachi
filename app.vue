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

  // If authenticated, sync with server
  if (authStore.isAuthenticated) {
    const { startSync } = useSync()
    await startSync()
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
})
</script>
