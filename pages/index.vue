<template>
  <div class="flex h-full">
    <!-- Sidebar -->
    <aside class="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
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
          @click="addCard('storyboard')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" /></svg>
          <span>Storyboard</span>
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

        <!-- Photography/Videography Section -->
        <div class="text-xs font-semibold text-gray-600 dark:text-gray-400 mt-4 mb-2">PHOTO/VIDEO PRODUCTION</div>

        <!-- Pre-Production -->
        <button class="w-full px-2 py-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded hover:bg-orange-100 dark:hover:bg-orange-900/30 transition text-xs flex items-center gap-2" @click="canvasStore.addShotListCard(getRandomPosition())">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
          <span>Shot List</span>
        </button>

        <button class="w-full px-2 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-100 dark:hover:bg-purple-900/30 transition text-xs flex items-center gap-2" @click="canvasStore.addMoodBoardCard(getRandomPosition())">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <span>Mood Board</span>
        </button>

        <button class="w-full px-2 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded hover:bg-green-100 dark:hover:bg-green-900/30 transition text-xs flex items-center gap-2" @click="canvasStore.addLocationScoutCard(getRandomPosition())">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
          <span>Location Scout</span>
        </button>

        <button class="w-full px-2 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition text-xs flex items-center gap-2" @click="canvasStore.addCallSheetCard(getRandomPosition())">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <span>Call Sheet</span>
        </button>

        <button class="w-full px-2 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded hover:bg-green-100 dark:hover:bg-green-900/30 transition text-xs flex items-center gap-2" @click="canvasStore.addEquipmentChecklistCard(getRandomPosition())">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
          <span>Equipment</span>
        </button>

        <button class="w-full px-2 py-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded hover:bg-orange-100 dark:hover:bg-orange-900/30 transition text-xs flex items-center gap-2" @click="canvasStore.addTalentModelCard(getRandomPosition())">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          <span>Talent/Model</span>
        </button>

        <button class="w-full px-2 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition text-xs flex items-center gap-2" @click="canvasStore.addReleaseFormTrackerCard(getRandomPosition())">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>Release Forms</span>
        </button>

        <button class="w-full px-2 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition text-xs flex items-center gap-2" @click="canvasStore.addWeatherPlanningCard(getRandomPosition())">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          <span>Weather</span>
        </button>

        <button class="w-full px-2 py-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded hover:bg-orange-100 dark:hover:bg-orange-900/30 transition text-xs flex items-center gap-2" @click="canvasStore.addScriptBreakdownCard(getRandomPosition())">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          <span>Script Breakdown</span>
        </button>

        <!-- Technical Tools -->
        <div class="text-xs font-semibold text-gray-600 dark:text-gray-400 mt-3 mb-2">TECHNICAL TOOLS</div>

        <button class="w-full px-2 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition text-xs flex items-center gap-2" @click="canvasStore.addLightingDiagramCard(getRandomPosition())">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
          <span>Lighting Diagram</span>
        </button>

        <button class="w-full px-2 py-1.5 bg-white dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition text-xs flex items-center gap-2" @click="canvasStore.addExifDataViewerCard(getRandomPosition())">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>EXIF Viewer</span>
        </button>

        <button class="w-full px-2 py-1.5 bg-white dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition text-xs flex items-center gap-2" @click="canvasStore.addColorPaletteCard(getRandomPosition())">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
          <span>Color Palette</span>
        </button>

        <button class="w-full px-2 py-1.5 bg-white dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition text-xs flex items-center gap-2" @click="canvasStore.addAspectRatioFrameCard(getRandomPosition())">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5z" /></svg>
          <span>Aspect Ratio</span>
        </button>

        <button class="w-full px-2 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition text-xs flex items-center gap-2" @click="canvasStore.addDepthOfFieldCalculatorCard(getRandomPosition())">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
          <span>DOF Calculator</span>
        </button>

        <button class="w-full px-2 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition text-xs flex items-center gap-2" @click="canvasStore.addTimeLapseCalculatorCard(getRandomPosition())">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>Timelapse Calc</span>
        </button>

        <button class="w-full px-2 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition text-xs flex items-center gap-2" @click="canvasStore.addCameraSettingsCard(getRandomPosition())">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <span>Camera Settings</span>
        </button>

        <button class="w-full px-2 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition text-xs flex items-center gap-2" @click="canvasStore.addLensSimulatorCard(getRandomPosition())">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <span>Lens Simulator</span>
        </button>

        <button class="w-full px-2 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition text-xs flex items-center gap-2" @click="canvasStore.addCameraMovementDiagramCard(getRandomPosition())">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" /></svg>
          <span>Camera Movement</span>
        </button>

        <!-- Production Tools -->
        <div class="text-xs font-semibold text-gray-600 dark:text-gray-400 mt-3 mb-2">PRODUCTION</div>

        <button class="w-full px-2 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-100 dark:hover:bg-purple-900/30 transition text-xs flex items-center gap-2" @click="canvasStore.addShotSequenceCard(getRandomPosition())">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" /></svg>
          <span>Shot Sequence</span>
        </button>

        <button class="w-full px-2 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition text-xs flex items-center gap-2" @click="canvasStore.addTimecodeNotesCard(getRandomPosition())">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>Timecode Notes</span>
        </button>

        <button class="w-full px-2 py-1.5 bg-white dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition text-xs flex items-center gap-2" @click="canvasStore.addBeforeAfterCard(getRandomPosition())">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
          <span>Before/After</span>
        </button>

        <button class="w-full px-2 py-1.5 bg-white dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition text-xs flex items-center gap-2" @click="canvasStore.addContactSheetCard(getRandomPosition())">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <span>Contact Sheet</span>
        </button>

        <!-- Post-Production -->
        <div class="text-xs font-semibold text-gray-600 dark:text-gray-400 mt-3 mb-2">POST-PRODUCTION</div>

        <button class="w-full px-2 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition text-xs flex items-center gap-2" @click="canvasStore.addEditDecisionListCard(getRandomPosition())">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          <span>Edit Decision List</span>
        </button>

        <button class="w-full px-2 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition text-xs flex items-center gap-2" @click="canvasStore.addClientFeedbackCard(getRandomPosition())">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
          <span>Client Feedback</span>
        </button>

        <button class="w-full px-2 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-100 dark:hover:bg-purple-900/30 transition text-xs flex items-center gap-2" @click="canvasStore.addLUTReferenceCard(getRandomPosition())">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
          <span>LUT Reference</span>
        </button>

        <button class="w-full px-2 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition text-xs flex items-center gap-2" @click="canvasStore.addDeliverySpecsCard(getRandomPosition())">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          <span>Delivery Specs</span>
        </button>

        <button class="w-full px-2 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-100 dark:hover:bg-purple-900/30 transition text-xs flex items-center gap-2" @click="canvasStore.addFileNamingConventionCard(getRandomPosition())">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
          <span>File Naming</span>
        </button>

        <button class="w-full px-2 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded hover:bg-green-100 dark:hover:bg-green-900/30 transition text-xs flex items-center gap-2" @click="canvasStore.addBudgetTrackerCard(getRandomPosition())">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>Budget Tracker</span>
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

const getRandomPosition = () => ({
  x: Math.random() * 400 + 100,
  y: Math.random() * 300 + 100
})

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
    case 'storyboard':
      canvasStore.addStoryboardCard(position)
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

      console.log('[Image] Creating card with imageUrl length:', imageUrl.length)
      canvasStore.addImageCard(
        getRandomPosition(),
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
