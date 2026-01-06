import { shareBoard } from '../../services/sharingService'
import { sendBoardShareInvitation } from '../../services/emailService'
import { db } from '../../db'
import { boards } from '../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = event.context.user

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }

  const body = await readBody(event)
  const { boardId, email, permission } = body

  if (!boardId || !email || !permission) {
    throw createError({
      statusCode: 400,
      message: 'Missing required fields'
    })
  }

  if (!['view', 'edit', 'admin'].includes(permission)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid permission level'
    })
  }

  try {
    const result = await shareBoard(boardId, user.id, email, permission)

    // Get board name for email
    const board = await db.query.boards.findFirst({
      where: eq(boards.id, boardId)
    })

    // Send invitation email (non-blocking)
    if (board) {
      sendBoardShareInvitation(
        email,
        boardId,
        board.name,
        user.name || user.email,
        permission
      ).catch((emailError) => {
        console.error('Failed to send invitation email:', emailError)
        // Email failure doesn't block sharing
      })
    }

    return result
  } catch (error: any) {
    throw createError({
      statusCode: 400,
      message: error.message
    })
  }
})
