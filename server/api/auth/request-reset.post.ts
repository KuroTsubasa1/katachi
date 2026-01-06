import { db } from '../../db'
import { users } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { sendPasswordReset } from '../../services/emailService'
import crypto from 'crypto'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email } = body

  if (!email) {
    throw createError({
      statusCode: 400,
      message: 'Email is required'
    })
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, email)
  })

  // Always return success (don't reveal if email exists)
  if (!user) {
    return { success: true, message: 'If the email exists, a reset link has been sent' }
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex')
  const resetExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  // Save token
  await db.update(users)
    .set({
      passwordResetToken: resetToken,
      passwordResetExpiry: resetExpiry
    })
    .where(eq(users.id, user.id))

  // Send email
  try {
    await sendPasswordReset(email, resetToken)
  } catch (error) {
    console.error('Failed to send reset email:', error)
  }

  return { success: true, message: 'If the email exists, a reset link has been sent' }
})
