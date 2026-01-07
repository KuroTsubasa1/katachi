<template>
  <div class="h-full w-full flex flex-col bg-white dark:bg-gray-900 p-4 overflow-auto">
    <div class="mb-4">
      <input
        v-model="localData.name"
        @blur="updateData"
        class="text-xl font-bold bg-transparent border-none outline-none dark:text-white w-full mb-1"
        placeholder="Model/Talent Name"
      />
      <input
        v-model="localData.role"
        @blur="updateData"
        class="text-sm text-gray-600 dark:text-gray-400 bg-transparent border-none outline-none w-full"
        placeholder="Role/Type"
      />
    </div>

    <div class="flex-1 overflow-auto space-y-4">
      <!-- Contact Information -->
      <div class="border border-gray-200 dark:border-gray-700 rounded p-3">
        <h3 class="font-semibold text-sm mb-2 dark:text-white">Contact</h3>
        <div class="space-y-2 text-sm">
          <div>
            <label class="text-gray-600 dark:text-gray-400 text-xs">Email</label>
            <input
              v-model="localData.contact.email"
              @blur="updateData"
              type="email"
              class="w-full px-2 py-1 bg-transparent border-b border-gray-300 dark:border-gray-600 outline-none dark:text-white"
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label class="text-gray-600 dark:text-gray-400 text-xs">Phone</label>
            <input
              v-model="localData.contact.phone"
              @blur="updateData"
              type="tel"
              class="w-full px-2 py-1 bg-transparent border-b border-gray-300 dark:border-gray-600 outline-none dark:text-white"
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>
      </div>

      <!-- Portfolio Images -->
      <div class="border border-gray-200 dark:border-gray-700 rounded p-3">
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-semibold text-sm dark:text-white">Portfolio</h3>
          <label
            class="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 cursor-pointer"
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
        <div class="grid grid-cols-3 gap-2">
          <div
            v-for="(image, index) in localData.portfolioImages"
            :key="index"
            class="relative aspect-square bg-gray-100 dark:bg-gray-800 rounded overflow-hidden group"
          >
            <img
              :src="image"
              alt="Portfolio image"
              class="w-full h-full object-cover"
            />
            <button
              @click="removeImage(index)"
              class="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
              title="Remove image"
            >
              ×
            </button>
          </div>
        </div>
      </div>

      <!-- Measurements -->
      <div class="border border-gray-200 dark:border-gray-700 rounded p-3">
        <h3 class="font-semibold text-sm mb-2 dark:text-white">Measurements</h3>
        <textarea
          v-model="localData.measurements"
          @blur="updateData"
          class="w-full px-2 py-1 bg-transparent border border-gray-300 dark:border-gray-600 rounded outline-none dark:text-white text-sm resize-none"
          rows="3"
          placeholder="Height, weight, clothing sizes, etc."
        />
      </div>

      <!-- Social Media -->
      <div class="border border-gray-200 dark:border-gray-700 rounded p-3">
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-semibold text-sm dark:text-white">Social Media</h3>
          <button
            @click="addSocialMedia"
            class="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
          >
            + Add
          </button>
        </div>
        <div class="space-y-2">
          <div
            v-for="(social, index) in localData.socialMedia"
            :key="index"
            class="flex gap-2"
          >
            <input
              v-model="social.platform"
              @blur="updateData"
              class="w-1/3 px-2 py-1 bg-transparent border-b border-gray-300 dark:border-gray-600 outline-none dark:text-white text-sm"
              placeholder="Platform"
            />
            <input
              v-model="social.handle"
              @blur="updateData"
              class="flex-1 px-2 py-1 bg-transparent border-b border-gray-300 dark:border-gray-600 outline-none dark:text-white text-sm"
              placeholder="@handle"
            />
            <button
              @click="removeSocialMedia(index)"
              class="text-red-500 hover:text-red-700 text-sm"
            >
              ×
            </button>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div class="border border-gray-200 dark:border-gray-700 rounded p-3">
        <h3 class="font-semibold text-sm mb-2 dark:text-white">Notes</h3>
        <textarea
          v-model="localData.notes"
          @blur="updateData"
          class="w-full px-2 py-1 bg-transparent border border-gray-300 dark:border-gray-600 rounded outline-none dark:text-white text-sm resize-none"
          rows="4"
          placeholder="Additional notes, availability, special requirements..."
        />
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
import type { NoteCard, TalentModelData } from '~/types'

const props = defineProps<{
  card: NoteCard
}>()

const canvasStore = useCanvasStore()
const { handleFileChange, uploadError } = useImageUpload()

const localData = ref<TalentModelData>(
  props.card.talentModelData || {
    name: 'New Talent',
    role: '',
    contact: { email: '', phone: '' },
    portfolioImages: [],
    measurements: '',
    notes: '',
    socialMedia: []
  }
)

const handleImageUpload = async (event: Event) => {
  const results = await handleFileChange(event, true)
  if (results && Array.isArray(results)) {
    localData.value.portfolioImages.push(...results)
    updateData()
  }
}

const removeImage = (index: number) => {
  localData.value.portfolioImages.splice(index, 1)
  updateData()
}

const addSocialMedia = () => {
  localData.value.socialMedia.push({
    platform: '',
    handle: ''
  })
  updateData()
}

const removeSocialMedia = (index: number) => {
  localData.value.socialMedia.splice(index, 1)
  updateData()
}

const updateData = () => {
  canvasStore.updateCard(props.card.id, {
    talentModelData: localData.value
  })
}

watch(
  () => props.card.talentModelData,
  (newData) => {
    if (newData) {
      localData.value = newData
    }
  },
  { deep: true }
)
</script>
