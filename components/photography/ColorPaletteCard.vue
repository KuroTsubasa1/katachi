<template>
  <div class="h-full w-full flex flex-col bg-white dark:bg-gray-900 p-4 overflow-auto">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold dark:text-white">Color Palette</h2>
      <div class="flex gap-2 items-center">
        <label class="text-sm text-gray-600 dark:text-gray-400">Colors:</label>
        <select
          v-model.number="localData.paletteSize"
          @change="handlePaletteSizeChange"
          class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 dark:text-white"
        >
          <option :value="5">5</option>
          <option :value="8">8</option>
          <option :value="12">12</option>
        </select>
        <label
          class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 cursor-pointer"
        >
          Upload Image
          <input
            type="file"
            accept="image/*"
            @change="handleImageUpload"
            class="hidden"
          />
        </label>
      </div>
    </div>

    <div class="flex-1 overflow-auto">
      <div v-if="localData.imageUrl" class="space-y-4">
        <!-- Image Preview -->
        <div class="relative bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
          <img
            :src="localData.imageUrl"
            alt="Source image"
            class="w-full h-auto max-h-48 object-contain"
          />
        </div>

        <!-- Loading State -->
        <div v-if="extracting" class="text-center text-gray-600 dark:text-gray-400">
          Extracting colors...
        </div>

        <!-- Color Palette -->
        <div v-else-if="localData.colors.length > 0" class="space-y-3">
          <!-- Color Bars -->
          <div class="flex h-16 rounded overflow-hidden shadow">
            <div
              v-for="(color, index) in localData.colors"
              :key="index"
              :style="{
                backgroundColor: color.hex,
                width: `${color.percentage}%`
              }"
              class="relative group cursor-pointer transition-all hover:flex-grow"
              :title="`${color.hex} - ${color.percentage}%`"
            >
              <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black bg-opacity-50 transition-opacity">
                <span class="text-white text-xs font-medium">{{ color.percentage }}%</span>
              </div>
            </div>
          </div>

          <!-- Color Details -->
          <div class="space-y-2">
            <div
              v-for="(color, index) in localData.colors"
              :key="index"
              class="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded"
            >
              <div
                :style="{ backgroundColor: color.hex }"
                class="w-12 h-12 rounded border border-gray-300 dark:border-gray-600 flex-shrink-0"
              />
              <div class="flex-1 text-sm">
                <div class="font-medium dark:text-white">{{ color.hex }}</div>
                <div class="text-gray-600 dark:text-gray-400">{{ color.rgb }}</div>
              </div>
              <div class="text-right">
                <div class="text-lg font-semibold dark:text-white">{{ color.percentage }}%</div>
                <div class="text-xs text-gray-600 dark:text-gray-400">dominance</div>
              </div>
              <button
                @click="copyToClipboard(color.hex)"
                class="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded dark:text-white"
                title="Copy hex code"
              >
                Copy
              </button>
            </div>
          </div>
        </div>

        <!-- No Colors Extracted -->
        <div v-else class="text-center text-gray-600 dark:text-gray-400 py-4">
          Could not extract colors from this image
        </div>
      </div>

      <!-- No Image State -->
      <div v-else class="flex items-center justify-center h-full text-gray-400 dark:text-gray-600">
        Upload an image to extract color palette
      </div>
    </div>

    <div v-if="uploadError" class="mt-2 text-red-500 text-sm">
      {{ uploadError }}
    </div>

    <div v-if="copySuccess" class="mt-2 text-green-600 dark:text-green-400 text-sm">
      Color copied to clipboard!
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCanvasStore } from '~/stores/canvas'
import { useImageUpload } from '~/composables/useImageUpload'
import { extractColorsFromImage } from '~/utils/photographyHelpers'
import type { NoteCard, ColorPaletteData } from '~/types'

const props = defineProps<{
  card: NoteCard
}>()

const canvasStore = useCanvasStore()
const { handleFileChange, uploadError } = useImageUpload()

const localData = ref<ColorPaletteData>(
  props.card.colorPaletteData || {
    imageUrl: '',
    colors: [],
    paletteSize: 5,
    sortBy: 'dominance'
  }
)

const extracting = ref(false)
const copySuccess = ref(false)

const extractColors = async () => {
  if (!localData.value.imageUrl) return

  extracting.value = true
  try {
    const colors = await extractColorsFromImage(
      localData.value.imageUrl,
      localData.value.paletteSize
    )
    localData.value.colors = colors
  } catch (error) {
    console.error('Error extracting colors:', error)
    localData.value.colors = []
  } finally {
    extracting.value = false
  }
}

const handleImageUpload = async (event: Event) => {
  const result = await handleFileChange(event, false)
  if (result && typeof result === 'string') {
    localData.value.imageUrl = result
    localData.value.colors = []
    await extractColors()
    updateData()
  }
}

const handlePaletteSizeChange = async () => {
  if (localData.value.imageUrl) {
    await extractColors()
    updateData()
  }
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    copySuccess.value = true
    setTimeout(() => {
      copySuccess.value = false
    }, 2000)
  } catch (error) {
    console.error('Failed to copy:', error)
  }
}

const updateData = () => {
  canvasStore.updateCard(props.card.id, {
    colorPaletteData: localData.value
  })
}

watch(
  () => props.card.colorPaletteData,
  (newData) => {
    if (newData) {
      localData.value = newData
    }
  },
  { deep: true }
)
</script>
