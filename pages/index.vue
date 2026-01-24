<template>
  <div class="flex h-full relative">
    <!-- Mobile Header -->
    <div class="md:hidden absolute top-4 left-4 z-30">
      <button
        @click="isSidebarOpen = !isSidebarOpen"
        class="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md text-gray-700 dark:text-gray-200"
      >
        <svg v-if="!isSidebarOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Mobile Sidebar Overlay -->
    <div
      v-if="isSidebarOpen"
      class="fixed inset-0 bg-black/50 z-40 md:hidden"
      @click="isSidebarOpen = false"
    ></div>

    <!-- Sidebar -->
    <aside
      class="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-transform duration-300 ease-in-out absolute md:relative h-full z-50 md:z-0 md:translate-x-0"
      :class="{ '-translate-x-full': !isSidebarOpen, 'translate-x-0': isSidebarOpen }"
    >
      <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <Logo :size="28" :showText="true" />
        <div class="flex items-center gap-1">
          <SyncStatus v-if="authStore.isAuthenticated" />
          <button
            @click="canvasStore.toggleDarkMode()"
            class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            title="Toggle dark mode"
          >
            <svg v-if="!canvasStore.darkMode" class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            <svg v-else class="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </button>
          <button
            v-if="authStore.isAuthenticated"
            @click="handleLogout"
            class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            title="Logout"
          >
            <svg class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Boards Section (50% height) -->
      <div class="flex-1 p-4 overflow-y-auto">
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-sm font-semibold text-gray-600 dark:text-gray-400">Boards</h2>
          <div class="flex gap-1">
            <button
              v-if="authStore.isAuthenticated && canvasStore.currentBoard"
              @click="openShareDialog"
              class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              title="Share board"
            >
              <svg class="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
            <button
              v-if="authStore.isAuthenticated && canvasStore.currentBoard"
              @click="showHistoryDialog = true"
              class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              title="Version history"
            >
              <svg class="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button
              @click="exportData"
              class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              title="Export all data"
            >
              <svg class="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
            <label class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition cursor-pointer" title="Import data">
              <svg class="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <input type="file" accept=".json" class="hidden" @change="importData" />
            </label>
            <button
              @click="showTemplateSelector = true"
              class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              title="Create from template"
            >
              <svg class="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
            </button>
            <button
              @click="createNewBoard"
              class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              title="Create blank board"
            >
              <svg class="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
        <div
          v-for="board in canvasStore.boards"
          :key="board.id"
          class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer mb-1 text-gray-700 dark:text-gray-300 group flex items-center justify-between"
          :class="{
            'bg-blue-100 dark:bg-blue-900': canvasStore.currentBoard?.id === board.id
          }"
          @click="canvasStore.currentBoard = board"
        >
          <span>{{ board.name }}</span>
          <div v-if="canvasStore.currentBoard?.id === board.id" class="flex gap-1 opacity-0 group-hover:opacity-100">
            <button
              @click.stop="startRename(board)"
              class="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              title="Rename board"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              @click.stop="confirmDeleteBoard(board)"
              class="p-1 hover:bg-red-200 dark:hover:bg-red-900 rounded"
              title="Delete board"
            >
              <svg class="w-3 h-3 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Content Tools Section (50% height) -->
      <div class="flex-1 p-4 border-t border-gray-200 dark:border-gray-700 overflow-y-auto">
        <div class="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3">ADD CONTENT</div>
        <div class="space-y-1.5">

        <button
          class="w-full px-3 py-3 md:py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm flex items-center gap-2 min-h-[48px] md:min-h-0"
          @click="addCard('text')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
          <span>Text Note</span>
        </button>

        <button
          class="w-full px-3 py-3 md:py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm flex items-center gap-2 min-h-[48px] md:min-h-0"
          @click="addCard('richtext')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          <span>Rich Text</span>
        </button>

        <button
          class="w-full px-3 py-3 md:py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm flex items-center gap-2 min-h-[48px] md:min-h-0"
          @click="addCard('column')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>
          <span>Column</span>
        </button>

        <label class="w-full px-3 py-3 md:py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm flex items-center gap-2 min-h-[48px] md:min-h-0 cursor-pointer">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <span>Image</span>
          <input type="file" accept="image/*" class="hidden" @change="handleImageUpload" />
        </label>

        <button
          class="w-full px-3 py-3 md:py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm flex items-center gap-2 min-h-[48px] md:min-h-0"
          @click="addCard('drawing')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          <span>Drawing</span>
        </button>

        <button
          class="w-full px-3 py-3 md:py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm flex items-center gap-2 min-h-[48px] md:min-h-0"
          @click="addCard('link')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
          <span>Link</span>
        </button>

        <button
          class="w-full px-3 py-3 md:py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm flex items-center gap-2 min-h-[48px] md:min-h-0"
          @click="addCard('table')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          <span>Table</span>
        </button>

        <button
          class="w-full px-3 py-3 md:py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm flex items-center gap-2 min-h-[48px] md:min-h-0"
          @click="addCard('storyboard')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" /></svg>
          <span>Storyboard</span>
        </button>

        <button
          class="w-full px-3 py-3 md:py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm flex items-center gap-2 min-h-[48px] md:min-h-0"
          @click="addCard('audio')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
          <span>Audio</span>
        </button>

        <button
          class="w-full px-3 py-3 md:py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm flex items-center gap-2 min-h-[48px] md:min-h-0"
          @click="addCard('video')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          <span>Video</span>
        </button>

        <button
          class="w-full px-3 py-3 md:py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm flex items-center gap-2 min-h-[48px] md:min-h-0"
          @click="addCard('map')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <span>Map</span>
        </button>

        <button
          class="w-full px-3 py-3 md:py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm flex items-center gap-2 min-h-[48px] md:min-h-0"
          @click="addCard('markdown')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          <span>Markdown</span>
        </button>

        <button
          class="w-full px-3 py-3 md:py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm flex items-center gap-2 min-h-[48px] md:min-h-0"
          @click="addCard('todo')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
          <span>Todo List</span>
        </button>

        <button
          class="w-full px-3 py-3 md:py-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 text-gray-700 dark:text-gray-200 rounded hover:from-blue-200 hover:to-purple-200 dark:hover:from-blue-800 dark:hover:to-purple-800 transition text-sm flex items-center gap-2 min-h-[48px] md:min-h-0 font-medium"
          @click="addCard('mindmap')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
          <span>Mind Map</span>
        </button>
        </div>
      </div>

      <!-- Sidebar Footer with utility buttons -->
      <div class="p-3 border-t border-gray-200 dark:border-gray-700">
        <div class="flex gap-2 justify-center">
          <a
            href="https://github.com/KuroTsubasa1/katachi"
            target="_blank"
            rel="noopener noreferrer"
            class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            title="View on GitHub"
          >
            <svg class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24">
              <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd" />
            </svg>
          </a>

          <button
            @click="showShortcutsHelp"
            class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            title="Keyboard Shortcuts (?)"
          >
            <svg class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>
    </aside>

    <!-- Canvas Area -->
    <main class="flex-1 relative overflow-hidden bg-gray-50 dark:bg-gray-800">
      <CanvasBoard v-if="canvasStore.currentBoard" />
      <div v-else class="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
        No board selected
      </div>
    </main>

    <!-- Dialogs -->
    <ShareBoardDialog
      :isOpen="showShareDialog"
      :boardId="sharingBoardId"
      @close="closeShareDialog"
    />

    <VersionHistoryDialog
      :isOpen="showHistoryDialog"
      entityType="board"
      :entityId="canvasStore.currentBoard?.id || null"
      @close="showHistoryDialog = false"
      @restore="handleRestoreVersion"
    />

    <RenameBoardDialog
      :isOpen="showRenameDialog"
      :board="renamingBoard"
      @close="showRenameDialog = false; renamingBoard = null"
      @rename="handleRenameBoard"
    />

    <TemplateSelector
      :isOpen="showTemplateSelector"
      @close="showTemplateSelector = false"
    />

    <DeleteBoardDialog
      :isOpen="showDeleteDialog"
      :board="deletingBoard"
      @close="showDeleteDialog = false; deletingBoard = null"
      @delete="handleDeleteBoard"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCanvasStore } from '~/stores/canvas'
