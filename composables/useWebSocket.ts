import { reactive, computed } from 'vue'

interface WebSocketState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error'
  socket: WebSocket | null
  reconnectAttempts: number
  messageQueue: any[]
}

const state = reactive<WebSocketState>({
  status: 'disconnected',
  socket: null,
  reconnectAttempts: 0,
  messageQueue: []
})

const eventHandlers = new Map<string, ((data: any) => void)[]>()
let reconnectTimeout: NodeJS.Timeout | null = null
let heartbeatInterval: NodeJS.Timeout | null = null

export const useWebSocket = () => {
  const connect = () => {
    if (state.socket?.readyState === WebSocket.OPEN) {
      return // Already connected
    }

    if (state.socket?.readyState === WebSocket.CONNECTING) {
      return // Connection in progress
    }

    state.status = 'connecting'

    try {
      // Determine WebSocket URL
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = window.location.host
      const wsUrl = `${protocol}//${host}/api/ws`

      console.log('[WebSocket] Connecting to:', wsUrl)

      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('[WebSocket] Connected')
        state.status = 'connected'
        state.socket = ws
        state.reconnectAttempts = 0

        // Start heartbeat
        startHeartbeat()

        // Flush queued messages
        flushMessageQueue()
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          handleMessage(data)
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error)
        state.status = 'error'
      }

      ws.onclose = () => {
        console.log('[WebSocket] Disconnected')
        state.status = 'disconnected'
        state.socket = null

        // Stop heartbeat
        stopHeartbeat()

        // Schedule reconnect with exponential backoff
        scheduleReconnect()
      }

      state.socket = ws

    } catch (error) {
      console.error('[WebSocket] Connection error:', error)
      state.status = 'error'
      scheduleReconnect()
    }
  }

  const disconnect = () => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }

    stopHeartbeat()

    if (state.socket) {
      state.socket.close()
      state.socket = null
    }

    state.status = 'disconnected'
    state.reconnectAttempts = 0
  }

  const send = (message: any) => {
    if (state.socket?.readyState === WebSocket.OPEN) {
      try {
        state.socket.send(JSON.stringify(message))
      } catch (error) {
        console.error('[WebSocket] Failed to send message:', error)
        // Queue message for retry
        state.messageQueue.push(message)
      }
    } else {
      // Queue message until connected
      state.messageQueue.push(message)

      // Attempt to connect if not already
      if (state.status === 'disconnected' || state.status === 'error') {
        connect()
      }
    }
  }

  const on = (eventType: string, handler: (data: any) => void) => {
    if (!eventHandlers.has(eventType)) {
      eventHandlers.set(eventType, [])
    }
    eventHandlers.get(eventType)!.push(handler)

    // Return unsubscribe function
    return () => {
      const handlers = eventHandlers.get(eventType)
      if (handlers) {
        const index = handlers.indexOf(handler)
        if (index > -1) {
          handlers.splice(index, 1)
        }
      }
    }
  }

  const off = (eventType: string, handler?: (data: any) => void) => {
    if (!handler) {
      eventHandlers.delete(eventType)
    } else {
      const handlers = eventHandlers.get(eventType)
      if (handlers) {
        const index = handlers.indexOf(handler)
        if (index > -1) {
          handlers.splice(index, 1)
        }
      }
    }
  }

  return {
    connect,
    disconnect,
    send,
    on,
    off,
    status: computed(() => state.status),
    isConnected: computed(() => state.status === 'connected'),
    reconnectAttempts: computed(() => state.reconnectAttempts)
  }
}

// Private helper functions

function handleMessage(data: any) {
  const handlers = eventHandlers.get(data.type)
  if (handlers) {
    handlers.forEach(handler => {
      try {
        handler(data)
      } catch (error) {
        console.error(`[WebSocket] Handler error for ${data.type}:`, error)
      }
    })
  }

  // Also trigger wildcard handlers
  const wildcardHandlers = eventHandlers.get('*')
  if (wildcardHandlers) {
    wildcardHandlers.forEach(handler => handler(data))
  }
}

function flushMessageQueue() {
  while (state.messageQueue.length > 0 && state.socket?.readyState === WebSocket.OPEN) {
    const message = state.messageQueue.shift()
    try {
      state.socket.send(JSON.stringify(message))
    } catch (error) {
      console.error('[WebSocket] Failed to flush message:', error)
      // Put it back in the queue
      state.messageQueue.unshift(message)
      break
    }
  }
}

function scheduleReconnect() {
  if (reconnectTimeout) {
    return // Already scheduled
  }

  // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
  const delay = Math.min(1000 * Math.pow(2, state.reconnectAttempts), 30000)
  state.reconnectAttempts++

  console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${state.reconnectAttempts})`)

  reconnectTimeout = setTimeout(() => {
    reconnectTimeout = null
    const { connect } = useWebSocket()
    connect()
  }, delay)
}

function startHeartbeat() {
  // Send ping every 30 seconds to keep connection alive
  heartbeatInterval = setInterval(() => {
    if (state.socket?.readyState === WebSocket.OPEN) {
      try {
        state.socket.send(JSON.stringify({ type: 'ping' }))
      } catch (error) {
        console.error('[WebSocket] Heartbeat error:', error)
      }
    }
  }, 30000)
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval)
    heartbeatInterval = null
  }
}
