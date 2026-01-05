<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]"
    @click.self="close"
  >
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md" @click.stop>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100">Share Board</h2>
        <button @click="close" class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div v-if="error" class="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-sm">
        {{ error }}
      </div>

      <div v-if="success" class="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-sm">
        {{ success }}
      </div>

      <form @submit.prevent="handleShare" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email Address
          </label>
          <input
            v-model="email"
            type="email"
            required
            placeholder="user@example.com"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Permission Level
          </label>
          <select
            v-model="permission"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="view">View Only - Can see but not edit</option>
            <option value="edit">Edit - Can modify content</option>
            <option value="admin">Admin - Can share with others</option>
          </select>
        </div>

        <div class="flex gap-2">
          <button
            type="submit"
            :disabled="loading"
            class="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {{ loading ? 'Sharing...' : 'Share Board' }}
          </button>
          <button
            type="button"
            @click="close"
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  isOpen: boolean
  boardId: string | null
}>()

const emit = defineEmits<{
  close: []
}>()

const email = ref('')
const permission = ref<'view' | 'edit' | 'admin'>('edit')
const loading = ref(false)
const error = ref('')
const success = ref('')

const handleShare = async () => {
  if (!props.boardId) return

  error.value = ''
  success.value = ''
  loading.value = true

  try {
    await $fetch('/api/boards/share', {
      method: 'POST',
      body: {
        boardId: props.boardId,
        email: email.value,
        permission: permission.value
      }
    })

    success.value = `Board shared with ${email.value}!`
    email.value = ''

    setTimeout(() => {
      close()
    }, 2000)
  } catch (err: any) {
    error.value = err.data?.message || 'Failed to share board'
  } finally {
    loading.value = false
  }
}

const close = () => {
  error.value = ''
  success.value = ''
  email.value = ''
  emit('close')
}
</script>
