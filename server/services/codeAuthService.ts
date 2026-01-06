import { db } from '../db'
import { users } from '../db/schema'
import { eq, and, gt } from 'drizzle-orm'
import { sendLoginCode } from './emailService'

// Generate a 6-digit code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function requestLoginCode(email: string, name?: string) {
  // Check if user exists
  let user = await db.select().from(users).where(eq(users.email, email)).limit(1)

  if (user.length === 0) {
    // Create new user (passwordless registration)
    const [newUser] = await db.insert(users).values({
      email,
      name: name || email.split('@')[0],
      emailVerified: true
    }).returning()

    user = [newUser]
  }

  // Generate 6-digit code
  const code = generateCode()
  const expiry = new Date(Date.now() + 120 * 1000) // 120 seconds = 2 minutes

  // Save code to database
  await db.update(users)
    .set({
      loginCode: code,
      loginCodeExpiry: expiry
    })
    .where(eq(users.id, user[0].id))

  // Send code via email
  try {
    await sendLoginCode(email, code)
  } catch (error) {
    console.error('Failed to send login code email:', error)
    throw new Error('Failed to send login code. Please try again.')
  }

  return {
    success: true,
    message: 'Login code sent to your email',
    expiresIn: 120
  }
}

export async function verifyLoginCode(email: string, code: string) {
  const result = await db.select()
    .from(users)
    .where(and(
      eq(users.email, email),
      eq(users.loginCode, code),
      gt(users.loginCodeExpiry, new Date())
    ))
    .limit(1)

  if (result.length === 0) {
    throw new Error('Invalid or expired code')
  }

  const user = result[0]

  // Clear the code after successful verification
  await db.update(users)
    .set({
      loginCode: null,
      loginCodeExpiry: null,
      lastLoginAt: new Date()
    })
    .where(eq(users.id, user.id))

  return {
    id: user.id,
    email: user.email,
    name: user.name
  }
}
