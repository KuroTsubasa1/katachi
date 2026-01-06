import { requestLoginCode } from '../../services/codeAuthService'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, name } = body

  if (!email) {
    throw createError({
      statusCode: 400,
      message: 'Email is required'
    })
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid email format'
    })
  }

  try {
    const result = await requestLoginCode(email, name)
    return result
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to send login code'
    })
  }
})