import { useAuthStore } from '~/stores/auth'
import { useRoute } from 'vue-router'
import { useKeyboardShortcuts } from '~/composables/useKeyboardShortcuts'

const canvasStore = useCanvasStore()
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const { openShortcutsHelp } = useKeyboardShortcuts()

const isSidebarOpen = ref(false)
const showShareDialog = ref(false)
const showHistoryDialog = ref(false)
const showRenameDialog = ref(false)
const showTemplateSelector = ref(false)
const showDeleteDialog = ref(false)
const renamingBoard = ref<any>(null)
const deletingBoard = ref<any>(null)
const sharingBoardId = ref<string | null>(null)

const showShortcutsHelp = () => {
  openShortcutsHelp()
}

const confirmDeleteBoard = (board: any) => {
  deletingBoard.value = board
  showDeleteDialog.value = true
}

const handleDeleteBoard = (boardId: string) => {
  canvasStore.deleteBoard(boardId)
}

// Handle shared board link from URL
onMounted(() => {
  const boardId = route.query.board as string
  if (boardId) {
    // Find the board in the loaded boards
    const board = canvasStore.boards.find(b => b.id === boardId)
    if (board) {
      canvasStore.currentBoard = board
    }
  }
})

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

const openShareDialog = () => {
  if (canvasStore.currentBoard) {
    sharingBoardId.value = canvasStore.currentBoard.id
    showShareDialog.value = true
  }
}

