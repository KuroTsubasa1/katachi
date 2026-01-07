<template>
  <!-- Drawing canvas inside transformed space so strokes move with canvas -->
  <canvas
    v-show="canvasStore.globalDrawingPaths.length > 0 || isDrawingMode"
    ref="canvas"
    class="absolute top-0 left-0"
    :width="canvasSize.width"
    :height="canvasSize.height"
    :style="{
      width: canvasSize.width + 'px',
      height: canvasSize.height + 'px',
      zIndex: 10000,
      pointerEvents: isDrawingMode ? 'auto' : 'none',
        cursor: isDrawingMode ? (
          currentTool === 'pen' ? 'crosshair' :
          currentTool === 'eraser' ? 'pointer' :
          currentTool === 'move-stroke' ? 'move' :
          currentTool === 'hand' ? 'grab' :
          ['rectangle', 'circle', 'line', 'arrow'].includes(currentTool) ? 'crosshair' :
          'default'
        ) : 'default'
      }"
    @mousedown.stop="handleMouseDown"
  ></canvas>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed, nextTick } from 'vue'
import { useCanvasStore } from '~/stores/canvas'
import { useSync } from '~/composables/useSync'

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
  canvasStore.currentTool.type === 'hand' ||
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
  // Get coordinates in canvas pixel space
  const viewport = canvasStore.viewport

  // Get the canvas board container (accounts for sidebar offset)
  const canvasBoard = document.querySelector('.canvas-grid')
  if (!canvasBoard) return { x: 0, y: 0 }

  const rect = canvasBoard.getBoundingClientRect()

  // Mouse position relative to the canvas board (after sidebar)
  const screenX = e.clientX - rect.left
  const screenY = e.clientY - rect.top

  // Reverse viewport transform to get canvas coordinates
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

  // Hand tool - don't start drawing, let canvas handle panning
  if (canvasStore.currentTool.type === 'hand') {
    return
  }

  // Eraser tool - drag to erase strokes
  if (canvasStore.currentTool.type === 'eraser') {
    isDrawing.value = true
    currentPath.value = [canvasCoords]

    // Check if starting on a stroke and delete it
    const strokeIndex = findStrokeAtPoint(canvasCoords.x, canvasCoords.y)
    if (strokeIndex !== null) {
      console.log('[Eraser] Deleting stroke at index:', strokeIndex)
      canvasStore.deleteGlobalDrawingPath(strokeIndex)
      redrawCanvas()
    }

    // Attach mouseup listener
    document.addEventListener('mouseup', handleDocumentMouseUp)
    return
  }

  // Move stroke mode - select and drag strokes
  if (canvasStore.currentTool.type === 'move-stroke') {
    const strokeIndex = findStrokeAtPoint(canvasCoords.x, canvasCoords.y)
    if (strokeIndex !== null) {
      selectedStrokeIndex.value = strokeIndex
      isDraggingStroke.value = true
      strokeDragStart.value = canvasCoords
      redrawCanvas()

      // Attach mouseup listener (mousemove already attached via watch)
      document.addEventListener('mouseup', handleDocumentMouseUp)
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
      // Note: Document listeners are always active in draw mode, no need to attach here
    } else {
      // Second click - confirm and save
      console.log('✓ SECOND CLICK DETECTED - isDrawingShape:', isDrawingShape.value)
      shapeEnd.value = canvasCoords

      // Immediately save the shape
      if (shapeStart.value && shapeEnd.value) {
        const shapeType = canvasStore.currentTool.type as 'rectangle' | 'circle' | 'line' | 'arrow'

        // For lines and arrows, preserve direction (don't normalize)
        // For rectangles and circles, normalize to handle any drag direction
        const isDirectional = shapeType === 'line' || shapeType === 'arrow'

        const newShape = {
          type: shapeType,
          position: isDirectional ?
            { x: shapeStart.value.x, y: shapeStart.value.y } :
            {
              x: Math.min(shapeStart.value.x, shapeEnd.value.x),
              y: Math.min(shapeStart.value.y, shapeEnd.value.y)
            },
          size: isDirectional ?
            {
              width: shapeEnd.value.x - shapeStart.value.x,
              height: shapeEnd.value.y - shapeStart.value.y
            } :
            {
              width: Math.abs(shapeEnd.value.x - shapeStart.value.x),
              height: Math.abs(shapeEnd.value.y - shapeStart.value.y)
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

  // Attach mouseup listener (mousemove is already attached via watch)
  document.addEventListener('mouseup', handleDocumentMouseUp)
}

const handleDocumentMouseMove = (e: MouseEvent) => {
  draw(e)
}

const handleDocumentMouseUp = (e: MouseEvent) => {
  stopDrawing()
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
  console.log('[Draw] Called - tool:', canvasStore.currentTool.type, 'isDrawingShape:', isDrawingShape.value, 'isDrawing:', isDrawing.value)

  if (!canvas.value) {
    console.log('[Draw] No canvas, returning')
    return
  }

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
  if (isDrawingShape.value && shapeStart.value) {
    const isShapeTool = ['rectangle', 'circle', 'line', 'arrow'].includes(canvasStore.currentTool.type)
    if (isShapeTool) {
      shapeEnd.value = canvasCoords
      console.log('[Shape Preview] Updating preview from', shapeStart.value, 'to', shapeEnd.value)
      drawShapePreview()
      return
    }
  }

  // Eraser dragging - check for strokes AND shapes to delete
  if (isDrawing.value && canvasStore.currentTool.type === 'eraser') {
    currentPath.value.push(canvasCoords)

    let deletedSomething = false

    // Check if eraser intersects any pen strokes
    const pathCount = canvasStore.globalDrawingPaths.length
    for (let i = pathCount - 1; i >= 0; i--) {
      try {
        const pathData = JSON.parse(canvasStore.globalDrawingPaths[i])
        const points = pathData.points

        // Check if any point in this stroke is near the eraser position
        for (const point of points) {
          const distance = Math.sqrt(Math.pow(point.x - canvasCoords.x, 2) + Math.pow(point.y - canvasCoords.y, 2))
          if (distance < 10) {
            console.log('[Eraser] Deleting stroke at index:', i)
            canvasStore.deleteGlobalDrawingPath(i)
            deletedSomething = true
            break
          }
        }
        if (deletedSomething) break // Only delete one item per mousemove
      } catch (error) {
        console.error('[Eraser] Error checking stroke:', error)
      }
    }

    // Also check for shapes to delete
    if (!deletedSomething && canvasStore.currentBoard?.shapes) {
      const shapesCount = canvasStore.currentBoard.shapes.length
      for (let i = shapesCount - 1; i >= 0; i--) {
        const shape = canvasStore.currentBoard.shapes[i]

        // Check if eraser position is inside or near the shape bounds
        const shapeX = shape.position.x
        const shapeY = shape.position.y
        const shapeWidth = shape.size.width
        const shapeHeight = shape.size.height

        // Check if point is inside shape bounding box (with 10px tolerance)
        if (canvasCoords.x >= shapeX - 10 &&
            canvasCoords.x <= shapeX + shapeWidth + 10 &&
            canvasCoords.y >= shapeY - 10 &&
            canvasCoords.y <= shapeY + shapeHeight + 10) {
          console.log('[Eraser] Deleting shape at index:', i)
          const shapeId = shape.id
          canvasStore.currentBoard.shapes.splice(i, 1)
          canvasStore.currentBoard.updatedAt = new Date().toISOString()

          // Sync shape deletion to server
          if (typeof window !== 'undefined') {
            const { queueSync } = useSync()
            queueSync('shape', 'delete', { id: shapeId, boardId: canvasStore.currentBoard.id })
          }

          deletedSomething = true
          break
        }
      }
    }

    if (deletedSomething) {
      redrawCanvas()
    }
    return
  }

  // Regular pen drawing
  if (!isDrawing.value) return

  currentPath.value.push(canvasCoords)

  const ctx = canvas.value.getContext('2d')
  if (!ctx) return

  // Pen tool settings
  ctx.globalCompositeOperation = 'source-over'
  ctx.strokeStyle = canvasStore.currentTool.color || '#000000'
  ctx.lineWidth = canvasStore.currentTool.width || 2

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
  if (!canvas.value || !shapeStart.value || !shapeEnd.value) {
    console.log('[drawShapePreview] Missing:', { canvas: !!canvas.value, start: !!shapeStart.value, end: !!shapeEnd.value })
    return
  }

  // Redraw existing content first
  redrawCanvas()

  const ctx = canvas.value.getContext('2d')
  if (!ctx) {
    console.log('[drawShapePreview] No context')
    return
  }

  // Draw preview with semi-transparent style
  ctx.strokeStyle = canvasStore.currentTool.color || '#000000'
  ctx.lineWidth = canvasStore.currentTool.width || 2
  ctx.lineCap = 'round'
  ctx.globalAlpha = 0.7 // Semi-transparent for preview

  // Normalize coordinates to handle negative dimensions
  const x1 = Math.min(shapeStart.value.x, shapeEnd.value.x)
  const y1 = Math.min(shapeStart.value.y, shapeEnd.value.y)
  const width = Math.abs(shapeEnd.value.x - shapeStart.value.x)
  const height = Math.abs(shapeEnd.value.y - shapeStart.value.y)

  console.log('[drawShapePreview] Drawing', canvasStore.currentTool.type, 'at', { x1, y1, width, height })

  switch (canvasStore.currentTool.type) {
    case 'rectangle':
      ctx.strokeRect(x1, y1, width, height)
      break
    case 'circle': {
      const cx = x1 + width / 2
      const cy = y1 + height / 2
      const rx = width / 2
      const ry = height / 2
      ctx.beginPath()
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
      ctx.stroke()
      break
    }
    case 'line':
    case 'arrow':
      ctx.beginPath()
      ctx.moveTo(shapeStart.value.x, shapeStart.value.y)
      ctx.lineTo(shapeEnd.value.x, shapeEnd.value.y)
      ctx.stroke()

      if (canvasStore.currentTool.type === 'arrow') {
        // Draw arrowhead
        const angle = Math.atan2(shapeEnd.value.y - shapeStart.value.y, shapeEnd.value.x - shapeStart.value.x)
        const headLength = 15
        ctx.beginPath()
        ctx.moveTo(shapeEnd.value.x, shapeEnd.value.y)
        ctx.lineTo(
          shapeEnd.value.x - headLength * Math.cos(angle - Math.PI / 6),
          shapeEnd.value.y - headLength * Math.sin(angle - Math.PI / 6)
        )
        ctx.moveTo(shapeEnd.value.x, shapeEnd.value.y)
        ctx.lineTo(
          shapeEnd.value.x - headLength * Math.cos(angle + Math.PI / 6),
          shapeEnd.value.y - headLength * Math.sin(angle + Math.PI / 6)
        )
        ctx.stroke()
      }
      break
  }

  // Reset alpha
  ctx.globalAlpha = 1.0
}

const stopDrawing = () => {
  // Remove mouseup listener (mousemove stays active in draw mode via watch)
  document.removeEventListener('mouseup', handleDocumentMouseUp)

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

  // Don't save eraser paths (they just delete strokes)
  if (canvasStore.currentTool.type === 'eraser') {
    currentPath.value = []
    return
  }

  // Save the path to store (pen tool only at this point)
  if (currentPath.value.length > 0) {
    const pathData = JSON.stringify({
      points: currentPath.value,
      color: canvasStore.currentTool.color || '#000000',
      width: canvasStore.currentTool.width || 2
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
      // Add document listeners for shape tools (need mousemove without button pressed)
      document.addEventListener('mousemove', handleDocumentMouseMove)
    } else {
      // Remove listeners when exiting draw mode
      document.removeEventListener('mousemove', handleDocumentMouseMove)
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
