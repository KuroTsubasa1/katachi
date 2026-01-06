<template>
  <div
    ref="canvasContainer"
    class="w-full h-full relative cursor-move canvas-grid"
    @mousedown="handleCanvasMouseDown"
    @mousemove="handleCanvasMouseMove"
    @mouseup="handleCanvasMouseUp"
    @wheel="handleWheel"
  >
    <div
      class="absolute origin-top-left"
      :style="{
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
        transition: canvasStore.isDragging ? 'none' : 'transform 0.1s ease-out'
      }"
    >
      <!-- Connections and shapes layer -->
      <ConnectionsLayer />

      <NoteCard
        v-for="card in canvasStore.sortedCards"
        :key="`${card.id}-${canvasStore.boardVersion}`"
        :card="card"
      />

      <!-- Global drawing layer inside transformed space -->
      <GlobalDrawingLayer />
    </div>

    <!-- Drawing tools (when in draw mode) -->
    <div
      v-if="canvasStore.currentTool.type !== 'select'"
      class="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-3 flex gap-2 items-center pointer-events-auto"
      style="z-index: 1001;"
      @click.stop
      @mousedown.stop
    >
      <button
        @click.stop="canvasStore.setTool({ type: 'pen' })"
        :class="{ 'bg-blue-500 text-white': canvasStore.currentTool.type === 'pen', 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200': canvasStore.currentTool.type !== 'pen' }"
        class="px-3 py-2 rounded text-sm font-medium transition"
      >
        Pen
      </button>
      <button
        @click.stop="canvasStore.setTool({ type: 'eraser' })"
        :class="{ 'bg-blue-500 text-white': canvasStore.currentTool.type === 'eraser', 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200': canvasStore.currentTool.type !== 'eraser' }"
        class="px-3 py-2 rounded text-sm font-medium transition"
      >
        Eraser
      </button>
      <button
        @click.stop="canvasStore.setTool({ type: 'move-stroke' })"
        :class="{ 'bg-blue-500 text-white': canvasStore.currentTool.type === 'move-stroke', 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200': canvasStore.currentTool.type !== 'move-stroke' }"
        class="px-3 py-2 rounded text-sm font-medium transition"
        title="Move strokes"
      >
        Move
      </button>
      <div class="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
      <button
        @click.stop="canvasStore.setTool({ type: 'rectangle' })"
        :class="{ 'bg-blue-500 text-white': canvasStore.currentTool.type === 'rectangle', 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200': canvasStore.currentTool.type !== 'rectangle' }"
        class="px-3 py-2 rounded text-sm font-medium transition"
        title="Draw rectangle"
      >
        □
      </button>
      <button
        @click.stop="canvasStore.setTool({ type: 'circle' })"
        :class="{ 'bg-blue-500 text-white': canvasStore.currentTool.type === 'circle', 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200': canvasStore.currentTool.type !== 'circle' }"
        class="px-3 py-2 rounded text-sm font-medium transition"
        title="Draw circle"
      >
        ○
      </button>
      <button
        @click.stop="canvasStore.setTool({ type: 'arrow' })"
        :class="{ 'bg-blue-500 text-white': canvasStore.currentTool.type === 'arrow', 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200': canvasStore.currentTool.type !== 'arrow' }"
        class="px-3 py-2 rounded text-sm font-medium transition"
        title="Draw arrow"
      >
        →
      </button>
      <button
        @click.stop="canvasStore.setTool({ type: 'line' })"
        :class="{ 'bg-blue-500 text-white': canvasStore.currentTool.type === 'line', 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200': canvasStore.currentTool.type !== 'line' }"
        class="px-3 py-2 rounded text-sm font-medium transition"
        title="Draw line"
      >
        —
      </button>
      <div class="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
      <input
        v-if="canvasStore.currentTool.type === 'pen' || canvasStore.currentTool.type === 'rectangle' || canvasStore.currentTool.type === 'circle' || canvasStore.currentTool.type === 'line' || canvasStore.currentTool.type === 'arrow'"
        type="color"
        v-model="canvasStore.currentTool.color"
        class="w-10 h-10 rounded cursor-pointer"
        @click.stop
      />
      <select
        v-model="canvasStore.currentTool.width"
        class="px-2 py-2 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
        @click.stop
      >
        <option :value="1">Thin</option>
        <option :value="2">Medium</option>
        <option :value="4">Thick</option>
        <option :value="8">Very Thick</option>
      </select>
      <button
        @click.stop="toggleDrawMode"
        class="px-4 py-2 bg-green-500 text-white rounded text-sm font-medium hover:bg-green-600 transition"
      >
        ✓ Done
      </button>
    </div>

    <!-- Canvas controls -->
    <div class="absolute bottom-4 right-4 flex flex-col gap-2">
      <!-- Zoom controls -->
      <div class="flex gap-2 bg-white rounded shadow-lg p-2">
        <button
          class="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded"
          @click="zoomIn"
        >
          +
        </button>
        <span class="px-3 py-1">{{ Math.round(viewport.scale * 100) }}%</span>
        <button
          class="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded"
          @click="zoomOut"
        >
          -
        </button>
      </div>

      <!-- Snap to grid toggle -->
      <button
        class="px-3 py-2 bg-white dark:bg-gray-800 rounded shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-2 text-sm"
        :class="{ 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300': canvasStore.snapToGrid }"
        @click="canvasStore.toggleSnapToGrid()"
        :title="canvasStore.snapToGrid ? 'Snap to Grid: ON' : 'Snap to Grid: OFF'"
      >
        <svg v-if="canvasStore.snapToGrid" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
        </svg>
        Snap
      </button>

      <!-- Draw/Shapes mode button -->
      <button
        class="px-3 py-2 bg-white dark:bg-gray-800 rounded shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-2 text-sm font-medium"
        :class="{
          'bg-orange-500 text-white hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700': canvasStore.currentTool.type !== 'select'
        }"
        @click="toggleDrawMode"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
        Draw
      </button>

      <!-- Connect cards button -->
      <button
        class="px-3 py-2 bg-white dark:bg-gray-800 rounded shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-2 text-sm font-medium"
        :class="{
          'bg-purple-500 text-white hover:bg-purple-600': canvasStore.currentTool.type === 'connect'
        }"
        @click="toggleConnectMode"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
        Connect
      </button>

      <!-- Clear drawing button -->
      <button
        v-if="hasAnyDrawings"
        class="px-3 py-2 bg-white dark:bg-gray-800 rounded shadow-lg hover:bg-red-50 dark:hover:bg-red-900 transition flex items-center gap-2 text-sm text-red-600 dark:text-red-400"
        @click="canvasStore.clearGlobalDrawing()"
        title="Clear all drawings, shapes, and arrows"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCanvasStore } from '~/stores/canvas'
