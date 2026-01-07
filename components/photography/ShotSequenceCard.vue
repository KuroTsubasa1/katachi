<template>
  <div class="h-full w-full flex flex-col bg-white dark:bg-gray-900 p-4 overflow-auto">
    <div class="flex items-center justify-between mb-4">
      <input
        v-model="localData.title"
        @blur="updateData"
        class="text-lg font-semibold bg-transparent border-none outline-none dark:text-white flex-1"
        placeholder="Shot Sequence"
      />
      <div class="flex items-center gap-2">
        <select
          v-model="localData.sequenceType"
          @change="updateData"
          class="px-2 py-1 text-sm border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        >
          <option value="linear">Linear</option>
          <option value="branching">Branching</option>
        </select>
        <button
          @click="addFrame"
          class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          + Add Frame
        </button>
      </div>
    </div>

    <!-- Frames Grid with Arrows -->
    <div class="flex-1 overflow-auto">
      <div class="relative">
        <!-- Grid of Frames -->
        <div class="grid grid-cols-2 md:grid-cols-3 gap-6 p-4">
          <div
            v-for="(frame, index) in sortedFrames"
            :key="frame.id"
            class="relative"
            :data-frame-id="frame.id"
          >
            <!-- Frame Card -->
            <div class="border-2 border-gray-300 dark:border-gray-600 rounded overflow-hidden bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
              <!-- Order Badge -->
              <div class="absolute top-2 left-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
                {{ frame.order }}
              </div>

              <!-- Image Upload Area -->
              <div class="relative aspect-video bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <img
                  v-if="frame.imageUrl"
                  :src="frame.imageUrl"
                  :alt="frame.caption"
                  class="w-full h-full object-cover"
                />
                <div v-else class="text-center p-4">
                  <input
                    type="file"
                    :id="`upload-${frame.id}`"
                    @change="(e) => handleImageUpload(e, frame.id)"
                    accept="image/*"
                    class="hidden"
                  />
                  <label
                    :for="`upload-${frame.id}`"
                    class="cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <div class="text-4xl mb-2">+</div>
                    <div class="text-xs">Add Image</div>
                  </label>
                </div>

                <!-- Delete Frame Button -->
                <button
                  @click="removeFrame(index)"
                  class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 z-10"
                  title="Delete frame"
                >
                  ×
                </button>
              </div>

              <!-- Caption -->
              <div class="p-3">
                <input
                  v-model="frame.caption"
                  @blur="updateData"
                  class="w-full text-sm bg-transparent border-none outline-none dark:text-white font-medium"
                  placeholder="Frame caption..."
                />

                <!-- Arrow Configuration -->
                <div v-if="localData.sequenceType === 'branching'" class="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <label class="text-xs text-gray-600 dark:text-gray-400">Arrow to frame:</label>
                  <div class="flex gap-1 mt-1">
                    <select
                      v-model="frame.arrow.to"
                      @change="updateData"
                      class="flex-1 px-2 py-1 text-xs border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">None</option>
                      <option
                        v-for="targetFrame in getAvailableTargets(frame)"
                        :key="targetFrame.id"
                        :value="targetFrame.id"
                      >
                        Frame {{ targetFrame.order }}
                      </option>
                    </select>
                    <input
                      v-if="frame.arrow.to"
                      v-model="frame.arrow.label"
                      @blur="updateData"
                      class="w-20 px-2 py-1 text-xs border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Label"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Linear Sequence Arrow -->
            <div
              v-if="localData.sequenceType === 'linear' && index < localData.frames.length - 1"
              class="absolute -right-3 top-1/2 transform -translate-y-1/2 z-0"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" class="text-blue-500">
                <path
                  d="M5 12 L19 12 M19 12 L15 8 M19 12 L15 16"
                  stroke="currentColor"
                  stroke-width="2"
                  fill="none"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        <!-- SVG Overlay for Branching Arrows -->
        <svg
          v-if="localData.sequenceType === 'branching'"
          class="absolute top-0 left-0 w-full h-full pointer-events-none"
          style="z-index: 5"
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
            </marker>
          </defs>
          <g v-for="frame in localData.frames" :key="`arrow-${frame.id}`">
            <path
              v-if="frame.arrow?.to"
              :d="getArrowPath(frame.id, frame.arrow.to)"
              stroke="#3b82f6"
              stroke-width="2"
              fill="none"
              marker-end="url(#arrowhead)"
            />
            <text
              v-if="frame.arrow?.to && frame.arrow?.label"
              :x="getArrowLabelPosition(frame.id, frame.arrow.to).x"
              :y="getArrowLabelPosition(frame.id, frame.arrow.to).y"
              class="text-xs fill-blue-600 dark:fill-blue-400"
              text-anchor="middle"
            >
              {{ frame.arrow.label }}
            </text>
          </g>
        </svg>
      </div>
    </div>

    <!-- Footer Info -->
    <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
      {{ localData.frames.length }} frames in {{ localData.sequenceType }} sequence
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useCanvasStore } from '~/stores/canvas'
import type { NoteCard, ShotSequenceData, ShotSequenceFrame } from '~/types'

