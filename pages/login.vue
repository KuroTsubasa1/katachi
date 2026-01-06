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

      <div v-if="success" class="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm">
        {{ success }}
      </div>

      <!-- Step 1: Enter Email -->
      <form v-if="!codeSent" @submit.prevent="requestCode" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
          <input
            v-model="email"
            type="email"
            required
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
            placeholder="you@example.com"
            :disabled="loading"
          />
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
        >
          {{ loading ? 'Sending code...' : 'Send Login Code' }}
        </button>
      </form>

      <!-- Step 2: Enter Code -->
      <form v-else @submit.prevent="verifyCode" class="space-y-4">
        <div class="text-center mb-4">
          <p class="text-gray-600 dark:text-gray-400 text-sm mb-2">
            Code sent to <strong>{{ email }}</strong>
          </p>
          <p class="text-red-600 dark:text-red-400 text-sm font-semibold">
            ⏱️ Expires in {{ timeRemaining }}s
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-center">
            Enter 6-Digit Code
          </label>
          <input
            v-model="code"
            type="text"
            inputmode="numeric"
            pattern="[0-9]{6}"
            maxlength="6"
            required
            class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 text-center text-2xl font-mono tracking-widest"
            placeholder="000000"
            :disabled="loading"
            autofocus
          />
        </div>

        <button
          type="submit"
          :disabled="loading || code.length !== 6"
          class="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
        >
          {{ loading ? 'Verifying...' : 'Verify Code' }}
        </button>

        <button
          type="button"
          @click="resetForm"
          class="w-full py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm"
        >
          ← Use different email
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'

const router = useRouter()

const email = ref('')
const code = ref('')
const codeSent = ref(false)
const loading = ref(false)
const error = ref('')
const success = ref('')
const timeRemaining = ref(120)

let countdownInterval: NodeJS.Timeout | null = null

const requestCode = async () => {
  error.value = ''
  success.value = ''
  loading.value = true

  try {
    const response = await $fetch('/api/auth/request-code', {
      method: 'POST',
      body: { email: email.value }
    })

    codeSent.value = true
    success.value = 'Code sent! Check your email.'

    // Start countdown
    timeRemaining.value = 120
    countdownInterval = setInterval(() => {
      timeRemaining.value--
      if (timeRemaining.value <= 0) {
        if (countdownInterval) clearInterval(countdownInterval)
        error.value = 'Code expired. Please request a new one.'
        resetForm()
      }
    }, 1000)
  } catch (err: any) {
    error.value = err.data?.message || 'Failed to send code'
  } finally {
    loading.value = false
  }
}

const verifyCode = async () => {
  error.value = ''
  loading.value = true

  try {
    const response = await $fetch('/api/auth/verify-code', {
      method: 'POST',
      body: {
        email: email.value,
        code: code.value
      }
    })

    if (countdownInterval) clearInterval(countdownInterval)
    router.push('/')
  } catch (err: any) {
    error.value = err.data?.message || 'Invalid code'
    code.value = ''
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  codeSent.value = false
  code.value = ''
  error.value = ''
  success.value = ''
  if (countdownInterval) clearInterval(countdownInterval)
}

onUnmounted(() => {
  if (countdownInterval) clearInterval(countdownInterval)
})
</script>
