import { db } from '../../db'
import { users } from '../../db/schema'
import { eq, and, gt } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { token } = body

  if (!token) {
    throw createError({
      statusCode: 400,
      message: 'Verification token is required'
    })
  }

  // Find user with valid token
  const user = await db.query.users.findFirst({
    where: and(
      eq(users.verificationToken, token),
      gt(users.verificationTokenExpiry, new Date())
    )
  })

  if (!user) {
    throw createError({
      statusCode: 400,
      message: 'Invalid or expired verification token'
    })
  }

  // Verify email
  await db.update(users)
    .set({
      emailVerified: true,
      verificationToken: null,
      verificationTokenExpiry: null
    })
    .where(eq(users.id, user.id))

  return { success: true, message: 'Email verified successfully' }
})
