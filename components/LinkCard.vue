<template>
  <div class="h-full w-full p-4 flex flex-col gap-3">
    <div v-if="isSelected" class="flex gap-2 mb-3">
      <input
        v-model="localUrl"
        @input="updateUrl"
        @keydown.enter="fetchMetadata"
        type="url"
        placeholder="https://example.com"
        class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        @click="fetchMetadata"
        class="px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition disabled:opacity-50"
        :disabled="loading || !localUrl"
      >
        {{ loading ? '...' : 'Preview' }}
      </button>
    </div>

    <div v-if="!localUrl && isSelected" class="text-gray-400 dark:text-gray-500 text-sm text-center py-8">
      Enter a URL above and click Preview to fetch link metadata
    </div>

    <a
      v-else-if="localUrl"
      :href="localUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="flex-1 flex flex-col hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded transition overflow-hidden"
    >
      <!-- Preview image -->
      <div v-if="metadata.image" class="w-full h-32 bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <img
          :src="metadata.image"
          :alt="metadata.title"
          class="w-full h-full object-cover"
          @error="metadata.image = ''"
        />
      </div>

      <!-- Content -->
      <div class="p-4 flex-1 flex flex-col gap-2">
        <h3 class="font-semibold text-gray-800 dark:text-gray-200 line-clamp-2">
          {{ metadata.title || 'Link Preview' }}
        </h3>

        <p v-if="metadata.description" class="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
          {{ metadata.description }}
        </p>

        <div class="mt-auto pt-2 flex items-center justify-between border-t border-gray-200 dark:border-gray-600">
          <div class="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            <span class="truncate">{{ metadata.siteName || displayDomain }}</span>
          </div>
          <svg class="w-4 h-4 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
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
  siteName?: string
}>({})

const displayDomain = computed(() => {
  try {
    const url = new URL(localUrl.value)
    return url.hostname
  } catch {
    return localUrl.value
  }
})

// Auto-fetch metadata when URL is loaded
watch(() => props.url, (newUrl) => {
  if (newUrl && newUrl !== localUrl.value) {
    localUrl.value = newUrl
    if (newUrl.startsWith('http')) {
      fetchMetadata()
    }
  }
}, { immediate: true })

const updateUrl = () => {
  emit('update:url', localUrl.value)
}

const fetchMetadata = async () => {
  if (!localUrl.value) return

  loading.value = true
  try {
    // Validate URL
    new URL(localUrl.value)

    // Fetch metadata from our API
    const response = await fetch(`/api/link-preview?url=${encodeURIComponent(localUrl.value)}`)
    const data = await response.json()

    metadata.value = {
      title: data.title || localUrl.value,
      description: data.description || '',
      image: data.image || '',
      siteName: data.siteName || displayDomain.value
    }

    emit('update:metadata', metadata.value)
  } catch (error) {
    console.error('Failed to fetch metadata:', error)
    // Fallback to basic URL info
    try {
      const url = new URL(localUrl.value)
      metadata.value = {
        title: url.hostname,
        description: url.pathname,
        image: '',
        siteName: url.hostname
      }
    } catch {
      metadata.value = {
        title: localUrl.value,
        description: 'Invalid URL',
        image: ''
      }
    }
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
