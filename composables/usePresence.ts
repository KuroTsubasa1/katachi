import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useWebSocket } from './useWebSocket'
import { useCanvasStore } from '~/stores/canvas'
import { useAuthStore } from '~/stores/auth'

interface RemoteUser {
  userId: string
  userName: string
  cursorX: number
  cursorY: number
  color: string
  lastSeen: number
}

const remoteUsers = ref<Map<string, RemoteUser>>(new Map())
const localCursor = ref<{ x: number, y: number } | null>(null)

let lastBroadcast = 0
const BROADCAST_INTERVAL = 100 // Throttle to 100ms

export const usePresence = () => {
  const canvasStore = useCanvasStore()
  const authStore = useAuthStore()
  const ws = useWebSocket()

  const handleMouseMove = (event: MouseEvent) => {
    const now = Date.now()
    if (now - lastBroadcast < BROADCAST_INTERVAL) return

    const viewport = canvasStore.viewport

    // Transform screen coordinates to canvas coordinates
    const canvasX = (event.clientX - viewport.x - 256) / viewport.scale // 256 = sidebar width
    const canvasY = (event.clientY - viewport.y) / viewport.scale

    // Update local cursor immediately
    localCursor.value = { x: canvasX, y: canvasY }

    // Broadcast to server
    if (ws.isConnected.value && canvasStore.currentBoard) {
      console.log('[Presence] Sending cursor update:', Math.round(canvasX), Math.round(canvasY))
      ws.send({
        type: 'presence_update',
        boardId: canvasStore.currentBoard.id,
        cursorX: Math.round(canvasX),
        cursorY: Math.round(canvasY)
      })
    }

    lastBroadcast = now
  }

  const handlePresenceUpdate = (event: any) => {
    const authStore = useAuthStore()

    console.log('[Presence] Received presence update:', event)

    // Don't show own cursor
    if (event.userId === authStore.user?.id) {
      console.log('[Presence] Ignoring own cursor')
      return
    }

    console.log('[Presence] Adding/updating remote user:', event.userId)

    remoteUsers.value.set(event.userId, {
      userId: event.userId,
      userName: event.userName || 'User',
      cursorX: event.cursorX,
      cursorY: event.cursorY,
      color: event.color || '#6366F1',
      lastSeen: Date.now()
    })

    console.log('[Presence] Total remote users:', remoteUsers.value.size)
  }

  const handlePresenceLeft = (event: any) => {
    remoteUsers.value.delete(event.userId)
  }

  // Cleanup stale users (haven't updated in 30s)
  const cleanupStaleUsers = () => {
    const now = Date.now()
    const STALE_THRESHOLD = 30000

    for (const [userId, user] of remoteUsers.value) {
      if (now - user.lastSeen > STALE_THRESHOLD) {
        remoteUsers.value.delete(userId)
      }
    }
  }

  let cleanupInterval: NodeJS.Timeout | null = null

  onMounted(() => {
    console.log('[Presence] Initializing presence tracking')

    // Register WebSocket event handlers
    ws.on('presence', handlePresenceUpdate)
    ws.on('presence_left', handlePresenceLeft)

    console.log('[Presence] WebSocket event handlers registered')

    // Track cursor movement
    window.addEventListener('mousemove', handleMouseMove)

    console.log('[Presence] Mouse tracking started')

    // Start cleanup interval
    cleanupInterval = setInterval(cleanupStaleUsers, 5000)
  })

  onUnmounted(() => {
    window.removeEventListener('mousemove', handleMouseMove)

    if (cleanupInterval) {
      clearInterval(cleanupInterval)
    }
  })

  return {
    remoteUsers: computed(() => Array.from(remoteUsers.value.values())),
    localCursor
  }
}
