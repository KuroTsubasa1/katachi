import { destroyUserSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  await destroyUserSession(event)

  return {
    success: true
  }
})
