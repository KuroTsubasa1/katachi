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

    console.log(`[QueueSync] ${operation} ${entityType}:`, {
      id: data.id,
      type: data.type,
      content: data.content?.substring(0, 50),
      url: data.url,
      imageUrl: data.imageUrl,
      hasPosition: !!data.position,
      hasSize: !!data.size
    })

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

        // Merge: always prefer server for real-time collaboration
        const mergedBoards = serverBoards.map(serverBoard => {
          const localBoard = localBoardMap.get(serverBoard.id)

          if (!localBoard) {
            // New board from server
            console.log(`[StartSync] New board from server: ${serverBoard.name} with ${serverBoard.cards?.length || 0} cards`)
            return serverBoard
          }

          // Always use server version for consistency
          // Local changes are preserved via sync queue before startSync runs
          console.log(`[StartSync] ${serverBoard.name}: Using server (Server: ${serverBoard.cards?.length || 0} cards, Local: ${localBoard.cards?.length || 0} cards)`)
          return serverBoard
        })

        // Add any local boards that don't exist on server yet
        localBoards.forEach(localBoard => {
          if (!serverBoards.find(sb => sb.id === localBoard.id)) {
            mergedBoards.push(localBoard)
          }
        })

        // Preserve current board selection if it still exists
        if (currentBoardId) {
          const existingBoard = mergedBoards.find(b => b.id === currentBoardId)
          if (existingBoard) {
            console.log(`[StartSync] Setting current board: ${existingBoard.name} with ${existingBoard.cards?.length || 0} cards`)
            // Use $patch for proper Pinia reactivity
            canvasStore.$patch({
              boards: mergedBoards,
              currentBoard: JSON.parse(JSON.stringify(existingBoard))
            })
          } else if (mergedBoards.length > 0) {
            canvasStore.$patch({
              boards: mergedBoards,
              currentBoard: JSON.parse(JSON.stringify(mergedBoards[0]))
            })
          }
        } else if (mergedBoards.length > 0 && !canvasStore.currentBoard) {
          canvasStore.$patch({
            boards: mergedBoards,
            currentBoard: JSON.parse(JSON.stringify(mergedBoards[0]))
          })
        } else {
          canvasStore.$patch({ boards: mergedBoards })
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
          const currentBoardId = canvasStore.currentBoard?.id

          console.log('[Polling] Received boards from server:', response.boards.length)
          response.boards.forEach(b => {
            console.log(`  - ${b.name}: ${b.cards?.length || 0} cards`)
            if (b.id === currentBoardId) {
              console.log('    Current board cards detail:')
              b.cards?.forEach((c, i) => {
                console.log(`      Card ${i}: type=${c.type}, content="${c.content?.substring(0, 30)}", imageUrl="${c.imageUrl?.substring(0, 30)}"`)
              })
            }
          })

          const serverBoards = response.boards
          const localBoards = canvasStore.boards

          // Create a map of local boards
          const localBoardMap = new Map(localBoards.map(b => [b.id, b]))

          // Merge: always prefer server during polling for real-time updates
          const mergedBoards = serverBoards.map(serverBoard => {
            const localBoard = localBoardMap.get(serverBoard.id)

            if (!localBoard) {
              console.log(`[Polling] New board from server: ${serverBoard.name} with ${serverBoard.cards?.length || 0} cards`)
              return serverBoard
            }

            console.log(`[Polling] Comparing ${serverBoard.name}:`)
            console.log(`  - Server: ${serverBoard.cards?.length || 0} cards, updated: ${serverBoard.updatedAt}`)
            console.log(`  - Local: ${localBoard.cards?.length || 0} cards, updated: ${localBoard.updatedAt}`)
            console.log(`  → Using server version (polling always uses server)`)

            // During polling, always use server version for real-time updates
            // Local changes are preserved via sync queue
            return serverBoard
          })

          // Add local-only boards
          localBoards.forEach(localBoard => {
            if (!serverBoards.find(sb => sb.id === localBoard.id)) {
              mergedBoards.push(localBoard)
            }
          })

          console.log(`[Polling] Merged boards count: ${mergedBoards.length}`)

          // Update boards array using $patch for proper reactivity
          canvasStore.$patch({
            boards: mergedBoards
          })

          // Force update current board to trigger reactivity
          if (currentBoardId) {
            const updatedCurrentBoard = mergedBoards.find(b => b.id === currentBoardId)
            if (updatedCurrentBoard) {
              console.log(`[Polling] Updating current board: ${updatedCurrentBoard.name} with ${updatedCurrentBoard.cards?.length || 0} cards`)
              console.log('[Polling] Card contents before assignment:')
              updatedCurrentBoard.cards?.forEach((c, i) => {
                console.log(`  Card ${i}: "${c.content?.substring(0, 30)}"`)
              })

              // Deep copy to trigger Vue reactivity for nested objects
              const deepCopy = JSON.parse(JSON.stringify(updatedCurrentBoard))

              console.log('[Polling] Card contents after deep copy:')
              deepCopy.cards?.forEach((c, i) => {
                console.log(`  Card ${i}: "${c.content?.substring(0, 30)}"`)
              })

              // Use Pinia's $patch for proper reactivity
              canvasStore.$patch({
                currentBoard: deepCopy,
                boardVersion: canvasStore.boardVersion + 1  // Force component re-render
              })

              console.log('[Polling] Current board set (version: ' + canvasStore.boardVersion + '). Verifying canvasStore.currentBoard:')
              canvasStore.currentBoard?.cards?.forEach((c, i) => {
                console.log(`  Card ${i}: "${c.content?.substring(0, 30)}"`)
              })
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
