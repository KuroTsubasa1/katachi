<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]"
    @click.self="close"
  >
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md" @click.stop>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100">Delete Board</h2>
        <button @click="close" class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="mb-6">
        <p class="text-gray-700 dark:text-gray-300 mb-2">
          Are you sure you want to delete <strong>"{{ board?.name }}"</strong>?
        </p>
        <p class="text-sm text-red-600 dark:text-red-400">
          This action cannot be undone. All cards, connections, and shapes will be permanently deleted.
        </p>
      </div>

      <div class="flex gap-2">
        <button
          @click="handleDelete"
          class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Delete Board
        </button>
        <button
          @click="close"
          class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition dark:text-gray-300"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Board } from '~/types'

const props = defineProps<{
  isOpen: boolean
  board: Board | null
}>()

const emit = defineEmits<{
  close: []
  delete: [boardId: string]
}>()

const handleDelete = () => {
  if (props.board) {
    emit('delete', props.board.id)
    close()
  }
}

const close = () => {
  emit('close')
}
</script>
