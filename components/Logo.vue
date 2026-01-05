<template>
  <div class="flex items-center gap-3">
    <svg
      :width="size"
      :height="size"
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      class="logo-icon"
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" :style="`stop-color:${iconColor1};stop-opacity:1`" />
          <stop offset="100%" :style="`stop-color:${iconColor2};stop-opacity:1`" />
        </linearGradient>
      </defs>

      <!-- Background -->
      <rect x="4" y="4" width="40" height="40" rx="8" fill="url(#logoGradient)" opacity="0.1"/>

      <!-- Geometric shapes -->
      <rect x="12" y="12" width="14" height="14" rx="2" fill="url(#logoGradient)"/>
      <circle cx="28" cy="28" r="8" :fill="iconColor3"/>
      <path d="M 24 32 L 18 38 L 30 38 Z" :fill="iconColor2"/>

      <!-- Accent -->
      <circle cx="36" cy="12" r="2" fill="#F59E0B"/>
    </svg>

    <div v-if="showText" class="flex flex-col">
      <span class="font-bold text-lg leading-tight" :class="textClass">
        Katachi
      </span>
      <span class="text-xs text-gray-500 dark:text-gray-400 font-light">
        形
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCanvasStore } from '~/stores/canvas'

const props = withDefaults(defineProps<{
  size?: number
  showText?: boolean
}>(), {
  size: 32,
  showText: true
})

const canvasStore = useCanvasStore()

const iconColor1 = computed(() =>
  canvasStore.darkMode ? '#60A5FA' : '#3B82F6'
)

const iconColor2 = computed(() =>
  canvasStore.darkMode ? '#818CF8' : '#6366F1'
)

const iconColor3 = computed(() =>
  canvasStore.darkMode ? '#A78BFA' : '#8B5CF6'
)

const textClass = computed(() =>
  canvasStore.darkMode ? 'text-gray-100' : 'text-gray-800'
)
</script>

<style scoped>
.logo-icon {
  flex-shrink: 0;
}
</style>
