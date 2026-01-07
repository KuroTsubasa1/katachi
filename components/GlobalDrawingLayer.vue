<template>
  <!-- Drawing canvas inside transformed space so strokes move with canvas -->
  <div
    v-show="canvasStore.globalDrawingPaths.length > 0 || isDrawingMode"
    class="global-drawing-layer absolute"
    :style="{
      pointerEvents: 'none',
      zIndex: 10000,
      left: '0',
      top: '0',
      width: canvasSize.width + 'px',
      height: canvasSize.height + 'px'
    }"
  >
    <canvas
      ref="canvas"
      class="absolute top-0 left-0"
      :width="canvasSize.width"
      :height="canvasSize.height"
      :style="{
        pointerEvents: isDrawingMode ? 'auto' : 'none',
        cursor: isDrawingMode ? (
          currentTool === 'pen' ? 'crosshair' :
          currentTool === 'eraser' ? 'not-allowed' :
          currentTool === 'move-stroke' ? 'move' :
          ['rectangle', 'circle', 'line', 'arrow'].includes(currentTool) ? 'crosshair' :
          'default'
        ) : 'default'
      }"
@mousedown.stop="handleMouseDown"
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
const shapeStart = ref<{x: number, y: number} | null>(null)
const shapeEnd = ref<{x: number, y: number} | null>(null)
const isDrawingShape = ref(false)

