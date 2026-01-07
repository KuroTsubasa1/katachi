<template>
  <div class="h-full w-full flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
    <!-- Toolbar -->
    <div class="flex items-center gap-2 p-3 border-b border-gray-200 dark:border-gray-700 flex-wrap">
      <input
        v-model="localData.title"
        @blur="updateData"
        class="text-lg font-semibold bg-transparent border-none outline-none dark:text-white flex-1 min-w-[120px]"
        placeholder="Camera Movement"
      />

      <div class="flex items-center gap-2 flex-wrap">
        <!-- Movement Type Selector -->
        <select
          v-model="localData.movementType"
          @change="updateData"
          class="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 dark:text-white"
        >
          <option value="dolly">Dolly</option>
          <option value="pan">Pan</option>
          <option value="tilt">Tilt</option>
          <option value="crane">Crane</option>
          <option value="steadicam">Steadicam</option>
          <option value="handheld">Handheld</option>
          <option value="slider">Slider</option>
        </select>

        <!-- Drawing Mode Toggle -->
        <button
          @click="toggleDrawingMode"
          :class="[
            'px-3 py-1 rounded text-xs flex items-center gap-1',
            isDrawing ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 dark:text-white hover:bg-gray-300'
          ]"
        >
          <span>✏️</span> {{ isDrawing ? 'Drawing...' : 'Draw Path' }}
        </button>

        <!-- Path Style Selector -->
        <select
          v-model="pathStyle"
          class="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 dark:text-white"
        >
          <option value="solid">Solid Line</option>
          <option value="dashed">Dashed Line</option>
          <option value="arrow">Arrow</option>
        </select>

        <!-- Color Picker -->
        <input
          v-model="drawingColor"
          type="color"
          class="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
          title="Path Color"
        />

        <!-- Line Width Selector -->
        <select
          v-model.number="lineWidth"
          class="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 dark:text-white"
        >
          <option :value="2">Thin</option>
          <option :value="4">Medium</option>
          <option :value="6">Thick</option>
        </select>

        <!-- Add Annotation Button -->
        <button
          @click="addAnnotation"
          class="px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 flex items-center gap-1"
        >
          <span>📝</span> Note
        </button>

        <!-- Add Start Marker -->
        <button
          @click="addStartMarker"
          :disabled="hasStartMarker"
          class="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start
        </button>

        <!-- Add End Marker -->
        <button
          @click="addEndMarker"
          :disabled="hasEndMarker"
          class="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          End
        </button>

        <!-- Clear Canvas -->
        <button
          @click="clearCanvas"
          class="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
        >
          Clear
        </button>
      </div>
    </div>

    <!-- Canvas Area -->
    <div class="flex-1 relative overflow-hidden">
      <canvas
        ref="canvasRef"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @mouseleave="handleMouseUp"
        class="w-full h-full cursor-crosshair"
        style="background-image: repeating-linear-gradient(0deg, transparent, transparent 19px, #e5e7eb 19px, #e5e7eb 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, #e5e7eb 19px, #e5e7eb 20px); background-size: 20px 20px;"
      ></canvas>

      <!-- Movement Type Indicator -->
      <div class="absolute top-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 text-xs">
        <div class="font-semibold mb-1 dark:text-white">Movement Type</div>
        <div class="text-gray-600 dark:text-gray-400">{{ movementTypeLabel }}</div>
      </div>
    </div>

    <!-- Properties Panel for Selected Item -->
    <div
      v-if="selectedItem"
      class="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800"
    >
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-sm font-semibold dark:text-white">
          {{ getItemLabel(selectedItem) }}
        </h3>
        <button
          @click="removeSelectedItem"
          class="text-red-500 hover:text-red-700 text-xs"
        >
          Delete
        </button>
      </div>

      <div class="grid grid-cols-2 gap-2 text-xs">
        <!-- Annotation text -->
        <template v-if="selectedItem.type === 'annotation'">
          <div class="col-span-2">
            <label class="block text-gray-600 dark:text-gray-400 mb-1">Text</label>
            <input
              v-model="selectedItem.label"
              @input="updateData"
              class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white"
              placeholder="Annotation text"
            />
          </div>
        </template>

        <!-- Marker label -->
        <template v-if="selectedItem.type === 'start' || selectedItem.type === 'end'">
          <div class="col-span-2">
            <label class="block text-gray-600 dark:text-gray-400 mb-1">Label</label>
            <input
              v-model="selectedItem.label"
              @input="updateData"
              class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white"
              placeholder="Marker label"
            />
          </div>
        </template>

        <!-- Position info -->
        <div>
          <label class="block text-gray-600 dark:text-gray-400 mb-1">X Position</label>
          <input
            :value="Math.round(selectedItem.position.x)"
            disabled
            class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-600 dark:text-white"
          />
        </div>
        <div>
          <label class="block text-gray-600 dark:text-gray-400 mb-1">Y Position</label>
          <input
            :value="Math.round(selectedItem.position.y)"
            disabled
            class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-600 dark:text-white"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useCanvasStore } from '~/stores/canvas'
