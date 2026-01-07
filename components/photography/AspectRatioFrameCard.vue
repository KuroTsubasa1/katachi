<template>
  <div class="h-full w-full flex flex-col bg-white dark:bg-gray-900 p-4 overflow-auto">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold dark:text-white">Aspect Ratio Crop Preview</h2>
      <input
        type="file"
        ref="fileInput"
        accept="image/*"
        @change="handleImageUpload"
        class="hidden"
      />
      <button
        @click="triggerFileUpload"
        class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
      >
        {{ localData.imageUrl ? 'Change' : 'Upload' }} Image
      </button>
    </div>

    <!-- Aspect Ratio Selector -->
    <div class="mb-4">
      <label class="text-gray-600 dark:text-gray-400 text-xs block mb-2">Aspect Ratio</label>
      <div class="grid grid-cols-4 gap-2">
        <button
          v-for="ratio in aspectRatios"
          :key="ratio.value"
          @click="selectAspectRatio(ratio.value)"
          class="px-2 py-2 text-xs rounded border transition-colors"
          :class="
            localData.aspectRatio === ratio.value
              ? 'bg-blue-500 text-white border-blue-600'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'
          "
        >
          <div class="font-semibold">{{ ratio.label }}</div>
          <div class="text-xs opacity-75">{{ ratio.description }}</div>
        </button>
      </div>

      <!-- Custom Aspect Ratio -->
      <div v-if="localData.aspectRatio === 'custom'" class="mt-3 grid grid-cols-2 gap-2">
        <div>
          <label class="text-gray-600 dark:text-gray-400 text-xs block mb-1">Width</label>
          <input
            v-model.number="localData.customRatio.width"
            @input="updateData"
            type="number"
            min="1"
            class="w-full px-2 py-1 bg-transparent border border-gray-300 dark:border-gray-600 rounded outline-none dark:text-white text-sm"
          />
        </div>
        <div>
          <label class="text-gray-600 dark:text-gray-400 text-xs block mb-1">Height</label>
          <input
            v-model.number="localData.customRatio.height"
            @input="updateData"
            type="number"
            min="1"
            class="w-full px-2 py-1 bg-transparent border border-gray-300 dark:border-gray-600 rounded outline-none dark:text-white text-sm"
          />
        </div>
      </div>
    </div>

    <!-- Overlay Controls -->
    <div class="mb-4 space-y-2">
      <div>
        <label class="text-gray-600 dark:text-gray-400 text-xs block mb-1">
          Overlay Opacity: {{ Math.round(localData.overlayOpacity * 100) }}%
        </label>
        <input
          v-model.number="localData.overlayOpacity"
          @input="updateData"
          type="range"
          min="0"
          max="1"
          step="0.1"
          class="w-full"
        />
      </div>

      <div>
        <label class="text-gray-600 dark:text-gray-400 text-xs block mb-1">Overlay Color</label>
        <div class="flex gap-2">
          <button
            v-for="color in overlayColors"
            :key="color.value"
            @click="selectOverlayColor(color.value)"
            class="w-8 h-8 rounded border-2 transition-transform hover:scale-110"
            :class="localData.overlayColor === color.value ? 'border-blue-500 scale-110' : 'border-gray-300 dark:border-gray-600'"
            :style="{ backgroundColor: color.value }"
            :title="color.label"
          ></button>
        </div>
      </div>
    </div>

    <!-- Image Preview with Crop Overlay -->
    <div class="flex-1 min-h-0 mb-4">
      <div
        v-if="localData.imageUrl"
        class="relative h-full bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden"
        @mousedown="startDragging"
        @mousemove="drag"
        @mouseup="stopDragging"
        @mouseleave="stopDragging"
      >
        <!-- Image -->
        <img
          ref="imageRef"
          :src="localData.imageUrl"
          alt="Preview"
          class="absolute inset-0 w-full h-full object-contain select-none"
          draggable="false"
        />

        <!-- Crop Overlay -->
        <svg class="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <mask id="cropMask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                :x="cropFrame.x"
                :y="cropFrame.y"
                :width="cropFrame.width"
                :height="cropFrame.height"
                fill="black"
              />
            </mask>
          </defs>

          <!-- Dark overlay outside crop -->
          <rect
            width="100%"
            height="100%"
            :fill="localData.overlayColor"
            :opacity="localData.overlayOpacity"
            mask="url(#cropMask)"
          />

          <!-- Crop frame border -->
          <rect
            :x="cropFrame.x"
            :y="cropFrame.y"
            :width="cropFrame.width"
            :height="cropFrame.height"
            fill="none"
            stroke="white"
            stroke-width="2"
            stroke-dasharray="10,5"
          >
            <animate attributeName="stroke-dashoffset" from="0" to="15" dur="1s" repeatCount="indefinite" />
          </rect>

          <!-- Corner handles -->
          <circle
            v-for="corner in ['tl', 'tr', 'bl', 'br']"
            :key="corner"
            :cx="getCornerPosition(corner).x"
            :cy="getCornerPosition(corner).y"
            r="6"
            fill="white"
            stroke="blue"
            stroke-width="2"
            class="pointer-events-auto cursor-move"
          />

          <!-- Grid lines (rule of thirds) -->
          <g v-if="showGrid" opacity="0.5">
            <!-- Vertical lines -->
            <line
              :x1="cropFrame.x + cropFrame.width / 3"
              :y1="cropFrame.y"
              :x2="cropFrame.x + cropFrame.width / 3"
              :y2="cropFrame.y + cropFrame.height"
              stroke="white"
              stroke-width="1"
            />
            <line
              :x1="cropFrame.x + (cropFrame.width * 2) / 3"
              :y1="cropFrame.y"
              :x2="cropFrame.x + (cropFrame.width * 2) / 3"
              :y2="cropFrame.y + cropFrame.height"
              stroke="white"
              stroke-width="1"
            />
            <!-- Horizontal lines -->
            <line
              :x1="cropFrame.x"
              :y1="cropFrame.y + cropFrame.height / 3"
              :x2="cropFrame.x + cropFrame.width"
              :y2="cropFrame.y + cropFrame.height / 3"
              stroke="white"
              stroke-width="1"
            />
            <line
              :x1="cropFrame.x"
              :y1="cropFrame.y + (cropFrame.height * 2) / 3"
              :x2="cropFrame.x + cropFrame.width"
              :y2="cropFrame.y + (cropFrame.height * 2) / 3"
              stroke="white"
              stroke-width="1"
            />
          </g>
        </svg>

        <!-- Info overlay -->
        <div class="absolute top-2 left-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
          {{ currentRatioDisplay }} - {{ Math.round(cropFrame.width) }}×{{ Math.round(cropFrame.height) }}
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-else
        class="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600"
      >
        <div class="text-center text-gray-400 dark:text-gray-600">
          <svg class="w-16 h-16 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p class="text-sm">Upload an image to preview crop</p>
        </div>
      </div>
    </div>

    <!-- Toggle Grid -->
    <div class="flex items-center justify-between">
      <label class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
        <input
          v-model="showGrid"
          type="checkbox"
          class="rounded"
        />
        <span>Show rule of thirds grid</span>
      </label>

      <button
        v-if="localData.imageUrl"
        @click="resetCrop"
        class="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
      >
        Reset
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useCanvasStore } from '~/stores/canvas'
import type { NoteCard, AspectRatioFrameData } from '~/types'

