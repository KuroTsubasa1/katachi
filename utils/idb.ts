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
