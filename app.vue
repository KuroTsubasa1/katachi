<template>
  <div id="app" class="h-screen w-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
import { useCanvasStore } from '~/stores/canvas'
import { watch } from 'vue'

const canvasStore = useCanvasStore()

onMounted(() => {
  // Load saved data
  canvasStore.loadFromLocalStorage()

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
