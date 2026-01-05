import bcrypt from 'bcrypt'
import { db } from '../db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'

const SALT_ROUNDS = 10

export async function registerUser(email: string, password: string, name?: string) {
  // Check if user already exists
  const existing = await db.query.users.findFirst({
    where: eq(users.email, email)
  })

  if (existing) {
    throw new Error('User already exists')
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

  // Create user
  const [user] = await db.insert(users).values({
    email,
    passwordHash,
    name: name || email.split('@')[0]
  }).returning()

  return {
    id: user.id,
    email: user.email,
    name: user.name
  }
}

export async function authenticateUser(email: string, password: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email)
  })

  if (!user) {
    throw new Error('Invalid credentials')
  }

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
  const user = await db.query.users.findFirst({
    where: eq(users.id, id)
  })

  if (!user) {
    return null
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name
  }
}
