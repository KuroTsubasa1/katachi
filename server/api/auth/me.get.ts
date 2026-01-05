import { getUserSession } from '../../utils/session'
import { getUserById } from '../../services/authService'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  if (!session?.userId) {
    return { user: null }
  }

  const user = await getUserById(session.userId)

  return { user }
})
