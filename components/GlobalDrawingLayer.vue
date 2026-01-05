<template>
  <!-- Drawing canvas inside transformed space so strokes move with canvas -->
  <div
    v-show="canvasStore.globalDrawingPaths.length > 0 || isDrawingMode"
    class="global-drawing-layer absolute inset-0"
    :style="{
      pointerEvents: 'none',
      zIndex: 10000
    }"
  >
    <canvas
      ref="canvas"
      class="absolute top-0 left-0"
      :width="canvasSize.width"
      :height="canvasSize.height"
      :style="{
        pointerEvents: isDrawingMode ? 'auto' : 'none',
        cursor: isDrawingMode ? (currentTool === 'pen' ? 'crosshair' : currentTool === 'eraser' ? 'not-allowed' : currentTool === 'move-stroke' ? 'move' : 'default') : 'default'
      }"
      @mousedown.stop="startDrawing"
      @mousemove.stop="draw"
      @mouseup.stop="stopDrawing"
      @mouseleave="stopDrawing"
    ></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed, nextTick } from 'vue'
import { useCanvasStore } from '~/stores/canvas'

const canvasStore = useCanvasStore()
const canvas = ref<HTMLCanvasElement | null>(null)
const isDrawing = ref(false)
const currentPath = ref<{x: number, y: number}[]>([])
const selectedStrokeIndex = ref<number | null>(null)
const isDraggingStroke = ref(false)
const strokeDragStart = ref<{x: number, y: number} | null>(null)

const isDrawingMode = computed(() =>
  canvasStore.currentTool.type === 'pen' ||
  canvasStore.currentTool.type === 'eraser' ||
  canvasStore.currentTool.type === 'move-stroke'
)
const currentTool = computed(() => canvasStore.currentTool.type)

// Large canvas to support drawing across the entire workspace
const canvasSize = computed(() => ({
  width: 10000,
  height: 10000
}))

const getCanvasCoords = (e: MouseEvent): { x: number, y: number } => {
  // Get mouse position relative to the transformed canvas space
  const viewport = canvasStore.viewport

  // Get the outermost canvas container (before the transform)
  // Structure: canvasContainer > transformed-div > GlobalDrawingLayer > canvas
  const transformedDiv = canvas.value?.parentElement?.parentElement
  const canvasContainer = transformedDiv?.parentElement
  if (!canvasContainer) return { x: 0, y: 0 }

  const rect = canvasContainer.getBoundingClientRect()

  // Mouse position relative to the outermost container
  const screenX = e.clientX - rect.left
  const screenY = e.clientY - rect.top

  // Convert to canvas coordinates by reversing the viewport transform
  const canvasX = (screenX - viewport.x) / viewport.scale
  const canvasY = (screenY - viewport.y) / viewport.scale

  return { x: canvasX, y: canvasY }
}

const startDrawing = (e: MouseEvent) => {
  if (!canvas.value) return

  const canvasCoords = getCanvasCoords(e)

  // Move stroke mode - select and drag strokes
  if (canvasStore.currentTool.type === 'move-stroke') {
    const strokeIndex = findStrokeAtPoint(canvasCoords.x, canvasCoords.y)
    if (strokeIndex !== null) {
      selectedStrokeIndex.value = strokeIndex
      isDraggingStroke.value = true
      strokeDragStart.value = canvasCoords
      redrawCanvas()
    }
    return
  }

  // Regular drawing mode
  isDrawing.value = true
  currentPath.value = [canvasCoords]
}

const findStrokeAtPoint = (x: number, y: number): number | null => {
  // Find if clicking near any stroke (within 10px tolerance)
  for (let i = canvasStore.globalDrawingPaths.length - 1; i >= 0; i--) {
    const pathData = JSON.parse(canvasStore.globalDrawingPaths[i])
    const points = pathData.points

    for (const point of points) {
      const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2))
      if (distance < 10) {
        return i
      }
    }
  }
  return null
}

const draw = (e: MouseEvent) => {
  if (!canvas.value) return

  const canvasCoords = getCanvasCoords(e)

  // Moving a stroke
  if (isDraggingStroke.value && strokeDragStart.value !== null && selectedStrokeIndex.value !== null) {
    const dx = canvasCoords.x - strokeDragStart.value.x
    const dy = canvasCoords.y - strokeDragStart.value.y
    canvasStore.moveGlobalDrawingPath(selectedStrokeIndex.value, dx, dy)
    strokeDragStart.value = canvasCoords
    redrawCanvas()
    return
  }

  // Regular drawing
  if (!isDrawing.value) return

  currentPath.value.push(canvasCoords)

  const ctx = canvas.value.getContext('2d')
  if (!ctx) return

  if (canvasStore.currentTool.type === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out'
    ctx.strokeStyle = 'rgba(0,0,0,1)'
    ctx.lineWidth = (canvasStore.currentTool.width || 2) * 3
  } else {
    ctx.globalCompositeOperation = 'source-over'
    ctx.strokeStyle = canvasStore.currentTool.color || '#000000'
    ctx.lineWidth = canvasStore.currentTool.width || 2
  }

  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  const len = currentPath.value.length
  if (len > 1) {
    ctx.beginPath()
    ctx.moveTo(currentPath.value[len - 2].x, currentPath.value[len - 2].y)
    ctx.lineTo(currentPath.value[len - 1].x, currentPath.value[len - 1].y)
    ctx.stroke()
  }
}

const stopDrawing = () => {
  // Stop moving stroke
  if (isDraggingStroke.value) {
    isDraggingStroke.value = false
    strokeDragStart.value = null
    return
  }

  // Stop regular drawing
  if (!isDrawing.value) return
  isDrawing.value = false

  // Save the path to store
  if (currentPath.value.length > 0) {
    const pathData = JSON.stringify({
      points: currentPath.value,
      color: canvasStore.currentTool.type === 'eraser' ? 'eraser' : canvasStore.currentTool.color,
      width: canvasStore.currentTool.width
    })
    canvasStore.addGlobalDrawingPath(pathData)
  }

  currentPath.value = []
}

const resizeCanvas = () => {
  if (!canvas.value) return
  // Canvas is large to support drawing across entire workspace
  canvas.value.width = canvasSize.value.width
  canvas.value.height = canvasSize.value.height
  redrawCanvas()
}

const redrawCanvas = () => {
  if (!canvas.value) return
  const ctx = canvas.value.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)

  // Redraw all saved paths
  if (!canvasStore.globalDrawingPaths) return
  canvasStore.globalDrawingPaths.forEach((pathData, index) => {
    const { points, color, width } = JSON.parse(pathData)

    if (color === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.strokeStyle = 'rgba(0,0,0,1)'
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = color
    }

    // Highlight selected stroke
    if (index === selectedStrokeIndex.value) {
      ctx.strokeStyle = '#3B82F6' // Blue highlight
      ctx.lineWidth = width + 2
    } else {
      ctx.lineWidth = width
    }

    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    ctx.beginPath()
    points.forEach((point: {x: number, y: number}, i: number) => {
      if (i === 0) {
        ctx.moveTo(point.x, point.y)
      } else {
        ctx.lineTo(point.x, point.y)
      }
    })
    ctx.stroke()
  })

  ctx.globalCompositeOperation = 'source-over'
}

onMounted(() => {
  nextTick(() => {
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCanvas)
})

watch(isDrawingMode, (newVal) => {
  nextTick(() => {
    if (newVal) {
      resizeCanvas()
    }
  })
})

watch(() => canvasStore.globalDrawingPaths, () => {
  nextTick(() => {
    redrawCanvas()
  })
}, { deep: true })
</script>
