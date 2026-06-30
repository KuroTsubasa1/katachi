# Offline-Capable Installable PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Katachi into an installable PWA that loads and is fully usable offline, with board data in IndexedDB, an offline-aware auth gate, and a sync queue that replays edits on reconnect.

**Architecture:** A single IndexedDB module (`utils/idb.ts`) owns all local persistence (boards, meta, cached user, sync queue). The Pinia stores read/write through it. `@vite-pwa/nuxt` precaches the built client assets and serves the app shell offline via a service worker. Auth distinguishes a real `401` (logged out) from a network error (offline → trust the cached session). The existing sync queue gains a `flushOfflineQueue()` that replays on the `online` event.

**Tech Stack:** Nuxt 4, Vue 3, Pinia, TypeScript, Vitest + happy-dom, `@vite-pwa/nuxt` (Workbox), `fake-indexeddb` (tests).

## Global Constraints

- Package manager: npm. Project is ESM (`"type": "module"`).
- Tests live under `tests/unit/` and `tests/components/`, run with `npm test` (vitest, `happy-dom` env, `globals: true`). Path aliases `~` and `@` both map to repo root.
- Follow existing store style: Pinia option stores (`defineStore('name', { state, getters, actions })`).
- All browser-only code must guard with `if (typeof window === 'undefined') return` (SSR safety), matching existing patterns.
- Do NOT use `localStorage.clear()` anywhere — only remove Katachi-scoped keys.
- Keep `saveToLocalStorage()` as the public method name on the canvas store (it has external callers); change only its body.
- Commit after each task with the message shown in its final step.

---

### Task 1: IndexedDB persistence module

**Files:**
- Create: `utils/idb.ts`
- Test: `tests/unit/idb.test.ts`
- Modify: `package.json` (add `fake-indexeddb` devDependency)

**Interfaces:**
- Consumes: nothing (leaf module).
- Produces:
  - `idbGet<T>(key: string, fallback: T): Promise<T>` — read one value from the `kv` store; returns `fallback` if missing or on error.
  - `idbSet(key: string, value: any): Promise<void>` — write one value to the `kv` store.
  - `idbDelete(key: string): Promise<void>` — delete one key from the `kv` store.
  - `queueAdd(op: any): Promise<void>` — append an op to the `syncQueue` store (auto-increment id, stamped with `queuedAt`).
  - `queueGetAll(): Promise<any[]>` — read all queued ops (each includes its stored `id` and `queuedAt`).
  - `queueClear(): Promise<void>` — empty the `syncQueue` store.
- Object stores (DB name `KatachiDB`, version `2`): `kv` (no keyPath, explicit string keys), `syncQueue` (`keyPath: 'id'`, `autoIncrement: true`).

- [ ] **Step 1: Add the test dependency**

Run:
```bash
npm install -D fake-indexeddb
```
Expected: `fake-indexeddb` appears under `devDependencies` in `package.json`.

- [ ] **Step 2: Write the failing test**

Create `tests/unit/idb.test.ts`:
```typescript
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
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- tests/unit/idb.test.ts`
Expected: FAIL — cannot resolve `~/utils/idb` / functions not defined.

- [ ] **Step 4: Implement the module**