const props = defineProps<{
  card: NoteCard
}>()

const canvasStore = useCanvasStore()
const fileInput = ref<HTMLInputElement | null>(null)
const imageRef = ref<HTMLImageElement | null>(null)
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const showGrid = ref(true)

const localData = ref<AspectRatioFrameData>(
  props.card.aspectRatioFrameData || {
    imageUrl: '',
    aspectRatio: '16:9',
    customRatio: { width: 16, height: 9 },
    cropPosition: { x: 0, y: 0 },
    overlayColor: '#000000',
    overlayOpacity: 0.7
  }
)

const aspectRatios = [
  { value: '1:1', label: '1:1', description: 'Square' },
  { value: '4:3', label: '4:3', description: 'Standard' },
  { value: '16:9', label: '16:9', description: 'Widescreen' },
  { value: '2.35:1', label: '2.35:1', description: 'Cinematic' },
  { value: '4:5', label: '4:5', description: 'Portrait' },
  { value: '9:16', label: '9:16', description: 'Vertical' },
  { value: 'custom', label: 'Custom', description: 'Custom' }
]

const overlayColors = [
  { value: '#000000', label: 'Black' },
  { value: '#FFFFFF', label: 'White' },
  { value: '#FF0000', label: 'Red' },
  { value: '#00FF00', label: 'Green' },
  { value: '#0000FF', label: 'Blue' }
]

