import { testEmailConnection } from '../services/emailService'

export default defineEventHandler(async (event) => {
  try {
    const result = await testEmailConnection()
    return result
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
      details: error.toString()
    }
  }
})
