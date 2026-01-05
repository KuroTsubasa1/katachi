import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCanvasStore } from '~/stores/canvas'

describe('Global Drawing', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should initialize with empty drawing paths', () => {
    const store = useCanvasStore()
    expect(store.globalDrawingPaths).toEqual([])
  })

  it('should add drawing paths', () => {
    const store = useCanvasStore()
    const testPath = JSON.stringify({
      points: [{ x: 10, y: 10 }, { x: 20, y: 20 }],
      color: '#000000',
      width: 2
    })

    store.addGlobalDrawingPath(testPath)

    expect(store.globalDrawingPaths).toHaveLength(1)
    expect(store.globalDrawingPaths[0]).toBe(testPath)
  })

  it('should persist multiple drawing paths', () => {
    const store = useCanvasStore()

    const path1 = JSON.stringify({ points: [{ x: 0, y: 0 }], color: '#ff0000', width: 2 })
    const path2 = JSON.stringify({ points: [{ x: 10, y: 10 }], color: '#00ff00', width: 3 })

    store.addGlobalDrawingPath(path1)
    store.addGlobalDrawingPath(path2)

    expect(store.globalDrawingPaths).toHaveLength(2)
  })

  it('should clear all drawing paths', () => {
    const store = useCanvasStore()

    store.addGlobalDrawingPath('path1')
    store.addGlobalDrawingPath('path2')
    expect(store.globalDrawingPaths).toHaveLength(2)

    store.clearGlobalDrawing()

    expect(store.globalDrawingPaths).toEqual([])
  })

  it('should maintain drawing paths when switching tools', () => {
    const store = useCanvasStore()

    store.setTool({ type: 'pen' })
    store.addGlobalDrawingPath('drawing1')

    store.setTool({ type: 'select' })
    expect(store.globalDrawingPaths).toHaveLength(1)

    store.setTool({ type: 'pen' })
    expect(store.globalDrawingPaths).toHaveLength(1)
  })

  it('should update current tool properties', () => {
    const store = useCanvasStore()

    store.setTool({ type: 'pen', color: '#ff0000', width: 5 })

    expect(store.currentTool.type).toBe('pen')
    expect(store.currentTool.color).toBe('#ff0000')
    expect(store.currentTool.width).toBe(5)
  })

  it('should handle eraser tool', () => {
    const store = useCanvasStore()

    store.setTool({ type: 'eraser', width: 10 })

    expect(store.currentTool.type).toBe('eraser')
    expect(store.currentTool.width).toBe(10)
  })
})

describe('Drawing Tool State', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should default to select tool', () => {
    const store = useCanvasStore()
    expect(store.currentTool.type).toBe('select')
  })

  it('should allow partial tool updates', () => {
    const store = useCanvasStore()
    store.setTool({ type: 'pen', color: '#ff0000', width: 3 })

    store.setTool({ width: 5 })

    expect(store.currentTool.type).toBe('pen')
    expect(store.currentTool.color).toBe('#ff0000')
    expect(store.currentTool.width).toBe(5)
  })
})
