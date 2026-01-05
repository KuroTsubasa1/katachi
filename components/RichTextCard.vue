<template>
  <div class="h-full flex flex-col">
    <div v-if="editor" class="border-b border-gray-200 p-2 flex gap-1 flex-wrap bg-gray-50">
      <button
        @click="editor.chain().focus().toggleBold().run()"
        :class="{ 'bg-blue-200': editor.isActive('bold') }"
        class="px-2 py-1 rounded hover:bg-gray-200 text-sm font-bold"
      >
        B
      </button>
      <button
        @click="editor.chain().focus().toggleItalic().run()"
        :class="{ 'bg-blue-200': editor.isActive('italic') }"
        class="px-2 py-1 rounded hover:bg-gray-200 text-sm italic"
      >
        I
      </button>
      <button
        @click="editor.chain().focus().toggleStrike().run()"
        :class="{ 'bg-blue-200': editor.isActive('strike') }"
        class="px-2 py-1 rounded hover:bg-gray-200 text-sm line-through"
      >
        S
      </button>
      <div class="w-px bg-gray-300 mx-1"></div>
      <button
        @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
        :class="{ 'bg-blue-200': editor.isActive('heading', { level: 1 }) }"
        class="px-2 py-1 rounded hover:bg-gray-200 text-sm font-bold"
      >
        H1
      </button>
      <button
        @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
        :class="{ 'bg-blue-200': editor.isActive('heading', { level: 2 }) }"
        class="px-2 py-1 rounded hover:bg-gray-200 text-sm font-bold"
      >
        H2
      </button>
      <button
        @click="editor.chain().focus().toggleBulletList().run()"
        :class="{ 'bg-blue-200': editor.isActive('bulletList') }"
        class="px-2 py-1 rounded hover:bg-gray-200 text-sm"
      >
        •
      </button>
      <button
        @click="editor.chain().focus().toggleOrderedList().run()"
        :class="{ 'bg-blue-200': editor.isActive('orderedList') }"
        class="px-2 py-1 rounded hover:bg-gray-200 text-sm"
      >
        1.
      </button>
    </div>
    <editor-content
      :editor="editor"
      class="flex-1 overflow-auto prose prose-sm max-w-none p-4"
    />
  </div>
</template>

<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { watch, onBeforeUnmount } from 'vue'

const props = defineProps<{
  modelValue: string
  editable: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editor = useEditor({
  extensions: [
    StarterKit,
    Placeholder.configure({
      placeholder: 'Start typing...'
    })
  ],
  content: props.modelValue,
  editable: props.editable,
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  }
})

watch(() => props.editable, (newVal) => {
  editor.value?.setEditable(newVal)
})

watch(() => props.modelValue, (newVal) => {
  const isSame = editor.value?.getHTML() === newVal
  if (!isSame && newVal) {
    editor.value?.commands.setContent(newVal, false)
  }
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<style>
.ProseMirror {
  outline: none;
}

.ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #adb5bd;
  pointer-events: none;
  height: 0;
}
</style>
