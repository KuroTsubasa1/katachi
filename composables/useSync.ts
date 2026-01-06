import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useCanvasStore } from '~/stores/canvas'

const syncQueue = ref<any[]>([])
const isSyncing = ref(false)
const syncStatus = ref<'idle' | 'syncing' | 'synced' | 'error' | 'offline'>('idle')
let syncTimeout: NodeJS.Timeout | null = null

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

      const response = await $fetch('/api/boards/sync', {
        method: 'POST',
        body: { operations }
      })

      if (response.conflicts && response.conflicts.length > 0) {
        console.warn('Sync conflicts detected:', response.conflicts)
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
      console.error('Sync error:', error)
      syncStatus.value = 'error'

      // Re-queue failed operations
      syncQueue.value.push(...syncQueue.value)
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
            return serverBoard
          }

          // Compare timestamps - keep newer version
          const serverTime = new Date(serverBoard.updatedAt).getTime()
          const localTime = new Date(localBoard.updatedAt).getTime()

          return localTime > serverTime ? localBoard : serverBoard
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

  return {
    queueSync,
    syncStatus,
    startSync,
    isSyncing
  }
}