Create `utils/idb.ts`:
```typescript
// Single owner of all Katachi IndexedDB persistence.
// `kv` store: explicit-key values (boards, currentBoardId, drawings, user).
// `syncQueue` store: auto-increment queued sync operations for offline replay.

const DB_NAME = 'KatachiDB'
const DB_VERSION = 2
const KV_STORE = 'kv'
const QUEUE_STORE = 'syncQueue'

let dbPromise: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(KV_STORE)) {
        db.createObjectStore(KV_STORE)
      }
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: 'id', autoIncrement: true })
      }
    }
  })
  return dbPromise
}

function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  return openDB().then(db => new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(store, mode)
    const request = fn(transaction.objectStore(store))
    request.onsuccess = () => resolve(request.result as T)
    request.onerror = () => reject(request.error)
  }))
}

export async function idbGet<T>(key: string, fallback: T): Promise<T> {
  try {
    const result = await tx<T | undefined>(KV_STORE, 'readonly', s => s.get(key))
    return result === undefined ? fallback : result
  } catch (error) {
    console.error('[idb] get failed:', error)
    return fallback
  }
}

export async function idbSet(key: string, value: any): Promise<void> {
  try {
    await tx(KV_STORE, 'readwrite', s => s.put(value, key))
  } catch (error) {
    console.error('[idb] set failed:', error)
  }
}

export async function idbDelete(key: string): Promise<void> {
  try {
    await tx(KV_STORE, 'readwrite', s => s.delete(key))
  } catch (error) {
    console.error('[idb] delete failed:', error)
  }
}

export async function queueAdd(op: any): Promise<void> {
  try {
    await tx(QUEUE_STORE, 'readwrite', s => s.add({ ...op, queuedAt: Date.now() }))
  } catch (error) {
    console.error('[idb] queueAdd failed:', error)
  }
}

export async function queueGetAll(): Promise<any[]> {
  try {
    return await tx<any[]>(QUEUE_STORE, 'readonly', s => s.getAll())
  } catch (error) {
    console.error('[idb] queueGetAll failed:', error)
    return []
  }
}

export async function queueClear(): Promise<void> {
  try {
    await tx(QUEUE_STORE, 'readwrite', s => s.clear())
  } catch (error) {
    console.error('[idb] queueClear failed:', error)
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- tests/unit/idb.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add utils/idb.ts tests/unit/idb.test.ts package.json package-lock.json
git commit -m "feat(idb): add IndexedDB persistence module for offline storage"
```

---

### Task 2: Canvas store persists to IndexedDB with one-time migration

**Files:**
- Modify: `stores/canvas.ts` (constants near top lines 5-8; `saveToLocalStorage`/`loadFromLocalStorage` at lines 696-769)
- Test: `tests/unit/canvas.persistence.test.ts` (new)

**Interfaces:**
- Consumes: `idbGet`, `idbSet` from `~/utils/idb` (Task 1).
- Produces (on the canvas store):
  - `saveToLocalStorage(): void` — unchanged name; writes viewport + settings to localStorage synchronously and schedules a debounced IndexedDB write of boards/currentBoardId/drawings.
  - `flushPersist(): Promise<void>` — cancels any pending debounce and writes boards/currentBoardId/drawings to IndexedDB immediately (used by tests and reconnect/unload paths).
  - `loadFromStorage(): Promise<void>` — runs migration, then loads boards/currentBoardId/drawings from IndexedDB and viewport/settings from localStorage. Replaces `loadFromLocalStorage`.
  - `migrateFromLocalStorage(): Promise<void>` — one-time copy of legacy localStorage boards into IndexedDB, then removes the legacy keys.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/canvas.persistence.test.ts`:
```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/canvas.persistence.test.ts`
Expected: FAIL — `flushPersist` / `loadFromStorage` not defined.

- [ ] **Step 3: Add the IndexedDB import and debounce timer**

In `stores/canvas.ts`, add the import after the existing `useSync` import (top of file):
```typescript
import { idbGet, idbSet } from '~/utils/idb'
```
Then, immediately after the four `const *_KEY = ...` lines (lines 5-8), add a module-level debounce handle:
```typescript
let persistTimer: ReturnType<typeof setTimeout> | null = null
```

- [ ] **Step 4: Replace `saveToLocalStorage` with the split persistence**

Replace the entire `saveToLocalStorage()` action body (lines 696-722) with:
```typescript
    saveToLocalStorage() {
      if (typeof window === 'undefined') return

      // Small, synchronous values stay in localStorage.
      try {
        localStorage.setItem(VIEWPORT_KEY, JSON.stringify(this.viewport))
        localStorage.setItem(SETTINGS_KEY, JSON.stringify({
          snapToGrid: this.snapToGrid,
          darkMode: this.darkMode
        }))
      } catch (error) {
        console.error('Failed to save settings to localStorage:', error)
      }

      // Large values (boards + drawings) go to IndexedDB, debounced.
      if (persistTimer) clearTimeout(persistTimer)
      persistTimer = setTimeout(() => {
        persistTimer = null
        void idbSet('boards', JSON.parse(JSON.stringify(this.boards)))
        void idbSet('currentBoardId', this.currentBoard?.id || '')
        void idbSet('drawings', JSON.parse(JSON.stringify(this.globalDrawingPaths)))
      }, 500)
    },

    async flushPersist() {
      if (persistTimer) {
        clearTimeout(persistTimer)
        persistTimer = null
      }
      if (typeof window === 'undefined') return
      await idbSet('boards', JSON.parse(JSON.stringify(this.boards)))
      await idbSet('currentBoardId', this.currentBoard?.id || '')
      await idbSet('drawings', JSON.parse(JSON.stringify(this.globalDrawingPaths)))
    },
