<template>
  <div class="h-full w-full p-4 flex flex-col gap-3 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
    <div v-if="isSelected" class="flex gap-2">
      <input
        v-model="localAudioUrl"
        @input="updateAudioUrl"
        type="url"
        placeholder="https://example.com/audio.mp3"
        class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800"
      />
    </div>

    <div v-if="!localAudioUrl && isSelected" class="text-gray-400 dark:text-gray-500 text-sm text-center py-8">
      Enter an audio URL above
    </div>

    <div v-else-if="localAudioUrl" class="flex-1 flex flex-col items-center justify-center gap-4">
      <div class="text-center">
        <svg class="w-16 h-16 mx-auto text-purple-500 dark:text-purple-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
        <div class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Audio Player</div>
        <div class="text-xs text-gray-500 dark:text-gray-400 truncate max-w-full px-4">{{ displayUrl }}</div>
      </div>

      <audio
        ref="audioElement"
        :src="localAudioUrl"
        controls
        class="w-full max-w-sm"
        @error="handleError"
      ></audio>

      <div v-if="errorMessage" class="text-xs text-red-500 dark:text-red-400">
        {{ errorMessage }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  audioUrl?: string
  isSelected: boolean
}>()

const emit = defineEmits<{
  'update:audioUrl': [url: string]
}>()

const localAudioUrl = ref(props.audioUrl || '')
const audioElement = ref<HTMLAudioElement | null>(null)
const errorMessage = ref('')

const displayUrl = computed(() => {
  try {
    const url = new URL(localAudioUrl.value)
    return url.hostname + url.pathname
  } catch {
    return localAudioUrl.value
  }
})

const updateAudioUrl = () => {
  errorMessage.value = ''
  emit('update:audioUrl', localAudioUrl.value)
}

const handleError = () => {
  errorMessage.value = 'Failed to load audio file'
}

watch(() => props.audioUrl, (newUrl) => {
  if (newUrl) {
    localAudioUrl.value = newUrl
  }
})
</script>
