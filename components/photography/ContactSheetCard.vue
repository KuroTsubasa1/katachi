<template>
  <div class="h-full w-full flex flex-col bg-white dark:bg-gray-900 p-4 overflow-auto">
    <div class="flex items-center justify-between mb-4">
      <input
        v-model="localData.title"
        @blur="updateData"
        class="text-lg font-semibold bg-transparent border-none outline-none dark:text-white flex-1"
        placeholder="Contact Sheet"
      />
      <div class="flex gap-2 items-center">
        <label class="text-sm text-gray-600 dark:text-gray-400">Size:</label>
        <select
          v-model="localData.thumbnailSize"
          @change="updateData"
          class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 dark:text-white"
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
        <label class="text-sm text-gray-600 dark:text-gray-400">Columns:</label>
        <select
          v-model.number="localData.columns"
          @change="updateData"
          class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 dark:text-white"
        >
          <option :value="2">2</option>
          <option :value="3">3</option>
          <option :value="4">4</option>
          <option :value="5">5</option>
          <option :value="6">6</option>
        </select>
        <label class="flex items-center gap-1 text-sm cursor-pointer">
          <input
            type="checkbox"
            v-model="localData.showFilenames"
            @change="updateData"
            class="w-4 h-4"
          />
          <span class="text-gray-600 dark:text-gray-400">Names</span>
        </label>
        <label
          class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 cursor-pointer"
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
    </div>

    <div class="flex-1 overflow-auto">
      <div
        :class="{
          'grid gap-2': true,
          [`grid-cols-${localData.columns}`]: true
        }"
        :style="{ gridTemplateColumns: `repeat(${localData.columns}, 1fr)` }"
      >
        <div
          v-for="(image, index) in localData.images"
          :key="index"
          class="relative group bg-gray-100 dark:bg-gray-800 rounded overflow-hidden"
        >
          <div
            :class="{
              'aspect-square': true,
              'w-16': localData.thumbnailSize === 'small',
              'w-24': localData.thumbnailSize === 'medium',
              'w-32': localData.thumbnailSize === 'large'
            }"
            class="w-full"
          >
            <img
              :src="image"
              :alt="`Image ${index + 1}`"
              class="w-full h-full object-cover"
            />
          </div>
          <button
            @click="removeImage(index)"
            class="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
            title="Remove image"
          >
            ×
          </button>
          <div
            v-if="localData.showFilenames"
            class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate"
          >
            IMG_{{ String(index + 1).padStart(4, '0') }}
          </div>
        </div>
      </div>

      <div
        v-if="localData.images.length === 0"
        class="flex items-center justify-center h-full text-gray-400 dark:text-gray-600"
      >
        Upload images to create a contact sheet
      </div>
    </div>

    <div v-if="uploadError" class="mt-2 text-red-500 text-sm">
      {{ uploadError }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCanvasStore } from '~/stores/canvas'
import { useImageUpload } from '~/composables/useImageUpload'
import type { NoteCard, ContactSheetData } from '~/types'

const props = defineProps<{
  card: NoteCard
}>()

const canvasStore = useCanvasStore()
const { handleFileChange, uploadError } = useImageUpload()

const localData = ref<ContactSheetData>(
  props.card.contactSheetData || {
    title: 'Contact Sheet',
    images: [],
    thumbnailSize: 'medium',
    columns: 4,
    showFilenames: true
  }
)

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
    contactSheetData: localData.value
  })
}

watch(
  () => props.card.contactSheetData,
  (newData) => {
    if (newData) {
      localData.value = newData
    }
  },
  { deep: true }
)
</script>
