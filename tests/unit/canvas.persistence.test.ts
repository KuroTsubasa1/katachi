import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCanvasStore } from '~/stores/canvas'
import { idbGet, idbSet, idbDelete } from '~/utils/idb'

describe('canvas store IndexedDB persistence', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    localStorage.clear()
    await idbDelete('boards')
    await idbDelete('currentBoardId')
    await idbDelete('drawings')
  })

  it('flushPersist writes boards to IndexedDB', async () => {
    const store = useCanvasStore()
    store.createBoard('My Board')
    await store.flushPersist()
    const boards = await idbGet<any[]>('boards', [])
    expect(boards).toHaveLength(1)
    expect(boards[0].name).toBe('My Board')
  })

  it('loadFromStorage reads boards back from IndexedDB', async () => {
    await idbSet('boards', [{ id: 'b1', name: 'Persisted', cards: [], connections: [], shapes: [] }])
    await idbSet('currentBoardId', 'b1')
    const store = useCanvasStore()
    await store.loadFromStorage()
    expect(store.boards).toHaveLength(1)
    expect(store.currentBoard?.id).toBe('b1')
  })

  it('migrates legacy localStorage boards into IndexedDB and removes the legacy key', async () => {
    localStorage.setItem('katachi_boards', JSON.stringify([{ id: 'old', name: 'Legacy', cards: [], connections: [], shapes: [] }]))
    localStorage.setItem('katachi_current_board_id', 'old')
    const store = useCanvasStore()
    await store.loadFromStorage()
    expect(store.boards).toHaveLength(1)
    expect(store.boards[0].name).toBe('Legacy')
    expect(localStorage.getItem('katachi_boards')).toBeNull()
    expect(await idbGet<any[]>('boards', [])).toHaveLength(1)
  })

  it('saveToLocalStorage keeps viewport in localStorage', () => {
    const store = useCanvasStore()
    store.viewport = { x: 10, y: 20, scale: 2 }
    store.saveToLocalStorage()
    expect(JSON.parse(localStorage.getItem('katachi_viewport')!)).toEqual({ x: 10, y: 20, scale: 2 })
  })
})
