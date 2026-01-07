<template>
  <div class="h-full w-full flex flex-col bg-white dark:bg-gray-900 p-4 overflow-auto">
    <input
      v-model="localData.title"
      @blur="updateData"
      class="text-lg font-semibold bg-transparent border-none outline-none dark:text-white mb-4"
      placeholder="File Naming Convention"
    />

    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Separator Type
      </label>
      <select
        v-model="localData.separatorType"
        @change="updatePattern"
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-800 dark:text-white"
      >
        <option value="underscore">Underscore (_)</option>
        <option value="dash">Dash (-)</option>
        <option value="camelCase">CamelCase</option>
      </select>
    </div>

    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Pattern
      </label>
      <input
        v-model="localData.pattern"
        @blur="updateData"
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-800 dark:text-white font-mono text-sm"
        placeholder="{project}_{date}_{scene}_{take}"
      />
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
        Use {project}, {date}, {scene}, {take}, {camera}, etc.
      </p>
    </div>

    <div class="mb-4">
      <div class="flex items-center justify-between mb-2">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Components
        </label>
        <button
          @click="addRule"
          class="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
        >
          + Add
        </button>
      </div>
      <div class="space-y-2">
        <div
          v-for="(rule, index) in localData.rules"
          :key="rule.id"
          class="flex items-center gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded"
        >
          <input
            v-model="rule.component"
            @blur="updateData"
            class="flex-1 bg-transparent border-none outline-none dark:text-white"
            placeholder="Component name"
          />
          <input
            v-model="rule.format"
            @blur="updateData"
            class="w-32 bg-transparent border-none outline-none dark:text-white text-sm"
            placeholder="Format"
          />
          <input
            v-model="rule.example"
            @blur="updateData"
            class="w-32 bg-transparent border-none outline-none dark:text-white text-sm text-gray-500"
            placeholder="Example"
          />
          <button
            @click="removeRule(index)"
            class="text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      </div>
    </div>

    <div class="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Example Output
      </label>
      <div class="font-mono text-sm dark:text-white">
        {{ localData.exampleOutput || 'project_2025-01-07_scene01_take03.mp4' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCanvasStore } from '~/stores/canvas'
import type { NoteCard, FileNamingConventionData } from '~/types'

const props = defineProps<{
  card: NoteCard
}>()

const canvasStore = useCanvasStore()

const localData = ref<FileNamingConventionData>(
  props.card.fileNamingConventionData || {
    title: 'File Naming Convention',
    pattern: '{project}_{date}_{scene}_{take}',
    rules: [],
    separatorType: 'underscore',
    exampleOutput: 'project_2025-01-07_scene01_take03.mp4'
  }
)

const addRule = () => {
  localData.value.rules.push({
    id: crypto.randomUUID(),
    component: '',
    format: '',
    example: ''
  })
  updateData()
}

const removeRule = (index: number) => {
  localData.value.rules.splice(index, 1)
  updateData()
}

const updatePattern = () => {
  const separator = {
    'underscore': '_',
    'dash': '-',
    'camelCase': ''
  }[localData.value.separatorType]

  const example = localData.value.pattern
    .replace(/{(\w+)}/g, (_, key) => {
      const examples: { [key: string]: string } = {
        project: 'myproject',
        date: '2025-01-07',
        scene: 'scene01',
        take: 'take03',
        camera: 'camA',
        shot: 'shot001'
      }
      return examples[key] || key
    })

  if (localData.value.separatorType !== 'camelCase') {
    localData.value.exampleOutput = example
  } else {
    localData.value.exampleOutput = example
      .split('_')
      .map((word, i) => i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
      .join('')
  }

  localData.value.exampleOutput += '.mp4'
  updateData()
}

const updateData = () => {
  canvasStore.updateCard(props.card.id, {
    fileNamingConventionData: localData.value
  })
}

watch(
  () => props.card.fileNamingConventionData,
  (newData) => {
    if (newData) {
      localData.value = newData
    }
  },
  { deep: true }
)
</script>
