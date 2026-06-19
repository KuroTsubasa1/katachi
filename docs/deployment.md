# Deployment

Katachi auto-deploys to `https://katachi.lasseharm.space` on every push to `main`
via the [`Deploy`](../.github/workflows/deploy.yml) GitHub Actions workflow.

## How it works

```
push to main ──▶ GitHub Actions ──ssh──▶ server (/opt/katachi)
                                          git reset --hard origin/main
                                          docker compose up -d --build
                                          docker image prune -f
                 ◀── health check (curl https://katachi.lasseharm.space)

host nginx ──TLS──▶ katachi.lasseharm.space ──proxy──▶ 127.0.0.1:3000 (app container)
                                                        db / redis (internal only)
```

- The app container publishes only to `127.0.0.1:3000`; Postgres and Redis are not
  published to the host at all (reachable only inside the `katachi_network`).
- Database migrations run automatically on container start (`docker-entrypoint.sh` →
  `npm run db:push`).
- The deploy uses a **login shell** (`bash -lc`) so nvm/docker are on `PATH` in the
  non-interactive SSH session.

## Required GitHub repo secrets

| Secret | Purpose |
|--------|---------|
| `SSH_PRIVATE_KEY` | Private key whose public key is in the server user's `~/.ssh/authorized_keys`. |
| `SSH_HOST` | Server hostname or IP. |
| `SSH_USER` | Login user that owns `/opt/katachi` and can run `docker`. |

## One-time server setup

Run these once on the server.

### 1. Install dependencies

```bash
# Docker Engine + compose plugin (see https://docs.docker.com/engine/install/)
# nginx + certbot
sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx
# Let the deploy user run docker without sudo:
sudo usermod -aG docker "$USER"   # log out/in afterwards
```

### 2. Clone the repo into /opt

```bash
sudo git clone https://github.com/KuroTsubasa1/katachi /opt/katachi
sudo chown -R "$USER":"$USER" /opt/katachi
```

### 3. Create the production .env

The pipeline never writes secrets — create `/opt/katachi/.env` by hand from
`.env.example` with real production values:

```bash
cd /opt/katachi
cp .env.example .env
# then edit .env:
#   NODE_ENV=production
#   POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_DB  (must match docker-compose.yml db service)
#   SESSION_SECRET=<random, >= 32 chars>
#   SMTP_* = real mail credentials
#   NUXT_PUBLIC_APP_URL=https://katachi.lasseharm.space
```

> `.env` is git-ignored, so `git reset --hard` during deploys preserves it.

### 4. Configure nginx + SSL

```bash
sudo ln -s /opt/katachi/deploy/nginx/katachi.conf /etc/nginx/sites-enabled/katachi.conf
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d katachi.lasseharm.space   # issues cert + enables auto-renew
```

Point a DNS `A`/`AAAA` record for `katachi.lasseharm.space` at the server before
running certbot.

### 5. First deploy

Push to `main` (or run the `Deploy` workflow manually via **Actions → Deploy → Run
workflow**). To run it by hand the first time:

```bash
cd /opt/katachi
docker compose up -d --build
```

## Rollback

```bash
cd /opt/katachi
git reset --hard <previous-good-sha>
docker compose up -d --build
```

## Troubleshooting

- **Workflow can't SSH:** confirm `SSH_PRIVATE_KEY` matches a key in the server user's
  `authorized_keys`, and that `SSH_HOST`/`SSH_USER` are correct.
- **`docker: command not found` over SSH:** the deploy uses `bash -lc`; ensure docker is
  on the login-shell `PATH` for `SSH_USER`.
- **Health check fails but site loads:** check the app logs with
  `docker compose logs -f app`; the check retries for ~60s before failing.
- **502 from nginx:** the app container isn't up on `127.0.0.1:3000` —
  `docker compose ps` / `docker compose logs app`.
