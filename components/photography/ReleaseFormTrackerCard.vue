<template>
  <div class="h-full w-full flex flex-col bg-white dark:bg-gray-900 p-4 overflow-auto">
    <div class="flex items-center justify-between mb-4">
      <input
        v-model="localData.title"
        @blur="updateData"
        class="text-lg font-semibold bg-transparent border-none outline-none dark:text-white flex-1"
        placeholder="Release Form Tracker"
      />
      <button
        @click="addEntry"
        class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
      >
        + Add Entry
      </button>
    </div>

    <div class="flex-1 overflow-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-100 dark:bg-gray-800 sticky top-0">
          <tr>
            <th class="p-2 text-left w-12">✓</th>
            <th class="p-2 text-left">Name</th>
            <th class="p-2 text-left w-32">Type</th>
            <th class="p-2 text-left w-28">Signed Date</th>
            <th class="p-2 text-left w-28">Expiry Date</th>
            <th class="p-2 text-left">Notes</th>
            <th class="p-2 w-8"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(entry, index) in localData.entries"
            :key="entry.id"
            class="border-b border-gray-200 dark:border-gray-700"
          >
            <td class="p-2">
              <input
                type="checkbox"
                v-model="entry.signed"
                @change="updateData"
                class="w-4 h-4"
              />
            </td>
            <td class="p-2">
              <input
                v-model="entry.personName"
                @blur="updateData"
                class="w-full bg-transparent border-none outline-none dark:text-white"
                placeholder="Person/Location name"
              />
            </td>
            <td class="p-2">
              <select
                v-model="entry.releaseType"
                @change="updateData"
                class="w-full bg-transparent border rounded px-2 py-1 dark:border-gray-700 dark:text-white"
              >
                <option value="model">Model</option>
                <option value="property">Property</option>
                <option value="location">Location</option>
              </select>
            </td>
            <td class="p-2">
              <input
                type="date"
                v-model="entry.signedDate"
                @change="updateData"
                class="w-full bg-transparent border-none outline-none dark:text-white"
              />
            </td>
            <td class="p-2">
              <input
                type="date"
                v-model="entry.expiryDate"
                @change="updateData"
                class="w-full bg-transparent border-none outline-none dark:text-white"
              />
            </td>
            <td class="p-2">
              <input
                v-model="entry.notes"
                @blur="updateData"
                class="w-full bg-transparent border-none outline-none dark:text-white"
                placeholder="Notes"
              />
            </td>
            <td class="p-2">
              <button
                @click="removeEntry(index)"
                class="text-red-500 hover:text-red-700"
                title="Delete entry"
              >
                ×
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
      {{ signedCount }} / {{ totalCount }} forms signed
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useCanvasStore } from '~/stores/canvas'
import type { NoteCard, ReleaseFormTrackerData } from '~/types'

const props = defineProps<{
  card: NoteCard
}>()

const canvasStore = useCanvasStore()

const localData = ref<ReleaseFormTrackerData>(
  props.card.releaseFormTrackerData || {
    title: 'Release Form Tracker',
    entries: []
  }
)

const signedCount = computed(() => localData.value.entries.filter(e => e.signed).length)
const totalCount = computed(() => localData.value.entries.length)

const addEntry = () => {
  localData.value.entries.push({
    id: crypto.randomUUID(),
    personName: '',
    releaseType: 'model',
    signed: false,
    signedDate: '',
    expiryDate: '',
    notes: ''
  })
  updateData()
}

const removeEntry = (index: number) => {
  localData.value.entries.splice(index, 1)
  updateData()
}

const updateData = () => {
  canvasStore.updateCard(props.card.id, {
    releaseFormTrackerData: localData.value
  })
}

watch(
  () => props.card.releaseFormTrackerData,
  (newData) => {
    if (newData) {
      localData.value = newData
    }
  },
  { deep: true }
)
</script>
