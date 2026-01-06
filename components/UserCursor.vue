<template>
  <div
    class="absolute pointer-events-none z-[9998] transition-transform duration-100"
    :style="{
      left: `${transformedX}px`,
      top: `${transformedY}px`,
      transform: 'translate(-2px, -2px)'
    }"
  >
    <!-- Cursor SVG -->
    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M5 3L19 12L12 13L9 20L5 3Z"
        :fill="user.color"
        stroke="white"
        stroke-width="1.5"
      />
    </svg>

    <!-- User name label -->
    <div
      class="absolute top-6 left-6 px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap shadow-lg"
      :style="{ backgroundColor: user.color }"
    >
      {{ user.userName }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCanvasStore } from '~/stores/canvas'

interface Props {
  user: {
    userId: string
    userName: string
    cursorX: number
    cursorY: number
    color: string
  }
}

const props = defineProps<Props>()
const canvasStore = useCanvasStore()

// Transform cursor position with viewport
const transformedX = computed(() => {
  return props.user.cursorX * canvasStore.viewport.scale + canvasStore.viewport.x
})

const transformedY = computed(() => {
  return props.user.cursorY * canvasStore.viewport.scale + canvasStore.viewport.y
})
</script>
