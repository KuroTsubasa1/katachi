import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCanvasStore } from '~/stores/canvas'

describe('Canvas Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('Board Management', () => {
    it('should create a new board', () => {
      const store = useCanvasStore()
      const board = store.createBoard('Test Board')

      expect(board).toBeDefined()
      expect(board.name).toBe('Test Board')
      expect(board.cards).toEqual([])
      expect(store.boards).toHaveLength(1)
      expect(store.currentBoard).toStrictEqual(board)
    })

    it('should set current board', () => {
      const store = useCanvasStore()
      const board1 = store.createBoard('Board 1')
      const board2 = store.createBoard('Board 2')

      expect(store.currentBoard).toStrictEqual(board2)

      store.currentBoard = board1
      expect(store.currentBoard).toStrictEqual(board1)
    })
  })

  describe('Card Management', () => {
    it('should add a text card', () => {
      const store = useCanvasStore()
      store.createBoard('Test Board')

      const card = store.addCard({
        type: 'text',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 150 },
        content: 'Test note'
      })

      expect(card).toBeDefined()
      expect(card.type).toBe('text')
      expect(card.content).toBe('Test note')
      expect(card.zIndex).toBe(1)
      expect(store.currentBoard?.cards).toHaveLength(1)
    })

    it('should assign increasing z-indexes to cards', () => {
      const store = useCanvasStore()
      store.createBoard('Test Board')

      const card1 = store.addCard({
        type: 'text',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
        content: 'Card 1'
      })

      const card2 = store.addCard({
        type: 'text',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
        content: 'Card 2'
      })

      expect(card1.zIndex).toBe(1)
      expect(card2.zIndex).toBe(2)
    })

    it('should update a card', () => {
      const store = useCanvasStore()
      store.createBoard('Test Board')

      const card = store.addCard({
        type: 'text',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
        content: 'Original'
      })

      store.updateCard(card.id, { content: 'Updated' })

      const updatedCard = store.currentBoard?.cards.find(c => c.id === card.id)
      expect(updatedCard?.content).toBe('Updated')
    })

    it('should delete a card', () => {
      const store = useCanvasStore()
      store.createBoard('Test Board')

      const card = store.addCard({
        type: 'text',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
        content: 'To delete'
      })

      expect(store.currentBoard?.cards).toHaveLength(1)

      store.deleteCard(card.id)

      expect(store.currentBoard?.cards).toHaveLength(0)
    })

    it('should bring card to front', () => {
      const store = useCanvasStore()
      store.createBoard('Test Board')

      const card1 = store.addCard({
        type: 'text',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
        content: 'Card 1'
      })

      const card2 = store.addCard({
        type: 'text',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
        content: 'Card 2'
      })

      store.bringToFront(card1.id)

      const updatedCard1 = store.currentBoard?.cards.find(c => c.id === card1.id)
      expect(updatedCard1?.zIndex).toBeGreaterThan(card2.zIndex)
    })
  })

  describe('Snap to Grid', () => {
    it('should toggle snap to grid', () => {
      const store = useCanvasStore()

      expect(store.snapToGrid).toBe(false)

      store.toggleSnapToGrid()
      expect(store.snapToGrid).toBe(true)

      store.toggleSnapToGrid()
      expect(store.snapToGrid).toBe(false)
    })

    it('should snap position to grid when enabled', () => {
      const store = useCanvasStore()
      store.snapToGrid = true

      const snapped = store.snapPositionToGrid({ x: 25, y: 35 })

      expect(snapped.x).toBe(20)
      expect(snapped.y).toBe(40)
    })

    it('should not snap when disabled', () => {
      const store = useCanvasStore()
      store.snapToGrid = false

      const snapped = store.snapPositionToGrid({ x: 25, y: 35 })

      expect(snapped.x).toBe(25)
      expect(snapped.y).toBe(35)
    })
  })

  describe('Column Operations', () => {
    it('should move card to column', () => {
      const store = useCanvasStore()
      store.createBoard('Test Board')

      const column = store.addColumnCard({ x: 100, y: 100 })
      const card = store.addCard({
        type: 'text',
        position: { x: 200, y: 200 },
        size: { width: 100, height: 100 },
        content: 'Test'
      })

      store.moveCardToColumn(card.id, column.id)

      const updatedColumn = store.currentBoard?.cards.find(c => c.id === column.id)
      expect(updatedColumn?.columnCards).toContain(card.id)

      const updatedCard = store.currentBoard?.cards.find(c => c.id === card.id)
      expect(updatedCard?.position.x).toBe(-10000) // Off-canvas
    })

    it('should remove card from column', () => {
      const store = useCanvasStore()
      store.createBoard('Test Board')

      const column = store.addColumnCard({ x: 100, y: 100 })
      const card = store.addCard({
        type: 'text',
        position: { x: 200, y: 200 },
        size: { width: 100, height: 100 },
        content: 'Test'
      })

      store.moveCardToColumn(card.id, column.id)
      store.removeCardFromColumn(card.id, column.id)

      const updatedColumn = store.currentBoard?.cards.find(c => c.id === column.id)
      expect(updatedColumn?.columnCards).not.toContain(card.id)
    })
  })

  describe('Viewport', () => {
    it('should update viewport', () => {
      const store = useCanvasStore()

      store.updateViewport({ x: 100, y: 200, scale: 1.5 })

      expect(store.viewport.x).toBe(100)
      expect(store.viewport.y).toBe(200)
      expect(store.viewport.scale).toBe(1.5)
    })
  })
})
