import { processBatchSync } from '../../services/syncService'

export default defineEventHandler(async (event) => {
  const user = event.context.user

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }

  const body = await readBody(event)
  const { operations } = body

  if (!operations || !Array.isArray(operations)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid sync payload'
    })
  }

  const results = await processBatchSync(user.id, operations)

  return results
})
