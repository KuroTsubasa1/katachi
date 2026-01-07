<template>
  <div class="h-full w-full flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
    <!-- Toolbar -->
    <div class="flex items-center gap-2 p-3 border-b border-gray-200 dark:border-gray-700 flex-wrap">
      <input
        v-model="localData.title"
        @blur="updateData"
        class="text-lg font-semibold bg-transparent border-none outline-none dark:text-white flex-1 min-w-[120px]"
        placeholder="Lighting Setup"
      />

      <div class="flex items-center gap-2 flex-wrap">
        <!-- Light Type Selector -->
        <select
          v-model="selectedLightType"
          class="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 dark:text-white"
        >
          <option value="key">Key Light</option>
          <option value="fill">Fill Light</option>
          <option value="back">Back Light</option>
          <option value="rim">Rim Light</option>
          <option value="hair">Hair Light</option>
          <option value="background">Background</option>
          <option value="practical">Practical</option>
        </select>

        <!-- Add Light Button -->
        <button
          @click="addLight"
          class="px-3 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600 flex items-center gap-1"
        >
          <span>💡</span> Add Light
        </button>

        <!-- Add Subject Button -->
        <button
          @click="addSubject"
          :disabled="hasSubject"
          class="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <span>👤</span> Subject
        </button>

        <!-- Add Camera Button -->
        <button
          @click="addCamera"
          :disabled="hasCamera"
          class="px-3 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <span>📷</span> Camera
        </button>

        <!-- Drawing Mode Toggle -->
        <button
          @click="toggleDrawingMode"
          :class="[
            'px-3 py-1 rounded text-xs flex items-center gap-1',
            isDrawing ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 dark:text-white hover:bg-gray-300'
          ]"
        >
          <span>✏️</span> {{ isDrawing ? 'Drawing...' : 'Draw' }}
        </button>

        <!-- Add Annotation Button -->
        <button
          @click="addAnnotation"
          class="px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 flex items-center gap-1"
        >
          <span>📝</span> Note
        </button>

        <!-- Clear Canvas -->
        <button
          @click="clearCanvas"
          class="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
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
        <!-- Light-specific properties -->
        <template v-if="selectedItem.type !== 'subject' && selectedItem.type !== 'camera' && selectedItem.type !== 'annotation'">
          <div>
            <label class="block text-gray-600 dark:text-gray-400 mb-1">Power</label>
            <input
              v-model="selectedItem.power"
              @input="updateData"
              class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white"
              placeholder="e.g., 500W"
            />
          </div>
          <div>
            <label class="block text-gray-600 dark:text-gray-400 mb-1">Modifier</label>
            <input
              v-model="selectedItem.modifier"
              @input="updateData"
              class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white"
              placeholder="e.g., Softbox"
            />
          </div>
          <div>
            <label class="block text-gray-600 dark:text-gray-400 mb-1">Color</label>
            <input
              v-model="selectedItem.color"
              @input="updateData"
              type="color"
              class="w-full h-8 border border-gray-300 dark:border-gray-600 rounded"
            />
          </div>
        </template>

        <!-- Camera-specific properties -->
        <template v-if="selectedItem.type === 'camera'">
          <div>
            <label class="block text-gray-600 dark:text-gray-400 mb-1">Rotation (deg)</label>
            <input
              v-model.number="selectedItem.rotation"
              @input="updateData"
              type="number"
              class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white"
            />
          </div>
        </template>

        <!-- Annotation-specific properties -->
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

        <!-- Common rotation for lights -->
        <template v-if="selectedItem.type !== 'subject' && selectedItem.type !== 'annotation'">
          <div>
            <label class="block text-gray-600 dark:text-gray-400 mb-1">Angle (deg)</label>
            <input
              v-model.number="selectedItem.rotation"
              @input="updateData"
              type="number"
              class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white"
            />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useCanvasStore } from '~/stores/canvas'
