<template>
  <div class="h-full w-full flex flex-col bg-white dark:bg-gray-900 p-4 overflow-auto">
    <div class="flex items-center justify-between mb-4">
      <input
        v-model="localData.title"
        @blur="updateData"
        class="text-lg font-semibold bg-transparent border-none outline-none dark:text-white flex-1"
        placeholder="Equipment Checklist"
      />
      <button
        @click="addItem"
        class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
      >
        + Add Item
      </button>
    </div>

    <div class="flex-1 overflow-auto space-y-2">
      <div
        v-for="(item, index) in localData.items"
        :key="item.id"
        class="flex items-center gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        <input
          type="checkbox"
          v-model="item.checked"
          @change="updateData"
          class="w-4 h-4"
        />
        <select
          v-model="item.category"
          @change="updateData"
          class="px-2 py-1 text-xs border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        >
          <option value="camera">Camera</option>
          <option value="lens">Lens</option>
          <option value="lighting">Lighting</option>
          <option value="audio">Audio</option>
          <option value="grip">Grip</option>
          <option value="other">Other</option>
        </select>
        <input
          v-model="item.name"
          @blur="updateData"
          class="flex-1 bg-transparent border-none outline-none dark:text-white"
          :class="{ 'line-through text-gray-400': item.checked }"
          placeholder="Equipment name"
        />
        <input
          type="number"
          v-model.number="item.quantity"
          @blur="updateData"
          class="w-16 px-2 py-1 text-center bg-transparent border rounded dark:border-gray-700 dark:text-white"
          min="1"
        />
        <input
          v-model="item.notes"
          @blur="updateData"
          class="w-32 bg-transparent border-none outline-none text-sm text-gray-500 dark:text-gray-400"
          placeholder="Notes"
        />
        <button
          @click="removeItem(index)"
          class="text-red-500 hover:text-red-700"
          title="Delete item"
        >
          ×
        </button>
      </div>
    </div>

    <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
      {{ checkedCount }} / {{ totalCount }} items checked
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useCanvasStore } from '~/stores/canvas'
import type { NoteCard, EquipmentChecklistData } from '~/types'

const props = defineProps<{
  card: NoteCard
}>()

const canvasStore = useCanvasStore()

const localData = ref<EquipmentChecklistData>(
  props.card.equipmentChecklistData || {
    title: 'Equipment Checklist',
    items: []
  }
)

const checkedCount = computed(() => localData.value.items.filter(i => i.checked).length)
const totalCount = computed(() => localData.value.items.length)

const addItem = () => {
  localData.value.items.push({
    id: crypto.randomUUID(),
    name: '',
    category: 'camera',
    checked: false,
    quantity: 1,
    notes: ''
  })
  updateData()
}

const removeItem = (index: number) => {
  localData.value.items.splice(index, 1)
  updateData()
}

const updateData = () => {
  canvasStore.updateCard(props.card.id, {
    equipmentChecklistData: localData.value
  })
}

watch(
  () => props.card.equipmentChecklistData,
  (newData) => {
    if (newData) {
      localData.value = newData
    }
  },
  { deep: true }
)
</script>
