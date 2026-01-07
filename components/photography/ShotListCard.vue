<template>
  <div class="h-full w-full flex flex-col bg-white dark:bg-gray-900 p-4 overflow-auto">
    <div class="flex items-center justify-between mb-4">
      <input
        v-model="localData.title"
        @blur="updateData"
        class="text-lg font-semibold bg-transparent border-none outline-none dark:text-white flex-1"
        placeholder="Shot List Title"
      />
      <button
        @click="addShot"
        class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
      >
        + Add Shot
      </button>
    </div>

    <div class="flex-1 overflow-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-100 dark:bg-gray-800 sticky top-0">
          <tr>
            <th class="p-2 text-left w-12">✓</th>
            <th class="p-2 text-left w-16">#</th>
            <th class="p-2 text-left">Type</th>
            <th class="p-2 text-left">Subject</th>
            <th class="p-2 text-left">Camera</th>
            <th class="p-2 text-left">Lens</th>
            <th class="p-2 text-left">Notes</th>
            <th class="p-2 w-8"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(shot, index) in localData.items"
            :key="shot.id"
            class="border-b border-gray-200 dark:border-gray-700"
          >
            <td class="p-2">
              <input
                type="checkbox"
                v-model="shot.completed"
                @change="updateData"
                class="w-4 h-4"
              />
            </td>
            <td class="p-2">
              <input
                v-model="shot.shotNumber"
                @blur="updateData"
                class="w-full bg-transparent border-none outline-none dark:text-white"
                placeholder="1"
              />
            </td>
            <td class="p-2">
              <input
                v-model="shot.shotType"
                @blur="updateData"
                class="w-full bg-transparent border-none outline-none dark:text-white"
                placeholder="Wide"
              />
            </td>
            <td class="p-2">
              <input
                v-model="shot.subject"
                @blur="updateData"
                class="w-full bg-transparent border-none outline-none dark:text-white"
                placeholder="Subject"
              />
            </td>
            <td class="p-2">
              <input
                v-model="shot.camera"
                @blur="updateData"
                class="w-full bg-transparent border-none outline-none dark:text-white"
                placeholder="Camera"
              />
            </td>
            <td class="p-2">
              <input
                v-model="shot.lens"
                @blur="updateData"
                class="w-full bg-transparent border-none outline-none dark:text-white"
                placeholder="50mm"
              />
            </td>
            <td class="p-2">
              <input
                v-model="shot.notes"
                @blur="updateData"
                class="w-full bg-transparent border-none outline-none dark:text-white"
                placeholder="Notes"
              />
            </td>
            <td class="p-2">
              <button
                @click="removeShot(index)"
                class="text-red-500 hover:text-red-700"
                title="Delete shot"
              >
                ×
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCanvasStore } from '~/stores/canvas'
import type { NoteCard, ShotListData } from '~/types'

const props = defineProps<{
  card: NoteCard
}>()

const canvasStore = useCanvasStore()

const localData = ref<ShotListData>(
  props.card.shotListData || {
    title: 'Shot List',
    items: []
  }
)

const addShot = () => {
  localData.value.items.push({
    id: crypto.randomUUID(),
    shotNumber: String(localData.value.items.length + 1),
    shotType: '',
    subject: '',
    camera: '',
    lens: '',
    notes: '',
    completed: false
  })
  updateData()
}

const removeShot = (index: number) => {
  localData.value.items.splice(index, 1)
  updateData()
}

const updateData = () => {
  canvasStore.updateCard(props.card.id, {
    shotListData: localData.value
  })
}

watch(
  () => props.card.shotListData,
  (newData) => {
    if (newData) {
      localData.value = newData
    }
  },
  { deep: true }
)
</script>
