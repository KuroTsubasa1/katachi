import { defineStore } from 'pinia'
import { idbGet, idbSet, idbDelete } from '~/utils/idb'

interface User {
  id: string
  email: string
  name: string | null
}

const KATACHI_LOCAL_KEYS = [
  'katachi_boards',
  'katachi_current_board_id',
  'katachi_drawings',
  'katachi_viewport',
  'katachi_settings'
]

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    isAuthenticated: false,
    isOffline: false,
    isLoading: false
  }),

  actions: {
    async checkAuth() {
      try {
        const response = await $fetch('/api/auth/me')
        if (response.user) {
          this.user = response.user
          this.isAuthenticated = true
          this.isOffline = false
          await idbSet('user', response.user)
        } else {
          // Server reachable and explicitly says: no session.
          this.user = null
          this.isAuthenticated = false
          this.isOffline = false
          await idbDelete('user')
        }
      } catch (error: any) {
        const status = error?.statusCode || error?.response?.status
        if (status === 401) {
          // Genuinely logged out.
          this.user = null
          this.isAuthenticated = false
          this.isOffline = false
          await idbDelete('user')
        } else {
          // Network/server unreachable: trust the last known session.
          const cached = await idbGet<User | null>('user', null)
          if (cached) {
            this.user = cached
            this.isAuthenticated = true
            this.isOffline = true
          } else {
            this.user = null
            this.isAuthenticated = false
          }
        }
      }
    },

    async login(email: string, password: string) {
      this.isLoading = true
      try {
        const response = await $fetch('/api/auth/login', {
          method: 'POST',
          body: { email, password }
        })
        this.user = response.user
        this.isAuthenticated = true
        this.isOffline = false
        await idbSet('user', response.user)
        return { success: true }
      } catch (error: any) {
        return { success: false, message: error.data?.message || 'Login failed' }
      } finally {
        this.isLoading = false
      }
    },

    async register(email: string, password: string, name?: string) {
      this.isLoading = true
      try {
        const response = await $fetch('/api/auth/register', {
          method: 'POST',
          body: { email, password, name }
        })
        this.user = response.user
        this.isAuthenticated = true
        this.isOffline = false
        await idbSet('user', response.user)
        return { success: true }
      } catch (error: any) {
        return { success: false, message: error.data?.message || 'Registration failed' }
      } finally {
        this.isLoading = false
      }
    },

    async logout() {
      try {
        await $fetch('/api/auth/logout', { method: 'POST' })
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        this.user = null
        this.isAuthenticated = false
        this.isOffline = false
        if (typeof window !== 'undefined') {
          await idbDelete('user')
          await idbSet('boards', null)
          await idbSet('currentBoardId', '')
          await idbSet('drawings', null)
          KATACHI_LOCAL_KEYS.forEach(key => localStorage.removeItem(key))
        }
      }
    }
  }
})
