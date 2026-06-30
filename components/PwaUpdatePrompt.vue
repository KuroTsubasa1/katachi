<template>
  <div
    v-if="$pwa?.needRefresh"
    class="fixed bottom-4 right-4 z-[100] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-xs"
  >
    <p class="text-sm text-gray-700 dark:text-gray-200 mb-3">A new version of Katachi is available.</p>
    <div class="flex gap-2 justify-end">
      <button
        @click="$pwa.cancelPrompt()"
        class="px-3 py-1 text-sm rounded text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        Later
      </button>
      <button
        @click="$pwa.updateServiceWorker()"
        class="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
      >
        Reload
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const { $pwa } = useNuxtApp()
</script>
