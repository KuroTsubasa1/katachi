<template>
  <div
    class="note-card absolute rounded-lg shadow-lg border-2 transition-shadow"
    :class="{
      'border-blue-500 dark:border-blue-400': isSelected,
      'border-purple-500 dark:border-purple-400 ring-2 ring-purple-300 dark:ring-purple-600': canvasStore.connectionStart === card.id,
      'border-transparent': !isSelected && canvasStore.connectionStart !== card.id,
      'shadow-2xl': isSelected,
      'cursor-move': !isSelected || card.type !== 'drawing',
      'cursor-pointer': canvasStore.currentTool.type === 'connect'
    }"
    :style="{
      left: `${card.position.x}px`,
      top: `${card.position.y}px`,
      width: `${card.size.width}px`,
      height: `${card.size.height}px`,
      backgroundColor: card.color || '#ffffff',
      zIndex: Math.min(card.zIndex, 9999),
      pointerEvents: canvasStore.currentTool.type !== 'select' ? 'none' : 'auto'
    }"
    :data-card-id="card.id"
    @mousedown.stop="handleMouseDown"
  >
    <div class="h-full flex flex-col overflow-hidden">
      <!-- Simple Text Card -->
      <div v-if="card.type === 'text'" class="p-4 h-full flex flex-col">
        <textarea
          v-model="localContent"
          class="flex-1 w-full resize-none border-none outline-none bg-transparent text-gray-800 dark:text-gray-200"
          :class="{ 'cursor-move': !isSelected, 'pointer-events-none': !isSelected }"
          :readonly="!isSelected"
          @input="updateContent"
        />
      </div>

      <!-- Rich Text Card -->
      <RichTextCard
        v-else-if="card.type === 'richtext'"
        v-model="localHtmlContent"
        :editable="isSelected"
        @update:modelValue="updateHtmlContent"
      />

      <!-- Image Card -->
      <ImageCard
        v-else-if="card.type === 'image'"
        :imageUrl="card.imageUrl"
        :isSelected="isSelected"
      />

      <!-- Column Card -->
      <ColumnCard
        v-else-if="card.type === 'column'"
        :columnId="card.id"
        :title="card.content"
        :columnItems="[]"
        :columnCards="card.columnCards || []"
        :isSelected="isSelected"
        @update:title="updateColumnTitle"
        @update:items="updateColumnItems"
      />

      <!-- Drawing Card -->
      <DrawingCard
        v-else-if="card.type === 'drawing'"
        :isSelected="isSelected"
        :drawingPaths="card.drawingData?.paths || []"
        :cardSize="card.size"
        @update:drawingPaths="updateDrawingPaths"
      />

      <!-- Link Card -->
      <LinkCard
        v-else-if="card.type === 'link'"
        :url="card.url"
        :isSelected="isSelected"
        @update:url="updateUrl"
      />

      <!-- Table Card -->
      <TableCard
        v-else-if="card.type === 'table'"
        :tableData="card.tableData"
        :isSelected="isSelected"
        @update:tableData="updateTableData"
      />

      <!-- Audio Card -->
      <AudioCard
        v-else-if="card.type === 'audio'"
        :audioUrl="card.audioUrl"
        :isSelected="isSelected"
        @update:audioUrl="updateAudioUrl"
      />

      <!-- Video Card -->
      <VideoCard
        v-else-if="card.type === 'video'"
        :videoUrl="card.videoUrl"
        :isSelected="isSelected"
        @update:videoUrl="updateVideoUrl"
      />

      <!-- Map Card -->
      <MapCard
        v-else-if="card.type === 'map'"
        :mapLocation="card.mapLocation"
        :isSelected="isSelected"
        @update:mapLocation="updateMapLocation"
      />

      <!-- Markdown Card -->
      <MarkdownCard
        v-else-if="card.type === 'markdown'"
        :markdown="card.markdown"
        :isSelected="isSelected"
        @update:markdown="updateMarkdown"
      />

      <!-- Storyboard Card -->
      <StoryboardCard
        v-else-if="card.type === 'storyboard'"
        :card="card"
      />

      <!-- Todo List Card -->
      <TodoListCard
        v-else-if="card.type === 'todo'"
        :todoData="card.todoData"
        :isSelected="isSelected"
        @update:todoData="updateTodoData"
      />
    </div>

    <!-- Card Controls (when selected) -->
    <div v-if="isSelected" class="absolute top-2 right-2 flex gap-1.5">
      <!-- Color picker -->
      <div class="relative">
        <button
          @click.stop="showColorPicker = !showColorPicker"
          class="w-7 h-7 rounded-full border-2 border-white shadow hover:scale-110 transition"
          :style="{ backgroundColor: card.color || '#ffffff' }"
        />
        <div
          v-if="showColorPicker"
          class="absolute top-9 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-3 z-50 grid grid-cols-3 gap-2 w-36"
          @click.stop
          @mousedown.stop
        >
          <button
            v-for="color in colorOptions"
            :key="color"
            @click.stop="changeColor(color)"
            class="w-9 h-9 rounded-full border-2 hover:scale-110 transition"
            :class="{ 'border-blue-500': card.color === color, 'border-gray-300 dark:border-gray-600': card.color !== color }"
            :style="{ backgroundColor: color }"
          />
        </div>
      </div>

      <button
        class="w-6 h-6 bg-red-500 text-white rounded-full hover:bg-red-600 flex items-center justify-center shadow"
        @click.stop="deleteCard"
      >
        ×
      </button>
    </div>

    <!-- Resize handle -->
    <div
      v-if="isSelected"
      class="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-se-resize rounded-tl"
      @mousedown.stop="handleResizeStart"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCanvasStore } from '~/stores/canvas'
