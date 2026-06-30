import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSync } from '~/composables/useSync'
import { useAuthStore } from '~/stores/auth'
import { queueAdd, queueGetAll, queueClear } from '~/utils/idb'

describe('useSync flushOfflineQueue', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await queueClear()
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('replays queued ops to the server and clears the queue', async () => {
    const auth = useAuthStore()
    auth.isAuthenticated = true
    auth.isOffline = false
    await queueAdd({ type: 'board', operation: 'update', id: 'b1', data: { id: 'b1' }, version: 1 })
    const fetchMock = vi.fn().mockResolvedValue({ results: [] })
    vi.stubGlobal('$fetch', fetchMock)

    const { flushOfflineQueue } = useSync()
    await flushOfflineQueue()

    expect(fetchMock).toHaveBeenCalledWith('/api/boards/sync', expect.objectContaining({ method: 'POST' }))
    expect(await queueGetAll()).toHaveLength(0)
  })

  it('keeps the queue when the replay request fails', async () => {
    const auth = useAuthStore()
    auth.isAuthenticated = true
    auth.isOffline = false
    await queueAdd({ type: 'board', operation: 'update', id: 'b1', data: { id: 'b1' }, version: 1 })
    vi.stubGlobal('$fetch', vi.fn().mockRejectedValue(new Error('network')))

    const { flushOfflineQueue } = useSync()
    await flushOfflineQueue()

    expect(await queueGetAll()).toHaveLength(1)
  })

  it('does nothing when not authenticated', async () => {
    const auth = useAuthStore()
    auth.isAuthenticated = false
    await queueAdd({ type: 'board', operation: 'update', id: 'b1', data: { id: 'b1' }, version: 1 })
    const fetchMock = vi.fn()
    vi.stubGlobal('$fetch', fetchMock)

    const { flushOfflineQueue } = useSync()
    await flushOfflineQueue()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(await queueGetAll()).toHaveLength(1)
  })
})
