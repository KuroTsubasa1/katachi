<template>
  <div class="h-full w-full flex flex-col bg-white dark:bg-gray-900 p-4 overflow-auto">
    <div class="flex items-center justify-between mb-4">
      <input
        v-model="localData.title"
        @blur="updateData"
        class="text-lg font-semibold bg-transparent border-none outline-none dark:text-white flex-1"
        placeholder="Edit Decision List"
      />
      <button
        @click="addDecision"
        class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
      >
        + Add Decision
      </button>
    </div>

    <div class="mb-4">
      <label class="text-xs text-gray-500 dark:text-gray-400">Project Name</label>
      <input
        v-model="localData.projectName"
        @blur="updateData"
        class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        placeholder="Project name"
      />
    </div>

    <div class="flex-1 overflow-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-100 dark:bg-gray-800 sticky top-0">
          <tr>
            <th class="p-2 text-left w-24">In Point</th>
            <th class="p-2 text-left w-24">Out Point</th>
            <th class="p-2 text-left">Clip Name</th>
            <th class="p-2 text-left w-16">Track</th>
            <th class="p-2 text-left w-24">Action</th>
            <th class="p-2 text-left">Notes</th>
            <th class="p-2 w-8"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(decision, index) in localData.decisions"
            :key="decision.id"
            class="border-b border-gray-200 dark:border-gray-700"
          >
            <td class="p-2">
              <input
                v-model="decision.inPoint"
                @blur="updateData"
                class="w-full bg-transparent border-none outline-none dark:text-white font-mono text-xs"
                placeholder="00:00:00:00"
                pattern="[0-9]{2}:[0-9]{2}:[0-9]{2}:[0-9]{2}"
              />
            </td>
            <td class="p-2">
              <input
                v-model="decision.outPoint"
                @blur="updateData"
                class="w-full bg-transparent border-none outline-none dark:text-white font-mono text-xs"
                placeholder="00:00:00:00"
                pattern="[0-9]{2}:[0-9]{2}:[0-9]{2}:[0-9]{2}"
              />
            </td>
            <td class="p-2">
              <input
                v-model="decision.clipName"
                @blur="updateData"
                class="w-full bg-transparent border-none outline-none dark:text-white"
                placeholder="Clip name"
              />
            </td>
            <td class="p-2">
              <input
                type="number"
                v-model.number="decision.track"
                @blur="updateData"
                class="w-full bg-transparent border-none outline-none dark:text-white text-center"
                min="1"
                placeholder="1"
              />
            </td>
            <td class="p-2">
              <select
                v-model="decision.action"
                @change="updateData"
                class="w-full px-2 py-1 text-xs border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              >
                <option value="cut">Cut</option>
                <option value="transition">Transition</option>
                <option value="effect">Effect</option>
                <option value="audio">Audio</option>
              </select>
            </td>
            <td class="p-2">
              <input
                v-model="decision.notes"
                @blur="updateData"
                class="w-full bg-transparent border-none outline-none dark:text-white"
                placeholder="Notes"
              />
            </td>
            <td class="p-2">
              <button
                @click="removeDecision(index)"
                class="text-red-500 hover:text-red-700"
                title="Delete decision"
              >
                ×
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>{{ localData.decisions.length }} edit decision(s)</span>
        <span v-if="totalDuration">Total Duration: {{ totalDuration }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useCanvasStore } from '~/stores/canvas'
import { parseTimecode, formatTimecode } from '~/utils/photographyHelpers'
import type { NoteCard, EditDecisionListData } from '~/types'

const props = defineProps<{
  card: NoteCard
}>()

const canvasStore = useCanvasStore()

const localData = ref<EditDecisionListData>(
  props.card.editDecisionListData || {
    title: 'Edit Decision List',
    projectName: '',
    decisions: []
  }
)

const totalDuration = computed(() => {
  if (localData.value.decisions.length === 0) return null

  let totalSeconds = 0
  localData.value.decisions.forEach(decision => {
    if (decision.inPoint && decision.outPoint) {
      const inSeconds = parseTimecode(decision.inPoint)
      const outSeconds = parseTimecode(decision.outPoint)
      totalSeconds += Math.abs(outSeconds - inSeconds)
    }
  })

  return formatTimecode(totalSeconds)
})

const addDecision = () => {
  localData.value.decisions.push({
    id: crypto.randomUUID(),
    inPoint: '',
    outPoint: '',
    clipName: '',
    track: 1,
    action: 'cut',
    notes: ''
  })
  updateData()
}

const removeDecision = (index: number) => {
  localData.value.decisions.splice(index, 1)
  updateData()
}

const updateData = () => {
  canvasStore.updateCard(props.card.id, {
    editDecisionListData: localData.value
  })
}

watch(
  () => props.card.editDecisionListData,
  (newData) => {
    if (newData) {
      localData.value = newData
    }
  },
  { deep: true }
)
</script>