const isDrawingMode = computed(() =>
  canvasStore.currentTool.type === 'pen' ||
  canvasStore.currentTool.type === 'eraser' ||
  canvasStore.currentTool.type === 'move-stroke' ||
  canvasStore.currentTool.type === 'rectangle' ||
  canvasStore.currentTool.type === 'circle' ||
  canvasStore.currentTool.type === 'line' ||
  canvasStore.currentTool.type === 'arrow'
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

const handleMouseDown = (e: MouseEvent) => {
  const coords = getCanvasCoords(e)

  console.log('[GlobalDrawing] MOUSEDOWN', {
    screenX: e.clientX,
    screenY: e.clientY,
    canvasCoords: coords,
    canvasSize: canvasSize.value,
    viewport: canvasStore.viewport,
    tool: canvasStore.currentTool.type,
    canvasElement: {
      width: canvas.value?.width,
      height: canvas.value?.height,
      offsetWidth: canvas.value?.offsetWidth,
      offsetHeight: canvas.value?.offsetHeight
    }
  })

  startDrawing(e)
}

const startDrawing = (e: MouseEvent) => {
  console.log('startDrawing called, tool:', canvasStore.currentTool.type, 'isDrawingShape:', isDrawingShape.value)

  if (!canvas.value) return

  const canvasCoords = getCanvasCoords(e)
  console.log('Canvas coords:', canvasCoords)

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

  // Shape drawing mode - click to place, click again to confirm
  const isShapeTool = ['rectangle', 'circle', 'line', 'arrow'].includes(canvasStore.currentTool.type)
  console.log('Is shape tool:', isShapeTool)

  if (isShapeTool) {
    if (!isDrawingShape.value) {
      // First click - set start point
      shapeStart.value = canvasCoords
      shapeEnd.value = canvasCoords
      isDrawingShape.value = true
      console.log('✓ FIRST CLICK - Shape started at:', canvasCoords, 'isDrawingShape now:', isDrawingShape.value)
    } else {
      // Second click - confirm and save
      console.log('✓ SECOND CLICK DETECTED - isDrawingShape:', isDrawingShape.value)
      shapeEnd.value = canvasCoords

      // Immediately save the shape
      if (shapeStart.value && shapeEnd.value) {
        const newShape = {
          type: canvasStore.currentTool.type as 'rectangle' | 'circle' | 'line' | 'arrow',
          position: shapeStart.value,
          size: {
            width: shapeEnd.value.x - shapeStart.value.x,
            height: shapeEnd.value.y - shapeStart.value.y
          },
          color: canvasStore.currentTool.color || '#000000',
          width: canvasStore.currentTool.width || 2,
          fill: false
        }

        console.log('Adding shape:', newShape)
        canvasStore.addShape(newShape)

        shapeStart.value = null
        shapeEnd.value = null
        isDrawingShape.value = false

        nextTick(() => {
          console.log('Redrawing canvas after shape add')
          redrawCanvas()
        })
      } else {
        console.error('Missing shapeStart or shapeEnd!')
      }
      console.log('✓ Shape saved, isDrawingShape reset to:', isDrawingShape.value)
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

  // Shape drawing preview - update on mouse move
  if (isDrawingShape.value && shapeStart.value && ['rectangle', 'circle', 'line', 'arrow'].includes(canvasStore.currentTool.type)) {
    shapeEnd.value = canvasCoords
    drawShapePreview()
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

const drawShapePreview = () => {
  if (!canvas.value || !shapeStart.value || !shapeEnd.value) return

  redrawCanvas()

  const ctx = canvas.value.getContext('2d')
  if (!ctx) return

  ctx.strokeStyle = canvasStore.currentTool.color || '#000000'
  ctx.lineWidth = canvasStore.currentTool.width || 2
  ctx.lineCap = 'round'

  const x1 = shapeStart.value.x
  const y1 = shapeStart.value.y
  const x2 = shapeEnd.value.x
  const y2 = shapeEnd.value.y

  switch (canvasStore.currentTool.type) {
    case 'rectangle':
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1)
      break
    case 'circle': {
      const rx = Math.abs(x2 - x1) / 2
      const ry = Math.abs(y2 - y1) / 2
      const cx = x1 + (x2 - x1) / 2
      const cy = y1 + (y2 - y1) / 2
      ctx.beginPath()
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
      ctx.stroke()
      break
    }
    case 'line':
    case 'arrow':
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()

      if (canvasStore.currentTool.type === 'arrow') {
        // Draw arrowhead
        const angle = Math.atan2(y2 - y1, x2 - x1)
        const headLength = 15
        ctx.beginPath()
        ctx.moveTo(x2, y2)
        ctx.lineTo(
          x2 - headLength * Math.cos(angle - Math.PI / 6),
          y2 - headLength * Math.sin(angle - Math.PI / 6)
        )
        ctx.moveTo(x2, y2)
        ctx.lineTo(
          x2 - headLength * Math.cos(angle + Math.PI / 6),
          y2 - headLength * Math.sin(angle + Math.PI / 6)
        )
        ctx.stroke()
      }
      break
  }
}

const stopDrawing = () => {
  // Stop moving stroke
  if (isDraggingStroke.value) {
    isDraggingStroke.value = false
    strokeDragStart.value = null
    return
  }

  // Don't auto-stop for shapes (they need second click to confirm)
  if (isDrawingShape.value) {
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

  // Redraw all saved shapes first (so they're behind strokes)
  if (canvasStore.currentBoard?.shapes) {
    canvasStore.currentBoard.shapes.forEach(shape => {
      ctx.strokeStyle = shape.color
      ctx.lineWidth = shape.width
      ctx.lineCap = 'round'

      switch (shape.type) {
        case 'rectangle':
          ctx.strokeRect(shape.position.x, shape.position.y, shape.size.width, shape.size.height)
          break
        case 'circle': {
          const rx = Math.abs(shape.size.width) / 2
          const ry = Math.abs(shape.size.height) / 2
          const cx = shape.position.x + shape.size.width / 2
          const cy = shape.position.y + shape.size.height / 2
          ctx.beginPath()
          ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
          ctx.stroke()
          break
        }
        case 'line':
        case 'arrow': {
          ctx.beginPath()
          ctx.moveTo(shape.position.x, shape.position.y)
          ctx.lineTo(shape.position.x + shape.size.width, shape.position.y + shape.size.height)
          ctx.stroke()

          if (shape.type === 'arrow') {
            // Draw arrowhead
            const x1 = shape.position.x
            const y1 = shape.position.y
            const x2 = shape.position.x + shape.size.width
            const y2 = shape.position.y + shape.size.height
            const angle = Math.atan2(y2 - y1, x2 - x1)
            const headLength = 15

            ctx.beginPath()
            ctx.moveTo(x2, y2)
            ctx.lineTo(
              x2 - headLength * Math.cos(angle - Math.PI / 6),
              y2 - headLength * Math.sin(angle - Math.PI / 6)
            )
            ctx.moveTo(x2, y2)
            ctx.lineTo(
              x2 - headLength * Math.cos(angle + Math.PI / 6),
              y2 - headLength * Math.sin(angle + Math.PI / 6)
            )
            ctx.stroke()
          }
          break
        }
      }
    })
  }

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

watch(() => canvasStore.currentBoard?.shapes, () => {
  nextTick(() => {
    redrawCanvas()
  })
}, { deep: true })
</script>
