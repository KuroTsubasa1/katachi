<template>
  <div class="h-full w-full flex flex-col bg-white dark:bg-gray-900 p-4 overflow-auto">
    <div class="flex items-center justify-between mb-4">
      <input
        v-model="localData.title"
        @blur="updateData"
        class="text-lg font-semibold bg-transparent border-none outline-none dark:text-white flex-1"
        placeholder="Budget Tracker"
      />
    </div>

    <div class="grid grid-cols-2 gap-4 mb-4">
      <div>
        <label class="text-xs text-gray-500 dark:text-gray-400">Currency</label>
        <select
          v-model="localData.currency"
          @change="updateData"
          class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        >
          <option value="USD">USD ($)</option>
          <option value="EUR">EUR (€)</option>
          <option value="GBP">GBP (£)</option>
          <option value="JPY">JPY (¥)</option>
          <option value="CAD">CAD ($)</option>
          <option value="AUD">AUD ($)</option>
        </select>
      </div>
      <div>
        <label class="text-xs text-gray-500 dark:text-gray-400">Total Budget</label>
        <input
          type="number"
          v-model.number="localData.totalBudget"
          @blur="updateData"
          class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          min="0"
          step="0.01"
          placeholder="10000"
        />
      </div>
    </div>

    <div class="flex items-center justify-between mb-2">
      <h3 class="text-sm font-semibold dark:text-white">Line Items</h3>
      <button
        @click="addItem"
        class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
      >
        + Add Item
      </button>
    </div>

    <div class="flex-1 overflow-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-100 dark:bg-gray-800 sticky top-0">
          <tr>
            <th class="p-2 text-left w-20">✓</th>
            <th class="p-2 text-left w-24">Category</th>
            <th class="p-2 text-left">Description</th>
            <th class="p-2 text-left w-24">Estimated</th>
            <th class="p-2 text-left w-24">Actual</th>
            <th class="p-2 text-left w-24">Difference</th>
            <th class="p-2 text-left">Notes</th>
            <th class="p-2 w-8"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(item, index) in localData.items"
            :key="item.id"
            class="border-b border-gray-200 dark:border-gray-700"
            :class="{ 'bg-green-50 dark:bg-green-900/20': item.paid }"
          >
            <td class="p-2">
              <input
                type="checkbox"
                v-model="item.paid"
                @change="updateData"
                class="w-4 h-4"
                title="Paid"
              />
            </td>
            <td class="p-2">
              <select
                v-model="item.category"
                @change="updateData"
                class="w-full px-1 py-1 text-xs border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              >
                <option value="equipment">Equipment</option>
                <option value="talent">Talent</option>
                <option value="location">Location</option>
                <option value="post">Post</option>
                <option value="travel">Travel</option>
                <option value="misc">Misc</option>
              </select>
            </td>
            <td class="p-2">
              <input
                v-model="item.description"
                @blur="updateData"
                class="w-full bg-transparent border-none outline-none dark:text-white"
                placeholder="Description"
              />
            </td>
            <td class="p-2">
              <input
                type="number"
                v-model.number="item.estimated"
                @blur="updateData"
                class="w-full px-2 py-1 text-right bg-transparent border rounded dark:border-gray-700 dark:text-white"
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </td>
            <td class="p-2">
              <input
                type="number"
                v-model.number="item.actual"
                @blur="updateData"
                class="w-full px-2 py-1 text-right bg-transparent border rounded dark:border-gray-700 dark:text-white"
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </td>
            <td class="p-2 text-right">
              <span
                :class="{
                  'text-red-600 dark:text-red-400': getDifference(item) > 0,
                  'text-green-600 dark:text-green-400': getDifference(item) < 0,
                  'text-gray-600 dark:text-gray-400': getDifference(item) === 0
                }"
              >
                {{ formatCurrency(getDifference(item)) }}
              </span>
            </td>
            <td class="p-2">
              <input
                v-model="item.notes"
                @blur="updateData"
                class="w-full bg-transparent border-none outline-none dark:text-white text-xs"
                placeholder="Notes"
              />
            </td>
            <td class="p-2">
              <button
                @click="removeItem(index)"
                class="text-red-500 hover:text-red-700"
                title="Delete item"
              >
                ×
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div class="space-y-1">
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Total Budget:</span>
            <span class="font-semibold dark:text-white">{{ formatCurrency(localData.totalBudget) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Total Estimated:</span>
            <span class="font-semibold dark:text-white">{{ formatCurrency(totalEstimated) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Total Spent:</span>
            <span class="font-semibold dark:text-white">{{ formatCurrency(totalSpent) }}</span>
          </div>
        </div>
        <div class="space-y-1">
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Remaining:</span>
            <span
              class="font-semibold"
              :class="{
                'text-red-600 dark:text-red-400': remaining < 0,
                'text-green-600 dark:text-green-400': remaining > 0,
                'text-gray-600 dark:text-gray-400': remaining === 0
              }"
            >
              {{ formatCurrency(remaining) }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">% of Budget Used:</span>
            <span class="font-semibold dark:text-white">{{ budgetPercentage }}%</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Items Paid:</span>
            <span class="font-semibold dark:text-white">{{ paidCount }} / {{ totalCount }}</span>
          </div>
        </div>
      </div>

      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
        <div
          class="h-full rounded-full transition-all"
          :class="{
            'bg-green-500': budgetPercentage < 80,
            'bg-yellow-500': budgetPercentage >= 80 && budgetPercentage < 100,
            'bg-red-500': budgetPercentage >= 100
          }"
          :style="{ width: Math.min(budgetPercentage, 100) + '%' }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useCanvasStore } from '~/stores/canvas'
import { formatCurrency as formatCurrencyUtil } from '~/utils/photographyHelpers'
import type { NoteCard, BudgetTrackerData, BudgetLineItem } from '~/types'

const props = defineProps<{
  card: NoteCard
}>()

const canvasStore = useCanvasStore()

const localData = ref<BudgetTrackerData>(
  props.card.budgetTrackerData || {
    title: 'Budget Tracker',
    currency: 'USD',
    totalBudget: 0,
    items: [],
    totalSpent: 0,
    remaining: 0
  }
)

const totalEstimated = computed(() => {
  return localData.value.items.reduce((sum, item) => sum + (item.estimated || 0), 0)
})

const totalSpent = computed(() => {
  return localData.value.items.reduce((sum, item) => sum + (item.actual || 0), 0)
})

const remaining = computed(() => {
  return localData.value.totalBudget - totalSpent.value
})

const budgetPercentage = computed(() => {
  if (localData.value.totalBudget === 0) return 0
  return Math.round((totalSpent.value / localData.value.totalBudget) * 100)
})

const paidCount = computed(() => {
  return localData.value.items.filter(item => item.paid).length
})

const totalCount = computed(() => {
  return localData.value.items.length
})

const getDifference = (item: BudgetLineItem): number => {
  return (item.actual || 0) - (item.estimated || 0)
}

const formatCurrency = (amount: number): string => {
  return formatCurrencyUtil(amount, localData.value.currency)
}

const addItem = () => {
  localData.value.items.push({
    id: crypto.randomUUID(),
    category: 'equipment',
    description: '',
    estimated: 0,
    actual: 0,
    paid: false,
    notes: ''
  })
  updateData()
}

const removeItem = (index: number) => {
  localData.value.items.splice(index, 1)
  updateData()
}

const updateData = () => {
  // Update calculated totals
  localData.value.totalSpent = totalSpent.value
  localData.value.remaining = remaining.value

  canvasStore.updateCard(props.card.id, {
    budgetTrackerData: localData.value
  })
}

watch(
  () => props.card.budgetTrackerData,
  (newData) => {
    if (newData) {
      localData.value = newData
    }
  },
  { deep: true }
)
</script>
