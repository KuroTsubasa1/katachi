<template>
  <div class="h-full flex flex-col p-3 relative">
    <!-- Node content -->
    <div class="flex-1 flex items-center justify-center">
      <textarea
        ref="textareaRef"
        v-model="localContent"
        class="w-full h-full resize-none border-none outline-none bg-transparent text-center font-medium overflow-hidden"
        :class="{
          'text-gray-800 dark:text-gray-200': true,
          'text-lg': level === 0,
          'text-base': level === 1,
          'text-sm': level >= 2,
          'cursor-move': !editable,
          'pointer-events-none': !editable
        }"
        :readonly="!editable"
        :placeholder="level === 0 ? 'Central Idea' : 'Node'"
        @input="handleInput"
        @keydown="handleKeyDown"
        @blur="handleBlur"
        rows="1"
      />
    </div>

    <!-- Level indicator (optional visual aid) -->
    <div
      v-if="level > 0"
      class="absolute bottom-1 right-1 text-[10px] text-gray-400 dark:text-gray-600"
    >
      L{{ level }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useCanvasStore } from '~/stores/canvas'
import type { MindMapData } from '~/types'

const props = defineProps<{
  cardId: string
  content: string
  mindMapData?: MindMapData
  editable: boolean
}>()

const emit = defineEmits<{
  'update:content': [value: string]
  'addChild': []
  'addSibling': []
}>()

const canvasStore = useCanvasStore()
const localContent = ref(props.content)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const level = computed(() => props.mindMapData?.level || 0)
const hasChildren = computed(() => (props.mindMapData?.childIds?.length || 0) > 0)
const isCollapsed = computed(() => props.mindMapData?.isCollapsed || false)

// Auto-resize textarea
const autoResize = () => {
  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.style.height = 'auto'
      textareaRef.value.style.height = textareaRef.value.scrollHeight + 'px'
    }
  })
}

watch(() => props.content, (newVal) => {
  localContent.value = newVal
  autoResize()
}, { immediate: true })

watch(localContent, () => {
  autoResize()
})

const handleInput = () => {
  emit('update:content', localContent.value)
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (!props.editable) return

  // Tab - Create child node
  if (e.key === 'Tab') {
    e.preventDefault()
    emit('addChild')
  }

  // Enter - Create sibling node
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    emit('addSibling')
  }

  // Shift+Enter - Allow newline in content
  if (e.key === 'Enter' && e.shiftKey) {
    // Allow default behavior (newline)
    return
  }
}

const handleBlur = () => {
  // Trim whitespace on blur
  localContent.value = localContent.value.trim()
  if (localContent.value !== props.content) {
    emit('update:content', localContent.value)
  }
}

const toggleCollapse = () => {
  canvasStore.toggleMindMapCollapse(props.cardId)
}

// Auto-focus and select all text when editable
watch(() => props.editable, (isEditable) => {
  if (isEditable) {
    nextTick(() => {
      if (textareaRef.value) {
        textareaRef.value.focus()
        textareaRef.value.select() // Select all text for easy replacement
      }
    })
  }
}, { immediate: true })
</script>

<style scoped>
textarea {
  resize: none;
  min-height: 1.5em;
  line-height: 1.5;
}

textarea::placeholder {
  opacity: 0.5;
}
</style>
