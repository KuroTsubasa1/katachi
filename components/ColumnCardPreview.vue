<template>
  <div
    v-if="card"
    class="text-sm relative"
    @click="handleCardClick"
  >
    <!-- Text card - full editing -->
    <div v-if="card.type === 'text'" class="text-gray-700 dark:text-gray-300">
      <textarea
        v-if="isEditing"
        v-model="editableContent"
        @blur="saveContent"
        @click.stop
        @mousedown.stop
        class="w-full resize-none border-none outline-none bg-transparent text-sm p-0 text-gray-700 dark:text-gray-300"
        rows="3"
      />
      <div v-else class="whitespace-pre-wrap">{{ card.content || 'Empty note' }}</div>
    </div>

    <!-- Rich text preview -->
    <div v-else-if="card.type === 'richtext'" class="text-gray-700 dark:text-gray-300">
      <div v-html="stripHtml(card.htmlContent || card.content)" class="line-clamp-3"></div>
    </div>

    <!-- Image - full display -->
    <div v-else-if="card.type === 'image'" class="w-full">
      <img v-if="card.imageUrl" :src="card.imageUrl" class="w-full h-auto object-contain rounded max-h-48" />
      <div v-else class="text-gray-500 dark:text-gray-400 italic">No image</div>
    </div>

    <!-- Drawing preview -->
    <div v-else-if="card.type === 'drawing'" class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
      <span>Drawing</span>
    </div>

    <!-- Audio preview -->
    <div v-else-if="card.type === 'audio'" class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
      <span>Audio</span>
    </div>

    <!-- Video preview -->
    <div v-else-if="card.type === 'video'" class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
      <span>Video</span>
    </div>

    <!-- Map preview -->
    <div v-else-if="card.type === 'map'" class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <span>{{ card.mapLocation || 'Map' }}</span>
    </div>

    <!-- Markdown preview - show first few lines -->
    <div v-else-if="card.type === 'markdown'" class="text-gray-700 dark:text-gray-300">
      <div class="text-xs line-clamp-3">{{ card.markdown?.substring(0, 100) || 'Empty markdown' }}...</div>
    </div>

    <!-- Todo List - show progress -->
    <div v-else-if="card.type === 'todo'" class="text-gray-600 dark:text-gray-400">
      <div class="font-semibold mb-1 text-gray-700 dark:text-gray-300 text-xs">{{ card.todoData?.title || 'Todo List' }}</div>
      <div v-if="card.todoData?.items && card.todoData.items.length > 0" class="space-y-1">
        <div v-for="(item, idx) in card.todoData.items.slice(0, 3)" :key="idx" class="flex items-center gap-1 text-xs">
          <input type="checkbox" :checked="item.completed" disabled class="w-3 h-3" />
          <span :class="{ 'line-through text-gray-400': item.completed }">{{ item.text }}</span>
        </div>
        <div v-if="card.todoData.items.length > 3" class="text-xs text-gray-400">+{{ card.todoData.items.length - 3 }} more...</div>
      </div>
      <div v-else class="text-xs text-gray-400 dark:text-gray-500 italic">No tasks</div>
    </div>

    <!-- Column preview -->
    <div v-else-if="card.type === 'column'" class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
      <span>{{ card.content }}</span>
    </div>

    <!-- Link - clickable with full URL -->
    <div v-else-if="card.type === 'link'" class="text-gray-600 dark:text-gray-400">
      <a
        v-if="card.url"
        :href="card.url"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-start gap-2 hover:text-blue-600 dark:hover:text-blue-400"
        @click.stop
      >
        <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        <span class="text-xs break-all">{{ card.url }}</span>
      </a>
      <div v-else class="italic text-gray-400 dark:text-gray-500">No link</div>
    </div>

    <!-- Table - show first row -->
    <div v-else-if="card.type === 'table'" class="text-gray-600 dark:text-gray-400">
      <div v-if="card.tableData?.cells" class="text-xs">
        <div class="font-semibold mb-1">{{ card.tableData.cells[0]?.join(' | ') }}</div>
        <div class="text-gray-500 dark:text-gray-400">{{ card.tableData.rows }}×{{ card.tableData.cols }} table</div>
      </div>
      <div v-else class="italic">Empty table</div>
    </div>

    <!-- Default -->
    <div v-else class="text-gray-500 italic">
      {{ card.type }} card
    </div>
  </div>
  <div v-else class="text-gray-400 text-sm italic">
    Card not found
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCanvasStore } from '~/stores/canvas'

const props = defineProps<{
  cardId: string
}>()

const canvasStore = useCanvasStore()
const isEditing = ref(false)
const editableContent = ref('')

const card = computed(() => {
  if (!canvasStore.currentBoard) return null
  return canvasStore.currentBoard.cards.find(c => c.id === props.cardId)
})

const handleCardClick = () => {
  if (card.value?.type === 'text') {
    isEditing.value = true
    editableContent.value = card.value.content
  }
}

const saveContent = () => {
  if (card.value && isEditing.value) {
    canvasStore.updateCard(props.cardId, { content: editableContent.value })
  }
  isEditing.value = false
}

const stripHtml = (html: string | undefined): string => {
  if (!html) return ''
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}
</script>
