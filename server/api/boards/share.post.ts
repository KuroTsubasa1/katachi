import { shareBoard } from '../../services/sharingService'

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
    return result
  } catch (error: any) {
    throw createError({
      statusCode: 400,
      message: error.message
    })
  }
})
