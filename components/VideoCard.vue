<template>
  <div class="h-full w-full p-4 flex flex-col gap-3 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
    <div v-if="isSelected" class="flex gap-2">
      <input
        v-model="localVideoUrl"
        @input="updateVideoUrl"
        type="url"
        placeholder="https://example.com/video.mp4 or YouTube URL"
        class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
      />
    </div>

    <div v-if="!localVideoUrl && isSelected" class="text-gray-400 dark:text-gray-500 text-sm text-center py-8">
      Enter a video URL above (supports YouTube, Vimeo, or direct video links)
    </div>

    <div v-else-if="localVideoUrl" class="flex-1 flex flex-col">
      <!-- YouTube/Vimeo embed -->
      <div v-if="embedUrl" class="flex-1 relative">
        <iframe
          :src="embedUrl"
          class="absolute inset-0 w-full h-full rounded"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>

      <!-- Direct video -->
      <div v-else class="flex-1 flex items-center justify-center">
        <video
          :src="localVideoUrl"
          controls
          class="max-w-full max-h-full rounded"
          @error="handleError"
        ></video>
      </div>

      <div v-if="errorMessage" class="text-xs text-red-500 dark:text-red-400 mt-2">
        {{ errorMessage }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  videoUrl?: string
  isSelected: boolean
}>()

const emit = defineEmits<{
  'update:videoUrl': [url: string]
}>()

const localVideoUrl = ref(props.videoUrl || '')
const errorMessage = ref('')

const embedUrl = computed(() => {
  if (!localVideoUrl.value) return null

  // YouTube
  const youtubeMatch = localVideoUrl.value.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`
  }

  // Vimeo
  const vimeoMatch = localVideoUrl.value.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  }

  return null
})

const updateVideoUrl = () => {
  errorMessage.value = ''
  emit('update:videoUrl', localVideoUrl.value)
}

const handleError = () => {
  errorMessage.value = 'Failed to load video file'
}

watch(() => props.videoUrl, (newUrl) => {
  if (newUrl) {
    localVideoUrl.value = newUrl
  }
})
</script>
