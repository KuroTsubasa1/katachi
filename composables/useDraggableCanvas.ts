// Draggable canvas composable for lighting diagrams and camera movement diagrams
import { ref, computed } from 'vue'

export interface DraggableItem {
  id: string
  position: { x: number; y: number }
  type: string
  rotation?: number
  label?: string
  color?: string
  [key: string]: any
}

export const useDraggableCanvas = () => {
  const items = ref<DraggableItem[]>([])
  const draggingItemId = ref<string | null>(null)
  const dragOffset = ref({ x: 0, y: 0 })
  const selectedItemId = ref<string | null>(null)

  /**
   * Add an item to the canvas
   */
  const addItem = (item: DraggableItem) => {
    items.value.push(item)
  }

  /**
   * Remove an item from the canvas
   */
  const removeItem = (itemId: string) => {
    items.value = items.value.filter(item => item.id !== itemId)
    if (selectedItemId.value === itemId) {
      selectedItemId.value = null
    }
  }

  /**
   * Update an item's properties
   */
  const updateItem = (itemId: string, updates: Partial<DraggableItem>) => {
    const index = items.value.findIndex(item => item.id === itemId)
    if (index !== -1) {
      items.value[index] = { ...items.value[index], ...updates }
    }
  }

  /**
   * Get an item by ID
   */
  const getItem = (itemId: string): DraggableItem | undefined => {
    return items.value.find(item => item.id === itemId)
  }

  /**
   * Start dragging an item
   */
  const startDrag = (itemId: string, event: MouseEvent, canvasElement: HTMLElement) => {
    const item = getItem(itemId)
    if (!item) return

    draggingItemId.value = itemId
    selectedItemId.value = itemId

    const rect = canvasElement.getBoundingClientRect()
    const canvasX = event.clientX - rect.left
    const canvasY = event.clientY - rect.top

    dragOffset.value = {
      x: canvasX - item.position.x,
      y: canvasY - item.position.y
    }
  }

  /**
   * Handle drag movement
   */
  const drag = (event: MouseEvent, canvasElement: HTMLElement) => {
    if (!draggingItemId.value) return

    const rect = canvasElement.getBoundingClientRect()
    const canvasX = event.clientX - rect.left
    const canvasY = event.clientY - rect.top

    const newX = Math.max(0, Math.min(canvasX - dragOffset.value.x, rect.width))
    const newY = Math.max(0, Math.min(canvasY - dragOffset.value.y, rect.height))

    updateItem(draggingItemId.value, {
      position: { x: newX, y: newY }
    })
  }

  /**
   * Stop dragging
   */
  const stopDrag = () => {
    draggingItemId.value = null
  }

  /**
   * Select an item
   */
  const selectItem = (itemId: string | null) => {
    selectedItemId.value = itemId
  }

  /**
   * Clear all items
   */
  const clearItems = () => {
    items.value = []
    draggingItemId.value = null
    selectedItemId.value = null
  }

  /**
   * Get items by type
   */
  const getItemsByType = (type: string): DraggableItem[] => {
    return items.value.filter(item => item.type === type)
  }

  /**
   * Check if an item is being dragged
   */
  const isDragging = computed(() => draggingItemId.value !== null)

  /**
   * Check if an item is selected
   */
  const isItemSelected = (itemId: string): boolean => {
    return selectedItemId.value === itemId
  }

  /**
   * Get selected item
   */
  const selectedItem = computed(() => {
    if (!selectedItemId.value) return null
    return getItem(selectedItemId.value)
  })

  /**
   * Rotate an item
   */
  const rotateItem = (itemId: string, degrees: number) => {
    const item = getItem(itemId)
    if (!item) return

    const currentRotation = item.rotation || 0
    updateItem(itemId, {
      rotation: (currentRotation + degrees) % 360
    })
  }

  /**
   * Calculate distance between two items
   */
  const calculateDistance = (item1Id: string, item2Id: string): number => {
    const item1 = getItem(item1Id)
    const item2 = getItem(item2Id)

    if (!item1 || !item2) return 0

    const dx = item2.position.x - item1.position.x
    const dy = item2.position.y - item1.position.y

    return Math.sqrt(dx * dx + dy * dy)
  }

  /**
   * Calculate angle between two items (in degrees)
   */
  const calculateAngle = (fromId: string, toId: string): number => {
    const from = getItem(fromId)
    const to = getItem(toId)

    if (!from || !to) return 0

    const dx = to.position.x - from.position.x
    const dy = to.position.y - from.position.y

    const angleRad = Math.atan2(dy, dx)
    const angleDeg = (angleRad * 180) / Math.PI

    return angleDeg
  }

  return {
    items,
    draggingItemId,
    selectedItemId,
    selectedItem,
    isDragging,
    addItem,
    removeItem,
    updateItem,
    getItem,
    getItemsByType,
    startDrag,
    drag,
    stopDrag,
    selectItem,
    isItemSelected,
    clearItems,
    rotateItem,
    calculateDistance,
    calculateAngle
  }
}
