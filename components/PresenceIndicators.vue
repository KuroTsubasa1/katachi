<template>
  <div class="presence-indicators">
    <!-- Active users badges (top-right) -->
    <div v-if="remoteUsers.length > 0" class="fixed top-4 right-4 z-[9997] flex items-center gap-2">
      <div
        v-for="user in remoteUsers"
        :key="user.userId"
        class="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-sm font-medium"
        :style="{ backgroundColor: user.color }"
        :title="user.userName"
      >
        {{ user.userName.charAt(0).toUpperCase() }}
      </div>
    </div>

    <!-- Remote cursors -->
    <UserCursor
      v-for="user in remoteUsers"
      :key="user.userId"
      :user="user"
    />
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { usePresence } from '~/composables/usePresence'

const { remoteUsers } = usePresence()

console.log('[PresenceIndicators] Component initialized')

watch(remoteUsers, (users) => {
  console.log('[PresenceIndicators] Remote users changed:', users.length, users)
}, { immediate: true, deep: true })
</script>
