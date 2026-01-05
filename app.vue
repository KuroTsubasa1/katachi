<template>
  <div id="app" class="h-screen w-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
import { useCanvasStore } from '~/stores/canvas'

const canvasStore = useCanvasStore()

onMounted(() => {
  if (canvasStore.boards.length === 0) {
    canvasStore.createBoard('My First Board')
  }
})
</script>
