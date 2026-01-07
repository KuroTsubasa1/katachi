import { onMounted, onUnmounted, computed, ref } from 'vue'
import { useCanvasStore } from '~/stores/canvas'
import { useAuthStore } from '~/stores/auth'

const isMac = computed(() =>
  typeof navigator !== 'undefined' && /Mac/.test(navigator.platform)
)

const commandPaletteOpen = ref(false)
const shortcutsHelpOpen = ref(false)

export const useKeyboardShortcuts = () => {
  const canvasStore = useCanvasStore()
  const authStore = useAuthStore()

  const isTypingContext = (target: EventTarget | null): boolean => {
    if (!target) return false
    const el = target as HTMLElement
    return (
      ['INPUT', 'TEXTAREA'].includes(el.tagName) ||
      el.contentEditable === 'true' ||
      el.classList.contains('ProseMirror') ||
      el.classList.contains('column-card-input')
    )
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    // Help dialog (?) works everywhere except when typing
    if (e.key === '?' && !isTypingContext(e.target)) {
      e.preventDefault()
      shortcutsHelpOpen.value = !shortcutsHelpOpen.value
      return
    }

    // Command palette (Cmd+K) works everywhere
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      commandPaletteOpen.value = !commandPaletteOpen.value
      return
    }

    // Don't handle shortcuts when typing
    if (isTypingContext(e.target)) {
      return
    }

    const hasModifier = e.metaKey || e.ctrlKey

    // Delete selected card
    if ((e.key === 'Delete' || e.key === 'Backspace') && canvasStore.selectedCardId) {
      e.preventDefault()
      canvasStore.deleteCard(canvasStore.selectedCardId)
      return
    }

    // Escape - deselect
    if (e.key === 'Escape') {
      e.preventDefault()
      if (canvasStore.selectedCardId) {
        canvasStore.selectCard(null)
      }
      return
    }

    // Copy card
    if (hasModifier && e.key === 'c' && canvasStore.selectedCardId) {
      e.preventDefault()
      canvasStore.copyCard(canvasStore.selectedCardId)
      return
    }

    // Paste card
    if (hasModifier && e.key === 'v') {
      e.preventDefault()
      const viewport = canvasStore.viewport
      const centerX = (window.innerWidth / 2 - viewport.x) / viewport.scale
      const centerY = (window.innerHeight / 2 - viewport.y) / viewport.scale
      canvasStore.pasteCard({ x: centerX, y: centerY })
      return
    }

    // Duplicate card
    if (hasModifier && e.key === 'd' && canvasStore.selectedCardId) {
      e.preventDefault()
      canvasStore.duplicateCard(canvasStore.selectedCardId)
      return
    }

    // Zoom controls
    if (hasModifier && e.key === '=') {
      e.preventDefault()
      const newScale = Math.min(canvasStore.viewport.scale * 1.2, 3)
      canvasStore.viewport.scale = newScale
      return
    }

    if (hasModifier && e.key === '-') {
      e.preventDefault()
      const newScale = Math.max(canvasStore.viewport.scale / 1.2, 0.1)
      canvasStore.viewport.scale = newScale
      return
    }

    if (hasModifier && e.key === '0') {
      e.preventDefault()
      canvasStore.viewport.scale = 1
      canvasStore.viewport.x = 0
      canvasStore.viewport.y = 0
      return
    }

    // Tool switching (only when a card is not selected for editing)
    if (!canvasStore.selectedCardId) {
      if (e.key === 'v' || e.key === '1') {
        e.preventDefault()
        canvasStore.setTool({ type: 'select' })
        return
      }

      if (e.key === 'd' || e.key === '2') {
        e.preventDefault()
        canvasStore.setTool({ type: 'pen' })
        return
      }

      if (e.key === 'e' || e.key === '3') {
        e.preventDefault()
        canvasStore.setTool({ type: 'eraser' })
        return
      }

      if (e.key === 'c' || e.key === '4') {
        e.preventDefault()
        canvasStore.setTool({ type: 'connect' })
        return
      }

      if (e.key === 'h' || e.key === '5') {
        e.preventDefault()
        canvasStore.setTool({ type: 'hand' })
        return
      }
    }

    // Arrow keys - move selected card
    if (canvasStore.selectedCardId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault()
      const card = canvasStore.currentBoard?.cards.find(c => c.id === canvasStore.selectedCardId)
      if (card) {
        const step = e.shiftKey ? 50 : 10
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0

        canvasStore.updateCard(canvasStore.selectedCardId, {
          position: {
            x: card.position.x + dx,
            y: card.position.y + dy
          }
        })
      }
      return
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
  })

  return {
    isMac,
    commandPaletteOpen,
    openCommandPalette: () => { commandPaletteOpen.value = true },
    closeCommandPalette: () => { commandPaletteOpen.value = false },
    shortcutsHelpOpen,
    openShortcutsHelp: () => { shortcutsHelpOpen.value = true },
    closeShortcutsHelp: () => { shortcutsHelpOpen.value = false }
  }
}
