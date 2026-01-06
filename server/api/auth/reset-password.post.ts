import { db } from '../../db'
import { users } from '../../db/schema'
import { eq, and, gt } from 'drizzle-orm'
import bcrypt from 'bcrypt'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { token, newPassword } = body

  if (!token || !newPassword) {
    throw createError({
      statusCode: 400,
      message: 'Token and new password are required'
    })
  }

  if (newPassword.length < 8) {
    throw createError({
      statusCode: 400,
      message: 'Password must be at least 8 characters'
    })
  }

  // Find user with valid token
  const user = await db.query.users.findFirst({
    where: and(
      eq(users.passwordResetToken, token),
      gt(users.passwordResetExpiry, new Date())
    )
  })

  if (!user) {
    throw createError({
      statusCode: 400,
      message: 'Invalid or expired reset token'
    })
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 10)

  // Update password and clear reset token
  await db.update(users)
    .set({
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiry: null,
      updatedAt: new Date()
    })
    .where(eq(users.id, user.id))

  return { success: true, message: 'Password reset successful' }
})
