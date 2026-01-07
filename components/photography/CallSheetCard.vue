<template>
  <div class="h-full w-full flex flex-col bg-white dark:bg-gray-900 p-4 overflow-auto">
    <div class="flex items-center justify-between mb-4">
      <input
        v-model="localData.title"
        @blur="updateData"
        class="text-lg font-semibold bg-transparent border-none outline-none dark:text-white flex-1"
        placeholder="Call Sheet Title"
      />
    </div>

    <div class="grid grid-cols-2 gap-4 mb-4">
      <div>
        <label class="text-xs text-gray-500 dark:text-gray-400">Shoot Date</label>
        <input
          type="date"
          v-model="localData.shootDate"
          @change="updateData"
          class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        />
      </div>
      <div>
        <label class="text-xs text-gray-500 dark:text-gray-400">Call Time</label>
        <input
          type="time"
          v-model="localData.callTime"
          @change="updateData"
          class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        />
      </div>
      <div>
        <label class="text-xs text-gray-500 dark:text-gray-400">Wrap Time</label>
        <input
          type="time"
          v-model="localData.wrapTime"
          @change="updateData"
          class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        />
      </div>
    </div>

    <div class="mb-4">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-sm font-semibold dark:text-white">Schedule</h3>
        <button
          @click="addEntry"
          class="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
        >
          + Add Entry
        </button>
      </div>
      <div class="flex-1 overflow-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-100 dark:bg-gray-800 sticky top-0">
            <tr>
              <th class="p-2 text-left">Time</th>
              <th class="p-2 text-left">Activity</th>
              <th class="p-2 text-left">Location</th>
              <th class="p-2 text-left">People</th>
              <th class="p-2 text-left">Notes</th>
              <th class="p-2 w-8"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(entry, index) in localData.entries"
              :key="entry.id"
              class="border-b border-gray-200 dark:border-gray-700"
            >
              <td class="p-2">
                <input
                  type="time"
                  v-model="entry.time"
                  @blur="updateData"
                  class="w-full bg-transparent border-none outline-none dark:text-white"
                />
              </td>
              <td class="p-2">
                <input
                  v-model="entry.activity"
                  @blur="updateData"
                  class="w-full bg-transparent border-none outline-none dark:text-white"
                  placeholder="Activity"
                />
              </td>
              <td class="p-2">
                <input
                  v-model="entry.location"
                  @blur="updateData"
                  class="w-full bg-transparent border-none outline-none dark:text-white"
                  placeholder="Location"
                />
              </td>
              <td class="p-2">
                <input
                  v-model="entry.people"
                  @blur="updateData"
                  class="w-full bg-transparent border-none outline-none dark:text-white"
                  placeholder="Names"
                />
              </td>
              <td class="p-2">
                <input
                  v-model="entry.notes"
                  @blur="updateData"
                  class="w-full bg-transparent border-none outline-none dark:text-white"
                  placeholder="Notes"
                />
              </td>
              <td class="p-2">
                <button
                  @click="removeEntry(index)"
                  class="text-red-500 hover:text-red-700"
                  title="Delete entry"
                >
                  ×
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="mt-4">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-sm font-semibold dark:text-white">Contacts</h3>
        <button
          @click="addContact"
          class="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
        >
          + Add Contact
        </button>
      </div>
      <div class="space-y-2">
        <div
          v-for="(contact, index) in localData.contacts"
          :key="index"
          class="flex items-center gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <input
            v-model="contact.name"
            @blur="updateData"
            class="flex-1 bg-transparent border-none outline-none dark:text-white"
            placeholder="Name"
          />
          <input
            v-model="contact.role"
            @blur="updateData"
            class="w-32 bg-transparent border-none outline-none dark:text-white"
            placeholder="Role"
          />
          <input
            v-model="contact.phone"
            @blur="updateData"
            class="w-32 bg-transparent border-none outline-none dark:text-white"
            placeholder="Phone"
          />
          <button
            @click="removeContact(index)"
            class="text-red-500 hover:text-red-700"
            title="Delete contact"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCanvasStore } from '~/stores/canvas'
import type { NoteCard, CallSheetData } from '~/types'

const props = defineProps<{
  card: NoteCard
}>()

const canvasStore = useCanvasStore()

const localData = ref<CallSheetData>(
  props.card.callSheetData || {
    title: 'Call Sheet',
    shootDate: '',
    callTime: '',
    wrapTime: '',
    entries: [],
    contacts: []
  }
)

const addEntry = () => {
  localData.value.entries.push({
    id: crypto.randomUUID(),
    time: '',
    activity: '',
    location: '',
    people: [],
    notes: ''
  })
  updateData()
}

const removeEntry = (index: number) => {
  localData.value.entries.splice(index, 1)
  updateData()
}

const addContact = () => {
  localData.value.contacts.push({
    name: '',
    role: '',
    phone: ''
  })
  updateData()
}

const removeContact = (index: number) => {
  localData.value.contacts.splice(index, 1)
  updateData()
}

const updateData = () => {
  canvasStore.updateCard(props.card.id, {
    callSheetData: localData.value
  })
}

watch(
  () => props.card.callSheetData,
  (newData) => {
    if (newData) {
      localData.value = newData
    }
  },
  { deep: true }
)
</script>
