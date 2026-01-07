<template>
  <div class="h-full w-full flex flex-col bg-white dark:bg-gray-900 p-4 overflow-auto">
    <div class="flex items-center justify-between mb-4">
      <input
        v-model="localData.title"
        @blur="updateData"
        class="text-lg font-semibold bg-transparent border-none outline-none dark:text-white flex-1"
        placeholder="Script Breakdown Title"
      />
      <button
        @click="addScene"
        class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
      >
        + Add Scene
      </button>
    </div>

    <div class="flex-1 overflow-auto space-y-4">
      <div
        v-for="(scene, index) in localData.scenes"
        :key="scene.id"
        class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        <div class="flex items-center justify-between mb-3">
          <input
            v-model="scene.sceneNumber"
            @blur="updateData"
            class="text-lg font-semibold bg-transparent border-none outline-none dark:text-white w-24"
            placeholder="Scene #"
          />
          <button
            @click="removeScene(index)"
            class="text-red-500 hover:text-red-700"
            title="Delete scene"
          >
            ×
          </button>
        </div>

        <div class="space-y-3">
          <div>
            <label class="text-xs text-gray-500 dark:text-gray-400">Description</label>
            <textarea
              v-model="scene.description"
              @blur="updateData"
              class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              rows="2"
              placeholder="Scene description"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-gray-500 dark:text-gray-400">Location</label>
              <input
                v-model="scene.location"
                @blur="updateData"
                class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                placeholder="INT. OFFICE"
              />
            </div>
            <div>
              <label class="text-xs text-gray-500 dark:text-gray-400">Time of Day</label>
              <select
                v-model="scene.timeOfDay"
                @change="updateData"
                class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              >
                <option value="">Select</option>
                <option value="Day">Day</option>
                <option value="Night">Night</option>
                <option value="Dawn">Dawn</option>
                <option value="Dusk">Dusk</option>
                <option value="Golden Hour">Golden Hour</option>
              </select>
            </div>
          </div>

          <div>
            <label class="text-xs text-gray-500 dark:text-gray-400">Talent</label>
            <input
              v-model="scene.talentInput"
              @blur="updateTalent(scene)"
              @keypress.enter="updateTalent(scene)"
              class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              placeholder="Enter names separated by commas"
            />
            <div v-if="scene.talent.length > 0" class="flex flex-wrap gap-1 mt-1">
              <span
                v-for="(person, i) in scene.talent"
                :key="i"
                class="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded"
              >
                {{ person }}
              </span>
            </div>
          </div>

          <div>
            <label class="text-xs text-gray-500 dark:text-gray-400">Props</label>
            <input
              v-model="scene.propsInput"
              @blur="updateProps(scene)"
              @keypress.enter="updateProps(scene)"
              class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              placeholder="Enter props separated by commas"
            />
            <div v-if="scene.props.length > 0" class="flex flex-wrap gap-1 mt-1">
              <span
                v-for="(prop, i) in scene.props"
                :key="i"
                class="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs rounded"
              >
                {{ prop }}
              </span>
            </div>
          </div>

          <div>
            <label class="text-xs text-gray-500 dark:text-gray-400">Equipment</label>
            <input
              v-model="scene.equipmentInput"
              @blur="updateEquipment(scene)"
              @keypress.enter="updateEquipment(scene)"
              class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              placeholder="Enter equipment separated by commas"
            />
            <div v-if="scene.equipment.length > 0" class="flex flex-wrap gap-1 mt-1">
              <span
                v-for="(item, i) in scene.equipment"
                :key="i"
                class="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 text-xs rounded"
              >
                {{ item }}
              </span>
            </div>
          </div>

          <div>
            <label class="text-xs text-gray-500 dark:text-gray-400">Notes</label>
            <textarea
              v-model="scene.notes"
              @blur="updateData"
              class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              rows="2"
              placeholder="Additional notes"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
      {{ localData.scenes.length }} scene(s) total
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCanvasStore } from '~/stores/canvas'
import type { NoteCard, ScriptBreakdownData, SceneBreakdownItem } from '~/types'

const props = defineProps<{
  card: NoteCard
}>()

const canvasStore = useCanvasStore()

interface ExtendedSceneBreakdownItem extends SceneBreakdownItem {
  talentInput?: string
  propsInput?: string
  equipmentInput?: string
}

const localData = ref<ScriptBreakdownData & { scenes: ExtendedSceneBreakdownItem[] }>(
  props.card.scriptBreakdownData || {
    title: 'Script Breakdown',
    scenes: []
  }
)

const addScene = () => {
  localData.value.scenes.push({
    id: crypto.randomUUID(),
    sceneNumber: String(localData.value.scenes.length + 1),
    description: '',
    location: '',
    timeOfDay: '',
    talent: [],
    props: [],
    equipment: [],
    notes: '',
    talentInput: '',
    propsInput: '',
    equipmentInput: ''
  })
  updateData()
}

const removeScene = (index: number) => {
  localData.value.scenes.splice(index, 1)
  updateData()
}

const updateTalent = (scene: ExtendedSceneBreakdownItem) => {
  if (scene.talentInput) {
    scene.talent = scene.talentInput.split(',').map(s => s.trim()).filter(s => s)
  }
  updateData()
}

const updateProps = (scene: ExtendedSceneBreakdownItem) => {
  if (scene.propsInput) {
    scene.props = scene.propsInput.split(',').map(s => s.trim()).filter(s => s)
  }
  updateData()
}

const updateEquipment = (scene: ExtendedSceneBreakdownItem) => {
  if (scene.equipmentInput) {
    scene.equipment = scene.equipmentInput.split(',').map(s => s.trim()).filter(s => s)
  }
  updateData()
}

const updateData = () => {
  canvasStore.updateCard(props.card.id, {
    scriptBreakdownData: localData.value
  })
}

watch(
  () => props.card.scriptBreakdownData,
  (newData) => {
    if (newData) {
      localData.value = {
        ...newData,
        scenes: newData.scenes.map(scene => ({
          ...scene,
          talentInput: scene.talent.join(', '),
          propsInput: scene.props.join(', '),
          equipmentInput: scene.equipment.join(', ')
        }))
      }
    }
  },
  { deep: true }
)
</script>
