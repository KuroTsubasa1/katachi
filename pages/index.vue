<template>
  <div class="flex h-full">
    <!-- Sidebar -->
    <aside class="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <Logo :size="28" :showText="true" />
        <button
          @click="canvasStore.toggleDarkMode()"
          class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          <svg v-if="!canvasStore.darkMode" class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
          <svg v-else class="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </button>
      </div>

      <div class="flex-1 p-4 overflow-y-auto">
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-sm font-semibold text-gray-600 dark:text-gray-400">Boards</h2>
          <button
            @click="createNewBoard"
            class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            title="Create new board"
          >
            <svg class="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        <div
          v-for="board in canvasStore.boards"
          :key="board.id"
          class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer mb-1 text-gray-700 dark:text-gray-300"
          :class="{
            'bg-blue-100 dark:bg-blue-900': canvasStore.currentBoard?.id === board.id
          }"
          @click="canvasStore.currentBoard = board"
        >
          {{ board.name }}
        </div>
      </div>

      <div class="p-4 border-t border-gray-200 dark:border-gray-700 space-y-1.5">
        <div class="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3">ADD CONTENT</div>

        <button
          class="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm flex items-center gap-2"
          @click="addCard('text')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
          <span>Text Note</span>
        </button>

        <button
          class="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm flex items-center gap-2"
          @click="addCard('richtext')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          <span>Rich Text</span>
        </button>

        <button
          class="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm flex items-center gap-2"
          @click="addCard('column')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>
          <span>Column</span>
        </button>

        <label class="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm flex items-center gap-2 cursor-pointer">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <span>Image</span>
          <input type="file" accept="image/*" class="hidden" @change="handleImageUpload" />
        </label>

        <button
          class="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm flex items-center gap-2"
          @click="addCard('drawing')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          <span>Drawing</span>
        </button>

        <button
          class="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm flex items-center gap-2"
          @click="addCard('link')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
          <span>Link</span>
        </button>

        <button
          class="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm flex items-center gap-2"
          @click="addCard('table')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          <span>Table</span>
        </button>

        <button
          class="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm flex items-center gap-2"
          @click="addCard('audio')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
          <span>Audio</span>
        </button>

        <button
          class="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm flex items-center gap-2"
          @click="addCard('video')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          <span>Video</span>
        </button>

        <button
          class="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm flex items-center gap-2"
          @click="addCard('map')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <span>Map</span>
        </button>

        <button
          class="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm flex items-center gap-2"
          @click="addCard('markdown')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          <span>Markdown</span>
        </button>

        <button
          class="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm flex items-center gap-2"
          @click="addCard('todo')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
          <span>Todo List</span>
        </button>
      </div>
    </aside>

    <!-- Canvas Area -->
    <main class="flex-1 relative overflow-hidden bg-gray-50 dark:bg-gray-800">
      <CanvasBoard v-if="canvasStore.currentBoard" />
      <div v-else class="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
        No board selected
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useCanvasStore } from '~/stores/canvas'

const canvasStore = useCanvasStore()

const getRandomPosition = () => ({
  x: Math.random() * 400 + 100,
  y: Math.random() * 300 + 100
})

const createNewBoard = () => {
  const boardNumber = canvasStore.boards.length + 1
  canvasStore.createBoard(`Board ${boardNumber}`)
}

const addCard = (type: string) => {
  const position = getRandomPosition()

  switch (type) {
    case 'text':
      canvasStore.addCard({
        type: 'text',
        position,
        size: { width: 200, height: 150 },
        content: 'New note',
        color: '#f3f4f6'
      })
      break
    case 'richtext':
      canvasStore.addCard({
        type: 'richtext',
        position,
        size: { width: 400, height: 300 },
        content: '',
        htmlContent: '<p>Start typing...</p>',
        color: '#ffffff'
      })
      break
    case 'column':
      canvasStore.addColumnCard(position)
      break
    case 'drawing':
      canvasStore.addDrawingCard(position)
      break
    case 'sketch':
      // Removed - use global draw mode or drawing card instead
      break
    case 'link':
      canvasStore.addCard({
        type: 'link',
        position,
        size: { width: 350, height: 200 },
        content: '',
        url: '',
        color: '#ffffff'
      })
      break
    case 'table':
      canvasStore.addCard({
        type: 'table',
        position,
        size: { width: 400, height: 300 },
        content: '',
        tableData: {
          rows: 3,
          cols: 3,
          cells: [
            ['Column 1', 'Column 2', 'Column 3'],
            ['', '', ''],
            ['', '', '']
          ]
        },
        color: '#ffffff'
      })
      break
    case 'sketch':
      canvasStore.addCard({
        type: 'sketch',
        position,
        size: { width: 350, height: 350 },
        content: '',
        drawingData: { paths: [], color: '#000000', width: 2 },
        color: '#ffffff'
      })
      break
    case 'audio':
      canvasStore.addCard({
        type: 'audio',
        position,
        size: { width: 350, height: 200 },
        content: '',
        audioUrl: '',
        color: '#faf5ff'
      })
      break
    case 'video':
      canvasStore.addCard({
        type: 'video',
        position,
        size: { width: 500, height: 350 },
        content: '',
        videoUrl: '',
        color: '#eff6ff'
      })
      break
    case 'map':
      canvasStore.addCard({
        type: 'map',
        position,
        size: { width: 400, height: 350 },
        content: '',
        mapLocation: '',
        color: '#f0fdf4'
      })
      break
    case 'markdown':
      canvasStore.addCard({
        type: 'markdown',
        position,
        size: { width: 500, height: 400 },
        content: '',
        markdown: '# Heading\n\nStart writing markdown...',
        color: '#ffffff'
      })
      break
    case 'todo':
      canvasStore.addCard({
        type: 'todo',
        position,
        size: { width: 300, height: 250 },
        content: '',
        todoData: {
          title: 'Todo List',
          items: []
        },
        color: '#f0f9ff'
      })
      break
  }
}

const handleImageUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  // Create object URL for the image
  const imageUrl = URL.createObjectURL(file)

  // Create an image to get dimensions
  const img = new Image()
  img.onload = () => {
    const maxSize = 400
    let width = img.width
    let height = img.height

    if (width > maxSize || height > maxSize) {
      const ratio = Math.min(maxSize / width, maxSize / height)
      width = width * ratio
      height = height * ratio
    }

    canvasStore.addImageCard(
      getRandomPosition(),
      imageUrl,
      { width, height }
    )
  }
  img.src = imageUrl

  // Reset input
  input.value = ''
}
</script>
