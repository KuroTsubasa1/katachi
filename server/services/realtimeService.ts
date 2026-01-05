import { redis } from '../utils/session'
import { db } from '../db'
import { presence } from '../db/schema'
import { eq, and } from 'drizzle-orm'

export class RealtimeService {
  // Publish a change to all clients viewing a board
  static async publishBoardChange(boardId: string, event: any) {
    await redis.publish(`board:${boardId}`, JSON.stringify(event))
  }

  // Subscribe to board changes
  static async subscribeToBoardChanges(boardId: string, callback: (event: any) => void) {
    const subscriber = redis.duplicate()
    await subscriber.subscribe(`board:${boardId}`)

    subscriber.on('message', (channel, message) => {
      if (channel === `board:${boardId}`) {
        callback(JSON.parse(message))
      }
    })

    return subscriber
  }

  // Update user presence (cursor position)
  static async updatePresence(userId: string, boardId: string, cursorX: number, cursorY: number) {
    const existing = await db.query.presence.findFirst({
      where: and(
        eq(presence.userId, userId),
        eq(presence.boardId, boardId)
      )
    })

    if (existing) {
      await db.update(presence)
        .set({
          cursorX,
          cursorY,
          lastSeenAt: new Date()
        })
        .where(eq(presence.id, existing.id))
    } else {
      // Assign random color to user
      const color = `#${Math.floor(Math.random() * 16777215).toString(16)}`

      await db.insert(presence).values({
        userId,
        boardId,
        cursorX,
        cursorY,
        color,
        lastSeenAt: new Date()
      })
    }

    // Broadcast cursor update
    await this.publishBoardChange(boardId, {
      type: 'presence',
      userId,
      cursorX,
      cursorY
    })
  }

  // Get all active users on a board
  static async getActivePresence(boardId: string) {
    // Get all presence records for this board from last 5 minutes
    return await db.query.presence.findMany({
      where: eq(presence.boardId, boardId)
    })
  }

  // Remove presence when user leaves
  static async removePresence(userId: string, boardId: string) {
    await db.delete(presence)
      .where(and(
        eq(presence.userId, userId),
        eq(presence.boardId, boardId)
      ))

    await this.publishBoardChange(boardId, {
      type: 'presence_left',
      userId
    })
  }
}
