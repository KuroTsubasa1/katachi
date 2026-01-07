import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useCanvasStore } from '~/stores/canvas'
import { useWebSocket } from '~/composables/useWebSocket'

const syncQueue = ref<any[]>([])
const isSyncing = ref(false)
const syncStatus = ref<'idle' | 'syncing' | 'synced' | 'error' | 'offline'>('idle')
let syncTimeout: NodeJS.Timeout | null = null
let pollInterval: NodeJS.Timeout | null = null
let wsInitialized = false

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

      if (response.errors && response.errors.length > 0) {
        console.error('[Sync] Errors:', response.errors)
        response.errors.forEach((err: any) => {
          console.error(`[Sync] Error for ${err.id}:`, err.message)
        })
      }

      if (response.conflicts && response.conflicts.length > 0) {
        console.warn('[Sync] Conflicts:', response.conflicts)
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
            return serverBoard
          }

          // Always use server version for real-time collaboration
          return serverBoard
        })

        // Add any local boards that don't exist on server yet
        localBoards.forEach(localBoard => {
          if (!serverBoards.find(sb => sb.id === localBoard.id)) {
            mergedBoards.push(localBoard)
          }
        })

        // Preserve current board selection
        if (currentBoardId) {
          const existingBoard = mergedBoards.find(b => b.id === currentBoardId)
          if (existingBoard) {
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

  const initWebSocket = () => {
    if (wsInitialized) return
    wsInitialized = true

    const ws = useWebSocket()

    // Setup event handlers
    ws.on('card_created', handleCardCreated)
    ws.on('card_updated', handleCardUpdated)
    ws.on('card_deleted', handleCardDeleted)
    ws.on('board_updated', handleBoardUpdated)
    ws.on('board_joined', handleBoardJoined)

    // Connect to WebSocket
    ws.connect()

    return ws
  }

  const handleCardCreated = (event: any) => {
    const canvasStore = useCanvasStore()
    if (!canvasStore.currentBoard || canvasStore.currentBoard.id !== event.data.boardId) {
      return
    }

    // Add card to current board
    const newCard = {
      ...event.data,
      id: event.cardId
    }

    if (!canvasStore.currentBoard.cards.find(c => c.id === event.cardId)) {
      canvasStore.currentBoard.cards.push(newCard)
      canvasStore.currentBoard.updatedAt = new Date().toISOString()
      canvasStore.boardVersion++
    }
  }

  const handleCardUpdated = (event: any) => {
    const canvasStore = useCanvasStore()
    if (!canvasStore.currentBoard) {
      return
    }

    const cardIndex = canvasStore.currentBoard.cards.findIndex(c => c.id === event.cardId)
    if (cardIndex !== -1) {
      // Merge updates
      canvasStore.currentBoard.cards[cardIndex] = {
        ...canvasStore.currentBoard.cards[cardIndex],
        ...event.data,
        id: event.cardId
      }
      canvasStore.currentBoard.updatedAt = new Date().toISOString()
      canvasStore.boardVersion++
    }
  }

  const handleCardDeleted = (event: any) => {
    const canvasStore = useCanvasStore()
    if (!canvasStore.currentBoard) return

    canvasStore.currentBoard.cards = canvasStore.currentBoard.cards.filter(c => c.id !== event.cardId)
    canvasStore.currentBoard.updatedAt = new Date().toISOString()
    canvasStore.boardVersion++
  }

  const handleBoardUpdated = (event: any) => {
    const canvasStore = useCanvasStore()
    if (!canvasStore.currentBoard || canvasStore.currentBoard.id !== event.boardId) {
      return
    }

    console.log('[WebSocket] Board updated:', event)

    // Update board properties including global drawing paths
    if (event.data.globalDrawingPaths !== undefined) {
      canvasStore.globalDrawingPaths = event.data.globalDrawingPaths
    }

    if (event.data.name) {
      canvasStore.currentBoard.name = event.data.name
    }

    if (event.data.backgroundColor) {
      canvasStore.currentBoard.backgroundColor = event.data.backgroundColor
    }

    canvasStore.currentBoard.updatedAt = new Date().toISOString()
  }

  const handleBoardJoined = (event: any) => {
    // Board successfully joined via WebSocket
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

      // Skip polling if WebSocket is connected
      const ws = useWebSocket()
      if (ws.isConnected.value) {
        console.log('[Polling] Skipping - WebSocket connected')
        return
      }

      try {
        const response = await $fetch('/api/boards')
        if (response.boards) {
          const currentBoardId = canvasStore.currentBoard?.id
          const serverBoards = response.boards
          const localBoards = canvasStore.boards

          // Create a map of local boards
          const localBoardMap = new Map(localBoards.map(b => [b.id, b]))

          // Merge: always use server for real-time collaboration
          const mergedBoards = serverBoards.map(serverBoard => {
            return serverBoard
          })

          // Add local-only boards
          localBoards.forEach(localBoard => {
            if (!serverBoards.find(sb => sb.id === localBoard.id)) {
              mergedBoards.push(localBoard)
            }
          })

          // Update boards array using $patch for proper reactivity
          canvasStore.$patch({
            boards: mergedBoards
          })

          // Force update current board to trigger reactivity
          if (currentBoardId) {
            const updatedCurrentBoard = mergedBoards.find(b => b.id === currentBoardId)
            if (updatedCurrentBoard) {
              // Only update if server version is actually newer
              const currentLocal = canvasStore.currentBoard
              if (currentLocal) {
                const serverTime = new Date(updatedCurrentBoard.updatedAt).getTime()
                const localTime = new Date(currentLocal.updatedAt).getTime()

                // Don't update if we have pending sync operations (user is actively editing)
                if (syncQueue.value.length > 0) {
                  console.log('[Polling] Skipping update - pending sync operations')
                  return
                }

                // Only update if server is actually newer
                if (serverTime <= localTime) {
                  return
                }
              }

              // Deep copy and force re-render
              canvasStore.$patch({
                currentBoard: JSON.parse(JSON.stringify(updatedCurrentBoard)),
                boardVersion: canvasStore.boardVersion + 1
              })
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

  const joinBoard = (boardId: string) => {
    const ws = useWebSocket()
    const authStore = useAuthStore()

    console.log('[WebSocket] joinBoard called - connected:', ws.isConnected.value, 'boardId:', boardId, 'userId:', authStore.user?.id)

    if (ws.isConnected.value) {
      console.log('[WebSocket] Sending join_board message')
      ws.send({
        type: 'join_board',
        boardId,
        userId: authStore.user?.id,
        userName: authStore.user?.name || authStore.user?.email || 'Anonymous'
      })
    } else {
      console.log('[WebSocket] Cannot join - not connected. Status:', ws.status.value)
    }
  }

  const leaveBoard = (boardId: string) => {
    const ws = useWebSocket()
    if (ws.isConnected.value) {
      console.log('[WebSocket] Leaving board:', boardId)
      ws.send({ type: 'leave_board', boardId })
    }
  }

  return {
    queueSync,
    syncStatus,
    startSync,
    isSyncing,
    startPolling,
    stopPolling,
    initWebSocket,
    joinBoard,
    leaveBoard
  }
}