import { ref, computed } from 'vue'

const canvasStore = useCanvasStore()
const canvasContainer = ref<HTMLElement | null>(null)

const viewport = computed(() => canvasStore.viewport)

const hasAnyDrawings = computed(() => {
  const hasPaths = canvasStore.globalDrawingPaths && canvasStore.globalDrawingPaths.length > 0
  const hasShapes = canvasStore.currentBoard?.shapes && canvasStore.currentBoard.shapes.length > 0
  const hasConnections = canvasStore.currentBoard?.connections && canvasStore.currentBoard.connections.length > 0
  return hasPaths || hasShapes || hasConnections
})

let panStartPos = { x: 0, y: 0 }
let viewportStartPos = { x: 0, y: 0 }

const handleCanvasMouseDown = (e: MouseEvent) => {
  // Only pan if clicking directly on canvas background, not on cards or their children
  const target = e.target as HTMLElement
  const isCard = target.closest('.note-card')
  const isDrawingLayer = target.closest('.global-drawing-layer')

  if (!isCard && !isDrawingLayer && (target === canvasContainer.value || target.classList.contains('canvas-grid'))) {
    canvasStore.setPanning(true)
    canvasStore.selectCard(null)
    panStartPos = { x: e.clientX, y: e.clientY }
    viewportStartPos = { x: viewport.value.x, y: viewport.value.y }
  }
}

const handleCanvasMouseMove = (e: MouseEvent) => {
  if (canvasStore.isPanning) {
    const dx = e.clientX - panStartPos.x
    const dy = e.clientY - panStartPos.y
    canvasStore.updateViewport({
      x: viewportStartPos.x + dx,
      y: viewportStartPos.y + dy
    })
  }
}

const handleCanvasMouseUp = () => {
  canvasStore.setPanning(false)
}

const handleWheel = (e: WheelEvent) => {
  e.preventDefault()

  const delta = e.deltaY > 0 ? -0.1 : 0.1
  const newScale = Math.max(0.1, Math.min(3, viewport.value.scale + delta))

  canvasStore.updateViewport({ scale: newScale })
}

const zoomIn = () => {
  const newScale = Math.min(3, viewport.value.scale + 0.1)
  canvasStore.updateViewport({ scale: newScale })
}

const zoomOut = () => {
  const newScale = Math.max(0.1, viewport.value.scale - 0.1)
  canvasStore.updateViewport({ scale: newScale })
}

const toggleDrawMode = () => {
  if (canvasStore.currentTool.type !== 'select') {
    canvasStore.setTool({ type: 'select' })
  } else {
    canvasStore.setTool({ type: 'pen', color: '#000000', width: 2 })
  }
}

const toggleConnectMode = () => {
  if (canvasStore.currentTool.type === 'connect') {
    canvasStore.setTool({ type: 'select' })
    canvasStore.connectionStart = null
  } else {
    canvasStore.setTool({ type: 'connect' })
  }
}
</script>

<style scoped>
.canvas-grid {
  background-image:
    radial-gradient(circle, #d1d5db 1px, transparent 1px),
    radial-gradient(circle, #d1d5db 1px, transparent 1px);
  background-size: 20px 20px;
  background-position: 0 0, 10px 10px;
}

.dark .canvas-grid {
  background-image:
    radial-gradient(circle, #4b5563 1px, transparent 1px),
    radial-gradient(circle, #4b5563 1px, transparent 1px);
  background-size: 20px 20px;
  background-position: 0 0, 10px 10px;
}

/* Alternative cross pattern - uncomment to use */
/*
.canvas-grid {
  background-image:
    linear-gradient(to right, #d1d5db 1px, transparent 1px),
    linear-gradient(to bottom, #d1d5db 1px, transparent 1px);
  background-size: 20px 20px;
}

.dark .canvas-grid {
  background-image:
    linear-gradient(to right, #4b5563 1px, transparent 1px),
    linear-gradient(to bottom, #4b5563 1px, transparent 1px);
  background-size: 20px 20px;
}
*/
</style>
