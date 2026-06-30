import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { idbGet, idbSet, idbDelete, queueAdd, queueGetAll, queueClear } from '~/utils/idb'

describe('idb module', () => {
  beforeEach(async () => {
    // Start each test from a clean kv + queue
    await idbDelete('boards')
    await idbDelete('user')
    await queueClear()
  })

  it('returns the fallback when a key is missing', async () => {
    const value = await idbGet('boards', null)
    expect(value).toBeNull()
  })

  it('round-trips a value through set/get', async () => {
    await idbSet('boards', [{ id: 'b1', name: 'Board 1' }])
    const value = await idbGet<any[]>('boards', [])
    expect(value).toEqual([{ id: 'b1', name: 'Board 1' }])
  })

  it('deletes a key', async () => {
    await idbSet('user', { id: 'u1' })
    await idbDelete('user')
    expect(await idbGet('user', null)).toBeNull()
  })

  it('queues, reads, and clears sync ops', async () => {
    await queueAdd({ type: 'board', operation: 'update', id: 'b1', data: { id: 'b1' }, version: 1 })
    await queueAdd({ type: 'card', operation: 'create', id: 'c1', data: { id: 'c1' }, version: 1 })
    const ops = await queueGetAll()
    expect(ops).toHaveLength(2)
    expect(ops[0].queuedAt).toBeTypeOf('number')
    await queueClear()
    expect(await queueGetAll()).toHaveLength(0)
  })
})
