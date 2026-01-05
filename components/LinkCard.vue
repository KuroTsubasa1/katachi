<template>
  <div class="h-full w-full p-4 flex flex-col gap-3">
    <div v-if="isSelected" class="flex gap-2">
      <input
        v-model="localUrl"
        @input="updateUrl"
        type="url"
        placeholder="https://example.com"
        class="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        @click="fetchMetadata"
        class="px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition"
        :disabled="loading"
      >
        {{ loading ? '...' : 'Fetch' }}
      </button>
    </div>

    <div v-if="!localUrl && isSelected" class="text-gray-400 text-sm text-center py-8">
      Enter a URL above to create a link preview
    </div>

    <a
      v-else-if="localUrl"
      :href="localUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="flex-1 flex flex-col gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 p-4 rounded transition"
    >
      <div class="flex items-start gap-2">
        <svg class="w-5 h-5 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        <div class="flex-1 min-w-0">
          <div class="text-xs font-mono text-gray-500 dark:text-gray-400 break-all mb-2">
            {{ localUrl }}
          </div>
          <div class="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span>Open link</span>
          </div>
        </div>
      </div>
    </a>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  url?: string
  isSelected: boolean
}>()

const emit = defineEmits<{
  'update:url': [url: string]
  'update:metadata': [metadata: any]
}>()

const localUrl = ref(props.url || '')
const loading = ref(false)
const metadata = ref<{
  title?: string
  description?: string
  image?: string
}>({})

const displayDomain = computed(() => {
  try {
    const url = new URL(localUrl.value)
    return url.hostname
  } catch {
    return localUrl.value
  }
})

const updateUrl = () => {
  emit('update:url', localUrl.value)
}

const fetchMetadata = async () => {
  if (!localUrl.value) return

  loading.value = true
  try {
    // Simple metadata extraction - in production, you'd use a backend service
    // For now, just use basic URL parsing and set dummy metadata
    const url = new URL(localUrl.value)
    metadata.value = {
      title: url.hostname,
      description: `Link to ${url.hostname}`,
      image: undefined
    }
    emit('update:metadata', metadata.value)
  } catch (error) {
    console.error('Invalid URL:', error)
  } finally {
    loading.value = false
  }
}

watch(() => props.url, (newUrl) => {
  if (newUrl) {
    localUrl.value = newUrl
    fetchMetadata()
  }
})
</script>
