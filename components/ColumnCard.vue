<template>
  <div
    class="h-full w-full flex flex-col bg-gray-50 dark:bg-gray-700 rounded relative column-drop-zone"
    :class="{ 'ring-4 ring-blue-400 dark:ring-blue-500': isDropTarget }"
  >
    <div class="p-3 border-b border-gray-300 dark:border-gray-600">
      <input
        v-if="isSelected"
        v-model="localTitle"
        @input="updateTitle"
        class="w-full font-semibold text-gray-700 dark:text-gray-200 bg-transparent border-none outline-none"
        placeholder="Column Title"
      />
      <div v-else class="font-semibold text-gray-700 dark:text-gray-200">{{ localTitle }}</div>
    </div>

    <div class="flex-1 overflow-y-auto p-2 space-y-2">
      <!-- Cards dropped into this column -->
      <div
        v-for="cardId in localColumnCards"
        :key="cardId"
        class="bg-white dark:bg-gray-800 p-3 rounded shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow relative group cursor-grab"
        :style="cardColorStyle(cardId)"
        draggable="true"
        title="Drag out to remove from column"
        @mousedown.stop
        @dragstart="onColumnCardDragStart($event, cardId)"
        @dragover.prevent
        @drop="handleDropFromColumn($event, cardId)"
      >
        <ColumnCardPreview :cardId="cardId" />
        <button
          v-if="isSelected"
          @click="deleteCardFromColumn(cardId)"
          title="Delete card"
          class="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full hover:bg-red-600 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
        >
          ×
        </button>
      </div>

      <!-- Manual text items -->
      <div
        v-for="(item, index) in items"
        :key="'item-' + index"
        class="bg-white dark:bg-gray-800 p-3 rounded shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
      >
        <div v-if="editingIndex === index">
          <textarea
            v-model="items[index]"
            @blur="finishEditing"
            @keydown.enter.prevent="finishEditing"
            @click.stop
            @mousedown.stop
            class="column-card-input w-full resize-none border-none outline-none text-sm text-gray-700 dark:text-gray-200"
            rows="2"
          />
        </div>
        <div
          v-else
          @dblclick.stop="startEditing(index)"
          @click.stop
          class="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
        >
          {{ item }}
        </div>
        <button
          v-if="isSelected"
          @click.stop="removeItem(index)"
          @mousedown.stop
          class="mt-2 text-xs text-red-500 hover:text-red-700"
        >
          Remove
        </button>
      </div>

      <div
        v-if="isSelected"
        class="w-full p-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded text-sm text-gray-400 dark:text-gray-500 pointer-events-none opacity-50"
      >
        + Add Item (disabled)
      </div>
    </div>

    <!-- Drop zone indicator -->
    <div
      v-if="isDropTarget"
      class="absolute inset-0 bg-blue-100 bg-opacity-50 border-4 border-blue-400 border-dashed rounded pointer-events-none flex items-center justify-center"
    >
      <div class="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold">
        Drop here
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { useCanvasStore } from '~/stores/canvas'

const props = defineProps<{
  columnId: string
  title: string
  columnItems: string[]
  columnCards: string[]
  isSelected: boolean
}>()

const emit = defineEmits<{
  'update:title': [value: string]
  'update:items': [value: string[]]
}>()

const canvasStore = useCanvasStore()
const localTitle = ref(props.title)
const items = ref([...props.columnItems])
const localColumnCards = ref([...props.columnCards])
const editingIndex = ref<number | null>(null)

const isDropTarget = computed(() =>
  canvasStore.dropTargetColumnId === props.columnId &&
  canvasStore.draggingCardId !== null &&
  canvasStore.draggingCardId !== props.columnId
)

// Preserve a card's own color when it's shown inside the column. Falls back to
// the default white/gray wrapper classes when the card has no color set.
const cardColorStyle = (cardId: string) => {
  const card = canvasStore.currentBoard?.cards.find(c => c.id === cardId)
  const color = card?.color
  return color && color !== '#ffffff' ? { backgroundColor: color } : {}
}

const updateTitle = () => {
  emit('update:title', localTitle.value)
}

const addItem = (e?: Event) => {
  if (e) {
    e.stopPropagation()
    e.preventDefault()
  }
  items.value.push('New item')
  emit('update:items', items.value)
  startEditing(items.value.length - 1)
}

const removeItem = (index: number) => {
  items.value.splice(index, 1)
  emit('update:items', items.value)
}

const startEditing = (index: number) => {
  editingIndex.value = index
  nextTick(() => {
    const inputs = document.querySelectorAll<HTMLTextAreaElement>('.column-card-input')
    inputs[index]?.focus()
  })
}

const finishEditing = () => {
  editingIndex.value = null
  emit('update:items', items.value)
}

const handleDropFromColumn = (e: DragEvent, beforeCardId: string) => {
  e.preventDefault()
  const draggedCardId = e.dataTransfer?.getData('cardId')
  if (!draggedCardId) return

  console.log('Reordering cards in column')
  // In the future, handle reordering cards within column
}

// X button: delete the card entirely.
const deleteCardFromColumn = (cardId: string) => {
  canvasStore.deleteCard(cardId)
  localColumnCards.value = localColumnCards.value.filter(id => id !== cardId)
}

// Start dragging a card out of the column; the canvas drop handler pops it out.
const onColumnCardDragStart = (e: DragEvent, cardId: string) => {
  e.dataTransfer?.setData('cardId', cardId)
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}

watch(() => props.columnItems, (newItems) => {
  items.value = [...newItems]
})

watch(() => props.title, (newTitle) => {
  localTitle.value = newTitle
})

watch(() => props.columnCards, (newCards) => {
  localColumnCards.value = [...newCards]
}, { deep: true })
</script>
