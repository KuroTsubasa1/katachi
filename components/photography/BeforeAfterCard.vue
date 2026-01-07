<template>
  <div class="h-full w-full flex flex-col bg-white dark:bg-gray-900 p-4 overflow-auto">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold dark:text-white">Before/After Comparison</h2>
      <div class="flex gap-2">
        <label
          class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 cursor-pointer"
        >
          Before
          <input
            type="file"
            accept="image/*"
            @change="handleBeforeUpload"
            class="hidden"
          />
        </label>
        <label
          class="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 cursor-pointer"
        >
          After
          <input
            type="file"
            accept="image/*"
            @change="handleAfterUpload"
            class="hidden"
          />
        </label>
      </div>
    </div>

    <div class="flex-1 overflow-auto">
      <div v-if="localData.beforeImageUrl && localData.afterImageUrl" class="space-y-4">
        <!-- Before/After Slider -->
        <div
          ref="containerRef"
          class="relative w-full aspect-video bg-gray-100 dark:bg-gray-800 rounded overflow-hidden select-none"
          @mousedown="startDrag"
          @touchstart="startDrag"
        >
          <!-- After Image (Background) -->
          <img
            :src="localData.afterImageUrl"
            alt="After"
            class="absolute inset-0 w-full h-full object-contain"
          />

          <!-- Before Image (Clipped) -->
          <div
            class="absolute inset-0 overflow-hidden"
            :style="{ width: `${localData.sliderPosition}%` }"
          >
            <img
              :src="localData.beforeImageUrl"
              alt="Before"
              class="absolute inset-0 w-full h-full object-contain"
              :style="{ width: containerWidth + 'px' }"
            />
          </div>

          <!-- Slider Handle -->
          <div
            class="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
            :style="{ left: `${localData.sliderPosition}%`, transform: 'translateX(-50%)' }"
          >
            <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
              <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
              </svg>
            </div>
          </div>

          <!-- Labels -->
          <div class="absolute top-2 left-2 px-2 py-1 bg-black bg-opacity-50 text-white text-xs rounded">
            {{ localData.labels.before }}
          </div>
          <div class="absolute top-2 right-2 px-2 py-1 bg-black bg-opacity-50 text-white text-xs rounded">
            {{ localData.labels.after }}
          </div>
        </div>

        <!-- Label Inputs -->
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-xs text-gray-600 dark:text-gray-400">Before Label</label>
            <input
              v-model="localData.labels.before"
              @blur="updateData"
              class="w-full px-2 py-1 bg-transparent border-b border-gray-300 dark:border-gray-600 outline-none dark:text-white text-sm"
              placeholder="Before"
            />
          </div>
          <div>
            <label class="text-xs text-gray-600 dark:text-gray-400">After Label</label>
            <input
              v-model="localData.labels.after"
              @blur="updateData"
              class="w-full px-2 py-1 bg-transparent border-b border-gray-300 dark:border-gray-600 outline-none dark:text-white text-sm"
              placeholder="After"
            />
          </div>
        </div>

        <!-- Slider Position Control -->
        <div class="space-y-1">
          <label class="text-xs text-gray-600 dark:text-gray-400">Slider Position: {{ Math.round(localData.sliderPosition) }}%</label>
          <input
            type="range"
            v-model.number="localData.sliderPosition"
            @input="updateData"
            min="0"
            max="100"
            class="w-full"
          />
        </div>
      </div>

      <!-- Upload Prompt -->
      <div v-else class="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-600 space-y-2">
        <div class="text-center">
          <div class="mb-2">Upload both images to compare</div>
          <div class="text-sm space-y-1">
            <div v-if="!localData.beforeImageUrl" class="text-blue-500">Need: Before image</div>
            <div v-if="!localData.afterImageUrl" class="text-green-500">Need: After image</div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="uploadError" class="mt-2 text-red-500 text-sm">
      {{ uploadError }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useCanvasStore } from '~/stores/canvas'
import { useImageUpload } from '~/composables/useImageUpload'
import type { NoteCard, BeforeAfterData } from '~/types'

const props = defineProps<{
  card: NoteCard
}>()

const canvasStore = useCanvasStore()
const { handleFileChange, uploadError } = useImageUpload()

const localData = ref<BeforeAfterData>(
  props.card.beforeAfterData || {
    beforeImageUrl: '',
    afterImageUrl: '',
    sliderPosition: 50,
    labels: { before: 'Before', after: 'After' }
  }
)

const containerRef = ref<HTMLElement>()
const containerWidth = ref(0)
const isDragging = ref(false)

const updateContainerWidth = () => {
  if (containerRef.value) {
    containerWidth.value = containerRef.value.offsetWidth
  }
}

const handleBeforeUpload = async (event: Event) => {
  const result = await handleFileChange(event, false)
  if (result && typeof result === 'string') {
    localData.value.beforeImageUrl = result
    updateData()
  }
}

const handleAfterUpload = async (event: Event) => {
  const result = await handleFileChange(event, false)
  if (result && typeof result === 'string') {
    localData.value.afterImageUrl = result
    updateData()
  }
}

const startDrag = (event: MouseEvent | TouchEvent) => {
  isDragging.value = true
  updateSliderPosition(event)
}

const onDrag = (event: MouseEvent | TouchEvent) => {
  if (isDragging.value) {
    updateSliderPosition(event)
  }
}

const stopDrag = () => {
  if (isDragging.value) {
    isDragging.value = false
    updateData()
  }
}

const updateSliderPosition = (event: MouseEvent | TouchEvent) => {
  if (!containerRef.value) return

  const rect = containerRef.value.getBoundingClientRect()
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const x = clientX - rect.left
  const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))

  localData.value.sliderPosition = percentage
}

const updateData = () => {
  canvasStore.updateCard(props.card.id, {
    beforeAfterData: localData.value
  })
}

onMounted(() => {
  updateContainerWidth()
  window.addEventListener('resize', updateContainerWidth)
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', stopDrag)
  window.addEventListener('touchmove', onDrag)
  window.addEventListener('touchend', stopDrag)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateContainerWidth)
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
  window.removeEventListener('touchmove', onDrag)
  window.removeEventListener('touchend', stopDrag)
})

watch(
  () => props.card.beforeAfterData,
  (newData) => {
    if (newData) {
      localData.value = newData
    }
  },
  { deep: true }
)

watch(
  () => [localData.value.beforeImageUrl, localData.value.afterImageUrl],
  () => {
    setTimeout(updateContainerWidth, 100)
  }
)
</script>
