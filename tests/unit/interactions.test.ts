import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCanvasStore } from '~/stores/canvas'

describe('Card Interactions', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('Card Selection', () => {
    it('should select a card', () => {
      const store = useCanvasStore()
      store.createBoard('Test Board')

      const card = store.addCard({
        type: 'text',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 150 },
        content: 'Test'
      })

      store.selectCard(card.id)

      expect(store.selectedCardId).toBe(card.id)
      expect(store.selectedCard).toBe(card)
    })

    it('should deselect when selecting null', () => {
      const store = useCanvasStore()
      store.createBoard('Test Board')

      const card = store.addCard({
        type: 'text',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 150 },
        content: 'Test'
      })

      store.selectCard(card.id)
      expect(store.selectedCardId).toBe(card.id)

      store.selectCard(null)
      expect(store.selectedCardId).toBeNull()
      expect(store.selectedCard).toBeNull()
    })

    it('should bring selected card to front', () => {
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

      const card2ZIndex = card2.zIndex

      store.selectCard(card1.id)

      const updatedCard1 = store.currentBoard?.cards.find(c => c.id === card1.id)
      expect(updatedCard1?.zIndex).toBeGreaterThan(card2ZIndex)
    })
  })

  describe('Drag and Drop State', () => {
    it('should track dragging state', () => {
      const store = useCanvasStore()

      expect(store.isDragging).toBe(false)

      store.setDragging(true)
      expect(store.isDragging).toBe(true)

      store.setDragging(false)
      expect(store.isDragging).toBe(false)
    })

    it('should track panning state', () => {
      const store = useCanvasStore()

      expect(store.isPanning).toBe(false)

      store.setPanning(true)
      expect(store.isPanning).toBe(true)

      store.setPanning(false)
      expect(store.isPanning).toBe(false)
    })

    it('should track dragging card id', () => {
      const store = useCanvasStore()
      store.createBoard('Test')

      const card = store.addCard({
        type: 'text',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
        content: 'Test'
      })

      store.setDraggingCard(card.id)
      expect(store.draggingCardId).toBe(card.id)

      store.setDraggingCard(null)
      expect(store.draggingCardId).toBeNull()
    })

    it('should track drop target column', () => {
      const store = useCanvasStore()
      store.createBoard('Test')

      const column = store.addColumnCard({ x: 100, y: 100 })

      store.setDropTargetColumn(column.id)
      expect(store.dropTargetColumnId).toBe(column.id)

      store.setDropTargetColumn(null)
      expect(store.dropTargetColumnId).toBeNull()
    })
  })

  describe('Card Color Changes', () => {
    it('should update card color', () => {
      const store = useCanvasStore()
      store.createBoard('Test')

      const card = store.addCard({
        type: 'text',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
        content: 'Test',
        color: '#ffffff'
      })

      store.updateCard(card.id, { color: '#ff0000' })

      const updatedCard = store.currentBoard?.cards.find(c => c.id === card.id)
      expect(updatedCard?.color).toBe('#ff0000')
    })
  })
})

describe('Multiple Card Types', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should create sketch card', () => {
    const store = useCanvasStore()
    store.createBoard('Test')

    const card = store.addCard({
      type: 'sketch',
      position: { x: 0, y: 0 },
      size: { width: 300, height: 300 },
      content: '',
      drawingData: { paths: [], color: '#000000', width: 2 }
    })

    expect(card.type).toBe('sketch')
    expect(card.drawingData).toBeDefined()
  })

  it('should create audio card', () => {
    const store = useCanvasStore()
    store.createBoard('Test')

    const card = store.addCard({
      type: 'audio',
      position: { x: 0, y: 0 },
      size: { width: 300, height: 200 },
      content: '',
      audioUrl: 'https://example.com/audio.mp3'
    })

    expect(card.type).toBe('audio')
    expect(card.audioUrl).toBe('https://example.com/audio.mp3')
  })

  it('should create video card', () => {
    const store = useCanvasStore()
    store.createBoard('Test')

    const card = store.addCard({
      type: 'video',
      position: { x: 0, y: 0 },
      size: { width: 500, height: 350 },
      content: '',
      videoUrl: 'https://youtube.com/watch?v=test'
    })

    expect(card.type).toBe('video')
    expect(card.videoUrl).toBe('https://youtube.com/watch?v=test')
  })

  it('should create map card', () => {
    const store = useCanvasStore()
    store.createBoard('Test')

    const card = store.addCard({
      type: 'map',
      position: { x: 0, y: 0 },
      size: { width: 400, height: 350 },
      content: '',
      mapLocation: 'Paris, France'
    })

    expect(card.type).toBe('map')
    expect(card.mapLocation).toBe('Paris, France')
  })

  it('should create table card', () => {
    const store = useCanvasStore()
    store.createBoard('Test')

    const card = store.addCard({
      type: 'table',
      position: { x: 0, y: 0 },
      size: { width: 400, height: 300 },
      content: '',
      tableData: {
        rows: 2,
        cols: 2,
        cells: [['A', 'B'], ['C', 'D']]
      }
    })

    expect(card.type).toBe('table')
    expect(card.tableData?.rows).toBe(2)
    expect(card.tableData?.cols).toBe(2)
  })
})
