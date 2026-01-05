import { useSession } from 'h3'
import type { H3Event } from 'h3'
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

export async function createUserSession(event: H3Event, userId: string) {
  const session = await useSession(event, {
    password: process.env.SESSION_SECRET || 'default-secret-change-in-production-min-32-chars',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  })

  await session.update({
    userId,
    createdAt: Date.now()
  })

  return session
}

export async function getUserSession(event: H3Event) {
  const session = await useSession(event, {
    password: process.env.SESSION_SECRET || 'default-secret-change-in-production-min-32-chars'
  })

  return session.data
}

export async function destroyUserSession(event: H3Event) {
  const session = await useSession(event, {
    password: process.env.SESSION_SECRET || 'default-secret-change-in-production-min-32-chars'
  })

  await session.clear()
}

export { redis }
