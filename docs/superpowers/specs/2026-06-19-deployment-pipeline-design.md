# Deployment Pipeline Design — katachi

**Date:** 2026-06-19
**Status:** Approved (pending spec review)

## Goal

Automatically deploy the katachi Nuxt app to a Linux server on every push to `main`,
serving it at `https://katachi.lasseharm.space` with SSL, behind host nginx.

## Context

- **App:** Nuxt 4 (Nitro server, port 3000), uses **WebSockets** (`nitro.experimental.websocket`).
- **Runtime:** Docker Compose stack — `app` + `db` (Postgres 16) + `redis` (Redis 7).
- **Migrations:** run automatically on container start via `docker-entrypoint.sh` (`npm run db:push`).
- **Repo:** public GitHub repo `KuroTsubasa1/katachi`.
- **Available GitHub repo secrets:** `SSH_PRIVATE_KEY`, `SSH_HOST`, `SSH_USER`.
- **Server facts:** nvm is installed (so non-interactive SSH sessions need a login shell to
  pick up node/docker on PATH). Project lives in its own directory under `/opt`.

## Decisions

| Decision | Choice |
|----------|--------|
| Build strategy | Build on the server (`docker compose up -d --build`). No registry. |
| Nginx | On the host, reverse-proxy to `127.0.0.1:3000`. |
| SSL | Let's Encrypt via certbot (`--nginx`), auto-renew. |
| Production `.env` | Placed on the server once by hand; pipeline never touches secrets. |
| Health check | Yes — fail the job if the site does not return HTTP 200 after deploy. |

## Architecture

```
push to main
   │
   ▼
GitHub Actions (deploy.yml)
   │  install SSH_PRIVATE_KEY, known_hosts := SSH_HOST
   ▼
ssh SSH_USER@SSH_HOST  (login shell)
   │
   ▼
/opt/katachi  (server-side deploy)
   git fetch origin && git reset --hard origin/main
   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
   docker image prune -f
   │
   ▼
nginx (host) ──TLS── katachi.lasseharm.space ──proxy──▶ 127.0.0.1:3000 (app container)
                                                          │
                                                  db / redis (internal network only)
```

## Components

### 1. `.github/workflows/deploy.yml`

- **Triggers:** `push` to `main`, plus `workflow_dispatch` (manual).
- **Concurrency:** group `deploy-main`, `cancel-in-progress: false` (don't interrupt an
  in-flight deploy mid-build).
- **Steps:**
  1. Write `SSH_PRIVATE_KEY` to a temp key file (mode 600), add `SSH_HOST` to `known_hosts`
     via `ssh-keyscan`.
  2. SSH to the server and run the remote deploy command through a **login shell**
     (`ssh ... "bash -lc '<script>'"`) so nvm/docker are on PATH.
  3. Remote script (fails fast with `set -e`):
     - `cd /opt/katachi`
     - `git fetch origin && git reset --hard origin/main`
     - `docker compose up -d --build`
     - `docker image prune -f`
  4. **Health check** step: `curl -fsS -o /dev/null -w "%{http_code}" https://katachi.lasseharm.space`
     with a short retry loop (give the container a few seconds to come up). Fail the job
     on non-200.

### 2. `docker-compose.yml` hardening (edit base file)

`docker-compose.dev.yml` is fully standalone (its own network, dev Dockerfile, bind mounts)
and does **not** extend `docker-compose.yml` — so `docker-compose.yml` is the production
file and can be hardened directly without affecting local dev.

> A `docker-compose.prod.yml` override was rejected: Compose **concatenates** `ports` lists
> across `-f` files, so an override can neither remove a published port (`ports: []` appends
> nothing) nor replace a public bind with a loopback one (it adds a second mapping). Editing
> the base file is the only reliable way to unpublish ports.

- `app`: bind published port to **`127.0.0.1:3000:3000`** (loopback only — nginx reaches it
  locally; the app is not directly exposed to the internet).
- `db`: remove the public `5432` mapping (reachable only inside `katachi_network`).
- `redis`: remove the public `6379` mapping (reachable only inside `katachi_network`).

### 3. `deploy/nginx/katachi.conf`

Host nginx server config:

- Port 80 server: `server_name katachi.lasseharm.space;` — serves the ACME challenge and
  redirects everything else to HTTPS. (certbot rewrites/augments this on first cert issue.)
- Port 443 server (TLS):
  - `proxy_pass http://127.0.0.1:3000;`
  - **WebSocket support:** `proxy_http_version 1.1;`, `proxy_set_header Upgrade $http_upgrade;`,
    `proxy_set_header Connection "upgrade";`
  - Proxy headers: `Host`, `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`.
  - `proxy_read_timeout` raised (e.g. 86400s) so idle WebSocket connections aren't dropped.
  - `ssl_certificate` / `ssl_certificate_key` point at the Let's Encrypt live paths
    (managed by certbot).

### 4. `docs/deployment.md` — one-time server setup

Manual steps performed once on the server:

1. Install Docker Engine + compose plugin, nginx, certbot (`certbot` + `python3-certbot-nginx`).
2. `sudo git clone https://github.com/KuroTsubasa1/katachi /opt/katachi`
   (and ensure `SSH_USER` owns it so the pipeline can pull).
3. Create `/opt/katachi/.env` from `.env.example` with real production values
   (`POSTGRES_PASSWORD`, `SESSION_SECRET` ≥ 32 chars, SMTP creds,
   `NUXT_PUBLIC_APP_URL=https://katachi.lasseharm.space`). **Never committed.**
4. Symlink the nginx config: `ln -s /opt/katachi/deploy/nginx/katachi.conf
   /etc/nginx/sites-enabled/` (or copy into `conf.d/`), `nginx -t`, `systemctl reload nginx`.
5. Issue the cert: `sudo certbot --nginx -d katachi.lasseharm.space`.
6. First deploy: trigger the workflow (or run the deploy commands by hand once).

## Error handling

- `set -e` in the remote script → any failed step aborts the deploy and fails the job.
- `git reset --hard origin/main` discards uncommitted changes in `/opt/katachi`. This is the
  intended clean-deploy behavior; `.env` is git-ignored and therefore preserved.
- Health-check retry loop tolerates container startup latency but fails the job if the site
  never returns 200, so a broken deploy surfaces as a red workflow run.
- `docker compose up -d --build` keeps the previous containers running until the new ones are
  ready; a build failure leaves the old version serving.

## Out of scope (YAGNI)

- Container registry / image versioning.
- Zero-downtime blue-green deploys.
- Rollback automation (manual: `git reset --hard <prev-sha>` + redeploy).
- Separate migration job (handled by the entrypoint).