```

- [ ] **Step 5: Replace `loadFromLocalStorage` with `loadFromStorage` + migration**

Replace the entire `loadFromLocalStorage()` action (lines 724-769) with:
```typescript
    async migrateFromLocalStorage() {
      if (typeof window === 'undefined') return
      const legacy = localStorage.getItem(STORAGE_KEY)
      if (!legacy) return
      try {
        if (!(await idbGet('boards', null))) {
          await idbSet('boards', JSON.parse(legacy))
          const cbid = localStorage.getItem('katachi_current_board_id')
          if (cbid) await idbSet('currentBoardId', cbid)
          const drawings = localStorage.getItem(DRAWING_KEY)
          if (drawings) await idbSet('drawings', JSON.parse(drawings))
        }
      } catch (error) {
        console.error('Migration to IndexedDB failed:', error)
        return
      }
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem('katachi_current_board_id')
      localStorage.removeItem(DRAWING_KEY)
    },

    async loadFromStorage() {
      if (typeof window === 'undefined') return

      try {
        await this.migrateFromLocalStorage()

        const boards = await idbGet<Board[] | null>('boards', null)
        if (boards) this.boards = boards

        const currentBoardId = await idbGet<string>('currentBoardId', '')
        if (currentBoardId) {
          this.currentBoard = this.boards.find(b => b.id === currentBoardId) || null
        }

        const drawings = await idbGet<string[] | null>('drawings', null)
        if (drawings) this.globalDrawingPaths = drawings

        const viewportData = localStorage.getItem(VIEWPORT_KEY)
        if (viewportData) this.viewport = JSON.parse(viewportData)

        const settingsData = localStorage.getItem(SETTINGS_KEY)
        if (settingsData) {
          const settings = JSON.parse(settingsData)
          this.snapToGrid = settings.snapToGrid || false
          this.darkMode = settings.darkMode || false
          if (this.darkMode && typeof document !== 'undefined') {
            document.documentElement.classList.add('dark')
          }
        }

        console.log('Loaded from storage:', this.boards.length, 'boards')
      } catch (error) {
        console.error('Failed to load from storage:', error)
      }
    },
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test -- tests/unit/canvas.persistence.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 7: Run the full suite to confirm no regressions**

