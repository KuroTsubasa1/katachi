<template>
  <div class="h-full w-full flex flex-col bg-white dark:bg-gray-900 p-4 overflow-auto">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold dark:text-white">Time-Lapse Calculator</h2>
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
        <label class="text-gray-600 dark:text-gray-400 text-xs block mb-1">
          Event Duration (minutes)
        </label>
        <input
          v-model.number="localData.eventDuration"
          @input="calculate"
          type="number"
          min="1"
          step="1"
          class="w-full px-3 py-2 bg-transparent border border-gray-300 dark:border-gray-600 rounded outline-none dark:text-white"
          placeholder="60"
        />
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          How long is the real-world event you're capturing?
        </p>
      </div>

      <div>
        <label class="text-gray-600 dark:text-gray-400 text-xs block mb-1">
          Desired Clip Length (seconds)
        </label>
        <input
          v-model.number="localData.clipLength"
          @input="calculate"
          type="number"
          min="1"
          step="1"
          class="w-full px-3 py-2 bg-transparent border border-gray-300 dark:border-gray-600 rounded outline-none dark:text-white"
          placeholder="10"
        />
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          How long should the final video be?
        </p>
      </div>

      <div>
        <label class="text-gray-600 dark:text-gray-400 text-xs block mb-1">
          Frame Rate (FPS)
        </label>
        <select
          v-model.number="localData.fps"
          @change="calculate"
          class="w-full px-3 py-2 bg-transparent border border-gray-300 dark:border-gray-600 rounded outline-none dark:text-white"
        >
          <option :value="24">24 FPS (Cinema)</option>
          <option :value="25">25 FPS (PAL)</option>
          <option :value="30">30 FPS (NTSC)</option>
          <option :value="60">60 FPS (High Frame Rate)</option>
        </select>
      </div>
    </div>

    <!-- Results Display -->
    <div v-if="localData.calculatedInterval !== null" class="flex-1 space-y-3">
      <div class="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 class="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3">
          Shooting Parameters
        </h3>

        <div class="space-y-3">
          <!-- Primary Result: Interval -->
          <div class="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div class="text-xs text-gray-600 dark:text-gray-400 mb-1">Shoot every</div>
            <div class="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {{ localData.calculatedInterval }}s
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Interval between shots
            </div>
          </div>

          <!-- Secondary Results -->
          <div class="grid grid-cols-2 gap-2">
            <div class="p-2 bg-white dark:bg-gray-800 rounded">
              <div class="text-xs text-gray-600 dark:text-gray-400">Total Frames</div>
              <div class="text-xl font-semibold text-gray-900 dark:text-white">
                {{ localData.calculatedFrames }}
              </div>
            </div>

            <div class="p-2 bg-white dark:bg-gray-800 rounded">
              <div class="text-xs text-gray-600 dark:text-gray-400">Est. File Size</div>
              <div class="text-xl font-semibold text-gray-900 dark:text-white">
                {{ localData.estimatedFileSize }} MB
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Timeline Visualization -->
      <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Timeline</h3>

        <div class="space-y-2">
          <!-- Real-time bar -->
          <div>
            <div class="text-xs text-gray-600 dark:text-gray-400 mb-1">Real Time</div>
            <div class="h-8 bg-gradient-to-r from-blue-200 to-blue-400 dark:from-blue-700 dark:to-blue-500 rounded relative overflow-hidden">
              <div class="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
                {{ formatDuration(localData.eventDuration * 60) }}
              </div>
              <!-- Interval markers -->
              <div
                v-for="i in Math.min(frameMarkers, 20)"
                :key="i"
                class="absolute top-0 h-full w-px bg-white/40"
                :style="{ left: `${(i / frameMarkers) * 100}%` }"
              ></div>
            </div>
          </div>

          <!-- Arrow -->
          <div class="flex items-center justify-center text-gray-400">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>

          <!-- Video time bar -->
          <div>
            <div class="text-xs text-gray-600 dark:text-gray-400 mb-1">Final Video</div>
            <div class="h-8 bg-gradient-to-r from-purple-200 to-purple-400 dark:from-purple-700 dark:to-purple-500 rounded relative flex items-center justify-center text-xs font-semibold text-white">
              {{ localData.clipLength }}s @ {{ localData.fps }} FPS
            </div>
          </div>
        </div>
      </div>

      <!-- Info Cards -->
      <div class="grid grid-cols-2 gap-2">
        <div class="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <div class="text-xs font-semibold text-amber-900 dark:text-amber-300 mb-1">
            Speed Factor
          </div>
          <div class="text-lg font-bold text-amber-700 dark:text-amber-400">
            {{ speedFactor }}x
          </div>
          <div class="text-xs text-amber-800 dark:text-amber-400 mt-1">
            faster than real-time
          </div>
        </div>

        <div class="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div class="text-xs font-semibold text-green-900 dark:text-green-300 mb-1">
            Storage
          </div>
          <div class="text-lg font-bold text-green-700 dark:text-green-400">
            {{ storagePerMinute }} MB/min
          </div>
          <div class="text-xs text-green-800 dark:text-green-400 mt-1">
            during shooting
          </div>
        </div>
      </div>

      <!-- Tips -->
      <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p class="text-xs text-blue-900 dark:text-blue-300">
          <strong>Tips:</strong>
        </p>
        <ul class="text-xs text-blue-800 dark:text-blue-400 mt-1 space-y-1 ml-4 list-disc">
          <li v-if="localData.calculatedInterval < 2">
            Very short interval - ensure your camera can keep up with continuous shooting
          </li>
          <li v-else-if="localData.calculatedInterval > 30">
            Long interval - use an intervalometer or remote trigger with timer
          </li>
          <li v-else>
            Good interval for most DSLR/mirrorless intervalometers
          </li>
          <li>Use manual mode to ensure consistent exposure</li>
          <li>Disable auto-focus to prevent hunting between frames</li>
        </ul>
      </div>
    </div>

    <!-- Initial State -->
    <div v-else class="flex-1 flex items-center justify-center">
      <div class="text-center text-gray-400 dark:text-gray-600">
        <svg class="w-16 h-16 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-sm">Enter values and click Calculate</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useCanvasStore } from '~/stores/canvas'
