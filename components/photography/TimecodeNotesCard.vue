<template>
  <div class="h-full w-full flex flex-col bg-white dark:bg-gray-900 p-4 overflow-auto">
    <div class="flex items-center justify-between mb-4">
      <input
        v-model="localData.title"
        @blur="updateData"
        class="text-lg font-semibold bg-transparent border-none outline-none dark:text-white flex-1"
        placeholder="Timecode Notes"
      />
      <button
        @click="addNote"
        class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
      >
        + Add Note
      </button>
    </div>

    <!-- Video Player Section -->
    <div class="mb-4 bg-black rounded overflow-hidden">
      <video
        ref="videoPlayer"
        :src="localData.videoUrl"
        class="w-full h-48"
        controls
        @timeupdate="updateCurrentTime"
        @loadedmetadata="onVideoLoaded"
      >
        Your browser does not support the video tag.
      </video>
    </div>

    <!-- Video URL Input -->
    <div class="mb-4">
      <label class="text-xs text-gray-600 dark:text-gray-400 block mb-1">Video URL</label>
      <input
        v-model="localData.videoUrl"
        @blur="updateData"
        class="w-full px-2 py-1 text-sm bg-transparent border border-gray-300 dark:border-gray-600 rounded outline-none dark:text-white"
        placeholder="https://example.com/video.mp4"
      />
    </div>

    <!-- Current Time and Quick Add -->
    <div class="mb-4 flex items-center gap-2">
      <div class="text-sm text-gray-600 dark:text-gray-400">
        Current: <span class="font-mono">{{ currentTimecode }}</span>
      </div>
      <button
        @click="addNoteAtCurrentTime"
        class="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
        :disabled="!localData.videoUrl"
      >
        Add Note Here
      </button>
    </div>

    <!-- Notes List -->
    <div class="flex-1 overflow-auto space-y-2">
      <div
        v-for="(note, index) in sortedNotes"
        :key="note.id"
        class="p-3 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        <div class="flex items-start gap-2">
          <!-- Category Badge -->
          <select
            v-model="note.category"
            @change="updateData"
            class="px-2 py-1 text-xs rounded border-none outline-none"
            :class="getCategoryClass(note.category)"
          >
            <option value="good">Good</option>
            <option value="issue">Issue</option>
            <option value="retake">Retake</option>
            <option value="favorite">Favorite</option>
          </select>

          <!-- Timecode Input -->
          <input
            v-model="note.timecode"
            @blur="updateData"
            @click="seekToTimecode(note.timecode)"
            class="w-24 px-2 py-1 text-xs font-mono bg-transparent border border-gray-300 dark:border-gray-600 rounded outline-none dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
            placeholder="00:00:00:00"
            title="Click to seek to this timecode"
          />

          <!-- Note Content -->
          <input
            v-model="note.note"
            @blur="updateData"
            class="flex-1 px-2 py-1 text-sm bg-transparent border-none outline-none dark:text-white"
            placeholder="Add note..."
          />

          <!-- Delete Button -->
          <button
            @click="removeNote(index)"
            class="text-red-500 hover:text-red-700 text-sm"
            title="Delete note"
          >
            ×
          </button>
        </div>
      </div>

      <div v-if="localData.notes.length === 0" class="text-center text-gray-400 dark:text-gray-600 py-8">
        No notes yet. Add a note to get started.
      </div>
    </div>

    <!-- Stats Footer -->
    <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400 flex justify-between">
      <div>{{ localData.notes.length }} notes</div>
      <div>
        <span class="mr-3">{{ categoryCount('good') }} Good</span>
        <span class="mr-3">{{ categoryCount('issue') }} Issues</span>
        <span class="mr-3">{{ categoryCount('retake') }} Retakes</span>
        <span>{{ categoryCount('favorite') }} Favorites</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useCanvasStore } from '~/stores/canvas'
import type { NoteCard, TimecodeNotesData } from '~/types'
import { formatTimecode, parseTimecode } from '~/utils/photographyHelpers'

const props = defineProps<{
  card: NoteCard
}>()

const canvasStore = useCanvasStore()
const videoPlayer = ref<HTMLVideoElement | null>(null)
const currentTime = ref(0)
const fps = ref(24) // Default FPS

const localData = ref<TimecodeNotesData>(
  props.card.timecodeNotesData || {
    title: 'Timecode Notes',
    videoUrl: '',
    notes: []
  }
)

const currentTimecode = computed(() => {
  return formatTimecode(currentTime.value, fps.value)
})

const sortedNotes = computed(() => {
  return [...localData.value.notes].sort((a, b) => {
    const timeA = parseTimecode(a.timecode, fps.value)
    const timeB = parseTimecode(b.timecode, fps.value)
    return timeA - timeB
  })
})

const getCategoryClass = (category: string) => {
  const classes = {
    good: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    issue: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    retake: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    favorite: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
  }
  return classes[category as keyof typeof classes] || classes.good
}

const categoryCount = (category: string) => {
  return localData.value.notes.filter(n => n.category === category).length
}

const updateCurrentTime = () => {
  if (videoPlayer.value) {
    currentTime.value = videoPlayer.value.currentTime
  }
}

const onVideoLoaded = () => {
  if (videoPlayer.value) {
    // Try to detect FPS from video metadata (not always available)
    // Default to 24fps if not detectable
    fps.value = 24
  }
}

const addNote = () => {
  localData.value.notes.push({
    id: crypto.randomUUID(),
    timecode: '00:00:00:00',
    note: '',
    category: 'good',
    color: '#10b981'
  })
  updateData()
}

const addNoteAtCurrentTime = () => {
  const timecode = formatTimecode(currentTime.value, fps.value)
  localData.value.notes.push({
    id: crypto.randomUUID(),
    timecode,
    note: '',
    category: 'good',
    color: '#10b981'
  })
  updateData()
}

const removeNote = (index: number) => {
  localData.value.notes.splice(index, 1)
  updateData()
}

const seekToTimecode = (timecode: string) => {
  if (videoPlayer.value) {
    const seconds = parseTimecode(timecode, fps.value)
    videoPlayer.value.currentTime = seconds
  }
}

const updateData = () => {
  canvasStore.updateCard(props.card.id, {
    timecodeNotesData: localData.value
  })
}

watch(
  () => props.card.timecodeNotesData,
  (newData) => {
    if (newData) {
      localData.value = newData
    }
  },
  { deep: true }
)
</script>
