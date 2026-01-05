import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCanvasStore } from '~/stores/canvas'

describe('Card Type Creation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should create text card with correct defaults', () => {
    const store = useCanvasStore()
    store.createBoard('Test')

    const card = store.addCard({
      type: 'text',
      position: { x: 100, y: 100 },
      size: { width: 200, height: 150 },
      content: 'Test note',
      color: '#f3f4f6'
    })

    expect(card.type).toBe('text')
    expect(card.content).toBe('Test note')
    expect(card.color).toBe('#f3f4f6')
  })

  it('should create richtext card with HTML content', () => {
    const store = useCanvasStore()
    store.createBoard('Test')

    const card = store.addCard({
      type: 'richtext',
      position: { x: 0, y: 0 },
      size: { width: 400, height: 300 },
      content: '',
      htmlContent: '<p>Rich text</p>'
    })

    expect(card.type).toBe('richtext')
    expect(card.htmlContent).toBe('<p>Rich text</p>')
  })

  it('should create image card with URL', () => {
    const store = useCanvasStore()
    store.createBoard('Test')

    const card = store.addImageCard(
      { x: 100, y: 100 },
      'https://example.com/image.jpg',
      { width: 300, height: 200 }
    )

    expect(card.type).toBe('image')
    expect(card.imageUrl).toBe('https://example.com/image.jpg')
    expect(card.size.width).toBe(300)
    expect(card.size.height).toBe(200)
  })

  it('should create column card', () => {
    const store = useCanvasStore()
    store.createBoard('Test')

    const card = store.addColumnCard({ x: 100, y: 100 })

    expect(card.type).toBe('column')
    expect(card.columnCards).toEqual([])
    expect(card.size.width).toBe(250)
    expect(card.size.height).toBe(500)
  })

  it('should create drawing card', () => {
    const store = useCanvasStore()
    store.createBoard('Test')

    const card = store.addDrawingCard({ x: 100, y: 100 })

    expect(card.type).toBe('drawing')
    expect(card.drawingData).toBeDefined()
    expect(card.drawingData?.paths).toEqual([])
  })
})

describe('Card Content Updates', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should update text content', () => {
    const store = useCanvasStore()
    store.createBoard('Test')

    const card = store.addCard({
      type: 'text',
      position: { x: 0, y: 0 },
      size: { width: 100, height: 100 },
      content: 'Original'
    })

    store.updateCard(card.id, { content: 'Updated' })

    const updated = store.currentBoard?.cards.find(c => c.id === card.id)
    expect(updated?.content).toBe('Updated')
  })

  it('should update audio URL', () => {
    const store = useCanvasStore()
    store.createBoard('Test')

    const card = store.addCard({
      type: 'audio',
      position: { x: 0, y: 0 },
      size: { width: 300, height: 200 },
      content: '',
      audioUrl: ''
    })

    store.updateCard(card.id, { audioUrl: 'https://example.com/audio.mp3' })

    const updated = store.currentBoard?.cards.find(c => c.id === card.id)
    expect(updated?.audioUrl).toBe('https://example.com/audio.mp3')
  })

  it('should update video URL', () => {
    const store = useCanvasStore()
    store.createBoard('Test')

    const card = store.addCard({
      type: 'video',
      position: { x: 0, y: 0 },
      size: { width: 500, height: 350 },
      content: '',
      videoUrl: ''
    })

    store.updateCard(card.id, { videoUrl: 'https://youtube.com/watch?v=test' })

    const updated = store.currentBoard?.cards.find(c => c.id === card.id)
    expect(updated?.videoUrl).toBe('https://youtube.com/watch?v=test')
  })

  it('should update map location', () => {
    const store = useCanvasStore()
    store.createBoard('Test')

    const card = store.addCard({
      type: 'map',
      position: { x: 0, y: 0 },
      size: { width: 400, height: 350 },
      content: '',
      mapLocation: ''
    })

    store.updateCard(card.id, { mapLocation: 'Paris, France' })

    const updated = store.currentBoard?.cards.find(c => c.id === card.id)
    expect(updated?.mapLocation).toBe('Paris, France')
  })

  it('should update table data', () => {
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

    store.updateCard(card.id, {
      tableData: {
        rows: 3,
        cols: 3,
        cells: [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9']]
      }
    })

    const updated = store.currentBoard?.cards.find(c => c.id === card.id)
    expect(updated?.tableData?.rows).toBe(3)
    expect(updated?.tableData?.cells[0][0]).toBe('1')
  })
})
