<template>
  <div class="h-full w-full flex flex-col bg-white dark:bg-gray-900 p-4 overflow-auto">
    <div class="flex items-center justify-between mb-4">
      <input
        v-model="localData.title"
        @blur="updateData"
        class="text-lg font-semibold bg-transparent border-none outline-none dark:text-white flex-1"
        placeholder="Mood Board Title"
      />
      <div class="flex gap-2">
        <select
          v-model="localData.layout"
          @change="updateData"
          class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 dark:text-white"
        >
          <option value="2x2">2x2</option>
          <option value="3x3">3x3</option>
          <option value="4x4">4x4</option>
        </select>
        <label
          class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 cursor-pointer"
        >
          + Add Image
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            multiple
            @change="handleImageUpload"
            class="hidden"
          />
        </label>
      </div>
    </div>

    <div class="flex-1 overflow-auto">
      <div
        :class="{
          'grid gap-2': true,
          'grid-cols-2': localData.layout === '2x2',
          'grid-cols-3': localData.layout === '3x3',
          'grid-cols-4': localData.layout === '4x4'
        }"
      >
        <div
          v-for="(image, index) in displayImages"
          :key="index"
          class="relative aspect-square bg-gray-100 dark:bg-gray-800 rounded overflow-hidden group"
        >
          <img
            v-if="image"
            :src="image"
            alt="Mood board image"
            class="w-full h-full object-cover"
          />
          <div
            v-else
            class="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600"
          >
            Empty
          </div>
          <button
            v-if="image"
            @click="removeImage(index)"
            class="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            title="Remove image"
          >
            ×
          </button>
        </div>
      </div>
    </div>

    <div v-if="uploadError" class="mt-2 text-red-500 text-sm">
      {{ uploadError }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useCanvasStore } from '~/stores/canvas'
import { useImageUpload } from '~/composables/useImageUpload'
import type { NoteCard, MoodBoardData } from '~/types'

const props = defineProps<{
  card: NoteCard
}>()

const canvasStore = useCanvasStore()
const { handleFileChange, uploadError } = useImageUpload()

const localData = ref<MoodBoardData>(
  props.card.moodBoardData || {
    title: 'Mood Board',
    images: [],
    layout: '3x3'
  }
)

const displayImages = computed(() => {
  const gridSize = parseInt(localData.value.layout.split('x')[0])
  const totalSlots = gridSize * gridSize
  const images = [...localData.value.images]

  while (images.length < totalSlots) {
    images.push('')
  }

  return images.slice(0, totalSlots)
})

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
    moodBoardData: localData.value
  })
}

watch(
  () => props.card.moodBoardData,
  (newData) => {
    if (newData) {
      localData.value = newData
    }
  },
  { deep: true }
)
</script>
