import { getUserSession } from '../utils/session'
import { getUserById } from '../services/authService'

export default defineEventHandler(async (event) => {
  // Skip auth check for auth endpoints and public assets
  const path = event.path || ''
  if (
    path.startsWith('/api/auth') ||
    path.startsWith('/_nuxt') ||
    path.startsWith('/api/link-preview') ||
    path === '/' ||
    !path.startsWith('/api')
  ) {
    return
  }

  // Get session
  const session = await getUserSession(event)

  if (!session?.userId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }

  // Get user and attach to context
  const user = await getUserById(session.userId)

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Invalid session'
    })
  }

  // Attach user to event context
  event.context.user = user
})
