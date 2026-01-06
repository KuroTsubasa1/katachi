<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]"
    @click.self="close"
  >
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Choose a Template</h2>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Start with a pre-built board layout</p>
        </div>
        <button @click="close" class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Category Filter -->
      <div class="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
        <button
          v-for="cat in categories"
          :key="cat.value"
          @click="selectedCategory = cat.value"
          :class="selectedCategory === cat.value ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'"
          class="px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          {{ cat.label }}
        </button>
      </div>

      <!-- Template Grid -->
      <div class="flex-1 overflow-y-auto">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="template in filteredTemplates"
            :key="template.name"
            @click="selectTemplate(template)"
            class="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-all"
          >
            <div class="aspect-video bg-gray-100 dark:bg-gray-900 rounded mb-3 flex items-center justify-center text-4xl">
              {{ template.icon }}
            </div>
            <h3 class="font-semibold text-lg mb-1 dark:text-gray-100">{{ template.name }}</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">{{ template.description }}</p>
            <span class="inline-block mt-2 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
              {{ template.category }}
            </span>
          </div>
        </div>
      </div>

      <!-- Name Board Dialog (nested) -->
      <div
        v-if="showNameDialog"
        class="absolute inset-0 bg-black/50 flex items-center justify-center z-10"
        @click.self="showNameDialog = false"
      >
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
          <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Name Your Board</h3>
          <input
            v-model="newBoardName"
            type="text"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Board name"
            @keydown.enter="createFromTemplate"
            @keydown.esc="showNameDialog = false"
          />
          <div class="flex gap-2 mt-4">
            <button
              @click="createFromTemplate"
              class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Board
            </button>
            <button
              @click="showNameDialog = false"
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCanvasStore } from '~/stores/canvas'
import { useRouter } from 'vue-router'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const canvasStore = useCanvasStore()
const router = useRouter()

const selectedCategory = ref('all')

const categories = [
  { value: 'all', label: 'All' },
  { value: 'general', label: 'General' },
  { value: 'planning', label: 'Planning' },
  { value: 'creative', label: 'Creative' },
  { value: 'business', label: 'Business' },
  { value: 'education', label: 'Education' }
]

const templates = [
  { name: 'Blank Canvas', description: 'Start from scratch', category: 'general', icon: '📋' },
  { name: 'Kanban Board', description: '3-column task management', category: 'planning', icon: '📊' },
  { name: 'Storyboard', description: 'Visual storytelling', category: 'creative', icon: '🎬' },
  { name: 'Mind Map', description: 'Branching concepts', category: 'planning', icon: '🧠' },
  { name: 'Meeting Notes', description: 'Agenda and action items', category: 'business', icon: '📝' },
  { name: 'Sprint Planning', description: '5-column agile board', category: 'planning', icon: '🏃' },
  { name: 'Design Mood Board', description: 'Visual inspiration grid', category: 'creative', icon: '🎨' },
  { name: 'Study Notes', description: 'Organized note-taking', category: 'education', icon: '📚' },
  { name: 'SWOT Analysis', description: '4-quadrant analysis', category: 'business', icon: '📈' },
  { name: 'Roadmap', description: 'Timeline with milestones', category: 'planning', icon: '🗺️' }
]

const filteredTemplates = computed(() => {
  if (selectedCategory.value === 'all') return templates
  return templates.filter(t => t.category === selectedCategory.value)
})

const selectedTemplate = ref<any>(null)
const showNameDialog = ref(false)
const newBoardName = ref('')

function selectTemplate(template: any) {
  selectedTemplate.value = template
  newBoardName.value = template.name
  showNameDialog.value = true
}

async function createFromTemplate() {
  if (!selectedTemplate.value || !newBoardName.value.trim()) return

  try {
    const response = await $fetch('/api/templates/create-from', {
      method: 'POST',
      body: {
        templateName: selectedTemplate.value.name,
        boardName: newBoardName.value.trim()
      }
    })

    if (response.success && response.boardId) {
      // Reload boards
      const boardsResponse = await $fetch('/api/boards')
      if (boardsResponse.boards) {
        canvasStore.boards = boardsResponse.boards
        const newBoard = boardsResponse.boards.find((b: any) => b.id === response.boardId)
        if (newBoard) {
          canvasStore.currentBoard = newBoard
        }
      }

      showNameDialog.value = false
      close()
    }
  } catch (error) {
    console.error('Failed to create board from template:', error)
    alert('Failed to create board from template')
  }
}

function close() {
  emit('close')
}
</script>
