<template>
  <div class="h-full w-full flex flex-col bg-white dark:bg-gray-900 p-4 overflow-auto">
    <div class="flex items-center justify-between mb-4">
      <input
        v-model="localData.title"
        @blur="updateData"
        class="text-lg font-semibold bg-transparent border-none outline-none dark:text-white flex-1"
        placeholder="Delivery Specifications"
      />
    </div>

    <div class="grid grid-cols-2 gap-4 mb-4">
      <div>
        <label class="text-xs text-gray-500 dark:text-gray-400">Client</label>
        <input
          v-model="localData.client"
          @blur="updateData"
          class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          placeholder="Client name"
        />
      </div>
      <div>
        <label class="text-xs text-gray-500 dark:text-gray-400">Due Date</label>
        <input
          type="date"
          v-model="localData.dueDate"
          @change="updateData"
          class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        />
      </div>
    </div>

    <div class="flex items-center justify-between mb-2">
      <h3 class="text-sm font-semibold dark:text-white">Specifications</h3>
      <button
        @click="addSpec"
        class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
      >
        + Add Spec
      </button>
    </div>

    <div class="flex-1 overflow-auto space-y-4">
      <div
        v-for="(spec, index) in localData.specs"
        :key="spec.id"
        class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        <div class="flex items-center justify-between mb-3">
          <input
            v-model="spec.platform"
            @blur="updateData"
            class="text-base font-semibold bg-transparent border-none outline-none dark:text-white flex-1"
            placeholder="Platform (e.g., YouTube, Instagram, Broadcast)"
          />
          <button
            @click="removeSpec(index)"
            class="text-red-500 hover:text-red-700"
            title="Delete spec"
          >
            ×
          </button>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-gray-500 dark:text-gray-400">Resolution</label>
            <select
              v-model="spec.resolution"
              @change="updateData"
              class="w-full px-2 py-1 text-sm border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            >
              <option value="">Select</option>
              <option value="3840x2160">4K (3840x2160)</option>
              <option value="1920x1080">Full HD (1920x1080)</option>
              <option value="1280x720">HD (1280x720)</option>
              <option value="1080x1920">Vertical HD (1080x1920)</option>
              <option value="1080x1080">Square (1080x1080)</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div>
            <label class="text-xs text-gray-500 dark:text-gray-400">Frame Rate</label>
            <select
              v-model="spec.frameRate"
              @change="updateData"
              class="w-full px-2 py-1 text-sm border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            >
              <option value="">Select</option>
              <option value="23.976">23.976 fps</option>
              <option value="24">24 fps</option>
              <option value="25">25 fps</option>
              <option value="29.97">29.97 fps</option>
              <option value="30">30 fps</option>
              <option value="50">50 fps</option>
              <option value="59.94">59.94 fps</option>
              <option value="60">60 fps</option>
            </select>
          </div>

          <div>
            <label class="text-xs text-gray-500 dark:text-gray-400">Codec</label>
            <select
              v-model="spec.codec"
              @change="updateData"
              class="w-full px-2 py-1 text-sm border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            >
              <option value="">Select</option>
              <option value="H.264">H.264</option>
              <option value="H.265/HEVC">H.265/HEVC</option>
              <option value="ProRes 422">ProRes 422</option>
              <option value="ProRes 4444">ProRes 4444</option>
              <option value="DNxHD">DNxHD</option>
              <option value="DNxHR">DNxHR</option>
            </select>
          </div>

          <div>
            <label class="text-xs text-gray-500 dark:text-gray-400">Bitrate</label>
            <input
              v-model="spec.bitrate"
              @blur="updateData"
              class="w-full px-2 py-1 text-sm border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              placeholder="e.g., 50 Mbps"
            />
          </div>

          <div>
            <label class="text-xs text-gray-500 dark:text-gray-400">Audio Codec</label>
            <select
              v-model="spec.audioCodec"
              @change="updateData"
              class="w-full px-2 py-1 text-sm border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            >
              <option value="">Select</option>
              <option value="AAC">AAC</option>
              <option value="PCM">PCM</option>
              <option value="MP3">MP3</option>
              <option value="AC3">AC3</option>
            </select>
          </div>

          <div>
            <label class="text-xs text-gray-500 dark:text-gray-400">Container Format</label>
            <select
              v-model="spec.containerFormat"
              @change="updateData"
              class="w-full px-2 py-1 text-sm border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            >
              <option value="">Select</option>
              <option value="MP4">MP4</option>
              <option value="MOV">MOV</option>
              <option value="AVI">AVI</option>
              <option value="MKV">MKV</option>
              <option value="MXF">MXF</option>
            </select>
          </div>

          <div class="col-span-2">
            <label class="text-xs text-gray-500 dark:text-gray-400">Color Space</label>
            <select
              v-model="spec.colorSpace"
              @change="updateData"
              class="w-full px-2 py-1 text-sm border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            >
              <option value="">Select</option>
              <option value="Rec. 709">Rec. 709</option>
              <option value="Rec. 2020">Rec. 2020</option>
              <option value="sRGB">sRGB</option>
              <option value="DCI-P3">DCI-P3</option>
              <option value="Adobe RGB">Adobe RGB</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
      {{ localData.specs.length }} specification(s)
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCanvasStore } from '~/stores/canvas'
import type { NoteCard, DeliverySpecsData } from '~/types'

const props = defineProps<{
  card: NoteCard
}>()

const canvasStore = useCanvasStore()

const localData = ref<DeliverySpecsData>(
  props.card.deliverySpecsData || {
    title: 'Delivery Specifications',
    client: '',
    dueDate: '',
    specs: []
  }
)

const addSpec = () => {
  localData.value.specs.push({
    id: crypto.randomUUID(),
    platform: '',
    resolution: '',
    frameRate: '',
    codec: '',
    bitrate: '',
    audioCodec: '',
    containerFormat: '',
    colorSpace: ''
  })
  updateData()
}

const removeSpec = (index: number) => {
  localData.value.specs.splice(index, 1)
  updateData()
}

const updateData = () => {
  canvasStore.updateCard(props.card.id, {
    deliverySpecsData: localData.value
  })
}

watch(
  () => props.card.deliverySpecsData,
  (newData) => {
    if (newData) {
      localData.value = newData
    }
  },
  { deep: true }
)
</script>