import { useDraggableCanvas } from '~/composables/useDraggableCanvas'
import type { NoteCard, CameraMovementData } from '~/types'

const props = defineProps<{
  card: NoteCard
}>()

const canvasStore = useCanvasStore()
const canvasRef = ref<HTMLCanvasElement | null>(null)
const isDrawing = ref(false)
const drawingPath = ref<{ x: number; y: number }[]>([])
const pathStyle = ref<'solid' | 'dashed' | 'arrow'>('solid')
const drawingColor = ref('#000000')
const lineWidth = ref(4)

// Initialize draggable canvas composable
const {
  items,
  selectedItem,
  addItem,
  removeItem,
  startDrag,
  drag,
  stopDrag,
  selectItem,
  clearItems
} = useDraggableCanvas()

// Local data
const localData = ref<CameraMovementData>(
  props.card.cameraMovementData || {
    title: 'Camera Movement',
    movementType: 'dolly',
    drawingPaths: [],
    annotations: [],
    startPosition: { x: 0, y: 0 },
    endPosition: { x: 0, y: 0 }
  }
)

// Computed properties
const hasStartMarker = computed(() => items.value.some(item => item.type === 'start'))
const hasEndMarker = computed(() => items.value.some(item => item.type === 'end'))

const movementTypeLabel = computed(() => {
  const labels: Record<string, string> = {
    dolly: 'Dolly (Move Forward/Backward)',
    pan: 'Pan (Horizontal Rotation)',
    tilt: 'Tilt (Vertical Rotation)',
    crane: 'Crane (Vertical Movement)',
    steadicam: 'Steadicam (Smooth Movement)',
    handheld: 'Handheld (Organic Movement)',
    slider: 'Slider (Linear Movement)'
  }
  return labels[localData.value.movementType] || localData.value.movementType
})

// Initialize canvas items from saved data
const initializeFromData = () => {
  clearItems()

  // Add start marker if exists
  if (localData.value.startPosition && (localData.value.startPosition.x !== 0 || localData.value.startPosition.y !== 0)) {
    addItem({
      id: 'start',
      position: localData.value.startPosition,
      type: 'start',
      label: 'Start'
    })
  }

  // Add end marker if exists
  if (localData.value.endPosition && (localData.value.endPosition.x !== 0 || localData.value.endPosition.y !== 0)) {
    addItem({
      id: 'end',
      position: localData.value.endPosition,
      type: 'end',
      label: 'End'
    })
  }

  // Add annotations
  localData.value.annotations?.forEach(annotation => {
    addItem({
      id: annotation.id,
      position: annotation.position,
      type: 'annotation',
      label: annotation.text
    })
  })
}

