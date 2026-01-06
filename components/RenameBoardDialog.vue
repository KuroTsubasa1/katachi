<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]"
    @click.self="close"
  >
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md" @click.stop>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100">Rename Board</h2>
        <button @click="close" class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div v-if="error" class="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-sm">
        {{ error }}
      </div>

      <form @submit.prevent="handleRename" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Board Name
          </label>
          <input
            ref="nameInput"
            v-model="newName"
            type="text"
            required
            maxlength="255"
            placeholder="Enter board name"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded focus:ring-2 focus:ring-blue-500"
            @keydown.esc="close"
          />
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {{ newName.length }}/255 characters
          </p>
        </div>

        <div class="flex gap-2">
          <button
            type="submit"
            :disabled="loading || !isValid"
            class="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? 'Renaming...' : 'Rename' }}
          </button>
          <button
            type="button"
            @click="close"
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { Board } from '~/types'

const props = defineProps<{
  isOpen: boolean
  board: Board | null
}>()

const emit = defineEmits<{
  close: []
  rename: [boardId: string, newName: string]
}>()

const newName = ref('')
const loading = ref(false)
const error = ref('')
const nameInput = ref<HTMLInputElement | null>(null)

const isValid = computed(() => {
  const trimmed = newName.value.trim()
  return trimmed.length > 0 && trimmed !== props.board?.name
})

watch(() => props.isOpen, async (isOpen) => {
  if (isOpen && props.board) {
    newName.value = props.board.name
    error.value = ''
    await nextTick()
    nameInput.value?.focus()
    nameInput.value?.select()
  }
})

const handleRename = async () => {
  if (!props.board || !isValid.value) return

  const trimmedName = newName.value.trim()

  if (trimmedName.length < 1) {
    error.value = 'Board name cannot be empty'
    return
  }

  if (trimmedName.length > 255) {
    error.value = 'Board name is too long (max 255 characters)'
    return
  }

  error.value = ''
  loading.value = true

  try {
    emit('rename', props.board.id, trimmedName)
    close()
  } catch (err: any) {
    error.value = err.message || 'Failed to rename board'
  } finally {
    loading.value = false
  }
}

const close = () => {
  error.value = ''
  newName.value = ''
  emit('close')
}
</script>
