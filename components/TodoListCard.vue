<template>
  <div class="h-full w-full p-4 flex flex-col gap-3">
    <div v-if="isSelected" class="pb-2 border-b border-gray-200 dark:border-gray-600">
      <input
        v-model="listTitle"
        @input="updateList"
        class="w-full font-semibold text-gray-800 dark:text-gray-200 bg-transparent border-none outline-none"
        placeholder="Todo List Title"
      />
    </div>
    <div v-else class="pb-2 border-b border-gray-200 dark:border-gray-600">
      <div class="font-semibold text-gray-800 dark:text-gray-200">{{ listTitle || 'Todo List' }}</div>
    </div>

    <div class="flex-1 overflow-auto space-y-2">
      <div
        v-for="(item, index) in todoItems"
        :key="index"
        class="flex items-start gap-2 group"
      >
        <input
          type="checkbox"
          v-model="item.completed"
          @change="updateList"
          class="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
        />
        <div class="flex-1">
          <input
            v-if="isSelected"
            v-model="item.text"
            @input="updateList"
            @keydown.enter="addNewTodoItem(index)"
            class="w-full bg-transparent border-none outline-none text-sm text-gray-700 dark:text-gray-300"
            :class="{ 'line-through text-gray-400 dark:text-gray-500': item.completed }"
            placeholder="Todo item"
          />
          <div
            v-else
            class="text-sm text-gray-700 dark:text-gray-300"
            :class="{ 'line-through text-gray-400 dark:text-gray-500': item.completed }"
          >
            {{ item.text }}
          </div>
        </div>
        <button
          v-if="isSelected"
          @click="removeTodoItem(index)"
          class="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 text-xs"
        >
          ×
        </button>
      </div>

      <button
        v-if="isSelected"
        @click="addNewTodoItem()"
        class="w-full p-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded text-sm text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition"
      >
        + Add Todo
      </button>
    </div>

    <!-- Progress bar -->
    <div class="pt-2 border-t border-gray-200 dark:border-gray-600">
      <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
        <span>{{ completedCount }} of {{ todoItems.length }} completed</span>
        <span>{{ progressPercentage }}%</span>
      </div>
      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          class="bg-blue-500 h-2 rounded-full transition-all"
          :style="{ width: progressPercentage + '%' }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface TodoItem {
  text: string
  completed: boolean
}

const props = defineProps<{
  todoData?: { title: string, items: TodoItem[] }
  isSelected: boolean
}>()

const emit = defineEmits<{
  'update:todoData': [data: { title: string, items: TodoItem[] }]
}>()

const listTitle = ref(props.todoData?.title || 'Todo List')
const todoItems = ref<TodoItem[]>(props.todoData?.items || [])

const completedCount = computed(() => {
  return todoItems.value.filter(item => item.completed).length
})

const progressPercentage = computed(() => {
  if (todoItems.value.length === 0) return 0
  return Math.round((completedCount.value / todoItems.value.length) * 100)
})

const updateList = () => {
  emit('update:todoData', {
    title: listTitle.value,
    items: todoItems.value
  })
}

const addNewTodoItem = (afterIndex?: number) => {
  const newItem = { text: '', completed: false }
  if (afterIndex !== undefined) {
    todoItems.value.splice(afterIndex + 1, 0, newItem)
  } else {
    todoItems.value.push(newItem)
  }
  updateList()
}

const removeTodoItem = (index: number) => {
  todoItems.value.splice(index, 1)
  updateList()
}

watch(() => props.todoData, (newData) => {
  if (newData) {
    listTitle.value = newData.title
    todoItems.value = newData.items
  }
}, { deep: true })
</script>