Run: `npm test`
Expected: All previously-passing tests still pass (the canvas store's other actions are unchanged).

- [ ] **Step 8: Commit**

```bash
git add stores/canvas.ts tests/unit/canvas.persistence.test.ts
git commit -m "feat(canvas): persist boards to IndexedDB with one-time migration"
```

---

### Task 3: Offline-aware auth (trust last session, scoped logout)

**Files:**
- Modify: `stores/auth.ts` (whole file)
- Test: `tests/unit/auth.offline.test.ts` (new)

**Interfaces:**
- Consumes: `idbGet`, `idbSet`, `idbDelete` from `~/utils/idb` (Task 1).
- Produces (on the auth store):
  - New state field `isOffline: boolean`.
  - `checkAuth(): Promise<void>` — sets `isAuthenticated`/`user`; on network error falls back to the cached user (`isOffline = true`); on real `401` or server-confirmed no-user, clears the cached user.
  - `logout(): Promise<void>` — clears Katachi-scoped localStorage keys + cached user only (no `localStorage.clear()`).

- [ ] **Step 1: Write the failing test**

Create `tests/unit/auth.offline.test.ts`:
```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/auth.offline.test.ts`
Expected: FAIL — `isOffline` undefined / cached-user behaviour missing.

- [ ] **Step 3: Rewrite the auth store**

Replace the full contents of `stores/auth.ts` with:
```typescript
import { defineStore } from 'pinia'
import { idbGet, idbSet, idbDelete } from '~/utils/idb'

interface User {
  id: string
  email: string
  name: string | null
}

const KATACHI_LOCAL_KEYS = [
  'katachi_boards',
  'katachi_current_board_id',
  'katachi_drawings',
  'katachi_viewport',
  'katachi_settings'
]

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    isAuthenticated: false,
    isOffline: false,
    isLoading: false
  }),

  actions: {
    async checkAuth() {
      try {
        const response = await $fetch('/api/auth/me')
        if (response.user) {
          this.user = response.user
          this.isAuthenticated = true
          this.isOffline = false
          await idbSet('user', response.user)
        } else {
          // Server reachable and explicitly says: no session.
          this.user = null
          this.isAuthenticated = false
          this.isOffline = false
          await idbDelete('user')
        }
      } catch (error: any) {
        const status = error?.statusCode || error?.response?.status
        if (status === 401) {
          // Genuinely logged out.
          this.user = null
          this.isAuthenticated = false
          this.isOffline = false
          await idbDelete('user')
        } else {
          // Network/server unreachable: trust the last known session.
          const cached = await idbGet<User | null>('user', null)
          if (cached) {
            this.user = cached
            this.isAuthenticated = true
            this.isOffline = true
          } else {
            this.user = null
            this.isAuthenticated = false
          }
        }
      }
    },

    async login(email: string, password: string) {
      this.isLoading = true
      try {
        const response = await $fetch('/api/auth/login', {
          method: 'POST',
          body: { email, password }
        })
        this.user = response.user
        this.isAuthenticated = true
        this.isOffline = false
        await idbSet('user', response.user)
        return { success: true }
      } catch (error: any) {
        return { success: false, message: error.data?.message || 'Login failed' }
      } finally {
        this.isLoading = false
      }
    },

    async register(email: string, password: string, name?: string) {
      this.isLoading = true
      try {
        const response = await $fetch('/api/auth/register', {
          method: 'POST',
          body: { email, password, name }
        })
        this.user = response.user
        this.isAuthenticated = true
        this.isOffline = false
        await idbSet('user', response.user)
        return { success: true }
      } catch (error: any) {
        return { success: false, message: error.data?.message || 'Registration failed' }
      } finally {
        this.isLoading = false
      }
    },

    async logout() {
      try {
        await $fetch('/api/auth/logout', { method: 'POST' })
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        this.user = null
        this.isAuthenticated = false
        this.isOffline = false
        if (typeof window !== 'undefined') {
          await idbDelete('user')
          await idbSet('boards', null)
          await idbSet('currentBoardId', '')
          await idbSet('drawings', null)
          KATACHI_LOCAL_KEYS.forEach(key => localStorage.removeItem(key))
        }
      }
    }
  }
})
```

> Note: `login`/`register` keep their existing endpoint paths; only the cached-user write was added. The app currently uses code-based auth, but these methods are left intact to avoid scope creep.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/auth.offline.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add stores/auth.ts tests/unit/auth.offline.test.ts
git commit -m "feat(auth): trust cached session offline, scope logout to Katachi keys"
```

---

### Task 4: Sync queue replays on reconnect

**Files:**
- Modify: `composables/useSync.ts` (`saveToOfflineQueue` + `openIndexedDB` at the IndexedDB block; add `flushOfflineQueue`; export it)
- Test: `tests/unit/sync.flush.test.ts` (new)

**Interfaces:**
- Consumes: `queueAdd`, `queueGetAll`, `queueClear` from `~/utils/idb` (Task 1); `useAuthStore.isAuthenticated`/`isOffline` (Task 3).
- Produces (from `useSync()`): `flushOfflineQueue(): Promise<void>` — if authenticated, online, and not in offline mode, POSTs all queued ops to `/api/boards/sync` and clears the queue on success; leaves the queue intact on failure.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/sync.flush.test.ts`:
```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/sync.flush.test.ts`
Expected: FAIL — `flushOfflineQueue` is not a function.

- [ ] **Step 3: Replace the hand-rolled IndexedDB code with the shared module**

In `composables/useSync.ts`, update the import block at the top to add:
```typescript
import { queueAdd, queueGetAll, queueClear } from '~/utils/idb'
```
Delete the `openIndexedDB` function entirely. Replace the body of `saveToOfflineQueue` with a call to the shared module:
```typescript
  const saveToOfflineQueue = async (operations: any[]) => {
    if (typeof window === 'undefined') return
    for (const op of operations) {
      await queueAdd(op)
    }
  }
```

- [ ] **Step 4: Add `flushOfflineQueue` and an `online` listener**

In `composables/useSync.ts`, add this function inside `useSync` (next to `saveToOfflineQueue`):
```typescript
  const flushOfflineQueue = async () => {
    if (typeof window === 'undefined') return
    if (!authStore.isAuthenticated || authStore.isOffline) return
    if (!navigator.onLine) return

    const ops = await queueGetAll()
    if (ops.length === 0) return

    try {
      const operations = ops.map(({ id, queuedAt, ...op }) => op)
      await $fetch('/api/boards/sync', {
        method: 'POST',
        body: { operations }
      })
      await queueClear()
      syncStatus.value = 'synced'
    } catch (error) {
      console.error('[Sync] Failed to flush offline queue:', error)
      syncStatus.value = 'error'
    }
  }
```
Then, at the end of `startSync` (after the initial server pull succeeds), add a flush call so queued offline edits replay on app start:
```typescript
      // Replay anything queued while offline.
      await flushOfflineQueue()
```
(Place it just before `startSync`'s closing `catch`/end so it runs after the boards merge.)

- [ ] **Step 5: Export `flushOfflineQueue`**

In the `return { ... }` object at the bottom of `useSync`, add `flushOfflineQueue` to the exported members alongside `startSync`, `queueSync`, etc.

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test -- tests/unit/sync.flush.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 7: Run the full suite**

Run: `npm test`
Expected: All tests pass.

- [ ] **Step 8: Commit**

```bash
git add composables/useSync.ts tests/unit/sync.flush.test.ts
git commit -m "feat(sync): replay offline edit queue on reconnect"
```

---

### Task 5: Wire offline-aware boot + reconnect into app.vue

**Files:**
- Modify: `app.vue` (`onMounted` block, lines ~24-80)

**Interfaces:**
- Consumes: `canvasStore.loadFromStorage()` (Task 2), `useSync().flushOfflineQueue` (Task 4), `authStore.checkAuth`/`isAuthenticated` (Task 3).
- Produces: correct offline boot (no spurious redirect to `/login`) and a reconnect handler that re-verifies auth and flushes the queue.

- [ ] **Step 1: Pull `flushOfflineQueue` from useSync**

In `app.vue`, update the `useSync()` destructure to include `flushOfflineQueue`:
```typescript
const { startSync, startPolling, stopPolling, initWebSocket, joinBoard, leaveBoard, flushOfflineQueue } = useSync()
```

- [ ] **Step 2: Switch board loading to the async IndexedDB path**

In `app.vue` `onMounted`, replace the line:
```typescript
  canvasStore.loadFromLocalStorage()
```
with:
```typescript
  await canvasStore.loadFromStorage()
```

> The existing auth-gate block already redirects to `/login` only when `!authStore.isAuthenticated`. Because Task 3 makes `checkAuth()` set `isAuthenticated = true` from the cached user when offline, an installed user with a prior session now passes the gate offline — no further change to the redirect condition is required.

- [ ] **Step 3: Add a reconnect handler**

In `app.vue` `onMounted`, after the existing `if (authStore.isAuthenticated) { ... }` block, add:
```typescript
  // When connectivity returns, re-verify the session and replay queued edits.
  if (typeof window !== 'undefined') {
    window.addEventListener('online', async () => {
      await authStore.checkAuth()
      if (authStore.isAuthenticated) {
        await flushOfflineQueue()
      }
    })
  }
```

- [ ] **Step 4: Verify the app type-checks and builds**

Run: `npm run build`
Expected: Build completes without TypeScript errors referencing `loadFromStorage`, `flushOfflineQueue`, or `isOffline`.

- [ ] **Step 5: Commit**

```bash
git add app.vue
git commit -m "feat(app): offline-aware boot and reconnect handling"
```

---

### Task 6: Install and configure @vite-pwa/nuxt (manifest + service worker + icons)

**Files:**
- Modify: `package.json` (add `@vite-pwa/nuxt`, `@vite-pwa/assets-generator` devDependencies)
- Modify: `nuxt.config.ts` (register module + `pwa` config)
- Create: PWA icon PNGs in `public/` (generated)
- Create: `public/offline.html`

**Interfaces:**
- Consumes: existing `public/logo-icon.svg` (icon source).
- Produces: a `manifest.webmanifest`, a generated service worker precaching `/_nuxt/*`, runtime caching for navigations, and `$pwa` available to components (Task 7).

- [ ] **Step 1: Install dependencies**

Run:
```bash
npm install -D @vite-pwa/nuxt @vite-pwa/assets-generator
```
Expected: both appear under `devDependencies`.

- [ ] **Step 2: Generate PWA icons from the existing logo**

Run:
```bash
npx @vite-pwa/assets-generator --preset minimal-2023 public/logo-icon.svg
```
Expected: PNG assets (including `pwa-192x192.png`, `pwa-512x512.png`, `pwa-64x64.png`, `maskable-icon-512x512.png`, `apple-touch-icon-180x180.png`) are written under `public/`. Confirm with `ls public/*.png`.

> If the preset flag is rejected by the installed version, run `npx @vite-pwa/assets-generator --help` and use the documented invocation; the required outputs are the 192/512 standard icons and a 512 maskable icon under `public/`.

- [ ] **Step 3: Create the offline fallback page**

Create `public/offline.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Katachi — Offline</title>
    <style>
      body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f5f5f5; color: #374151; }
      .box { text-align: center; }
    </style>
  </head>
  <body>
    <div class="box">
      <h1>You're offline</h1>
      <p>Reopen Katachi once you have a connection, or relaunch the installed app to reach your cached boards.</p>
    </div>
  </body>
</html>
```

- [ ] **Step 4: Register and configure the module**

Edit `nuxt.config.ts`. Add `'@vite-pwa/nuxt'` to the `modules` array, and add a `pwa` block:
```typescript
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@vite-pwa/nuxt'
  ],

  pwa: {
    registerType: 'prompt',
    manifest: {
      name: 'Katachi — Visual Workspace',
      short_name: 'Katachi',
      description: 'A visual workspace for organizing creative projects',
      theme_color: '#3B82F6',
      background_color: '#f5f5f5',
      display: 'standalone',
      start_url: '/',
      icons: [
        { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
      ]
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      navigateFallback: '/offline.html',
      runtimeCaching: [
        {
          // App navigations: serve from network, fall back to cache offline.
          urlPattern: ({ request }) => request.mode === 'navigate',
          handler: 'NetworkFirst',
          options: {
            cacheName: 'katachi-pages',
            networkTimeoutSeconds: 3,
            expiration: { maxEntries: 32 }
          }
        },
        {
          // OpenStreetMap tiles: degrade gracefully offline.
          urlPattern: ({ url }) => url.host.includes('tile.openstreetmap.org'),
          handler: 'StaleWhileRevalidate',
          options: { cacheName: 'osm-tiles', expiration: { maxEntries: 200 } }
        }
      ]
    },
    devOptions: {
      enabled: false
    }
  }
```

- [ ] **Step 5: Build and confirm the service worker + manifest are emitted**

Run: `npm run build`
Expected: build succeeds; `.output/public/sw.js` and `.output/public/manifest.webmanifest` exist (confirm with `ls .output/public/sw.js .output/public/manifest.webmanifest`).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json nuxt.config.ts public/
git commit -m "feat(pwa): add installable manifest, service worker, and icons"
```

---

### Task 7: Update-available prompt

**Files:**
- Create: `components/PwaUpdatePrompt.vue`
- Modify: `app.vue` (render the component)

**Interfaces:**
- Consumes: `useNuxtApp().$pwa` (provided by `@vite-pwa/nuxt` with `registerType: 'prompt'`), exposing reactive `needRefresh` and `updateServiceWorker()`.
- Produces: a small banner that appears when a new version is ready and reloads on confirm.

- [ ] **Step 1: Create the prompt component**

Create `components/PwaUpdatePrompt.vue`:
```vue
<template>
  <div
    v-if="$pwa?.needRefresh"
    class="fixed bottom-4 right-4 z-[100] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-xs"
  >
    <p class="text-sm text-gray-700 dark:text-gray-200 mb-3">A new version of Katachi is available.</p>
    <div class="flex gap-2 justify-end">
      <button
        @click="$pwa.cancelPrompt()"
        class="px-3 py-1 text-sm rounded text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        Later
      </button>
      <button
        @click="$pwa.updateServiceWorker()"
        class="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
      >
        Reload
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const { $pwa } = useNuxtApp()
</script>
```

> `$pwa.cancelPrompt()` and `$pwa.updateServiceWorker()` are provided by `@vite-pwa/nuxt`. If `cancelPrompt` is unavailable in the installed version, set `$pwa.needRefresh = false` instead.

- [ ] **Step 2: Render it in app.vue**

In `app.vue`'s `<template>`, add the component inside the root `#app` div, after `<KeyboardShortcutsHelp ... />`:
```vue
    <PwaUpdatePrompt />
```

- [ ] **Step 3: Build to confirm no errors**

Run: `npm run build`
Expected: build succeeds; no errors referencing `$pwa` or `PwaUpdatePrompt`.

- [ ] **Step 4: Commit**

```bash
git add components/PwaUpdatePrompt.vue app.vue
git commit -m "feat(pwa): prompt the user when an app update is ready"
```

---

### Task 8: End-to-end offline verification

**Files:** none (manual + scripted verification).

- [ ] **Step 1: Build and preview the production app**

Run:
```bash
npm run build
npm run preview
```
Expected: app served (note the URL, typically `http://localhost:3000`).

- [ ] **Step 2: Verify installability + service worker (manual, Chrome DevTools)**

Open the preview URL in Chrome. In DevTools → Application:
- "Manifest" shows name "Katachi — Visual Workspace" and the icons.
- "Service Workers" shows an activated worker.
Expected: both present; an install icon appears in the address bar.

- [ ] **Step 3: Verify offline boot with Playwright**

Use the Playwright tools to script: navigate to the preview URL while online (let the SW install and a board load), then set the browser offline, reload, and confirm the boards UI still renders (not the `/login` page and not a browser error page). Concretely:
1. `browser_navigate` to the preview URL.
2. Create or confirm at least one board exists, then `browser_wait_for` the sidebar/board UI.
3. Toggle offline (`browser_run_code_unsafe` calling the CDP/context offline API, or DevTools protocol) and `browser_navigate` (reload) the URL.
4. `browser_snapshot` and assert the board workspace is visible.
Expected: the app shell loads from cache and the previously-saved board is present and editable offline.

- [ ] **Step 4: Verify reconnect replay (manual)**

While offline, edit a board (move/add a card). Confirm the change persists across an offline reload. Then go back online and confirm the queued edit is POSTed to `/api/boards/sync` (Network tab) and the queue clears.
Expected: offline edits survive reload and sync after reconnect.

- [ ] **Step 5: Final regression pass**

Run: `npm test`
Expected: full suite green.

- [ ] **Step 6: Commit any verification fixes (if needed)**

```bash
git add -A
git commit -m "fix(pwa): address offline verification findings"
```
(Skip if no changes were required.)

---

## Self-Review

**Spec coverage:**
- PWA shell + installability → Tasks 6, 7, 8. ✓
- Offline auth (trust last session, network-vs-401, scoped logout) → Task 3, wired in Task 5. ✓
- Sync-queue replay (flush on reconnect, persist queue) → Tasks 1 (queue store), 4 (flush), 5 (online listener). ✓
- Persistence → IndexedDB (module, migration, board load/save) → Tasks 1, 2. ✓
- Out-of-scope degrade-gracefully (map tiles/link-preview/WebSocket) → no offline work; OSM tiles get a forgiving runtime cache in Task 6. ✓
- Update prompt (user-confirmed) → Task 7 with `registerType: 'prompt'`. ✓
- Dark-mode flag stays in localStorage (user-confirmed) → Task 2 keeps settings in localStorage. ✓

**Placeholder scan:** No TBD/TODO; every code step shows complete code; commands have expected output. Icon-generation and `$pwa.cancelPrompt` steps include explicit fallbacks for version drift.

**Type consistency:** `loadFromStorage`, `flushPersist`, `migrateFromLocalStorage`, `saveToLocalStorage` (canvas); `checkAuth`, `logout`, `isOffline` (auth); `flushOfflineQueue` (sync); `idbGet`/`idbSet`/`idbDelete`/`queueAdd`/`queueGetAll`/`queueClear` (idb) are referenced consistently across producing and consuming tasks. `idbGet(key, fallback)` signature used uniformly.
