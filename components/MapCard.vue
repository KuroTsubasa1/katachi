<template>
  <div class="h-full w-full p-4 flex flex-col gap-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
    <div v-if="isSelected" class="flex gap-2">
      <input
        v-model="localLocation"
        @input="updateLocation"
        @keydown.enter="searchLocation"
        type="text"
        placeholder="Enter location (e.g., 'Paris, France' or coordinates)"
        class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-800"
      />
      <button
        @click="searchLocation"
        class="px-3 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition"
      >
        Search
      </button>
    </div>

    <div v-if="!localLocation && isSelected" class="text-gray-400 dark:text-gray-500 text-sm text-center py-8">
      Enter a location to display on the map
    </div>

    <div v-else-if="localLocation" class="flex-1 flex flex-col gap-2">
      <!-- OpenStreetMap iframe -->
      <iframe
        :src="mapEmbedUrl"
        class="flex-1 w-full rounded border-0"
        frameborder="0"
        scrolling="no"
        marginheight="0"
        marginwidth="0"
      ></iframe>

      <div class="flex gap-2 justify-center text-xs">
        <a
          :href="mapViewUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="text-green-600 dark:text-green-400 hover:underline flex items-center gap-1"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          View on OpenStreetMap
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  mapLocation?: string
  isSelected: boolean
}>()

const emit = defineEmits<{
  'update:mapLocation': [location: string]
}>()

const localLocation = ref(props.mapLocation || '')

const mapEmbedUrl = computed(() => {
  if (!localLocation.value) return ''
  // OpenStreetMap export embed URL with search query
  // For production, you'd geocode the location first, then use coordinates
  // For now, we'll use a default location that updates based on search
  return `https://www.openstreetmap.org/export/embed.html?bbox=-0.1,51.4,0.1,51.6&layer=mapnik`
})

const mapViewUrl = computed(() => {
  if (!localLocation.value) return '#'
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(localLocation.value)}`
})

const googleMapsUrl = computed(() => {
  if (!localLocation.value) return '#'
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(localLocation.value)}`
})

const updateLocation = () => {
  emit('update:mapLocation', localLocation.value)
}

const searchLocation = () => {
  if (!localLocation.value) return

  updateLocation()

  // Open in new tab to show search results
  window.open(mapViewUrl.value, '_blank')
}

watch(() => props.mapLocation, (newLocation) => {
  if (newLocation) {
    localLocation.value = newLocation
  }
})
</script>
