<template>
  <div class="h-full w-full flex flex-col bg-white dark:bg-gray-900 p-4 overflow-auto">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold dark:text-white">Lens Field of View Simulator</h2>
      <button
        @click="addFocalLength"
        class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
      >
        + Add Focal Length
      </button>
    </div>

    <!-- Camera Settings -->
    <div class="space-y-3 mb-4">
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="text-gray-600 dark:text-gray-400 text-xs block mb-1">Sensor Size</label>
          <select
            v-model="localData.sensorSize"
            @change="updateData"
            class="w-full px-3 py-2 bg-transparent border border-gray-300 dark:border-gray-600 rounded outline-none dark:text-white"
          >
            <option value="full-frame">Full Frame</option>
            <option value="aps-c">APS-C</option>
          </select>
        </div>

        <div>
          <label class="text-gray-600 dark:text-gray-400 text-xs block mb-1">
            Current Focal Length (mm)
          </label>
          <input
            v-model.number="localData.currentFocalLength"
            @input="updateData"
            type="number"
            min="8"
            max="600"
            step="1"
            class="w-full px-3 py-2 bg-transparent border border-gray-300 dark:border-gray-600 rounded outline-none dark:text-white"
            placeholder="50"
          />
        </div>
      </div>

      <div v-if="localData.sensorSize === 'aps-c'" class="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
        APS-C crop factor: {{ localData.cropFactor }}x ({{ equivalentFocalLength }}mm equivalent on Full Frame)
      </div>
    </div>

    <!-- Focal Length Comparison List -->
    <div class="mb-4">
      <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">Compare Focal Lengths</h3>
      <div class="flex flex-wrap gap-2">
        <div
          v-for="(fl, index) in localData.focalLengths"
          :key="index"
          class="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded"
        >
          <input
            v-model.number="localData.focalLengths[index]"
            @input="updateData"
            type="number"
            min="8"
            max="600"
            class="w-16 px-1 py-0.5 bg-transparent border-b border-gray-300 dark:border-gray-600 outline-none dark:text-white text-sm"
          />
          <span class="text-xs text-gray-600 dark:text-gray-400">mm</span>
          <button
            @click="removeFocalLength(index)"
            class="ml-1 text-red-500 hover:text-red-700 text-xs"
          >
            ×
          </button>
        </div>
      </div>
    </div>

    <!-- Visual Field of View Comparison -->
    <div class="flex-1 overflow-auto">
      <div class="space-y-3">
        <!-- Current Focal Length View -->
        <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-400 dark:border-blue-600">
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm font-semibold text-blue-900 dark:text-blue-300">
              {{ localData.currentFocalLength }}mm (Current)
            </span>
            <span class="text-xs text-blue-700 dark:text-blue-400">
              {{ calculateFieldOfView(localData.currentFocalLength).horizontal }}° × {{ calculateFieldOfView(localData.currentFocalLength).vertical }}°
            </span>
          </div>

          <!-- FOV Visualization -->
          <div class="relative h-32 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
            <!-- Image placeholder -->
            <div class="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500">
              <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>

            <!-- FOV frame -->
            <div
              class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-blue-500 dark:border-blue-400"
              :style="{
                width: `${getFOVWidth(localData.currentFocalLength)}%`,
                height: `${getFOVHeight(localData.currentFocalLength)}%`
              }"
            ></div>
          </div>

          <div class="mt-2 text-xs text-blue-800 dark:text-blue-300">
            {{ getLensCategory(localData.currentFocalLength) }}
          </div>
        </div>

        <!-- Comparison Views -->
        <div
          v-for="fl in localData.focalLengths.filter(f => f !== localData.currentFocalLength)"
          :key="fl"
          class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600"
        >
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm font-semibold text-gray-900 dark:text-white">
              {{ fl }}mm
              <span v-if="fl < localData.currentFocalLength" class="text-xs text-green-600 dark:text-green-400">
                (Wider)
              </span>
              <span v-else class="text-xs text-purple-600 dark:text-purple-400">
                (Tighter)
              </span>
            </span>
            <span class="text-xs text-gray-600 dark:text-gray-400">
              {{ calculateFieldOfView(fl).horizontal }}° × {{ calculateFieldOfView(fl).vertical }}°
            </span>
          </div>

          <!-- FOV Visualization -->
          <div class="relative h-24 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
            <!-- Image placeholder -->
            <div class="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>

            <!-- FOV frame -->
            <div
              class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2"
              :class="fl < localData.currentFocalLength ? 'border-green-500 dark:border-green-400' : 'border-purple-500 dark:border-purple-400'"
              :style="{
                width: `${getFOVWidth(fl)}%`,
                height: `${getFOVHeight(fl)}%`
              }"
            ></div>

            <!-- Current focal length overlay for comparison -->
            <div
              class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-dashed border-blue-400 dark:border-blue-600 opacity-40"
              :style="{
                width: `${getFOVWidth(localData.currentFocalLength)}%`,
                height: `${getFOVHeight(localData.currentFocalLength)}%`
              }"
            ></div>
          </div>

          <div class="mt-2 text-xs text-gray-600 dark:text-gray-400">
            {{ getLensCategory(fl) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Info Section -->
    <div class="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
      <p class="text-xs text-amber-900 dark:text-amber-300">
        <strong>Tip:</strong> Wider lenses (smaller mm) capture more of the scene, while telephoto lenses (larger mm) magnify distant subjects.
        The colored rectangles show how much of the frame each focal length captures relative to each other.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useCanvasStore } from '~/stores/canvas'
import type { NoteCard, LensSimulatorData } from '~/types'

const props = defineProps<{
  card: NoteCard
}>()

const canvasStore = useCanvasStore()

const localData = ref<LensSimulatorData>(
  props.card.lensSimulatorData || {
    referenceImageUrl: '',
    currentFocalLength: 50,
    focalLengths: [24, 35, 85, 135],
    sensorSize: 'full-frame',
    cropFactor: 1.5
  }
)

const equivalentFocalLength = computed(() => {
  return Math.round(localData.value.currentFocalLength * localData.value.cropFactor)
})

// Calculate field of view angles based on sensor size and focal length
const calculateFieldOfView = (focalLength: number) => {
  // Sensor dimensions in mm
  const sensorWidth = localData.value.sensorSize === 'full-frame' ? 36 : 23.6
  const sensorHeight = localData.value.sensorSize === 'full-frame' ? 24 : 15.6

  // Calculate FOV using the formula: FOV = 2 * arctan(sensor dimension / (2 * focal length))
  const horizontalFOV = 2 * Math.atan(sensorWidth / (2 * focalLength)) * (180 / Math.PI)
  const verticalFOV = 2 * Math.atan(sensorHeight / (2 * focalLength)) * (180 / Math.PI)

  return {
    horizontal: Math.round(horizontalFOV),
    vertical: Math.round(verticalFOV)
  }
}

// Get proportional width for visualization (relative to widest lens)
const getFOVWidth = (focalLength: number): number => {
  const fov = calculateFieldOfView(focalLength).horizontal
  const maxFOV = 114 // Approximate max FOV for 24mm on full frame

  return Math.min((fov / maxFOV) * 100, 100)
}

// Get proportional height for visualization
const getFOVHeight = (focalLength: number): number => {
  const fov = calculateFieldOfView(focalLength).vertical
  const maxFOV = 84 // Approximate max vertical FOV

  return Math.min((fov / maxFOV) * 100, 100)
}

// Categorize lens by focal length
const getLensCategory = (focalLength: number): string => {
  if (focalLength < 24) return 'Ultra-wide angle'
  if (focalLength < 35) return 'Wide angle'
  if (focalLength < 70) return 'Standard / Normal'
  if (focalLength < 135) return 'Portrait / Medium telephoto'
  if (focalLength < 300) return 'Telephoto'
  return 'Super telephoto'
}

const addFocalLength = () => {
  // Add a focal length that's not already in the list
  const common = [14, 16, 18, 20, 24, 28, 35, 40, 50, 70, 85, 105, 135, 200, 300, 400, 600]
  const available = common.filter(
    fl => !localData.value.focalLengths.includes(fl) && fl !== localData.value.currentFocalLength
  )

  if (available.length > 0) {
    localData.value.focalLengths.push(available[0])
  } else {
    localData.value.focalLengths.push(100)
  }

  updateData()
}

const removeFocalLength = (index: number) => {
  localData.value.focalLengths.splice(index, 1)
  updateData()
}

const updateData = () => {
  canvasStore.updateCard(props.card.id, {
    lensSimulatorData: localData.value
  })
}

watch(
  () => props.card.lensSimulatorData,
  (newData) => {
    if (newData) {
      localData.value = newData
    }
  },
  { deep: true }
)
</script>
