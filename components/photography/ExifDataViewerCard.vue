<template>
  <div class="h-full w-full flex flex-col bg-white dark:bg-gray-900 p-4 overflow-auto">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold dark:text-white">EXIF Data Viewer</h2>
      <div class="flex gap-2">
        <button
          @click="localData.displayMode = localData.displayMode === 'compact' ? 'detailed' : 'compact'"
          @blur="updateData"
          class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-white"
        >
          {{ localData.displayMode === 'compact' ? 'Detailed' : 'Compact' }}
        </button>
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
            alt="Image with EXIF data"
            class="w-full h-auto max-h-64 object-contain"
          />
        </div>

        <!-- Loading State -->
        <div v-if="extracting" class="text-center text-gray-600 dark:text-gray-400">
          Extracting EXIF data...
        </div>

        <!-- EXIF Data Display -->
        <div v-else-if="localData.exifData" class="space-y-3">
          <!-- Compact Mode -->
          <div v-if="localData.displayMode === 'compact'" class="grid grid-cols-2 gap-3">
            <div class="p-2 bg-gray-50 dark:bg-gray-800 rounded">
              <div class="text-xs text-gray-600 dark:text-gray-400">Camera</div>
              <div class="text-sm font-medium dark:text-white">{{ localData.exifData.camera }}</div>
            </div>
            <div class="p-2 bg-gray-50 dark:bg-gray-800 rounded">
              <div class="text-xs text-gray-600 dark:text-gray-400">Lens</div>
              <div class="text-sm font-medium dark:text-white">{{ localData.exifData.lens }}</div>
            </div>
            <div class="p-2 bg-gray-50 dark:bg-gray-800 rounded">
              <div class="text-xs text-gray-600 dark:text-gray-400">Focal Length</div>
              <div class="text-sm font-medium dark:text-white">{{ localData.exifData.focalLength }}</div>
            </div>
            <div class="p-2 bg-gray-50 dark:bg-gray-800 rounded">
              <div class="text-xs text-gray-600 dark:text-gray-400">Aperture</div>
              <div class="text-sm font-medium dark:text-white">{{ localData.exifData.aperture }}</div>
            </div>
            <div class="p-2 bg-gray-50 dark:bg-gray-800 rounded">
              <div class="text-xs text-gray-600 dark:text-gray-400">Shutter Speed</div>
              <div class="text-sm font-medium dark:text-white">{{ localData.exifData.shutterSpeed }}</div>
            </div>
            <div class="p-2 bg-gray-50 dark:bg-gray-800 rounded">
              <div class="text-xs text-gray-600 dark:text-gray-400">ISO</div>
              <div class="text-sm font-medium dark:text-white">{{ localData.exifData.iso }}</div>
            </div>
          </div>

          <!-- Detailed Mode -->
          <div v-else class="space-y-2 text-sm">
            <div class="border-b border-gray-200 dark:border-gray-700 pb-2">
              <h3 class="font-semibold mb-2 dark:text-white">Equipment</h3>
              <div class="space-y-1">
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">Camera:</span>
                  <span class="font-medium dark:text-white">{{ localData.exifData.camera }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">Lens:</span>
                  <span class="font-medium dark:text-white">{{ localData.exifData.lens }}</span>
                </div>
              </div>
            </div>

            <div class="border-b border-gray-200 dark:border-gray-700 pb-2">
              <h3 class="font-semibold mb-2 dark:text-white">Exposure</h3>
              <div class="space-y-1">
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">Focal Length:</span>
                  <span class="font-medium dark:text-white">{{ localData.exifData.focalLength }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">Aperture:</span>
                  <span class="font-medium dark:text-white">{{ localData.exifData.aperture }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">Shutter Speed:</span>
                  <span class="font-medium dark:text-white">{{ localData.exifData.shutterSpeed }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">ISO:</span>
                  <span class="font-medium dark:text-white">{{ localData.exifData.iso }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">Exposure Comp:</span>
                  <span class="font-medium dark:text-white">{{ localData.exifData.exposureCompensation }}</span>
                </div>
              </div>
            </div>

            <div class="border-b border-gray-200 dark:border-gray-700 pb-2">
              <h3 class="font-semibold mb-2 dark:text-white">Settings</h3>
              <div class="space-y-1">
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">White Balance:</span>
                  <span class="font-medium dark:text-white">{{ localData.exifData.whiteBalance }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">Flash:</span>
                  <span class="font-medium dark:text-white">{{ localData.exifData.flashUsed ? 'Used' : 'Not Used' }}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 class="font-semibold mb-2 dark:text-white">Metadata</h3>
              <div class="space-y-1">
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">Date Taken:</span>
                  <span class="font-medium dark:text-white">{{ localData.exifData.dateTaken }}</span>
                </div>
                <div v-if="localData.exifData.gpsLocation" class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">GPS:</span>
                  <span class="font-medium dark:text-white">{{ localData.exifData.gpsLocation.lat }}, {{ localData.exifData.gpsLocation.lng }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- No EXIF Data -->
        <div v-else class="text-center text-gray-600 dark:text-gray-400 py-4">
          No EXIF data found in this image
        </div>
      </div>

      <!-- No Image State -->
      <div v-else class="flex items-center justify-center h-full text-gray-400 dark:text-gray-600">
        Upload an image to view EXIF data
      </div>
    </div>

    <div v-if="uploadError" class="mt-2 text-red-500 text-sm">
      {{ uploadError }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCanvasStore } from '~/stores/canvas'
import { useImageUpload } from '~/composables/useImageUpload'
import { extractExifData } from '~/utils/photographyHelpers'
import type { NoteCard, ExifDataViewerData } from '~/types'

const props = defineProps<{
  card: NoteCard
}>()

const canvasStore = useCanvasStore()
const { handleFileChange, uploadError } = useImageUpload()

const localData = ref<ExifDataViewerData>(
  props.card.exifDataViewerData || {
    imageUrl: '',
    exifData: null,
    displayMode: 'compact'
  }
)

const extracting = ref(false)

const handleImageUpload = async (event: Event) => {
  const result = await handleFileChange(event, false)
  if (result && typeof result === 'string') {
    localData.value.imageUrl = result
    localData.value.exifData = null

    // Extract EXIF data
    extracting.value = true
    try {
      const exif = await extractExifData(result)
      localData.value.exifData = exif
    } catch (error) {
      console.error('Error extracting EXIF data:', error)
    } finally {
      extracting.value = false
    }

    updateData()
  }
}

const updateData = () => {
  canvasStore.updateCard(props.card.id, {
    exifDataViewerData: localData.value
  })
}

watch(
  () => props.card.exifDataViewerData,
  (newData) => {
    if (newData) {
      localData.value = newData
    }
  },
  { deep: true }
)
</script>