import { useDraggableCanvas } from '~/composables/useDraggableCanvas'
import { getLightingIcon, getCameraIcon, getSubjectIcon } from '~/utils/photographyHelpers'
import type { NoteCard, LightingDiagramData } from '~/types'

const props = defineProps<{
  card: NoteCard
}>()

const canvasStore = useCanvasStore()
const canvasRef = ref<HTMLCanvasElement | null>(null)
const isDrawing = ref(false)
const drawingPath = ref<{ x: number; y: number }[]>([])
const selectedLightType = ref<'key' | 'fill' | 'back' | 'rim' | 'hair' | 'background' | 'practical'>('key')

// Initialize draggable canvas composable
const {
  items,
  selectedItem,
  addItem,
  removeItem,
  updateItem,
  startDrag,
  drag,
  stopDrag,
  selectItem,
  clearItems
} = useDraggableCanvas()

// Local data
const localData = ref<LightingDiagramData>(
  props.card.lightingDiagramData || {
    title: 'Lighting Setup',
    lights: [],
    subject: { x: 400, y: 300, icon: 'person' },
    background: { x: 400, y: 100 },
    camera: { x: 400, y: 500, rotation: 0 },
    annotations: [],
    measurements: [],
    drawingPaths: []
  }
)

// Computed properties
const hasSubject = computed(() => items.value.some(item => item.type === 'subject'))
const hasCamera = computed(() => items.value.some(item => item.type === 'camera'))

// Initialize canvas items from saved data
const initializeFromData = () => {
  clearItems()

  // Add subject if exists
  if (localData.value.subject) {
    addItem({
      id: 'subject',
      position: { x: localData.value.subject.x, y: localData.value.subject.y },
      type: 'subject',
      icon: localData.value.subject.icon
    })
  }

  // Add camera if exists
  if (localData.value.camera) {
    addItem({
      id: 'camera',
      position: { x: localData.value.camera.x, y: localData.value.camera.y },
      type: 'camera',
      rotation: localData.value.camera.rotation || 0
    })
  }

  // Add lights
  localData.value.lights?.forEach(light => {
    addItem({
      id: light.id,
      position: { x: light.position.x, y: light.position.y },
      type: light.type,
      rotation: light.rotation || 0,
      power: light.power || '',
      modifier: light.modifier || '',
      color: light.color || '#FFA500'
    })
  })

  // Add annotations
  localData.value.annotations?.forEach(annotation => {
    addItem({
      id: annotation.id,
      position: { x: annotation.position.x, y: annotation.position.y },
      type: 'annotation',
      label: annotation.text
    })
  })
}

// Add light
const addLight = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  const id = crypto.randomUUID()
  addItem({
    id,
    position: { x: canvas.width / 2, y: canvas.height / 2 },
    type: selectedLightType.value,
    rotation: 0,
    power: '',
    modifier: '',
    color: '#FFA500'
  })

  updateData()
}

// Add subject
const addSubject = () => {
  const canvas = canvasRef.value
  if (!canvas || hasSubject.value) return

  addItem({
    id: 'subject',
    position: { x: canvas.width / 2, y: canvas.height / 2 },
    type: 'subject',
    icon: 'person'
  })

  updateData()
}