const closeShareDialog = () => {
  showShareDialog.value = false
  sharingBoardId.value = null
}

const startRename = (board: any) => {
  renamingBoard.value = board
  showRenameDialog.value = true
}

const handleRenameBoard = (boardId: string, newName: string) => {
  canvasStore.renameBoard(boardId, newName)
}

const handleRestoreVersion = (version: any) => {
  console.log('Restoring version:', version)
  // TODO: Implement restore logic
  alert('Version restore will be implemented')
}

const createNewBoard = () => {
  const boardNumber = canvasStore.boards.length + 1
  canvasStore.createBoard(`Board ${boardNumber}`)
}

const exportData = () => {
  const data = {
    boards: canvasStore.boards,
    viewport: canvasStore.viewport,
    globalDrawingPaths: canvasStore.globalDrawingPaths,
    settings: {
      snapToGrid: canvasStore.snapToGrid,
      darkMode: canvasStore.darkMode
    },
    exportedAt: new Date().toISOString(),
    version: '1.0'
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `katachi-backup-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const importData = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  try {
    const text = await file.text()
    const data = JSON.parse(text)

    if (confirm('This will replace all current boards. Continue?')) {
      canvasStore.boards = data.boards || []
      canvasStore.viewport = data.viewport || { x: 0, y: 0, scale: 1 }
      canvasStore.globalDrawingPaths = data.globalDrawingPaths || []

      if (data.settings) {
        canvasStore.snapToGrid = data.settings.snapToGrid || false
        if (data.settings.darkMode !== canvasStore.darkMode) {
          canvasStore.toggleDarkMode()
        }
      }

      if (canvasStore.boards.length > 0) {
        canvasStore.currentBoard = canvasStore.boards[0]
      }

      canvasStore.saveToLocalStorage()
      alert('Data imported successfully!')
    }
  } catch (error) {
    alert('Failed to import data. Please check the file format.')
    console.error('Import error:', error)
  }

  input.value = ''
}

const addCard = (type: string) => {
  console.log('='.repeat(80))
  console.log('🎯🎯🎯 ADDING NEW CARD - TYPE:', type)
  console.log('='.repeat(80))

  let size = { width: 200, height: 150 }

  // Set default sizes based on type
  switch (type) {
    case 'text': size = { width: 200, height: 150 }; break;
    case 'richtext': size = { width: 400, height: 300 }; break;
    case 'drawing': size = { width: 400, height: 400 }; break;
    case 'column': size = { width: 250, height: 500 }; break;
    case 'storyboard': size = { width: 600, height: 400 }; break;
    case 'link': size = { width: 350, height: 200 }; break;
    case 'table': size = { width: 400, height: 300 }; break;
    case 'sketch': size = { width: 350, height: 350 }; break;
    case 'audio': size = { width: 350, height: 200 }; break;
    case 'video': size = { width: 500, height: 350 }; break;
    case 'map': size = { width: 400, height: 350 }; break;
    case 'markdown': size = { width: 500, height: 400 }; break;
    case 'todo': size = { width: 300, height: 250 }; break;
  }

  console.log('🎯 [ADD CARD] Card size:', size)
  console.log('🎯 [ADD CARD] Viewport state:', {
    x: canvasStore.viewport.x,
    y: canvasStore.viewport.y,
    scale: canvasStore.viewport.scale,
    containerSize: canvasStore.containerSize
  })

  const position = canvasStore.getCenterPosition(size)

  console.log('🎯 [ADD CARD] Calculated position:', position)

  switch (type) {
    case 'text':
      canvasStore.addCard({
        type: 'text',
        position,
        size,
        content: 'New note',
        color: '#f3f4f6'
      })
      break
    case 'richtext':
      canvasStore.addCard({
        type: 'richtext',
        position,
        size,
        content: '',
        htmlContent: '<p>Start typing...</p>',
        color: '#ffffff'
      })
      break
    case 'column':
      // Columns have fixed size in store action but we can pass position
      canvasStore.addColumnCard(position)
      break
    case 'drawing':
      // Drawings have fixed size in store action
      canvasStore.addDrawingCard(position)
      break
    case 'link':
      canvasStore.addCard({
        type: 'link',
        position,
        size,
        content: '',
        url: '',
        color: '#ffffff'
      })
      break
    case 'table':
      canvasStore.addCard({
        type: 'table',
        position,
        size,
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
    case 'storyboard':
      canvasStore.addStoryboardCard(position)
      break
    case 'sketch':
      canvasStore.addCard({
        type: 'sketch',
        position,
        size,
        content: '',
        drawingData: { paths: [], color: '#000000', width: 2 },
        color: '#ffffff'
      })
      break
    case 'audio':
      canvasStore.addCard({
        type: 'audio',
        position,
        size,
        content: '',
        audioUrl: '',
        color: '#faf5ff'
      })
      break
    case 'video':
      canvasStore.addCard({
        type: 'video',
        position,
        size,
        content: '',
        videoUrl: '',
        color: '#eff6ff'
      })
      break
    case 'map':
      canvasStore.addCard({
        type: 'map',
        position,
        size,
        content: '',
        mapLocation: '',
        color: '#f0fdf4'
      })
      break
    case 'markdown':
      canvasStore.addCard({
        type: 'markdown',
        position,
        size,
        content: '',
        markdown: '# Heading\n\nStart writing markdown...',
        color: '#ffffff'
      })
      break
    case 'todo':
      canvasStore.addCard({
        type: 'todo',
        position,
        size,
        content: '',
        todoData: {
          title: 'Todo List',
          items: []
        },
        color: '#f0f9ff'
      })
      break
    case 'mindmap':
      // Create root mind map node
      const rootNode = canvasStore.addMindMapNode(position)
      // Auto-select the node for immediate editing
      canvasStore.selectCard(rootNode.id)
      break
  }
}

const handleImageUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  console.log('[Image] Uploading file:', file.name, 'Size:', file.size, 'bytes')

  // Convert to base64 data URL for persistence
  const reader = new FileReader()
  reader.onload = (e) => {
    const imageUrl = e.target?.result as string
    console.log('[Image] Base64 generated, length:', imageUrl.length, 'First 100 chars:', imageUrl.substring(0, 100))

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

      const position = canvasStore.getCenterPosition({ width, height })

      console.log('[Image] Creating card with imageUrl length:', imageUrl.length)
      canvasStore.addImageCard(
        position,
        imageUrl,
        { width, height }
      )
    }
    img.src = imageUrl
  }
  reader.readAsDataURL(file)

  // Reset input
  input.value = ''
}
</script>