import type { NoteCard as NoteCardType } from '~/types'
import RichTextCard from './RichTextCard.vue'
import ImageCard from './ImageCard.vue'
import ColumnCard from './ColumnCard.vue'
import DrawingCard from './DrawingCard.vue'
import LinkCard from './LinkCard.vue'
import TableCard from './TableCard.vue'
import AudioCard from './AudioCard.vue'
import VideoCard from './VideoCard.vue'
import MapCard from './MapCard.vue'
import MarkdownCard from './MarkdownCard.vue'
import TodoListCard from './TodoListCard.vue'

const props = defineProps<{
  card: NoteCardType
}>()

const canvasStore = useCanvasStore()
const localContent = ref(props.card.content)
const localHtmlContent = ref(props.card.htmlContent || '<p>Start typing...</p>')
const showColorPicker = ref(false)

const colorOptions = [
  '#ffffff', // White
  '#f3f4f6', // Gray
  '#fef3c7', // Light Yellow
  '#fecaca', // Light Red
  '#bfdbfe', // Light Blue
  '#bbf7d0', // Light Green
  '#e9d5ff', // Light Purple
  '#fed7aa', // Light Orange
  '#fbcfe8', // Light Pink
  '#d1fae5', // Light Teal
  '#ddd6fe', // Light Indigo
  '#fde68a', // Light Amber
]

const isSelected = computed(() => canvasStore.selectedCardId === props.card.id)

let dragStartPos = { x: 0, y: 0 }
let cardStartPos = { x: 0, y: 0 }
let isDragging = false
let isResizing = false
let resizeStartPos = { x: 0, y: 0 }
let sizeStart = { width: 0, height: 0 }

const handleMouseDown = (e: MouseEvent) => {
  const target = e.target as HTMLElement

  // Connect mode - create connections between cards
  if (canvasStore.currentTool.type === 'connect') {
    if (!canvasStore.connectionStart) {
      // First click - set start card
      canvasStore.connectionStart = props.card.id
      console.log('Connection started from:', props.card.id)
    } else if (canvasStore.connectionStart !== props.card.id) {
      // Second click - create connection
      canvasStore.addConnection(canvasStore.connectionStart, props.card.id)
      console.log('Connection created:', canvasStore.connectionStart, '->', props.card.id)
      canvasStore.connectionStart = null
    }
    return
  }

  // Don't drag if clicking inside drawing canvas area
  if (props.card.type === 'drawing' && isSelected.value) {
    return
  }

  canvasStore.selectCard(props.card.id)
  canvasStore.setDragging(true)
  canvasStore.setDraggingCard(props.card.id)
  isDragging = true
  dragStartPos = { x: e.clientX, y: e.clientY }
  cardStartPos = { ...props.card.position }

  console.log('Started dragging card:', props.card.id, props.card.type)

  document.addEventListener('mousemove', handleDrag)
  document.addEventListener('mouseup', handleDragEnd)
}

