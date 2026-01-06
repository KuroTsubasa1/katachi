import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { db } from '../db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'

const SALT_ROUNDS = 10

export async function registerUser(email: string, password: string, name?: string) {
  // Check if user already exists
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1)

  if (existing.length > 0) {
    throw new Error('User already exists')
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString('hex')
  const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  // Create user
  const [user] = await db.insert(users).values({
    email,
    passwordHash,
    name: name || email.split('@')[0],
    emailVerified: false,
    verificationToken,
    verificationTokenExpiry: verificationExpiry
  }).returning()

  // TODO: Send verification email
  // await sendEmailVerification(email, verificationToken)

  return {
    id: user.id,
    email: user.email,
    name: user.name
  }
}

export async function authenticateUser(email: string, password: string) {
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1)

  if (result.length === 0) {
    throw new Error('Invalid credentials')
  }

  const user = result[0]
  const isValid = await bcrypt.compare(password, user.passwordHash)

  if (!isValid) {
    throw new Error('Invalid credentials')
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name
  }
}

export async function getUserById(id: string) {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1)

  if (result.length === 0) {
    return null
  }

  const user = result[0]
  return {
    id: user.id,
    email: user.email,
    name: user.name
  }
}
