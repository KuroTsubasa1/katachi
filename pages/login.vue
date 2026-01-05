<template>
  <div class="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
    <div class="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl">
      <div class="text-center mb-8">
        <Logo :size="48" :showText="false" class="mx-auto mb-4" />
        <h1 class="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Katachi</h1>
        <p class="text-gray-600 dark:text-gray-400 text-sm">形 - Visual Workspace</p>
      </div>

      <div v-if="error" class="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
        {{ error }}
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
          <input
            v-model="email"
            type="email"
            required
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
          <input
            v-model="password"
            type="password"
            required
            minlength="8"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          :disabled="authStore.isLoading"
          class="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
        >
          {{ authStore.isLoading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>

      <div class="mt-6 text-center">
        <p class="text-gray-600 dark:text-gray-400 text-sm">
          Don't have an account?
          <NuxtLink to="/register" class="text-blue-600 dark:text-blue-400 hover:underline font-medium">
            Sign up
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref('')

const handleLogin = async () => {
  error.value = ''

  const result = await authStore.login(email.value, password.value)

  if (result.success) {
    router.push('/')
  } else {
    error.value = result.message || 'Login failed'
  }
}
</script>
