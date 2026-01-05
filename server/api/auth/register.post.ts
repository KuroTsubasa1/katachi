import { registerUser } from '../../services/authService'
import { createUserSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password, name } = body

  // Validation
  if (!email || !password) {
    throw createError({
      statusCode: 400,
      message: 'Email and password are required'
    })
  }

  if (password.length < 8) {
    throw createError({
      statusCode: 400,
      message: 'Password must be at least 8 characters'
    })
  }

  try {
    const user = await registerUser(email, password, name)
    await createUserSession(event, user.id)

    return {
      success: true,
      user
    }
  } catch (error: any) {
    throw createError({
      statusCode: 400,
      message: error.message || 'Registration failed'
    })
  }
})
