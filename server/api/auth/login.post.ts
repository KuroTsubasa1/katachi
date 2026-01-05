import { authenticateUser } from '../../services/authService'
import { createUserSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password } = body

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      message: 'Email and password are required'
    })
  }

  try {
    const user = await authenticateUser(email, password)
    await createUserSession(event, user.id)

    return {
      success: true,
      user
    }
  } catch (error: any) {
    throw createError({
      statusCode: 401,
      message: 'Invalid credentials'
    })
  }
})