const props = defineProps<{
  card: NoteCard
}>()

const canvasStore = useCanvasStore()

const localData = ref<ShotSequenceData>(
  props.card.shotSequenceData || {
    title: 'Shot Sequence',
    frames: [],
    sequenceType: 'linear'
  }
)

const sortedFrames = computed(() => {
  return [...localData.value.frames].sort((a, b) => a.order - b.order)
})

const addFrame = () => {
  const newOrder = localData.value.frames.length + 1
  localData.value.frames.push({
    id: crypto.randomUUID(),
    caption: '',
    order: newOrder,
    arrow: { to: '', label: '' }
  })
  updateData()
}

const removeFrame = (index: number) => {
  const removedFrame = localData.value.frames[index]
  localData.value.frames.splice(index, 1)

  // Remove arrows pointing to deleted frame
  localData.value.frames.forEach(frame => {
    if (frame.arrow?.to === removedFrame.id) {
      frame.arrow = { to: '', label: '' }
    }
  })

  // Reorder remaining frames
  localData.value.frames.forEach((frame, idx) => {
    frame.order = idx + 1
  })

  updateData()
}

const getAvailableTargets = (currentFrame: ShotSequenceFrame) => {
  return localData.value.frames.filter(f => f.id !== currentFrame.id)
}

const handleImageUpload = async (event: Event, frameId: string) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const frame = localData.value.frames.find(f => f.id === frameId)
    if (frame) {
      frame.imageUrl = e.target?.result as string
      updateData()
    }
  }
  reader.readAsDataURL(file)
}

const getFramePosition = (frameId: string) => {
  const element = document.querySelector(`[data-frame-id="${frameId}"]`)
  if (!element) return { x: 0, y: 0 }

  const rect = element.getBoundingClientRect()
  const container = element.closest('.relative')?.getBoundingClientRect()

  if (!container) return { x: 0, y: 0 }

  return {
    x: rect.left - container.left + rect.width / 2,
    y: rect.top - container.top + rect.height / 2
  }
}

const getArrowPath = (fromId: string, toId: string) => {
  const from = getFramePosition(fromId)
  const to = getFramePosition(toId)

  // Create a curved path
  const midX = (from.x + to.x) / 2
  const midY = (from.y + to.y) / 2
  const offsetX = (to.y - from.y) * 0.2
  const offsetY = (from.x - to.x) * 0.2

  return `M ${from.x} ${from.y} Q ${midX + offsetX} ${midY + offsetY} ${to.x} ${to.y}`
}

const getArrowLabelPosition = (fromId: string, toId: string) => {
  const from = getFramePosition(fromId)
  const to = getFramePosition(toId)

  return {
    x: (from.x + to.x) / 2,
    y: (from.y + to.y) / 2 - 10
  }
}

const updateData = () => {
  canvasStore.updateCard(props.card.id, {
    shotSequenceData: localData.value
  })
}

watch(
  () => props.card.shotSequenceData,
  (newData) => {
    if (newData) {
      localData.value = newData
    }
  },
  { deep: true }
)
</script>
