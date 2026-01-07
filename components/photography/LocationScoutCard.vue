<template>
  <div class="h-full w-full flex flex-col bg-white dark:bg-gray-900 p-4 overflow-auto">
    <div class="mb-4">
      <input
        v-model="localData.locationName"
        @blur="updateData"
        class="text-xl font-bold bg-transparent border-none outline-none dark:text-white w-full mb-1"
        placeholder="Location Name"
      />
      <input
        v-model="localData.address"
        @blur="updateData"
        class="text-sm text-gray-600 dark:text-gray-400 bg-transparent border-none outline-none w-full"
        placeholder="Address"
      />
    </div>

    <div class="flex-1 overflow-auto space-y-4">
      <!-- Coordinates -->
      <div class="border border-gray-200 dark:border-gray-700 rounded p-3">
        <h3 class="font-semibold text-sm mb-2 dark:text-white">GPS Coordinates</h3>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-xs text-gray-600 dark:text-gray-400">Latitude</label>
            <input
              v-model.number="coordinates.lat"
              @blur="updateCoordinates"
              type="number"
              step="0.000001"
              class="w-full px-2 py-1 bg-transparent border-b border-gray-300 dark:border-gray-600 outline-none dark:text-white text-sm"
              placeholder="40.7128"
            />
          </div>
          <div>
            <label class="text-xs text-gray-600 dark:text-gray-400">Longitude</label>
            <input
              v-model.number="coordinates.lng"
              @blur="updateCoordinates"
              type="number"
              step="0.000001"
              class="w-full px-2 py-1 bg-transparent border-b border-gray-300 dark:border-gray-600 outline-none dark:text-white text-sm"
              placeholder="-74.0060"
            />
          </div>
        </div>
        <a
          v-if="localData.coordinates"
          :href="`https://www.google.com/maps?q=${localData.coordinates.lat},${localData.coordinates.lng}`"
          target="_blank"
          class="mt-2 inline-block text-xs text-blue-500 hover:text-blue-700"
        >
          Open in Google Maps
        </a>
      </div>

      <!-- Location Images -->
      <div class="border border-gray-200 dark:border-gray-700 rounded p-3">
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-semibold text-sm dark:text-white">Location Photos</h3>
          <label
            class="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 cursor-pointer"
          >
            + Add
            <input
              type="file"
              accept="image/*"
              multiple
              @change="handleImageUpload"
              class="hidden"
            />
          </label>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div
            v-for="(image, index) in localData.images"
            :key="index"
            class="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded overflow-hidden group"
          >
            <img
              :src="image"
              alt="Location photo"
              class="w-full h-full object-cover"
            />
            <button
              @click="removeImage(index)"
              class="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
              title="Remove image"
            >
              ×
            </button>
          </div>
        </div>
        <div
          v-if="localData.images.length === 0"
          class="text-center text-gray-400 dark:text-gray-600 text-sm py-4"
        >
          No photos added
        </div>
      </div>

      <!-- Location Notes -->
      <div class="border border-gray-200 dark:border-gray-700 rounded p-3">
        <h3 class="font-semibold text-sm mb-2 dark:text-white">Notes</h3>
        <textarea
          v-model="localData.notes"
          @blur="updateData"
          class="w-full px-2 py-1 bg-transparent border border-gray-300 dark:border-gray-600 rounded outline-none dark:text-white text-sm resize-none"
          rows="4"
          placeholder="General notes about the location, lighting conditions, best times to shoot..."
        />
      </div>

      <!-- Accessibility -->
      <div class="border border-gray-200 dark:border-gray-700 rounded p-3">
        <h3 class="font-semibold text-sm mb-2 dark:text-white">Accessibility</h3>
        <textarea
          v-model="localData.accessibility"
          @blur="updateData"
          class="w-full px-2 py-1 bg-transparent border border-gray-300 dark:border-gray-600 rounded outline-none dark:text-white text-sm resize-none"
          rows="3"
          placeholder="Parking, load-in distance, stairs, wheelchair access, etc."
        />
      </div>

      <!-- Permits & Restrictions -->
      <div class="border border-gray-200 dark:border-gray-700 rounded p-3">
        <h3 class="font-semibold text-sm mb-2 dark:text-white">Permits & Restrictions</h3>
        <textarea
          v-model="localData.permits"
          @blur="updateData"
          class="w-full px-2 py-1 bg-transparent border border-gray-300 dark:border-gray-600 rounded outline-none dark:text-white text-sm resize-none"
          rows="3"
          placeholder="Required permits, shooting restrictions, noise ordinances, hours of operation..."
        />
      </div>
    </div>

    <div v-if="uploadError" class="mt-2 text-red-500 text-sm">
      {{ uploadError }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useCanvasStore } from '~/stores/canvas'
import { useImageUpload } from '~/composables/useImageUpload'
import type { NoteCard, LocationScoutData } from '~/types'

const props = defineProps<{
  card: NoteCard
}>()

const canvasStore = useCanvasStore()
const { handleFileChange, uploadError } = useImageUpload()

const localData = ref<LocationScoutData>(
  props.card.locationScoutData || {
    locationName: 'New Location',
    address: '',
    coordinates: undefined,
    images: [],
    notes: '',
    accessibility: '',
    permits: ''
  }
)

const coordinates = ref({
  lat: localData.value.coordinates?.lat || 0,
  lng: localData.value.coordinates?.lng || 0
})

const updateCoordinates = () => {
  if (coordinates.value.lat !== 0 || coordinates.value.lng !== 0) {
    localData.value.coordinates = {
      lat: coordinates.value.lat,
      lng: coordinates.value.lng
    }
  } else {
    localData.value.coordinates = undefined
  }
  updateData()
}

const handleImageUpload = async (event: Event) => {
  const results = await handleFileChange(event, true)
  if (results && Array.isArray(results)) {
    localData.value.images.push(...results)
    updateData()
  }
}

const removeImage = (index: number) => {
  localData.value.images.splice(index, 1)
  updateData()
}

const updateData = () => {
  canvasStore.updateCard(props.card.id, {
    locationScoutData: localData.value
  })
}

watch(
  () => props.card.locationScoutData,
  (newData) => {
    if (newData) {
      localData.value = newData
      if (newData.coordinates) {
        coordinates.value = {
          lat: newData.coordinates.lat,
          lng: newData.coordinates.lng
        }
      }
    }
  },
  { deep: true }
)
</script>
