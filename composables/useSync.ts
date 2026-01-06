import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useCanvasStore } from '~/stores/canvas'

const syncQueue = ref<any[]>([])
const isSyncing = ref(false)
const syncStatus = ref<'idle' | 'syncing' | 'synced' | 'error' | 'offline'>('idle')
let syncTimeout: NodeJS.Timeout | null = null
let pollInterval: NodeJS.Timeout | null = null

export const useSync = () => {
  const authStore = useAuthStore()
  const canvasStore = useCanvasStore()

  const queueSync = (entityType: string, operation: string, data: any) => {
    if (!authStore.isAuthenticated) {
      return // Skip sync if not authenticated
    }

    syncQueue.value.push({
      type: entityType,
      operation,
      id: data.id,
      data,
      version: data.version || 1
    })

    // Debounce - wait 500ms before syncing
    if (syncTimeout) {
      clearTimeout(syncTimeout)
    }

    syncTimeout = setTimeout(() => {
      processSyncQueue()
    }, 500)
  }

  const processSyncQueue = async () => {
    if (syncQueue.value.length === 0 || isSyncing.value) {
      return
    }

    if (!navigator.onLine) {
      syncStatus.value = 'offline'
      // Store in IndexedDB for later
      await saveToOfflineQueue(syncQueue.value)
      syncQueue.value = []
      return
    }

    isSyncing.value = true
    syncStatus.value = 'syncing'

    try {
      const operations = [...syncQueue.value]
      syncQueue.value = []

      console.log('[Sync] Processing operations:', operations)

      const response = await $fetch('/api/boards/sync', {
        method: 'POST',
        body: { operations }
      })

      console.log('[Sync] Response:', response)

      if (response.errors && response.errors.length > 0) {
        console.error('[Sync] Errors:', response.errors)
      }

      if (response.conflicts && response.conflicts.length > 0) {
        console.warn('[Sync] Conflicts detected:', response.conflicts)
        // Handle conflicts - for now, accept server version
        // TODO: Show conflict resolution UI
      }

      syncStatus.value = 'synced'
      setTimeout(() => {
        if (syncStatus.value === 'synced') {
          syncStatus.value = 'idle'
        }
      }, 2000)
    } catch (error) {
      console.error('[Sync] Error:', error)
      syncStatus.value = 'error'

      // Re-queue failed operations
      syncQueue.value.push(...operations)
    } finally {
      isSyncing.value = false
    }
  }

  const saveToOfflineQueue = async (operations: any[]) => {
    // Use IndexedDB for offline queue
    if (typeof window === 'undefined') return

    try {
      const db = await openIndexedDB()
      const tx = db.transaction('syncQueue', 'readwrite')
      const store = tx.objectStore('syncQueue')

      for (const op of operations) {
        await store.add({
          ...op,
          queuedAt: Date.now()
        })
      }
    } catch (error) {
      console.error('Failed to save to offline queue:', error)
    }
  }

  const openIndexedDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('KatachiDB', 1)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true })
        }
      }
    })
  }

  const startSync = async () => {
    // Initial sync - pull from server
    if (!authStore.isAuthenticated) return

    try {
      const response = await $fetch('/api/boards')
      if (response.boards) {
        // Merge server data with local data intelligently
        const serverBoards = response.boards
        const localBoards = canvasStore.boards
        const currentBoardId = canvasStore.currentBoard?.id

        // Create a map of local boards for quick lookup
        const localBoardMap = new Map(localBoards.map(b => [b.id, b]))

        // Merge: keep newer version based on updatedAt timestamp
        const mergedBoards = serverBoards.map(serverBoard => {
          const localBoard = localBoardMap.get(serverBoard.id)

          if (!localBoard) {
            // New board from server
            console.log(`[StartSync] New board from server: ${serverBoard.name} with ${serverBoard.cards?.length || 0} cards`)
            return serverBoard
          }

          // For shared boards, always prefer server; for owned, keep newer
          const isOwnedBoard = serverBoard.userId === authStore.user?.id

          if (!isOwnedBoard) {
            console.log(`[StartSync] ${serverBoard.name}: Using server (shared board, ${serverBoard.cards?.length || 0} cards)`)
            return serverBoard
          }

          // For owned boards, compare timestamps
          const serverTime = new Date(serverBoard.updatedAt).getTime()
          const localTime = new Date(localBoard.updatedAt).getTime()

          const result = localTime > serverTime ? localBoard : serverBoard
          console.log(`[StartSync] ${serverBoard.name}: Using ${result === localBoard ? 'local' : 'server'} (Server: ${serverBoard.cards?.length || 0} cards, Local: ${localBoard.cards?.length || 0} cards)`)
          return result
        })

        // Add any local boards that don't exist on server yet
        localBoards.forEach(localBoard => {
          if (!serverBoards.find(sb => sb.id === localBoard.id)) {
            mergedBoards.push(localBoard)
          }
        })

        canvasStore.boards = mergedBoards

        // Preserve current board selection if it still exists
        if (currentBoardId) {
          const existingBoard = mergedBoards.find(b => b.id === currentBoardId)
          if (existingBoard) {
            canvasStore.currentBoard = existingBoard
          } else if (mergedBoards.length > 0) {
            canvasStore.currentBoard = mergedBoards[0]
          }
        } else if (mergedBoards.length > 0 && !canvasStore.currentBoard) {
          canvasStore.currentBoard = mergedBoards[0]
        }
      }
    } catch (error) {
      console.error('Initial sync failed:', error)
    }
  }

  const startPolling = () => {
    // Poll for updates every 5 seconds
    if (pollInterval) {
      clearInterval(pollInterval)
    }

    pollInterval = setInterval(async () => {
      if (!authStore.isAuthenticated) {
        stopPolling()
        return
      }

      try {
        const response = await $fetch('/api/boards')
        if (response.boards) {
          console.log('[Polling] Received boards from server:', response.boards.length)
          response.boards.forEach(b => {
            console.log(`  - ${b.name}: ${b.cards?.length || 0} cards`)
          })

          const serverBoards = response.boards
          const localBoards = canvasStore.boards
          const currentBoardId = canvasStore.currentBoard?.id

          // Create a map of local boards
          const localBoardMap = new Map(localBoards.map(b => [b.id, b]))

          // Merge with priority to server for shared boards, local for owned
          const mergedBoards = serverBoards.map(serverBoard => {
            const localBoard = localBoardMap.get(serverBoard.id)

            if (!localBoard) {
              console.log(`[Polling] New board from server: ${serverBoard.name} with ${serverBoard.cards?.length || 0} cards`)
              return serverBoard
            }

            const serverTime = new Date(serverBoard.updatedAt).getTime()
            const localTime = new Date(localBoard.updatedAt).getTime()

            // For shared boards (not owned), always prefer server version
            const isOwnedBoard = serverBoard.userId === authStore.user?.id

            console.log(`[Polling] Comparing ${serverBoard.name}:`)
            console.log(`  - Owned: ${isOwnedBoard}`)
            console.log(`  - Server: ${serverBoard.cards?.length || 0} cards, updated: ${serverBoard.updatedAt}`)
            console.log(`  - Local: ${localBoard.cards?.length || 0} cards, updated: ${localBoard.updatedAt}`)

            if (!isOwnedBoard) {
              // For shared boards, always use server version (authoritative)
              console.log(`  → Using server version (shared board)`)
              return serverBoard
            }

            // For owned boards, keep newer version
            const result = localTime > serverTime ? localBoard : serverBoard
            console.log(`  → Using ${result === localBoard ? 'local' : 'server'} version`)
            return result
          })

          // Add local-only boards
          localBoards.forEach(localBoard => {
            if (!serverBoards.find(sb => sb.id === localBoard.id)) {
              mergedBoards.push(localBoard)
            }
          })

          console.log(`[Polling] Merged boards count: ${mergedBoards.length}`)
          canvasStore.boards = mergedBoards

          // Update current board if it was modified
          if (currentBoardId) {
            const updatedCurrentBoard = mergedBoards.find(b => b.id === currentBoardId)
            if (updatedCurrentBoard) {
              console.log(`[Polling] Updating current board: ${updatedCurrentBoard.name} with ${updatedCurrentBoard.cards?.length || 0} cards`)
              canvasStore.currentBoard = updatedCurrentBoard
            } else {
              console.log(`[Polling] Current board ${currentBoardId} not found in merged boards`)
            }
          }
        }
      } catch (error) {
        // Silently handle polling errors to avoid spam
        console.debug('Polling error:', error)
      }
    }, 5000) // Poll every 5 seconds
  }

  const stopPolling = () => {
    if (pollInterval) {
      clearInterval(pollInterval)
      pollInterval = null
    }
  }

  return {
    queueSync,
    syncStatus,
    startSync,
    isSyncing,
    startPolling,
    stopPolling
  }
}
