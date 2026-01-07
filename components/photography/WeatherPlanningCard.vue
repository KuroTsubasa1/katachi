<template>
  <div class="h-full w-full flex flex-col bg-white dark:bg-gray-900 p-4 overflow-auto">
    <div class="mb-4">
      <h2 class="text-lg font-semibold dark:text-white mb-2">Weather Planning</h2>

      <div class="space-y-3">
        <div>
          <label class="text-xs text-gray-500 dark:text-gray-400">Location</label>
          <input
            v-model="localData.location"
            @blur="updateData"
            class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            placeholder="City or coordinates"
          />
        </div>

        <div>
          <label class="text-xs text-gray-500 dark:text-gray-400">Date</label>
          <input
            type="date"
            v-model="localData.date"
            @change="calculateTimes"
            class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-gray-500 dark:text-gray-400">Latitude</label>
            <input
              type="number"
              v-model.number="latitude"
              @blur="calculateTimes"
              step="0.0001"
              class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              placeholder="40.7128"
            />
          </div>
          <div>
            <label class="text-xs text-gray-500 dark:text-gray-400">Longitude</label>
            <input
              type="number"
              v-model.number="longitude"
              @blur="calculateTimes"
              step="0.0001"
              class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              placeholder="-74.0060"
            />
          </div>
        </div>

        <button
          @click="calculateTimes"
          class="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Calculate Golden Hour
        </button>
      </div>
    </div>

    <div v-if="hasCalculatedTimes" class="space-y-3 mb-4">
      <div class="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded">
        <h3 class="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Sun Times</h3>
        <div class="space-y-1 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Sunrise:</span>
            <span class="font-medium dark:text-white">{{ localData.sunrise }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Sunset:</span>
            <span class="font-medium dark:text-white">{{ localData.sunset }}</span>
          </div>
        </div>
      </div>

      <div class="bg-orange-50 dark:bg-orange-900/20 p-3 rounded">
        <h3 class="text-sm font-semibold text-orange-800 dark:text-orange-200 mb-2">Golden Hour - Morning</h3>
        <div class="space-y-1 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Start:</span>
            <span class="font-medium dark:text-white">{{ localData.goldenHourMorning.start }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">End:</span>
            <span class="font-medium dark:text-white">{{ localData.goldenHourMorning.end }}</span>
          </div>
        </div>
      </div>

      <div class="bg-orange-50 dark:bg-orange-900/20 p-3 rounded">
        <h3 class="text-sm font-semibold text-orange-800 dark:text-orange-200 mb-2">Golden Hour - Evening</h3>
        <div class="space-y-1 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Start:</span>
            <span class="font-medium dark:text-white">{{ localData.goldenHourEvening.start }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">End:</span>
            <span class="font-medium dark:text-white">{{ localData.goldenHourEvening.end }}</span>
          </div>
        </div>
      </div>

      <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
        <h3 class="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">Blue Hour</h3>
        <div class="space-y-1 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Start:</span>
            <span class="font-medium dark:text-white">{{ localData.blueHour.start }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">End:</span>
            <span class="font-medium dark:text-white">{{ localData.blueHour.end }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="space-y-3">
      <div>
        <label class="text-xs text-gray-500 dark:text-gray-400">Weather Conditions</label>
        <textarea
          v-model="localData.weather"
          @blur="updateData"
          class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          rows="2"
          placeholder="Forecast, temperature, wind, etc."
        />
      </div>

      <div>
        <label class="text-xs text-gray-500 dark:text-gray-400">Backup Plan</label>
        <textarea
          v-model="localData.backupPlan"
          @blur="updateData"
          class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          rows="3"
          placeholder="Alternative location, indoor setup, reschedule plan..."
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useCanvasStore } from '~/stores/canvas'
import { calculateGoldenHour } from '~/utils/photographyHelpers'
import type { NoteCard, WeatherPlanningData } from '~/types'

const props = defineProps<{
  card: NoteCard
}>()

const canvasStore = useCanvasStore()

const localData = ref<WeatherPlanningData>(
  props.card.weatherPlanningData || {
    location: '',
    date: '',
    sunrise: '',
    sunset: '',
    goldenHourMorning: { start: '', end: '' },
    goldenHourEvening: { start: '', end: '' },
    blueHour: { start: '', end: '' },
    weather: '',
    backupPlan: ''
  }
)

const latitude = ref<number>(40.7128)
const longitude = ref<number>(-74.0060)

const hasCalculatedTimes = computed(() => {
  return localData.value.sunrise !== '' && localData.value.sunset !== ''
})

const calculateTimes = () => {
  if (!localData.value.date || !latitude.value || !longitude.value) {
    return
  }

  const date = new Date(localData.value.date)
  const times = calculateGoldenHour(latitude.value, longitude.value, date)

  localData.value.sunrise = times.sunrise
  localData.value.sunset = times.sunset
  localData.value.goldenHourMorning = times.goldenHourMorning
  localData.value.goldenHourEvening = times.goldenHourEvening
  localData.value.blueHour = times.blueHour

  updateData()
}

const updateData = () => {
  canvasStore.updateCard(props.card.id, {
    weatherPlanningData: localData.value
  })
}

watch(
  () => props.card.weatherPlanningData,
  (newData) => {
    if (newData) {
      localData.value = newData
    }
  },
  { deep: true }
)
</script>
