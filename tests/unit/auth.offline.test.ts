import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '~/stores/auth'
import { idbSet, idbGet, idbDelete } from '~/utils/idb'

describe('auth store offline behaviour', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await idbDelete('user')
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('caches the user when the server confirms a session', async () => {
    vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({ user: { id: 'u1', email: 'a@b.c', name: null } }))
    const store = useAuthStore()
    await store.checkAuth()
    expect(store.isAuthenticated).toBe(true)
    expect(store.isOffline).toBe(false)
    expect(await idbGet('user', null)).toMatchObject({ id: 'u1' })
  })

  it('trusts the cached user on a network error (offline)', async () => {
    await idbSet('user', { id: 'u1', email: 'a@b.c', name: null })
    vi.stubGlobal('$fetch', vi.fn().mockRejectedValue(new Error('Failed to fetch')))
    const store = useAuthStore()
    await store.checkAuth()
    expect(store.isAuthenticated).toBe(true)
    expect(store.isOffline).toBe(true)
    expect(store.user?.id).toBe('u1')
  })

  it('clears the session when the server confirms no user', async () => {
    await idbSet('user', { id: 'u1', email: 'a@b.c', name: null })
    vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({ user: null }))
    const store = useAuthStore()
    await store.checkAuth()
    expect(store.isAuthenticated).toBe(false)
    expect(await idbGet('user', null)).toBeNull()
  })

  it('clears the session on a real 401', async () => {
    await idbSet('user', { id: 'u1', email: 'a@b.c', name: null })
    vi.stubGlobal('$fetch', vi.fn().mockRejectedValue(Object.assign(new Error('Unauthorized'), { statusCode: 401 })))
    const store = useAuthStore()
    await store.checkAuth()
    expect(store.isAuthenticated).toBe(false)
    expect(store.isOffline).toBe(false)
    expect(await idbGet('user', null)).toBeNull()
  })

  it('logout clears cached user without wiping all of localStorage', async () => {
    localStorage.setItem('unrelated_key', 'keep-me')
    localStorage.setItem('katachi_viewport', '{}')
    await idbSet('user', { id: 'u1' })
    vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({}))
    const store = useAuthStore()
    await store.logout()
    expect(localStorage.getItem('unrelated_key')).toBe('keep-me')
    expect(localStorage.getItem('katachi_viewport')).toBeNull()
    expect(await idbGet('user', null)).toBeNull()
  })
})
