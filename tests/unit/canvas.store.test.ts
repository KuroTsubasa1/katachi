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

  describe('Mind Map node placement', () => {
    type Rect = { position: { x: number; y: number }; size: { width: number; height: number } }

    const overlaps = (a: Rect, b: Rect) =>
      a.position.x < b.position.x + b.size.width &&
      b.position.x < a.position.x + a.size.width &&
      a.position.y < b.position.y + b.size.height &&
      b.position.y < a.position.y + a.size.height

    it('places children without overlapping each other or the parent', () => {
      const store = useCanvasStore()
      store.createBoard('Mind Map Board')

      const root = store.addMindMapNode({ x: 0, y: 0 })
      const a = store.addMindMapChild(root.id)!
      const b = store.addMindMapChild(root.id)!
      const c = store.addMindMapChild(root.id)!

      const nodes = [root, a, b, c]
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          expect(overlaps(nodes[i], nodes[j])).toBe(false)
        }
      }
    })

    it('does not collide when mixing children (Tab) and siblings (Enter)', () => {
      const store = useCanvasStore()
      store.createBoard('Mind Map Board')

      const root = store.addMindMapNode({ x: 0, y: 0 })
      const a = store.addMindMapChild(root.id)!     // Tab
      const b = store.addMindMapChild(root.id)!     // Tab
      const s = store.addMindMapSibling(a.id)!      // Enter on first child

      const nodes = [a, b, s]
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          expect(overlaps(nodes[i], nodes[j])).toBe(false)
        }
      }
    })
  })

  describe('Mind Map cross-links', () => {
    it('creates a graph link between two nodes', () => {
      const store = useCanvasStore()
      store.createBoard('Mind Map Board')

      const root = store.addMindMapNode({ x: 0, y: 0 })
      const a = store.addMindMapChild(root.id)!
      const b = store.addMindMapChild(root.id)!

      const before = store.currentBoard!.connections.length
      store.createMindMapLink(a.id, b.id)

      expect(store.currentBoard!.connections.length).toBe(before + 1)
      const link = store.currentBoard!.connections.at(-1)!
      expect([link.fromCardId, link.toCardId].sort()).toEqual([a.id, b.id].sort())
    })

    it('ignores self-links and duplicate links', () => {
      const store = useCanvasStore()
      store.createBoard('Mind Map Board')

      const root = store.addMindMapNode({ x: 0, y: 0 })
      const a = store.addMindMapChild(root.id)!
      const b = store.addMindMapChild(root.id)!

      store.createMindMapLink(a.id, a.id) // self
      store.createMindMapLink(a.id, b.id)
      store.createMindMapLink(a.id, b.id) // duplicate
      store.createMindMapLink(b.id, a.id) // duplicate, reversed

      const links = store.currentBoard!.connections.filter(c =>
        [c.fromCardId, c.toCardId].includes(a.id) &&
        [c.fromCardId, c.toCardId].includes(b.id)
      )
      expect(links.length).toBe(1)
    })
  })

  describe('Column membership', () => {
    const seedCardInColumn = () => {
      const store = useCanvasStore()
      store.createBoard('Board')
      const column = store.addCard({
        type: 'column',
        position: { x: 0, y: 0 },
        size: { width: 250, height: 400 },
        content: 'Col'
      })
      const card = store.addCard({
        type: 'text',
        position: { x: 500, y: 500 },
        size: { width: 200, height: 150 },
        content: 'note'
      })
      store.moveCardToColumn(card.id, column.id)
      return { store, column, card }
    }

    it('deleteCard removes the card from its column', () => {
      const { store, column, card } = seedCardInColumn()
      expect(column.columnCards).toContain(card.id)

      store.deleteCard(card.id)

      expect(column.columnCards).not.toContain(card.id)
      expect(store.currentBoard!.cards.find(c => c.id === card.id)).toBeUndefined()
    })

    it('popCardFromColumn removes it from the column and repositions it', () => {
      const { store, column, card } = seedCardInColumn()

      store.popCardFromColumn(card.id, { x: 320, y: 240 })

      expect(column.columnCards).not.toContain(card.id)
      const popped = store.currentBoard!.cards.find(c => c.id === card.id)!
      expect(popped.position).toEqual({ x: 320, y: 240 })
    })
  })

  describe('Viewport pan clamping', () => {
    it('clamps panning to content bounds + margin', () => {
      const store = useCanvasStore()
      store.createBoard('Board')
      store.updateContainerSize(1000, 800)
      // One 180x60 node at the origin -> content bounds [0,0]..[180,60].
      store.addMindMapNode({ x: 0, y: 0 })

      store.updateViewport({ x: 100000, y: 100000, scale: 1 })

      // Upper bounds: x = W - margin - minX*s = 1000-200-0 = 800; y = 800-200-0 = 600.
      expect(store.viewport.x).toBe(800)
      expect(store.viewport.y).toBe(600)
    })

    it('does not clamp when there is no board', () => {
      const store = useCanvasStore()
      store.updateContainerSize(1000, 800)

      store.updateViewport({ x: 100000, y: 100000 })

      expect(store.viewport.x).toBe(100000)
      expect(store.viewport.y).toBe(100000)
    })
  })
})
