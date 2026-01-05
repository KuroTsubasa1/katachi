import { db } from '../db'
import { boardShares, boards, users } from '../db/schema'
import { eq, and } from 'drizzle-orm'

export async function shareBoard(
  boardId: string,
  ownerId: string,
  targetEmail: string,
  permission: 'view' | 'edit' | 'admin'
) {
  // Verify board ownership
  const board = await db.query.boards.findFirst({
    where: and(
      eq(boards.id, boardId),
      eq(boards.userId, ownerId)
    )
  })

  if (!board) {
    throw new Error('Board not found or unauthorized')
  }

  // Find target user
  const targetUser = await db.query.users.findFirst({
    where: eq(users.email, targetEmail)
  })

  if (!targetUser) {
    throw new Error('User not found')
  }

  // Check if already shared
  const existing = await db.query.boardShares.findFirst({
    where: and(
      eq(boardShares.boardId, boardId),
      eq(boardShares.userId, targetUser.id)
    )
  })

  if (existing) {
    // Update permission
    await db.update(boardShares)
      .set({ permission })
      .where(eq(boardShares.id, existing.id))

    return { updated: true }
  }

  // Create new share
  await db.insert(boardShares).values({
    boardId,
    userId: targetUser.id,
    permission,
    invitedBy: ownerId
  })

  return { created: true }
}

export async function getUserBoardPermission(userId: string, boardId: string): Promise<'owner' | 'admin' | 'edit' | 'view' | null> {
  // Check if owner
  const board = await db.query.boards.findFirst({
    where: and(
      eq(boards.id, boardId),
      eq(boards.userId, userId)
    )
  })

  if (board) {
    return 'owner'
  }

  // Check if shared
  const share = await db.query.boardShares.findFirst({
    where: and(
      eq(boardShares.boardId, boardId),
      eq(boardShares.userId, userId)
    )
  })

  if (share) {
    return share.permission as 'admin' | 'edit' | 'view'
  }

  return null
}

export async function getSharedBoards(userId: string) {
  return await db.query.boardShares.findMany({
    where: eq(boardShares.userId, userId),
    with: {
      board: true
    }
  })
}

export async function revokeAccess(boardId: string, ownerId: string, userId: string) {
  // Verify ownership
  const board = await db.query.boards.findFirst({
    where: and(
      eq(boards.id, boardId),
      eq(boards.userId, ownerId)
    )
  })

  if (!board) {
    throw new Error('Unauthorized')
  }

  await db.delete(boardShares)
    .where(and(
      eq(boardShares.boardId, boardId),
      eq(boardShares.userId, userId)
    ))

  return { success: true }
}
