<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-[10001]"
    @click.self="close"
  >
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto" @click.stop>
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Keyboard Shortcuts</h2>
        <button @click="close" class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="space-y-6">
        <!-- Card Operations -->
        <div>
          <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">Card Operations</h3>
          <div class="grid grid-cols-2 gap-3">
            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <span class="text-sm dark:text-gray-300">Delete selected card</span>
              <kbd class="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-xs font-mono">Delete</kbd>
            </div>
            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <span class="text-sm dark:text-gray-300">Copy card</span>
              <kbd class="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-xs font-mono">{{ modKey }}+C</kbd>
            </div>
            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <span class="text-sm dark:text-gray-300">Paste card</span>
              <kbd class="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-xs font-mono">{{ modKey }}+V</kbd>
            </div>
            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <span class="text-sm dark:text-gray-300">Duplicate card</span>
              <kbd class="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-xs font-mono">{{ modKey }}+D</kbd>
            </div>
            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <span class="text-sm dark:text-gray-300">Deselect card</span>
              <kbd class="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-xs font-mono">Esc</kbd>
            </div>
          </div>
        </div>

        <!-- View Controls -->
        <div>
          <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">View Controls</h3>
          <div class="grid grid-cols-2 gap-3">
            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <span class="text-sm dark:text-gray-300">Zoom in</span>
              <kbd class="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-xs font-mono">{{ modKey }}+=</kbd>
            </div>
            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <span class="text-sm dark:text-gray-300">Zoom out</span>
              <kbd class="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-xs font-mono">{{ modKey }}+-</kbd>
            </div>
            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <span class="text-sm dark:text-gray-300">Reset zoom</span>
              <kbd class="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-xs font-mono">{{ modKey }}+0</kbd>
            </div>
          </div>
        </div>

        <!-- Navigation -->
        <div>
          <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">Card Movement</h3>
          <div class="grid grid-cols-2 gap-3">
            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <span class="text-sm dark:text-gray-300">Move card (10px)</span>
              <kbd class="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-xs font-mono">Arrow Keys</kbd>
            </div>
            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <span class="text-sm dark:text-gray-300">Move card (50px)</span>
              <kbd class="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-xs font-mono">Shift+Arrows</kbd>
            </div>
          </div>
        </div>

        <!-- Tool Switching -->
        <div>
          <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">Tool Switching</h3>
          <div class="grid grid-cols-2 gap-3">
            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <span class="text-sm dark:text-gray-300">Select tool</span>
              <kbd class="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-xs font-mono">V or 1</kbd>
            </div>
            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <span class="text-sm dark:text-gray-300">Pen tool</span>
              <kbd class="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-xs font-mono">D or 2</kbd>
            </div>
            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <span class="text-sm dark:text-gray-300">Eraser tool</span>
              <kbd class="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-xs font-mono">E or 3</kbd>
            </div>
            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <span class="text-sm dark:text-gray-300">Connect tool</span>
              <kbd class="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-xs font-mono">C or 4</kbd>
            </div>
          </div>
        </div>

        <!-- Help -->
        <div>
          <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">Help</h3>
          <div class="grid grid-cols-1 gap-3">
            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <span class="text-sm dark:text-gray-300">Show this help</span>
              <kbd class="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-xs font-mono">?</kbd>
            </div>
            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <span class="text-sm dark:text-gray-300">Command palette (coming soon)</span>
              <kbd class="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-xs font-mono">{{ modKey }}+K</kbd>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          <strong>Note:</strong> Shortcuts don't work when typing in text fields.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  isOpen?: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const modKey = computed(() => {
  if (typeof navigator !== 'undefined' && /Mac/.test(navigator.platform)) {
    return 'Cmd'
  }
  return 'Ctrl'
})

const close = () => {
  emit('close')
}
</script>