const handleDrag = (e: MouseEvent) => {
  if (!isDragging) return

  // Check what element we're hovering over
  const elements = document.elementsFromPoint(e.clientX, e.clientY)
  const columnDropZone = elements.find(el => el.classList.contains('column-drop-zone'))

  if (columnDropZone) {
    // Find the parent note-card to get the column ID
    const columnCardElement = columnDropZone.closest('.note-card')
    if (columnCardElement) {
      const columnId = columnCardElement.getAttribute('data-card-id')
      if (columnId && columnId !== props.card.id) {
        console.log('Hovering over column:', columnId)
        canvasStore.setDropTargetColumn(columnId)
      }
    }
  } else {
    if (canvasStore.dropTargetColumnId) {
      console.log('Left column drop zone')
      canvasStore.setDropTargetColumn(null)
    }
  }

  const scale = canvasStore.viewport.scale
  const dx = (e.clientX - dragStartPos.x) / scale
  const dy = (e.clientY - dragStartPos.y) / scale

  const newPosition = {
    x: cardStartPos.x + dx,
    y: cardStartPos.y + dy
  }

  const snappedPosition = canvasStore.snapPositionToGrid(newPosition)

  canvasStore.updateCard(props.card.id, {
    position: snappedPosition
  })
}

const handleDragEnd = () => {
  if (!isDragging) return

  isDragging = false
  canvasStore.setDragging(false)

  // Check if we're dropping into a column
  if (canvasStore.dropTargetColumnId && props.card.type !== 'column') {
    console.log('Dropping card into column:', props.card.id, '->', canvasStore.dropTargetColumnId)
    canvasStore.moveCardToColumn(props.card.id, canvasStore.dropTargetColumnId)
  }

  canvasStore.setDraggingCard(null)
  canvasStore.setDropTargetColumn(null)

  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', handleDragEnd)
}

const handleResizeStart = (e: MouseEvent) => {
  e.preventDefault()
  isResizing = true
  resizeStartPos = { x: e.clientX, y: e.clientY }
  sizeStart = { ...props.card.size }

  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', handleResizeEnd)
}

const handleResize = (e: MouseEvent) => {
  if (!isResizing) return

  const scale = canvasStore.viewport.scale
  const dx = (e.clientX - resizeStartPos.x) / scale
  const dy = (e.clientY - resizeStartPos.y) / scale

  let newWidth = Math.max(150, sizeStart.width + dx)
  let newHeight = Math.max(100, sizeStart.height + dy)

  // Snap to grid if enabled
  if (canvasStore.snapToGrid) {
    const gridSize = canvasStore.gridSize
    newWidth = Math.round(newWidth / gridSize) * gridSize
    newHeight = Math.round(newHeight / gridSize) * gridSize
  }

  canvasStore.updateCard(props.card.id, {
    size: {
      width: newWidth,
      height: newHeight
    }
  })
}

const handleResizeEnd = () => {
  isResizing = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', handleResizeEnd)
}

const updateContent = () => {
  canvasStore.updateCard(props.card.id, {
    content: localContent.value
  })
}

const updateHtmlContent = (html: string) => {
  canvasStore.updateCard(props.card.id, {
    htmlContent: html
  })
}

const updateImageDrawing = (paths: string[]) => {
  canvasStore.updateCard(props.card.id, {
    drawingData: {
      paths,
      color: '#ff0000',
      width: 3
    }
  })
}

const updateColumnTitle = (title: string) => {
  canvasStore.updateCard(props.card.id, {
    content: title
  })
}

const updateColumnItems = (items: string[]) => {
  canvasStore.updateCard(props.card.id, {
    columnCards: items
  })
}

const updateDrawingPaths = (paths: string[]) => {
  canvasStore.updateCard(props.card.id, {
    drawingData: {
      paths,
      color: '#000000',
      width: 2
    }
  })
}

const parseColumnItems = (items: any): string[] => {
  if (Array.isArray(items)) return items
  return []
}

const updateUrl = (url: string) => {
  canvasStore.updateCard(props.card.id, {
    url
  })
}

const updateTableData = (tableData: any) => {
  canvasStore.updateCard(props.card.id, {
    tableData
  })
}

const updateAudioUrl = (audioUrl: string) => {
  canvasStore.updateCard(props.card.id, {
    audioUrl
  })
}

const updateVideoUrl = (videoUrl: string) => {
  canvasStore.updateCard(props.card.id, {
    videoUrl
  })
}

const updateMapLocation = (mapLocation: string) => {
  canvasStore.updateCard(props.card.id, {
    mapLocation
  })
}

const updateMarkdown = (markdown: string) => {
  canvasStore.updateCard(props.card.id, {
    markdown
  })
}

const updateTodoData = (todoData: any) => {
  canvasStore.updateCard(props.card.id, {
    todoData
  })
}

const changeColor = (color: string) => {
  canvasStore.updateCard(props.card.id, { color })
  showColorPicker.value = false
}

const deleteCard = () => {
  canvasStore.deleteCard(props.card.id)
}
</script>
