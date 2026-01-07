<template>
  <div class="h-full w-full flex flex-col bg-white dark:bg-gray-900 p-4 overflow-auto">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold dark:text-white">Depth of Field Calculator</h2>
      <button
        @click="calculate"
        class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
      >
        Calculate
      </button>
    </div>

    <!-- Input Parameters -->
    <div class="space-y-3 mb-4">
      <div>
        <label class="text-gray-600 dark:text-gray-400 text-xs block mb-1">Sensor Size</label>
        <select
          v-model="localData.sensorSize"
          @change="calculate"
          class="w-full px-3 py-2 bg-transparent border border-gray-300 dark:border-gray-600 rounded outline-none dark:text-white"
        >
          <option value="full-frame">Full Frame (35mm)</option>
          <option value="aps-c">APS-C</option>
          <option value="micro-four-thirds">Micro Four Thirds</option>
          <option value="medium-format">Medium Format</option>
        </select>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="text-gray-600 dark:text-gray-400 text-xs block mb-1">
            Focal Length (mm)
          </label>
          <input
            v-model.number="localData.focalLength"
            @input="calculate"
            type="number"
            min="1"
            step="1"
            class="w-full px-3 py-2 bg-transparent border border-gray-300 dark:border-gray-600 rounded outline-none dark:text-white"
            placeholder="50"
          />
        </div>

        <div>
          <label class="text-gray-600 dark:text-gray-400 text-xs block mb-1">
            Aperture (f-stop)
          </label>
          <input
            v-model.number="localData.aperture"
            @input="calculate"
            type="number"
            min="0.95"
            step="0.1"
            class="w-full px-3 py-2 bg-transparent border border-gray-300 dark:border-gray-600 rounded outline-none dark:text-white"
            placeholder="2.8"
          />
        </div>
      </div>

      <div>
        <label class="text-gray-600 dark:text-gray-400 text-xs block mb-1">
          Subject Distance (meters)
        </label>
        <input
          v-model.number="localData.subjectDistance"
          @input="calculate"
          type="number"
          min="0.1"
          step="0.1"
          class="w-full px-3 py-2 bg-transparent border border-gray-300 dark:border-gray-600 rounded outline-none dark:text-white"
          placeholder="5"
        />
      </div>
    </div>

    <!-- Results Display -->
    <div v-if="localData.calculatedDOF" class="flex-1 space-y-3">
      <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 class="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">Results</h3>

        <div class="space-y-2 text-sm">
          <div class="flex justify-between items-center">
            <span class="text-gray-600 dark:text-gray-400">Near Focus:</span>
            <span class="font-mono font-semibold text-gray-900 dark:text-white">
              {{ formatDistance(localData.calculatedDOF.near) }}
            </span>
          </div>

          <div class="flex justify-between items-center">
            <span class="text-gray-600 dark:text-gray-400">Far Focus:</span>
            <span class="font-mono font-semibold text-gray-900 dark:text-white">
              {{ formatDistance(localData.calculatedDOF.far) }}
            </span>
          </div>

          <div class="flex justify-between items-center pt-2 border-t border-blue-200 dark:border-blue-700">
            <span class="text-gray-600 dark:text-gray-400 font-semibold">Total DOF:</span>
            <span class="font-mono font-bold text-blue-600 dark:text-blue-400">
              {{ formatDistance(localData.calculatedDOF.total) }}
            </span>
          </div>

          <div class="flex justify-between items-center">
            <span class="text-gray-600 dark:text-gray-400">Hyperfocal:</span>
            <span class="font-mono font-semibold text-gray-900 dark:text-white">
              {{ formatDistance(localData.calculatedDOF.hyperFocal) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Visual Representation -->
      <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Visual Guide</h3>

        <div class="relative h-24 flex items-center">
          <!-- Out of focus area (before) -->
          <div class="absolute left-0 h-full w-1/4 bg-red-100 dark:bg-red-900/30 opacity-50 rounded-l"></div>

          <!-- In focus area (DOF) -->
          <div
            class="absolute h-full bg-green-200 dark:bg-green-900/40"
            :style="{
              left: '25%',
              width: dofVisualWidth
            }"
          ></div>

          <!-- Out of focus area (after) -->
          <div class="absolute right-0 h-full w-1/4 bg-red-100 dark:bg-red-900/30 opacity-50 rounded-r"></div>

          <!-- Subject marker -->
          <div
            class="absolute w-1 h-full bg-blue-500 dark:bg-blue-400"
            :style="{ left: '50%' }"
          >
            <div class="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
              Subject
            </div>
          </div>
        </div>

        <div class="mt-2 flex justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>Out of focus</span>
          <span>Sharp Focus Zone</span>
          <span>Out of focus</span>
        </div>
      </div>

      <!-- Information Box -->
      <div class="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
        <p class="text-xs text-amber-900 dark:text-amber-300">
          <strong>Tip:</strong> Use a smaller aperture (higher f-number) for greater depth of field,
          or a larger aperture (lower f-number) for shallower depth of field with more background blur.
        </p>
      </div>
    </div>

    <!-- Initial State -->
    <div v-else class="flex-1 flex items-center justify-center">
      <div class="text-center text-gray-400 dark:text-gray-600">
        <svg class="w-16 h-16 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p class="text-sm">Enter values and click Calculate</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useCanvasStore } from '~/stores/canvas'
import { calculateDepthOfField } from '~/utils/photographyHelpers'
import type { NoteCard, DepthOfFieldData } from '~/types'

const props = defineProps<{
  card: NoteCard
}>()

const canvasStore = useCanvasStore()

const localData = ref<DepthOfFieldData>(
  props.card.depthOfFieldData || {
    focalLength: 50,
    aperture: 2.8,
    subjectDistance: 5,
    sensorSize: 'full-frame',
    calculatedDOF: null
  }
)

const calculate = () => {
  if (
    localData.value.focalLength > 0 &&
    localData.value.aperture > 0 &&
    localData.value.subjectDistance > 0
  ) {
    const result = calculateDepthOfField(
      localData.value.focalLength,
      localData.value.aperture,
      localData.value.subjectDistance,
      localData.value.sensorSize
    )

    localData.value.calculatedDOF = result
    updateData()
  }
}

const formatDistance = (meters: number): string => {
  if (!isFinite(meters)) {
    return 'Infinity'
  }
  if (meters < 1) {
    return `${(meters * 100).toFixed(1)} cm`
  }
  return `${meters.toFixed(2)} m`
}

// Calculate visual width for DOF representation
const dofVisualWidth = computed(() => {
  if (!localData.value.calculatedDOF) return '50%'

  const { near, far, total } = localData.value.calculatedDOF
  const subject = localData.value.subjectDistance

  if (!isFinite(far) || !isFinite(total)) {
    return '50%'
  }

  // Calculate proportional width (capped at 50% of total width)
  const range = far - near
  const totalRange = subject * 2
  const width = Math.min((range / totalRange) * 50, 50)

  return `${width}%`
})

const updateData = () => {
  canvasStore.updateCard(props.card.id, {
    depthOfFieldData: localData.value
  })
}

watch(
  () => props.card.depthOfFieldData,
  (newData) => {
    if (newData) {
      localData.value = newData
    }
  },
  { deep: true }
)

// Calculate on mount if data exists
if (localData.value.focalLength && localData.value.aperture && localData.value.subjectDistance) {
  calculate()
}
</script>