// Toggle drawing mode
const toggleDrawingMode = () => {
  isDrawing.value = !isDrawing.value
  if (!isDrawing.value && drawingPath.value.length > 0) {
    // Save the drawn path
    const pathData = {
      points: drawingPath.value,
      style: pathStyle.value,
      color: drawingColor.value,
      width: lineWidth.value
    }
    localData.value.drawingPaths.push(JSON.stringify(pathData))
    drawingPath.value = []
    updateData()
  }
}

// Add annotation
const addAnnotation = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  const id = crypto.randomUUID()
  addItem({
    id,
    position: { x: canvas.width / 2, y: 50 },
    type: 'annotation',
    label: 'Note'
  })

  updateData()
}

// Add start marker
const addStartMarker = () => {
  const canvas = canvasRef.value
  if (!canvas || hasStartMarker.value) return

  addItem({
    id: 'start',
    position: { x: canvas.width * 0.25, y: canvas.height / 2 },
    type: 'start',
    label: 'Start'
  })

  updateData()
}

// Add end marker
const addEndMarker = () => {
  const canvas = canvasRef.value
  if (!canvas || hasEndMarker.value) return

  addItem({
    id: 'end',
    position: { x: canvas.width * 0.75, y: canvas.height / 2 },
    type: 'end',
    label: 'End'
  })

  updateData()
}

// Clear canvas
const clearCanvas = () => {
  if (confirm('Clear all paths and annotations from the canvas?')) {
    clearItems()
    localData.value.drawingPaths = []
    drawingPath.value = []
    updateData()
  }
}

// Remove selected item
const removeSelectedItem = () => {
  if (selectedItem.value) {
    removeItem(selectedItem.value.id)
    updateData()
  }
}

// Get item label
const getItemLabel = (item: any): string => {
  const labels: Record<string, string> = {
    start: 'Start Marker',
    end: 'End Marker',
    annotation: 'Annotation'
  }
  return labels[item.type] || 'Item'
}

// Mouse event handlers
const handleMouseDown = (event: MouseEvent) => {
  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  if (isDrawing.value) {
    drawingPath.value.push({ x, y })
    return
  }

  // Check if clicking on an item
  const clickedItem = items.value.find(item => {
    const dx = x - item.position.x
    const dy = y - item.position.y
    return Math.sqrt(dx * dx + dy * dy) < 30
  })

  if (clickedItem) {
    startDrag(clickedItem.id, event, canvas)
  } else {
    selectItem(null)
  }
}

const handleMouseMove = (event: MouseEvent) => {
  const canvas = canvasRef.value
  if (!canvas) return

  if (isDrawing.value && drawingPath.value.length > 0) {
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    drawingPath.value.push({ x, y })
    renderCanvas()
    return
  }

  drag(event, canvas)
  renderCanvas()
}

const handleMouseUp = () => {
  stopDrag()
  renderCanvas()
}