import { calculateTimeLapse } from '~/utils/photographyHelpers'
import type { NoteCard, TimeLapseCalculatorData } from '~/types'

const props = defineProps<{
  card: NoteCard
}>()

const canvasStore = useCanvasStore()

const localData = ref<TimeLapseCalculatorData>(
  props.card.timeLapseCalculatorData || {
    eventDuration: 60,
    clipLength: 10,
    fps: 24,
    calculatedInterval: null,
    calculatedFrames: null,
    estimatedFileSize: null
  }
)

const calculate = () => {
  if (
    localData.value.eventDuration > 0 &&
    localData.value.clipLength > 0 &&
    localData.value.fps > 0
  ) {
    const result = calculateTimeLapse(
      localData.value.eventDuration,
      localData.value.clipLength,
      localData.value.fps
    )

    localData.value.calculatedInterval = result.interval
    localData.value.calculatedFrames = result.frames
    localData.value.estimatedFileSize = result.fileSize

    updateData()
  }
}

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`
  }
  return `${secs}s`
}

const speedFactor = computed(() => {
  if (localData.value.calculatedInterval === null) return 0

  const realTimeSeconds = localData.value.eventDuration * 60
  const videoSeconds = localData.value.clipLength

  return Math.round((realTimeSeconds / videoSeconds) * 10) / 10
})

const storagePerMinute = computed(() => {
  if (
    localData.value.calculatedInterval === null ||
    localData.value.estimatedFileSize === null
  ) {
    return 0
  }

  const framesPerMinute = 60 / localData.value.calculatedInterval
  const mbPerFrame = localData.value.estimatedFileSize / (localData.value.calculatedFrames || 1)

  return Math.round(framesPerMinute * mbPerFrame * 10) / 10
})

const frameMarkers = computed(() => {
  return localData.value.calculatedFrames || 10
})

const updateData = () => {
  canvasStore.updateCard(props.card.id, {
    timeLapseCalculatorData: localData.value
  })
}

watch(
  () => props.card.timeLapseCalculatorData,
  (newData) => {
    if (newData) {
      localData.value = newData
    }
  },
  { deep: true }
)

// Calculate on mount if data exists
if (
  localData.value.eventDuration &&
  localData.value.clipLength &&
  localData.value.fps
) {
  calculate()
}
</script>
