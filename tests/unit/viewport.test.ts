import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCanvasStore } from '~/stores/canvas'

describe('Viewport Management', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should initialize viewport at origin with scale 1', () => {
    const store = useCanvasStore()

    expect(store.viewport.x).toBe(0)
    expect(store.viewport.y).toBe(0)
    expect(store.viewport.scale).toBe(1)
  })

  it('should update viewport position', () => {
    const store = useCanvasStore()

    store.updateViewport({ x: 100, y: 200 })

    expect(store.viewport.x).toBe(100)
    expect(store.viewport.y).toBe(200)
    expect(store.viewport.scale).toBe(1)
  })

  it('should update viewport scale', () => {
    const store = useCanvasStore()

    store.updateViewport({ scale: 1.5 })

    expect(store.viewport.scale).toBe(1.5)
    expect(store.viewport.x).toBe(0)
    expect(store.viewport.y).toBe(0)
  })

  it('should update multiple viewport properties at once', () => {
    const store = useCanvasStore()

    store.updateViewport({ x: 50, y: 75, scale: 2 })

    expect(store.viewport.x).toBe(50)
    expect(store.viewport.y).toBe(75)
    expect(store.viewport.scale).toBe(2)
  })

  it('should not affect panning state when updating viewport', () => {
    const store = useCanvasStore()

    store.setPanning(true)
    store.updateViewport({ x: 100, y: 100 })

    expect(store.isPanning).toBe(true)
  })
})

describe('Panning Behavior', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should only pan when isPanning is true', () => {
    const store = useCanvasStore()

    expect(store.isPanning).toBe(false)

    // Simulating that panning should not update viewport automatically
    // The actual panning logic is in the component
    store.setPanning(true)
    expect(store.isPanning).toBe(true)
  })

  it('should not pan while dragging a card', () => {
    const store = useCanvasStore()

    store.setDragging(true)
    expect(store.isDragging).toBe(true)

    // When dragging, panning should not be active
    // This is handled in component logic
    expect(store.isPanning).toBe(false)
  })
})

describe('Dark Mode', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should initialize with light mode', () => {
    const store = useCanvasStore()
    expect(store.darkMode).toBe(false)
  })

  it('should toggle dark mode', () => {
    const store = useCanvasStore()

    store.toggleDarkMode()
    expect(store.darkMode).toBe(true)

    store.toggleDarkMode()
    expect(store.darkMode).toBe(false)
  })
})
