<template>
  <div class="h-full w-full flex flex-col bg-white dark:bg-gray-900 p-4 overflow-auto">
    <div class="flex items-center justify-between mb-4">
      <input
        v-model="localData.title"
        @blur="updateData"
        class="text-lg font-semibold bg-transparent border-none outline-none dark:text-white flex-1"
        placeholder="LUT Reference Gallery"
      />
      <button
        @click="addLUT"
        class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
      >
        + Add LUT
      </button>
    </div>

    <div class="flex-1 overflow-auto">
      <div class="grid grid-cols-2 gap-3">
        <div
          v-for="(lut, index) in localData.luts"
          :key="lut.id"
          class="border border-gray-200 dark:border-gray-700 rounded overflow-hidden"
        >
          <!-- Preview Image -->
          <div class="relative aspect-video bg-gray-100 dark:bg-gray-800 group">
            <img
              v-if="lut.previewImageUrl"
              :src="lut.previewImageUrl"
              :alt="lut.name"
              class="w-full h-full object-cover"
            />
            <div
              v-else
              class="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600 text-sm"
            >
              No preview
            </div>
            <label
              class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <span class="text-white text-sm">Upload Preview</span>
              <input
                type="file"
                accept="image/*"
                @change="handleImageUpload($event, index)"
                class="hidden"
              />
            </label>
            <button
              @click="removeLUT(index)"
              class="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              title="Delete LUT"
            >
              ×
            </button>
          </div>

          <!-- LUT Details -->
          <div class="p-3 space-y-2">
            <input
              v-model="lut.name"
              @blur="updateData"
              class="w-full font-semibold bg-transparent border-none outline-none dark:text-white"
              placeholder="LUT Name"
            />

            <select
              v-model="lut.category"
              @change="updateData"
              class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 dark:text-white"
            >
              <option value="cinematic">Cinematic</option>
              <option value="vintage">Vintage</option>
              <option value="modern">Modern</option>
              <option value="black-white">Black & White</option>
              <option value="custom">Custom</option>
            </select>

            <!-- Color Settings -->
            <div
              v-if="lut.settings"
              class="bg-gray-50 dark:bg-gray-800 rounded p-2 space-y-2"
            >
              <div class="text-xs font-semibold text-gray-600 dark:text-gray-400">Settings</div>
              <div class="space-y-1">
                <div class="flex justify-between text-xs">
                  <span class="text-gray-600 dark:text-gray-400">Contrast:</span>
                  <span class="dark:text-white">{{ lut.settings.contrast }}</span>
                </div>
                <input
                  type="range"
                  v-model.number="lut.settings.contrast"
                  @input="updateData"
                  min="-100"
                  max="100"
                  class="w-full h-1"
                />
                <div class="flex justify-between text-xs">
                  <span class="text-gray-600 dark:text-gray-400">Saturation:</span>
                  <span class="dark:text-white">{{ lut.settings.saturation }}</span>
                </div>
                <input
                  type="range"
                  v-model.number="lut.settings.saturation"
                  @input="updateData"
                  min="-100"
                  max="100"
                  class="w-full h-1"
                />
                <div class="flex justify-between text-xs">
                  <span class="text-gray-600 dark:text-gray-400">Temperature:</span>
                  <span class="dark:text-white">{{ lut.settings.temperature }}</span>
                </div>
                <input
                  type="range"
                  v-model.number="lut.settings.temperature"
                  @input="updateData"
                  min="-100"
                  max="100"
                  class="w-full h-1"
                />
              </div>
            </div>

            <textarea
              v-model="lut.notes"
              @blur="updateData"
              class="w-full px-2 py-1 text-xs bg-transparent border border-gray-300 dark:border-gray-600 rounded outline-none dark:text-white resize-none"
              rows="2"
              placeholder="Notes about this LUT..."
            />
          </div>
        </div>
      </div>

      <div
        v-if="localData.luts.length === 0"
        class="flex items-center justify-center h-full text-gray-400 dark:text-gray-600"
      >
        Add LUTs to build your reference gallery
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
import type { NoteCard, LUTReferenceData } from '~/types'

const props = defineProps<{
  card: NoteCard
}>()

const canvasStore = useCanvasStore()
const { handleFileChange, uploadError } = useImageUpload()

const localData = ref<LUTReferenceData>(
  props.card.lutReferenceData || {
    title: 'LUT Reference Gallery',
    luts: []
  }
)

const addLUT = () => {
  localData.value.luts.push({
    id: crypto.randomUUID(),
    name: 'New LUT',
    category: 'cinematic',
    previewImageUrl: '',
    notes: '',
    settings: {
      contrast: 0,
      saturation: 0,
      temperature: 0
    }
  })
  updateData()
}

const removeLUT = (index: number) => {
  localData.value.luts.splice(index, 1)
  updateData()
}

const handleImageUpload = async (event: Event, lutIndex: number) => {
  const result = await handleFileChange(event, false)
  if (result && typeof result === 'string') {
    localData.value.luts[lutIndex].previewImageUrl = result
    updateData()
  }
}

const updateData = () => {
  canvasStore.updateCard(props.card.id, {
    lutReferenceData: localData.value
  })
}

watch(
  () => props.card.lutReferenceData,
  (newData) => {
    if (newData) {
      localData.value = newData
    }
  },
  { deep: true }
)
</script>
