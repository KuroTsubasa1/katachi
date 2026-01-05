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

<style>
.markdown-preview :deep(h1),
.markdown-preview :deep(h2),
.markdown-preview :deep(h3),
.markdown-preview :deep(h4),
.markdown-preview :deep(h5),
.markdown-preview :deep(h6) {
  font-weight: bold;
  margin-top: 1em;
  margin-bottom: 0.5em;
  color: inherit;
}

.markdown-preview :deep(h1) {
  font-size: 1.5em;
}

.markdown-preview :deep(h2) {
  font-size: 1.3em;
}

.markdown-preview :deep(h3) {
  font-size: 1.1em;
}

.markdown-preview :deep(ul),
.markdown-preview :deep(ol) {
  padding-left: 1.5em;
  margin: 0.5em 0;
}

.markdown-preview :deep(li) {
  margin: 0.25em 0;
}

.markdown-preview :deep(p) {
  margin: 0.5em 0;
}

.markdown-preview :deep(strong) {
  font-weight: bold;
}

.markdown-preview :deep(em) {
  font-style: italic;
}

.markdown-preview :deep(code) {
  background: #f3f4f6;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: monospace;
}

.dark .markdown-preview :deep(code) {
  background: #374151;
}
</style>
