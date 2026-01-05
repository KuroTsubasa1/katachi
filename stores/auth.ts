import { defineStore } from 'pinia'

interface User {
  id: string
  email: string
  name: string | null
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    isAuthenticated: false,
    isLoading: false
  }),

  actions: {
    async checkAuth() {
      try {
        const response = await $fetch('/api/auth/me')
        if (response.user) {
          this.user = response.user
          this.isAuthenticated = true
        } else {
          this.user = null
          this.isAuthenticated = false
        }
      } catch (error) {
        this.user = null
        this.isAuthenticated = false
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
        return { success: true }
      } catch (error: any) {
        return {
          success: false,
          message: error.data?.message || 'Login failed'
        }
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
        return { success: true }
      } catch (error: any) {
        return {
          success: false,
          message: error.data?.message || 'Registration failed'
        }
      } finally {
        this.isLoading = false
      }
    },

    async logout() {
      try {
        await $fetch('/api/auth/logout', { method: 'POST' })
        this.user = null
        this.isAuthenticated = false

        // Clear local data
        if (typeof window !== 'undefined') {
          localStorage.clear()
        }
      } catch (error) {
        console.error('Logout error:', error)
      }
    }
  }
})
