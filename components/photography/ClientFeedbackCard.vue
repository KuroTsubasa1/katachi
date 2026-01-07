<template>
  <div class="h-full w-full flex flex-col bg-white dark:bg-gray-900 p-4 overflow-auto">
    <div class="flex items-center justify-between mb-4">
      <input
        v-model="localData.title"
        @blur="updateData"
        class="text-lg font-semibold bg-transparent border-none outline-none dark:text-white flex-1"
        placeholder="Client Feedback"
      />
      <button
        @click="addFeedback"
        class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
      >
        + Add Feedback
      </button>
    </div>

    <!-- Version Info -->
    <div class="mb-4 flex items-center gap-4">
      <div class="flex-1">
        <label class="text-xs text-gray-600 dark:text-gray-400 block mb-1">Project Version</label>
        <input
          v-model="localData.version"
          @blur="updateData"
          class="w-full px-2 py-1 text-sm bg-transparent border border-gray-300 dark:border-gray-600 rounded outline-none dark:text-white"
          placeholder="v1.0.0"
        />
      </div>
    </div>

    <!-- Filter and Stats -->
    <div class="mb-4 flex items-center justify-between gap-4">
      <div class="flex gap-2">
        <select
          v-model="filterStatus"
          class="px-2 py-1 text-xs border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
        <select
          v-model="filterPriority"
          class="px-2 py-1 text-xs border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        >
          <option value="all">All Priority</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>
      <div class="text-xs text-gray-600 dark:text-gray-400">
        {{ filteredFeedback.length }} / {{ localData.feedback.length }} items
      </div>
    </div>

    <!-- Feedback List -->
    <div class="flex-1 overflow-auto space-y-3">
      <div
        v-for="(item, index) in filteredFeedback"
        :key="item.id"
        class="p-3 border rounded"
        :class="getBorderClass(item.priority)"
      >
        <!-- Header: Author, Timestamp, Actions -->
        <div class="flex items-start justify-between mb-2">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <input
                v-model="item.author"
                @blur="updateData"
                class="font-medium text-sm bg-transparent border-none outline-none dark:text-white"
                placeholder="Author name"
              />
              <span class="text-xs text-gray-500 dark:text-gray-400">{{ formatTimestamp(item.timestamp) }}</span>
            </div>
            <input
              v-model="item.timestamp"
              @blur="updateData"
              type="datetime-local"
              class="text-xs bg-transparent border-none outline-none text-gray-500 dark:text-gray-400"
            />
          </div>
          <button
            @click="removeFeedback(index)"
            class="text-red-500 hover:text-red-700 text-sm ml-2"
            title="Delete feedback"
          >
            ×
          </button>
        </div>

        <!-- Status and Priority Badges -->
        <div class="flex items-center gap-2 mb-2">
          <select
            v-model="item.status"
            @change="updateData"
            class="px-2 py-1 text-xs rounded border-none outline-none"
            :class="getStatusClass(item.status)"
          >
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
          <select
            v-model="item.priority"
            @change="updateData"
            class="px-2 py-1 text-xs rounded border-none outline-none"
            :class="getPriorityClass(item.priority)"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <!-- Comment -->
        <textarea
          v-model="item.comment"
          @blur="updateData"
          class="w-full px-2 py-2 text-sm bg-transparent border border-gray-200 dark:border-gray-700 rounded outline-none dark:text-white resize-none"
          placeholder="Add feedback comment..."
          rows="3"
        ></textarea>

        <!-- Attachment URL -->
        <div class="mt-2">
          <input
            v-model="item.attachmentUrl"
            @blur="updateData"
            class="w-full px-2 py-1 text-xs bg-transparent border border-gray-200 dark:border-gray-700 rounded outline-none dark:text-white"
            placeholder="Attachment URL (optional)"
          />
          <a
            v-if="item.attachmentUrl"
            :href="item.attachmentUrl"
            target="_blank"
            class="text-xs text-blue-500 hover:text-blue-600 mt-1 inline-block"
          >
            View attachment →
          </a>
        </div>
      </div>

      <div v-if="filteredFeedback.length === 0" class="text-center text-gray-400 dark:text-gray-600 py-8">
        {{ localData.feedback.length === 0 ? 'No feedback yet.' : 'No feedback matches the filters.' }}
      </div>
    </div>

    <!-- Summary Footer -->
    <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
      <div class="grid grid-cols-2 gap-2">
        <div>
          <span class="font-medium">Status:</span>
          <span class="ml-2">{{ statusCount('pending') }} Pending</span>
          <span class="ml-2">{{ statusCount('in-progress') }} In Progress</span>
          <span class="ml-2">{{ statusCount('resolved') }} Resolved</span>
        </div>
        <div>
          <span class="font-medium">Priority:</span>
          <span class="ml-2 text-red-600">{{ priorityCount('high') }} High</span>
          <span class="ml-2 text-yellow-600">{{ priorityCount('medium') }} Medium</span>
          <span class="ml-2 text-green-600">{{ priorityCount('low') }} Low</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useCanvasStore } from '~/stores/canvas'
import type { NoteCard, ClientFeedbackData } from '~/types'

const props = defineProps<{
  card: NoteCard
}>()

const canvasStore = useCanvasStore()
const filterStatus = ref('all')
const filterPriority = ref('all')

const localData = ref<ClientFeedbackData>(
  props.card.clientFeedbackData || {
    title: 'Client Feedback',
    version: 'v1.0.0',
    feedback: []
  }
)

const filteredFeedback = computed(() => {
  return localData.value.feedback.filter(item => {
    const statusMatch = filterStatus.value === 'all' || item.status === filterStatus.value
    const priorityMatch = filterPriority.value === 'all' || item.priority === filterPriority.value
    return statusMatch && priorityMatch
  })
})

const getStatusClass = (status: string) => {
  const classes = {
    pending: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  }
  return classes[status as keyof typeof classes] || classes.pending
}

const getPriorityClass = (priority: string) => {
  const classes = {
    low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  }
  return classes[priority as keyof typeof classes] || classes.medium
}

const getBorderClass = (priority: string) => {
  const classes = {
    low: 'border-green-200 dark:border-green-800',
    medium: 'border-yellow-200 dark:border-yellow-800',
    high: 'border-red-200 dark:border-red-800'
  }
  return classes[priority as keyof typeof classes] || classes.medium
}

const statusCount = (status: string) => {
  return localData.value.feedback.filter(f => f.status === status).length
}

const priorityCount = (priority: string) => {
  return localData.value.feedback.filter(f => f.priority === priority).length
}

const formatTimestamp = (timestamp: string) => {
  if (!timestamp) return 'No date'
  try {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return timestamp
  }
}

const addFeedback = () => {
  const now = new Date().toISOString().slice(0, 16) // Format for datetime-local
  localData.value.feedback.push({
    id: crypto.randomUUID(),
    timestamp: now,
    author: '',
    comment: '',
    status: 'pending',
    priority: 'medium'
  })
  updateData()
}

const removeFeedback = (index: number) => {
  localData.value.feedback.splice(index, 1)
  updateData()
}

const updateData = () => {
  canvasStore.updateCard(props.card.id, {
    clientFeedbackData: localData.value
  })
}

watch(
  () => props.card.clientFeedbackData,
  (newData) => {
    if (newData) {
      localData.value = newData
    }
  },
  { deep: true }
)
</script>
