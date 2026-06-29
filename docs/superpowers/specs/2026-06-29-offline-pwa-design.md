# Katachi as an Offline-Capable Installable PWA

**Date:** 2026-06-29
**Status:** Approved (design)

## Goal

Make Katachi an **installable PWA that is fully usable offline**. A user can install
the app, open it with no network (e.g. on a plane), work on their boards, and have
changes sync back to the server when a connection returns.

## Context (current architecture)

- Nuxt 4 SSR app. The HTML page is served per-request from the server.
- Boards (including base64 image data URLs and drawings) are stored in `localStorage`
  and reloaded locally on boot — content persistence is already half-local.
- Boards also sync to a Postgres server via `POST /api/boards/sync`, with WebSocket +
  5s polling for realtime collaboration.
- Auth is email-code based; sessions live in Redis. `app.vue` calls
  `authStore.checkAuth()` on boot and redirects to `/login` if it fails.

### Confirmed problems blocking offline use

1. **App shell is not cached.** Offline, the SSR page does not load at all — no
   service worker / manifest.
2. **Auth gate kicks you out offline.** `checkAuth()` (`stores/auth.ts`) catches *all*
   errors and sets `isAuthenticated = false`, so a network failure is treated
   identically to a real `401` → redirect to `/login` → login also needs the server →
   dead end.
3. **Offline edits are silently dropped.** `useSync.saveToOfflineQueue()` writes
   pending ops to IndexedDB, but nothing ever flushes that queue on reconnect.
4. **localStorage size limit.** Boards with base64 images blow past the ~5MB
   localStorage quota and silently fail to save — unacceptable when the server can't
   be relied on as a backup.

## Decisions

- **Scenario:** installable PWA, fully usable offline.
- **Offline auth:** trust the last session offline; re-verify silently when back online.
- **Storage:** migrate board persistence from `localStorage` to IndexedDB.
- **PWA tooling:** `@vite-pwa/nuxt` (maintained `vite-plugin-pwa` integration for
  Nuxt 4). Rejected: hand-rolled service worker (maintenance cost, no benefit); the
  legacy `@nuxtjs/pwa` (not Nuxt 4 compatible).

## Design

### 1. PWA shell + installability

- Add and configure `@vite-pwa/nuxt`:
  - Web app manifest: name "Katachi", `display: standalone`, theme/background colors,
    icons.
  - `registerType: 'autoUpdate'` with an "update available" prompt to the user.
- Generate maskable PNG icons (192px, 512px) from the existing `logo.svg` into
  `public/`.
- Caching strategy (the app is SSR, so the HTML document is dynamic):
  - **Precache** all `/_nuxt/*` build assets (JS/CSS) — Workbox handles automatically.
  - **Navigation requests** (`/`): `NetworkFirst` with cache fallback. The first online
    visit caches the document; offline visits serve it from cache. Provide a small
    `offline.html` as the ultimate fallback.
  - **Map tiles / link-preview / external resources:** `NetworkFirst` /
    `StaleWhileRevalidate` that fails gracefully offline.

### 2. Offline auth (trust last session)

- Persist the authenticated `user` locally (IndexedDB `meta` store) on successful
  login / `checkAuth`.
- Rewrite `checkAuth()` to distinguish **network error** from **HTTP 401**:
  - Real `401` → genuinely logged out: clear cached user, redirect to `/login`.
  - **Network/fetch error** → keep cached user, set `isAuthenticated = true` in an
    "offline" state, allow access to boards.
  - On reconnect, silently re-verify; only act on a real 401 then.
- `app.vue` gate: do not redirect to `/login` when offline if a cached user exists.
- Fix `logout()` to clear only Katachi's own keys / IDB stores, not blanket
  `localStorage.clear()` (which nukes unrelated state and races with IDB).

### 3. Sync-queue replay (offline edits survive)

- Add `flushOfflineQueue()` to `useSync.ts`: read queued ops from IDB, `POST` them to
  `/api/boards/sync`, clear on success.
- Trigger flush on: the browser `online` event, and on app start when authenticated
  and online.
- Persist the in-memory sync queue to IDB as well, so a reload while offline does not
  lose pending ops.

### 4. Persistence → IndexedDB

- Introduce one small IDB module (`utils/idb.ts` or `composables/useIndexedDB.ts`) that
  owns object stores: `boards`, `meta` (viewport / settings / dark mode / cached user),
  and `syncQueue`. Consolidates the hand-rolled `openIndexedDB` currently in
  `useSync.ts`.
- Move board load/save in `stores/canvas.ts` from `localStorage` to IDB (async,
  debounced save).
- **One-time migration:** on first load, if `localStorage['katachi_boards']` exists,
  copy it into IDB then remove the old key — existing users keep their boards.
- Tiny non-critical keys (e.g. dark mode flag) may remain in `localStorage` where
  simplest; boards/images are what require IDB's larger quota.

## Files touched

- `nuxt.config.ts` — add `@vite-pwa/nuxt` module + `pwa` config
- `public/` — manifest icons, `offline.html`
- new `utils/idb.ts` (or `composables/useIndexedDB.ts`)
- `stores/canvas.ts` — IDB persistence + one-time migration
- `stores/auth.ts` — offline-aware `checkAuth`, scoped `logout`, cache user
- `composables/useSync.ts` — queue flush, online/offline listeners, shared IDB module
- `app.vue` — offline-aware auth gate + reconnect flush

## Testing

- Vitest unit tests for:
  - IDB module: load / save / one-time migration from localStorage.
  - Offline `checkAuth` fallback: network-error path keeps session; 401 path clears it.
  - `flushOfflineQueue`: replays queued ops and clears on success; re-queues on failure.
- Service-worker / install behavior verified against a production build
  (`npm run build` + `preview`) and a manual offline check (Playwright: go offline →
  reload → boards still present and editable).

## Out of scope (degrade gracefully, online-only by nature)

- Realtime WebSocket collaboration
- Map tiles (OpenStreetMap)
- Link-preview metadata fetching

These fail quietly offline and resume when the connection returns.
