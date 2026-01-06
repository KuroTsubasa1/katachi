<template>
  <div class="w-full h-full bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 flex flex-col">
    <input
      v-model="localTitle"
      @blur="updateTitle"
      @keydown.enter="$event.target.blur()"
      class="text-lg font-bold mb-3 bg-transparent border-b border-gray-200 dark:border-gray-600 focus:outline-none focus:border-blue-500 dark:text-gray-100"
      placeholder="Storyboard Title"
    />

    <div class="flex-1 overflow-y-auto">
      <div class="grid grid-cols-3 gap-3">
        <div
          v-for="(frame, index) in localFrames"
          :key="frame.id"
          class="flex flex-col gap-2"
        >
          <div class="relative aspect-video bg-gray-100 dark:bg-gray-700 rounded border-2 border-gray-300 dark:border-gray-600 overflow-hidden group">
            <img
              v-if="frame.imageUrl"
              :src="frame.imageUrl"
              class="w-full h-full object-cover"
              alt="Frame"
            />
            <div v-else class="w-full h-full flex items-center justify-center text-gray-400 text-xs">
              Frame {{ index + 1 }}
            </div>

            <label class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition cursor-pointer">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <input
                type="file"
                accept="image/*"
                class="hidden"
                @change="(e) => handleFrameImageUpload(e, index)"
              />
            </label>

            <button
              v-if="frame.imageUrl"
              @click="removeFrameImage(index)"
              class="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <input
            v-model="frame.caption"
            @blur="updateFrames"
            @keydown.enter="$event.target.blur()"
            class="text-xs font-medium bg-transparent border-b border-gray-200 dark:border-gray-600 focus:outline-none focus:border-blue-500 dark:text-gray-100"
            placeholder="Caption"
          />

          <textarea
            v-model="frame.notes"
            @blur="updateFrames"
            class="text-xs bg-transparent border border-gray-200 dark:border-gray-600 rounded px-2 py-1 focus:outline-none focus:border-blue-500 resize-none dark:text-gray-100"
            placeholder="Notes"
            rows="2"
          ></textarea>
        </div>
      </div>
    </div>

    <div class="flex gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
      <button
        @click="addFrame"
        class="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition"
      >
        + Add Frame
      </button>
      <button
        v-if="localFrames.length > 1"
        @click="removeLastFrame"
        class="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition dark:text-gray-300"
      >
        Remove Last
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { NoteCard, StoryboardFrame } from '~/types'
import { useCanvasStore } from '~/stores/canvas'

const props = defineProps<{
  card: NoteCard
}>()

const canvasStore = useCanvasStore()

const localTitle = ref(props.card.storyboardData?.title || 'New Storyboard')
const localFrames = ref<StoryboardFrame[]>(props.card.storyboardData?.frames || [])

const updateTitle = () => {
  if (localTitle.value !== props.card.storyboardData?.title) {
    canvasStore.updateCard(props.card.id, {
      storyboardData: {
        title: localTitle.value,
        frames: localFrames.value
      }
    })
  }
}

const updateFrames = () => {
  canvasStore.updateCard(props.card.id, {
    storyboardData: {
      title: localTitle.value,
      frames: localFrames.value
    }
  })
}

const handleFrameImageUpload = async (event: Event, frameIndex: number) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const imageUrl = e.target?.result as string
    localFrames.value[frameIndex].imageUrl = imageUrl
    updateFrames()
  }
  reader.readAsDataURL(file)

  input.value = ''
}

const removeFrameImage = (frameIndex: number) => {
  localFrames.value[frameIndex].imageUrl = undefined
  updateFrames()
}

const addFrame = () => {
  localFrames.value.push({
    id: crypto.randomUUID(),
    caption: `Frame ${localFrames.value.length + 1}`,
    notes: ''
  })
  updateFrames()
}

const removeLastFrame = () => {
  if (localFrames.value.length > 1) {
    localFrames.value.pop()
    updateFrames()
  }
}

// Watch for external updates
watch(() => props.card.storyboardData, (newData) => {
  if (newData) {
    localTitle.value = newData.title
    localFrames.value = newData.frames
  }
}, { deep: true })
</script>
