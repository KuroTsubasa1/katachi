import { verifyLoginCode } from '../../services/codeAuthService'
import { createUserSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, code } = body

  if (!email || !code) {
    throw createError({
      statusCode: 400,
      message: 'Email and code are required'
    })
  }

  try {
    const user = await verifyLoginCode(email, code)
    await createUserSession(event, user.id)

    return {
      success: true,
      user
    }
  } catch (error: any) {
    throw createError({
      statusCode: 401,
      message: error.message || 'Invalid code'
    })
  }
})
