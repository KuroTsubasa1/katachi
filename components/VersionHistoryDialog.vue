<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]"
    @click.self="close"
  >
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col" @click.stop>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100">Version History</h2>
        <button @click="close" class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div v-if="loading" class="flex-1 flex items-center justify-center">
        <div class="text-gray-500 dark:text-gray-400">Loading history...</div>
      </div>

      <div v-else-if="history.length === 0" class="flex-1 flex items-center justify-center">
        <div class="text-gray-400 dark:text-gray-500 text-center">
          <svg class="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>No version history yet</p>
        </div>
      </div>

      <div v-else class="flex-1 overflow-y-auto space-y-2">
        <div
          v-for="version in history"
          :key="version.id"
          class="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
          @click="selectVersion(version)"
        >
          <div class="flex items-start justify-between mb-2">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="font-medium text-gray-800 dark:text-gray-200">
                Version {{ version.version }}
              </span>
              <span class="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">
                {{ version.operation }}
              </span>
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              {{ formatDate(version.createdAt) }}
            </div>
          </div>

          <div class="text-sm text-gray-600 dark:text-gray-400">
            {{ getChangeDescription(version) }}
          </div>
        </div>
      </div>

      <div v-if="selectedVersion" class="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p class="text-sm text-gray-700 dark:text-gray-300 mb-3">
          Restore to Version {{ selectedVersion.version }}?
        </p>
        <div class="flex gap-2">
          <button
            @click="restoreVersion"
            class="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Restore
          </button>
          <button
            @click="selectedVersion = null"
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  isOpen: boolean
  entityType: 'board' | 'card'
  entityId: string | null
}>()

const emit = defineEmits<{
  close: []
  restore: [version: any]
}>()

const history = ref<any[]>([])
const loading = ref(false)
const selectedVersion = ref<any | null>(null)

watch(() => props.isOpen, async (isOpen) => {
  if (isOpen && props.entityId) {
    await loadHistory()
  }
})

const loadHistory = async () => {
  if (!props.entityId) return

  loading.value = true
  try {
    const endpoint = props.entityType === 'board'
      ? `/api/boards/${props.entityId}/history`
      : `/api/cards/${props.entityId}/history`

    const response = await $fetch(endpoint)
    history.value = response.history || []
  } catch (error) {
    console.error('Failed to load history:', error)
    history.value = []
  } finally {
    loading.value = false
  }
}

const selectVersion = (version: any) => {
  selectedVersion.value = version
}

const restoreVersion = () => {
  if (selectedVersion.value) {
    emit('restore', selectedVersion.value)
    close()
  }
}

const close = () => {
  selectedVersion.value = null
  emit('close')
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString()
}

const getChangeDescription = (version: any) => {
  if (version.operation === 'create') {
    return `Created ${props.entityType}`
  } else if (version.operation === 'update') {
    return `Updated ${props.entityType}`
  } else if (version.operation === 'delete') {
    return `Deleted ${props.entityType}`
  }
  return 'Changed'
}
</script>
