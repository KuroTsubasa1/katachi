<template>
  <div class="flex items-center gap-2 text-xs">
    <!-- Synced -->
    <div v-if="syncStatus === 'synced'" class="flex items-center gap-1 text-green-600 dark:text-green-400">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
      <span>Synced</span>
    </div>

    <!-- Syncing -->
    <div v-else-if="syncStatus === 'syncing'" class="flex items-center gap-1 text-blue-600 dark:text-blue-400">
      <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      <span>Syncing...</span>
    </div>

    <!-- Offline -->
    <div v-else-if="syncStatus === 'offline'" class="flex items-center gap-1 text-orange-600 dark:text-orange-400">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
      </svg>
      <span>Offline</span>
    </div>

    <!-- Error -->
    <div v-else-if="syncStatus === 'error'" class="flex items-center gap-1 text-red-600 dark:text-red-400">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>Sync error</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSync } from '~/composables/useSync'

const { syncStatus } = useSync()
</script>
