// Nitro WebSocket handler - requires nitro.experimental.websocket: true in nuxt.config.ts
import { RealtimeService } from '../services/realtimeService'

const connections = new Map<string, any>()

export default defineWebSocketHandler({
  open(peer) {
    console.log('[WebSocket] New connection')

    // Initialize peer context
    if (!peer.ctx) {
      peer.ctx = {}
    }

    // Assign a temporary user ID (will be replaced when board is joined)
    peer.ctx.userId = `anonymous-${peer.id}`

    connections.set(peer.id, peer)

    console.log(`[WebSocket] Peer ${peer.id} connected (total: ${connections.size})`)

    peer.send({ type: 'connected', peerId: peer.id })
  },

  message(peer, message) {
    try {
      const data = message.text ? JSON.parse(message.text()) : message

      console.log(`[WebSocket] Message from ${peer.id}:`, data.type)

      switch (data.type) {
        case 'join_board':
          handleJoinBoard(peer, data)
          break

        case 'leave_board':
          handleLeaveBoard(peer, data)
          break

        case 'ping':
          peer.send({ type: 'pong', timestamp: Date.now() })
          break

        default:
          console.warn(`[WebSocket] Unknown message type: ${data.type}`)
      }
    } catch (error) {
      console.error('[WebSocket] Message error:', error)
    }
  },

  close(peer, event) {
    console.log(`[WebSocket] Peer ${peer.id} disconnected`)

    // Cleanup Redis subscription
    if (peer.ctx?.subscriber) {
      peer.ctx.subscriber.unsubscribe().then(() => {
        return peer.ctx.subscriber.quit()
      }).catch((error: any) => {
        console.error('[WebSocket] Cleanup error:', error)
      })
    }

    // Remove presence
    if (peer.ctx?.userId && peer.ctx?.boardId) {
      RealtimeService.removePresence(peer.ctx.userId, peer.ctx.boardId).catch((error) => {
        console.error('[WebSocket] Presence cleanup error:', error)
      })
    }

    connections.delete(peer.id)
  },

  error(peer, error) {
    console.error('[WebSocket] Peer error:', error)
  }
})

async function handleJoinBoard(peer: any, message: any) {
  const boardId = message.boardId
  const userId = message.userId // Client sends their userId

  if (!boardId) {
    peer.send({ type: 'error', message: 'boardId required' })
    return
  }

  // Initialize context if needed
  if (!peer.ctx) {
    peer.ctx = {}
  }

  // Store the actual authenticated userId
  if (userId) {
    peer.ctx.userId = userId
  }

  console.log(`[WebSocket] Peer ${peer.id} (user: ${peer.ctx.userId}) joining board ${boardId}`)

  // Leave previous board
  if (peer.ctx.subscriber) {
    try {
      await peer.ctx.subscriber.unsubscribe()
      await peer.ctx.subscriber.quit()
    } catch (error) {
      console.error('[WebSocket] Error leaving previous board:', error)
    }
  }

  try {
    // Subscribe to board updates via Redis
    const subscriber = await RealtimeService.subscribeToBoardChanges(boardId, (event) => {
      // Don't echo back to sender
      if (event.userId === peer.ctx?.userId) {
        return
      }

      try {
        peer.send(event)
        console.log(`[WebSocket] Broadcasted ${event.type} to peer ${peer.id}`)
      } catch (error) {
        console.error('[WebSocket] Failed to send event:', error)
      }
    })

    peer.ctx.subscriber = subscriber
    peer.ctx.boardId = boardId

    peer.send({
      type: 'board_joined',
      boardId
    })

    console.log(`[WebSocket] Peer ${peer.id} successfully joined board ${boardId}`)
  } catch (error) {
    console.error('[WebSocket] Error joining board:', error)
    peer.send({ type: 'error', message: 'Failed to join board' })
  }
}

async function handleLeaveBoard(peer: any, message: any) {
  if (peer.ctx?.subscriber) {
    try {
      await peer.ctx.subscriber.unsubscribe()
      await peer.ctx.subscriber.quit()
      peer.ctx.subscriber = null
    } catch (error) {
      console.error('[WebSocket] Error leaving board:', error)
    }
  }

  if (peer.ctx) {
    peer.ctx.boardId = null
  }
  peer.send({ type: 'board_left' })
}