// Add camera
const addCamera = () => {
  const canvas = canvasRef.value
  if (!canvas || hasCamera.value) return

  addItem({
    id: 'camera',
    position: { x: canvas.width / 2, y: canvas.height * 0.8 },
    type: 'camera',
    rotation: 0
  })

  updateData()
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

// Toggle drawing mode
const toggleDrawingMode = () => {
  isDrawing.value = !isDrawing.value
  if (!isDrawing.value && drawingPath.value.length > 0) {
    // Save the drawn path
    const pathString = drawingPath.value
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ')
    localData.value.drawingPaths.push(pathString)
    drawingPath.value = []
    updateData()
  }
}

// Clear canvas
const clearCanvas = () => {
  if (confirm('Clear all items from the canvas?')) {
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
    key: 'Key Light',
    fill: 'Fill Light',
    back: 'Back Light',
    rim: 'Rim Light',
    hair: 'Hair Light',
    background: 'Background Light',
    practical: 'Practical Light',
    subject: 'Subject',
    camera: 'Camera',
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
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 2
  localData.value.drawingPaths.forEach(pathString => {
    const path = new Path2D(pathString)
    ctx.stroke(path)
  })

  // Draw current drawing path
  if (drawingPath.value.length > 1) {
    ctx.beginPath()
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    drawingPath.value.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y)
      } else {
        ctx.lineTo(point.x, point.y)
      }
    })
    ctx.stroke()
  }

  // Draw items
  items.value.forEach(item => {
    ctx.save()
    ctx.translate(item.position.x, item.position.y)

    if (item.type === 'subject') {
      // Draw subject icon
      const iconSvg = getSubjectIcon(item.icon || 'person')
      drawSVG(ctx, iconSvg, -20, -20, 40, 40)
    } else if (item.type === 'camera') {
      // Draw camera icon
      const iconSvg = getCameraIcon(item.rotation || 0)
      drawSVG(ctx, iconSvg, -20, -20, 40, 40)
    } else if (item.type === 'annotation') {
      // Draw annotation
      ctx.fillStyle = '#FFFFFF'
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 1
      ctx.fillRect(-40, -15, 80, 30)
      ctx.strokeRect(-40, -15, 80, 30)
      ctx.fillStyle = '#000000'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(item.label || 'Note', 0, 0)
    } else {
      // Draw light icon
      const iconSvg = getLightingIcon(item.type, item.color || '#FFA500')
      ctx.rotate((item.rotation || 0) * Math.PI / 180)
      drawSVG(ctx, iconSvg, -20, -20, 40, 40)

      // Draw label below icon
      ctx.rotate(-(item.rotation || 0) * Math.PI / 180)
      ctx.fillStyle = '#000000'
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(getItemLabel(item), 0, 30)
    }

    // Draw selection indicator
    if (selectedItem.value?.id === item.id) {
      ctx.strokeStyle = '#3B82F6'
      ctx.lineWidth = 2
      ctx.strokeRect(-25, -25, 50, 50)
    }

    ctx.restore()
  })
}

// Helper to draw SVG on canvas
const drawSVG = (ctx: CanvasRenderingContext2D, svgString: string, x: number, y: number, width: number, height: number) => {
  const img = new Image()
  const blob = new Blob([svgString], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)

  img.onload = () => {
    ctx.drawImage(img, x, y, width, height)
    URL.revokeObjectURL(url)
  }

  img.src = url
}

// Update data
const updateData = () => {
  // Update local data from items
  localData.value.lights = items.value
    .filter(item => !['subject', 'camera', 'annotation'].includes(item.type))
    .map(item => ({
      id: item.id,
      type: item.type as any,
      position: item.position,
      rotation: item.rotation || 0,
      power: item.power || '',
      modifier: item.modifier || '',
      color: item.color || '#FFA500'
    }))

  const subjectItem = items.value.find(item => item.type === 'subject')
  if (subjectItem) {
    localData.value.subject = {
      x: subjectItem.position.x,
      y: subjectItem.position.y,
      icon: subjectItem.icon || 'person'
    }
  }

  const cameraItem = items.value.find(item => item.type === 'camera')
  if (cameraItem) {
    localData.value.camera = {
      x: cameraItem.position.x,
      y: cameraItem.position.y,
      rotation: cameraItem.rotation || 0
    }
  }

  localData.value.annotations = items.value
    .filter(item => item.type === 'annotation')
    .map(item => ({
      id: item.id,
      text: item.label || '',
      position: item.position
    }))

  // Save to store
  canvasStore.updateCard(props.card.id, {
    lightingDiagramData: localData.value
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
  () => props.card.lightingDiagramData,
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
