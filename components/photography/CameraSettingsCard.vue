<template>
  <div class="h-full w-full flex flex-col bg-white dark:bg-gray-900 p-4 overflow-auto">
    <div class="flex items-center justify-between mb-4">
      <input
        v-model="localData.title"
        @blur="updateData"
        class="text-lg font-semibold bg-transparent border-none outline-none dark:text-white flex-1"
        placeholder="Camera Settings"
      />
      <button
        @click="addPreset"
        class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
      >
        + Add Preset
      </button>
    </div>

    <div class="flex-1 overflow-auto space-y-3">
      <div
        v-for="(preset, index) in localData.presets"
        :key="preset.id"
        class="p-3 border border-gray-200 dark:border-gray-700 rounded"
      >
        <div class="flex items-center justify-between mb-2">
          <input
            v-model="preset.name"
            @blur="updateData"
            class="font-medium bg-transparent border-none outline-none dark:text-white"
            placeholder="Preset name"
          />
          <button
            @click="removePreset(index)"
            class="text-red-500 hover:text-red-700 text-sm"
          >
            Delete
          </button>
        </div>

        <div class="grid grid-cols-2 gap-2 text-sm">
          <div>
            <label class="text-gray-600 dark:text-gray-400 text-xs">Camera</label>
            <input
              v-model="preset.camera"
              @blur="updateData"
              class="w-full px-2 py-1 bg-transparent border-b border-gray-300 dark:border-gray-600 outline-none dark:text-white"
              placeholder="Canon R5"
            />
          </div>
          <div>
            <label class="text-gray-600 dark:text-gray-400 text-xs">ISO</label>
            <input
              v-model="preset.iso"
              @blur="updateData"
              class="w-full px-2 py-1 bg-transparent border-b border-gray-300 dark:border-gray-600 outline-none dark:text-white"
              placeholder="800"
            />
          </div>
          <div>
            <label class="text-gray-600 dark:text-gray-400 text-xs">Aperture</label>
            <input
              v-model="preset.aperture"
              @blur="updateData"
              class="w-full px-2 py-1 bg-transparent border-b border-gray-300 dark:border-gray-600 outline-none dark:text-white"
              placeholder="f/2.8"
            />
          </div>
          <div>
            <label class="text-gray-600 dark:text-gray-400 text-xs">Shutter Speed</label>
            <input
              v-model="preset.shutterSpeed"
              @blur="updateData"
              class="w-full px-2 py-1 bg-transparent border-b border-gray-300 dark:border-gray-600 outline-none dark:text-white"
              placeholder="1/125"
            />
          </div>
          <div>
            <label class="text-gray-600 dark:text-gray-400 text-xs">White Balance</label>
            <input
              v-model="preset.whiteBalance"
              @blur="updateData"
              class="w-full px-2 py-1 bg-transparent border-b border-gray-300 dark:border-gray-600 outline-none dark:text-white"
              placeholder="5600K"
            />
          </div>
          <div class="col-span-2">
            <label class="text-gray-600 dark:text-gray-400 text-xs">Notes</label>
            <input
              v-model="preset.notes"
              @blur="updateData"
              class="w-full px-2 py-1 bg-transparent border-b border-gray-300 dark:border-gray-600 outline-none dark:text-white"
              placeholder="For outdoor scenes"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCanvasStore } from '~/stores/canvas'
import type { NoteCard, CameraSettingsData } from '~/types'

const props = defineProps<{
  card: NoteCard
}>()

const canvasStore = useCanvasStore()

const localData = ref<CameraSettingsData>(
  props.card.cameraSettingsData || {
    title: 'Camera Settings',
    presets: []
  }
)

const addPreset = () => {
  localData.value.presets.push({
    id: crypto.randomUUID(),
    name: 'New Preset',
    camera: '',
    iso: '',
    aperture: '',
    shutterSpeed: '',
    whiteBalance: '',
    notes: ''
  })
  updateData()
}

const removePreset = (index: number) => {
  localData.value.presets.splice(index, 1)
  updateData()
}

const updateData = () => {
  canvasStore.updateCard(props.card.id, {
    cameraSettingsData: localData.value
  })
}

watch(
  () => props.card.cameraSettingsData,
  (newData) => {
    if (newData) {
      localData.value = newData
    }
  },
  { deep: true }
)
</script>
