<template>
  <div class="h-full w-full relative bg-white rounded">
    <canvas
      ref="canvas"
      class="w-full h-full cursor-crosshair"
      :width="canvasSize.width"
      :height="canvasSize.height"
      @mousedown="startDrawing"
      @mousemove="draw"
      @mouseup="stopDrawing"
      @mouseleave="stopDrawing"
    ></canvas>

    <!-- Drawing tools -->
    <div v-if="isSelected" class="absolute top-2 left-2 bg-white rounded shadow-lg p-2 flex gap-2 items-center">
      <button
        @click="setTool('pen')"
        :class="{ 'bg-blue-500 text-white': currentTool === 'pen' }"
        class="px-3 py-1 rounded text-sm hover:bg-gray-200"
      >
        Pen
      </button>
      <button
        @click="setTool('eraser')"
        :class="{ 'bg-blue-500 text-white': currentTool === 'eraser' }"
        class="px-3 py-1 rounded text-sm hover:bg-gray-200"
      >
        Eraser
      </button>
      <input
        v-if="currentTool === 'pen'"
        type="color"
        v-model="penColor"
        class="w-8 h-6"
      />
      <select v-model="penWidth" class="text-sm border rounded px-1">
        <option :value="1">Thin</option>
        <option :value="3">Medium</option>
        <option :value="5">Thick</option>
        <option :value="10">Very Thick</option>
      </select>
      <button
        @click="clearCanvas"
        class="px-3 py-1 rounded text-sm bg-red-100 hover:bg-red-200"
      >
        Clear
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'

const props = defineProps<{
  isSelected: boolean
  drawingPaths?: string[]
  cardSize: { width: number, height: number }
}>()

const emit = defineEmits<{
  'update:drawingPaths': [paths: string[]]
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
const currentTool = ref<'pen' | 'eraser'>('pen')
const penColor = ref('#000000')
const penWidth = ref(3)
const isDrawing = ref(false)
const paths = ref<string[]>(props.drawingPaths || [])
const currentPath = ref<{x: number, y: number}[]>([])

const canvasSize = computed(() => ({
  width: props.cardSize.width,
  height: props.cardSize.height
}))

const setTool = (tool: 'pen' | 'eraser') => {
  currentTool.value = tool
}

const startDrawing = (e: MouseEvent) => {
  if (!canvas.value) return
  isDrawing.value = true
  const rect = canvas.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  currentPath.value = [{ x, y }]
}

const draw = (e: MouseEvent) => {
  if (!isDrawing.value || !canvas.value) return
  const rect = canvas.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  currentPath.value.push({ x, y })

  const ctx = canvas.value.getContext('2d')
  if (!ctx) return

  if (currentTool.value === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out'
    ctx.strokeStyle = 'rgba(0,0,0,1)'
    ctx.lineWidth = penWidth.value * 3
  } else {
    ctx.globalCompositeOperation = 'source-over'
    ctx.strokeStyle = penColor.value
    ctx.lineWidth = penWidth.value
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
  if (!isDrawing.value) return
  isDrawing.value = false

  if (currentPath.value.length > 0) {
    const pathData = JSON.stringify({
      points: currentPath.value,
      color: currentTool.value === 'eraser' ? 'eraser' : penColor.value,
      width: currentTool.value === 'eraser' ? penWidth.value * 3 : penWidth.value
    })
    paths.value.push(pathData)
    emit('update:drawingPaths', paths.value)
  }
  currentPath.value = []
}

const clearCanvas = () => {
  paths.value = []
  emit('update:drawingPaths', [])
  const ctx = canvas.value?.getContext('2d')
  if (ctx && canvas.value) {
    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
  }
}

const redrawCanvas = () => {
  if (!canvas.value) return
  const ctx = canvas.value.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)

  paths.value.forEach(pathData => {
    const { points, color, width } = JSON.parse(pathData)

    if (color === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.strokeStyle = 'rgba(0,0,0,1)'
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = color
    }

    ctx.lineWidth = width
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
    redrawCanvas()
  })
})

watch(() => props.drawingPaths, (newPaths) => {
  if (newPaths) {
    paths.value = newPaths
    nextTick(() => redrawCanvas())
  }
}, { deep: true })

watch(() => props.cardSize, () => {
  nextTick(() => redrawCanvas())
}, { deep: true })
</script>