// Render canvas
const renderCanvas = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Draw saved paths
  localData.value.drawingPaths.forEach(pathString => {
    try {
      const pathData = JSON.parse(pathString)
      drawPath(ctx, pathData.points, pathData.style, pathData.color, pathData.width)
    } catch (e) {
      console.error('Error parsing path data:', e)
    }
  })

  // Draw current drawing path
  if (drawingPath.value.length > 1) {
    drawPath(ctx, drawingPath.value, pathStyle.value, drawingColor.value, lineWidth.value)
  }

  // Draw items
  items.value.forEach(item => {
    ctx.save()
    ctx.translate(item.position.x, item.position.y)

    if (item.type === 'start') {
      // Draw start marker (green circle with "S")
      ctx.fillStyle = '#10B981'
      ctx.strokeStyle = '#059669'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(0, 0, 20, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 16px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('S', 0, 0)

      // Draw label below
      ctx.fillStyle = '#000000'
      ctx.font = '12px sans-serif'
      ctx.fillText(item.label || 'Start', 0, 35)
    } else if (item.type === 'end') {
      // Draw end marker (red circle with "E")
      ctx.fillStyle = '#EF4444'
      ctx.strokeStyle = '#DC2626'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(0, 0, 20, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 16px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('E', 0, 0)

      // Draw label below
      ctx.fillStyle = '#000000'
      ctx.font = '12px sans-serif'
      ctx.fillText(item.label || 'End', 0, 35)
    } else if (item.type === 'annotation') {
      // Draw annotation
      ctx.fillStyle = '#FFFBEB'
      ctx.strokeStyle = '#F59E0B'
      ctx.lineWidth = 2
      ctx.fillRect(-50, -20, 100, 40)
      ctx.strokeRect(-50, -20, 100, 40)
      ctx.fillStyle = '#000000'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(item.label || 'Note', 0, 0)
    }

    // Draw selection indicator
    if (selectedItem.value?.id === item.id) {
      ctx.strokeStyle = '#3B82F6'
      ctx.lineWidth = 2
      ctx.strokeRect(-30, -30, 60, 60)
    }

    ctx.restore()
  })
}

// Draw path with style
const drawPath = (
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  style: 'solid' | 'dashed' | 'arrow',
  color: string,
  width: number
) => {
  if (points.length < 2) return

  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  if (style === 'dashed') {
    ctx.setLineDash([10, 5])
  } else {
    ctx.setLineDash([])
  }

  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)

  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y)
  }

  ctx.stroke()

  // Draw arrow at the end
  if (style === 'arrow' && points.length >= 2) {
    const lastPoint = points[points.length - 1]
    const secondLastPoint = points[points.length - 2]

    const angle = Math.atan2(lastPoint.y - secondLastPoint.y, lastPoint.x - secondLastPoint.x)
    const arrowLength = 15
    const arrowWidth = 10

    ctx.fillStyle = color
    ctx.setLineDash([])
    ctx.beginPath()
    ctx.moveTo(lastPoint.x, lastPoint.y)
    ctx.lineTo(
      lastPoint.x - arrowLength * Math.cos(angle - Math.PI / 6),
      lastPoint.y - arrowLength * Math.sin(angle - Math.PI / 6)
    )
    ctx.lineTo(
      lastPoint.x - arrowLength * Math.cos(angle + Math.PI / 6),
      lastPoint.y - arrowLength * Math.sin(angle + Math.PI / 6)
    )
    ctx.closePath()
    ctx.fill()
  }
}

// Update data
const updateData = () => {
  // Update local data from items
  localData.value.annotations = items.value
    .filter(item => item.type === 'annotation')
    .map(item => ({
      id: item.id,
      text: item.label || '',
      position: item.position
    }))

  const startItem = items.value.find(item => item.type === 'start')
  if (startItem) {
    localData.value.startPosition = startItem.position
  }

  const endItem = items.value.find(item => item.type === 'end')
  if (endItem) {
    localData.value.endPosition = endItem.position
  }

  // Save to store
  canvasStore.updateCard(props.card.id, {
    cameraMovementData: localData.value
  })

  renderCanvas()
}

// Setup canvas size
const setupCanvas = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  const parent = canvas.parentElement
  if (!parent) return

  canvas.width = parent.clientWidth
  canvas.height = parent.clientHeight

  renderCanvas()
}

// Lifecycle
onMounted(() => {
  setupCanvas()
  initializeFromData()
  renderCanvas()

  window.addEventListener('resize', setupCanvas)
})

// Watch for external data changes
watch(
  () => props.card.cameraMovementData,
  (newData) => {
    if (newData) {
      localData.value = newData
      initializeFromData()
      renderCanvas()
    }
  },
  { deep: true }
)

// Watch items for changes
watch(
  () => items.value,
  () => {
    renderCanvas()
  },
  { deep: true }
)
</script>
