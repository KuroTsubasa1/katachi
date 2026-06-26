<template>
  <div class="h-full w-full flex flex-col">
    <div v-if="isSelected" class="flex-1 flex">
      <!-- Editor side -->
      <div class="flex-1 flex flex-col border-r border-gray-200 dark:border-gray-600">
        <div class="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300">
          Markdown
        </div>
        <textarea
          v-model="localMarkdown"
          @input="updateMarkdown"
          class="flex-1 p-3 font-mono text-sm resize-none border-none outline-none bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
          placeholder="# Heading
- List item
**Bold** *italic*"
        ></textarea>
      </div>

      <!-- Preview side -->
      <div class="flex-1 flex flex-col">
        <div class="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300">
          Preview
        </div>
        <div
          class="flex-1 p-3 overflow-auto prose prose-sm dark:prose-invert max-w-none markdown-preview"
          v-html="renderedHtml"
        ></div>
      </div>
    </div>

    <!-- Preview only when not selected -->
    <div
      v-else
      class="h-full p-4 overflow-auto prose prose-sm dark:prose-invert max-w-none markdown-preview"
      v-html="renderedHtml"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { marked } from 'marked'

const props = defineProps<{
  markdown?: string
  isSelected: boolean
}>()

const emit = defineEmits<{
  'update:markdown': [markdown: string]
}>()

const localMarkdown = ref(props.markdown || '# Heading\n\nStart writing markdown...')

const renderedHtml = computed(() => {
  try {
    // Use marked as a function, not marked.parse
    return marked(localMarkdown.value, {
      breaks: true,
      gfm: true
    }) as string
  } catch (error) {
    return '<p class="text-red-500">Invalid markdown</p>'
  }
})

const updateMarkdown = () => {
  emit('update:markdown', localMarkdown.value)
}

watch(() => props.markdown, (newMarkdown) => {
  if (newMarkdown !== undefined) {
    localMarkdown.value = newMarkdown
  }
})
</script>