const cropFrame = ref({
  x: 100,
  y: 100,
  width: 400,
  height: 225
})

const currentRatioDisplay = computed(() => {
  if (localData.value.aspectRatio === 'custom') {
    return `${localData.value.customRatio.width}:${localData.value.customRatio.height}`
  }
  return localData.value.aspectRatio
})

const triggerFileUpload = () => {
  fileInput.value?.click()
}

const handleImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      localData.value.imageUrl = e.target?.result as string
      updateData()

      // Wait for image to load and recalculate crop frame
      nextTick(() => {
        setTimeout(() => calculateCropFrame(), 100)
      })
    }
    reader.readAsDataURL(file)
  }
}

const selectAspectRatio = (ratio: string) => {
  localData.value.aspectRatio = ratio as any
  calculateCropFrame()
  updateData()
}

const selectOverlayColor = (color: string) => {
  localData.value.overlayColor = color
  updateData()
}

const calculateCropFrame = () => {
  if (!imageRef.value) return

  const imgRect = imageRef.value.getBoundingClientRect()
  const containerWidth = imgRect.width
  const containerHeight = imgRect.height

  // Get aspect ratio
  let ratioWidth = 16
  let ratioHeight = 9

  if (localData.value.aspectRatio === 'custom') {
    ratioWidth = localData.value.customRatio.width
    ratioHeight = localData.value.customRatio.height
  } else {
    const parts = localData.value.aspectRatio.split(':')
    if (parts.length === 2) {
      ratioWidth = parseFloat(parts[0])
      ratioHeight = parseFloat(parts[1])
    } else if (localData.value.aspectRatio === '2.35:1') {
      ratioWidth = 2.35
      ratioHeight = 1
    }
  }

  // Calculate crop dimensions maintaining aspect ratio
  let width = containerWidth * 0.8
  let height = width * (ratioHeight / ratioWidth)

  // If height exceeds container, recalculate based on height
  if (height > containerHeight * 0.8) {
    height = containerHeight * 0.8
    width = height * (ratioWidth / ratioHeight)
  }

  // Center the crop frame
  cropFrame.value = {
    x: (containerWidth - width) / 2,
    y: (containerHeight - height) / 2,
    width,
    height
  }
}

const getCornerPosition = (corner: string) => {
  const { x, y, width, height } = cropFrame.value

  switch (corner) {
    case 'tl':
      return { x, y }
    case 'tr':
      return { x: x + width, y }
    case 'bl':
      return { x, y: y + height }
    case 'br':
      return { x: x + width, y: y + height }
    default:
      return { x, y }
  }
}

const startDragging = (event: MouseEvent) => {
  isDragging.value = true
  dragStart.value = {
    x: event.clientX - cropFrame.value.x,
    y: event.clientY - cropFrame.value.y
  }
}

const drag = (event: MouseEvent) => {
  if (!isDragging.value || !imageRef.value) return

  const imgRect = imageRef.value.getBoundingClientRect()

  let newX = event.clientX - dragStart.value.x
  let newY = event.clientY - dragStart.value.y

  // Constrain to image bounds
  newX = Math.max(0, Math.min(newX, imgRect.width - cropFrame.value.width))
  newY = Math.max(0, Math.min(newY, imgRect.height - cropFrame.value.height))

  cropFrame.value.x = newX
  cropFrame.value.y = newY

  localData.value.cropPosition = { x: newX, y: newY }
}

const stopDragging = () => {
  if (isDragging.value) {
    isDragging.value = false
    updateData()
  }
}

const resetCrop = () => {
  calculateCropFrame()
  updateData()
}

const updateData = () => {
  canvasStore.updateCard(props.card.id, {
    aspectRatioFrameData: localData.value
  })
}

watch(
  () => props.card.aspectRatioFrameData,
  (newData) => {
    if (newData) {
      localData.value = newData
    }
  },
  { deep: true }
)

watch(
  () => localData.value.customRatio,
  () => {
    if (localData.value.aspectRatio === 'custom') {
      calculateCropFrame()
    }
  },
  { deep: true }
)

onMounted(() => {
  if (localData.value.imageUrl) {
    nextTick(() => {
      setTimeout(() => calculateCropFrame(), 100)
    })
  }
})
</script>
