<template>
  <div class="h-full w-full overflow-auto">
    <table class="w-full border-collapse border border-gray-300 dark:border-gray-600">
      <tbody>
        <tr v-for="(row, rowIndex) in localCells" :key="rowIndex">
          <td
            v-for="(cell, colIndex) in row"
            :key="colIndex"
            class="border border-gray-300 dark:border-gray-600 p-2 min-w-[80px]"
            :class="{ 'bg-gray-50 dark:bg-gray-700': rowIndex === 0 }"
          >
            <input
              v-if="isSelected"
              v-model="localCells[rowIndex][colIndex]"
              @input="updateTable"
              class="w-full bg-transparent border-none outline-none text-sm text-gray-800 dark:text-gray-200"
              :class="{ 'font-semibold': rowIndex === 0 }"
              :placeholder="rowIndex === 0 ? 'Header' : 'Cell'"
            />
            <div
              v-else
              class="text-sm text-gray-800 dark:text-gray-200"
              :class="{ 'font-semibold': rowIndex === 0 }"
            >
              {{ cell || (rowIndex === 0 ? 'Header' : '') }}
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="isSelected" class="mt-2 p-2 flex gap-2 flex-wrap bg-gray-50 dark:bg-gray-800 rounded">
      <button
        @click="addRow"
        class="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        + Row
      </button>
      <button
        @click="addColumn"
        class="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        + Column
      </button>
      <button
        v-if="localCells.length > 1"
        @click="removeRow"
        class="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
      >
        - Row
      </button>
      <button
        v-if="localCells[0]?.length > 1"
        @click="removeColumn"
        class="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
      >
        - Column
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { TableData } from '~/types'

const props = defineProps<{
  tableData?: TableData
  isSelected: boolean
}>()

const emit = defineEmits<{
  'update:tableData': [data: TableData]
}>()

const localCells = ref<string[][]>(
  props.tableData?.cells || [
    ['Column 1', 'Column 2', 'Column 3'],
    ['', '', ''],
    ['', '', '']
  ]
)

const updateTable = () => {
  emit('update:tableData', {
    rows: localCells.value.length,
    cols: localCells.value[0]?.length || 0,
    cells: localCells.value
  })
}

const addRow = () => {
  const cols = localCells.value[0]?.length || 3
  localCells.value.push(new Array(cols).fill(''))
  updateTable()
}

const removeRow = () => {
  if (localCells.value.length > 1) {
    localCells.value.pop()
    updateTable()
  }
}

const addColumn = () => {
  localCells.value.forEach(row => row.push(''))
  updateTable()
}

const removeColumn = () => {
  if (localCells.value[0]?.length > 1) {
    localCells.value.forEach(row => row.pop())
    updateTable()
  }
}

watch(() => props.tableData?.cells, (newCells) => {
  if (newCells) {
    localCells.value = newCells
  }
}, { deep: true })
</script>
