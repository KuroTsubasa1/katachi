# Katachi Setup Guide

## Server-Side Persistence & Authentication

Katachi now includes full authentication, server-side sync, real-time collaboration, board sharing, and version history!

## Quick Start

### 1. Environment Setup

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

**Important:** Update `SESSION_SECRET` to a random 32+ character string:
```env
SESSION_SECRET=your-random-32-plus-character-secret-key-here
```

### 2. Start Services with Docker

```bash
docker-compose up -d
```

This starts:
- PostgreSQL database (port 5432)
- Redis (port 6379)
- Katachi app (port 3000)

### 3. Run Database Migrations

```bash
npm run db:generate
npm run db:migrate
```

### 4. Start Development

```bash
npm run dev:notest
```

Open http://localhost:3000

## First Time Setup

### Create an Account

1. Go to http://localhost:3000
2. You'll be redirected to `/login`
3. Click "Sign up"
4. Enter email and password (min 8 characters)
5. Click "Create Account"

### Migrating Existing Data

If you have data in localStorage:
1. Login with your new account
2. A migration prompt will appear (if implemented)
3. Click "Sync to Cloud" to upload your existing boards

## Features

### ✅ Authentication
- Email + password login
- Secure session management with Redis
- Automatic session persistence (7 days)

### ✅ Server-Side Sync
- Auto-sync every 500ms (debounced)
- Offline-first architecture
- Works without internet
- Syncs when connection restored

### ✅ Real-Time Collaboration
- See other users' cursors on shared boards
- Live updates when others edit
- Redis pub/sub for instant updates

### ✅ Board Sharing
- Share boards with other users
- 3 permission levels: view, edit, admin
- Invite by email
- Revoke access anytime

### ✅ Version History
- Every change tracked
- View previous versions
- Restore to any point in time
- See who made each change

## Database Commands

```bash
# Generate new migration
npm run db:generate

# Apply migrations
npm run db:migrate

# Open Drizzle Studio (database GUI)
npm run db:studio
```

## Architecture

```
Client (Browser)
  ↓
Nuxt 3 App (SSR)
  ↓
API Routes (/server/api)
  ↓
Services (/server/services)
  ↓
Database (PostgreSQL + Drizzle ORM)

Realtime: Redis Pub/Sub
```

## Troubleshooting

### Database Connection Failed

Check `.env` file and ensure:
```env
DATABASE_URL=postgresql://katachi:katachi_password@localhost:5432/katachi_db
```

### Redis Connection Failed

Ensure Redis is running:
```bash
docker-compose ps
```

### Session Errors

Update `SESSION_SECRET` in `.env` to a strong random string (32+ chars)

### Sync Not Working

1. Check you're logged in
2. Check browser console for errors
3. Verify `NUXT_PUBLIC_ENABLE_SYNC=true` in `.env`

## Production Deployment

1. Update all passwords in `.env`
2. Set `NODE_ENV=production`
3. Use managed PostgreSQL & Redis
4. Enable HTTPS
5. Run migrations before deploy
6. Set up automated backups

## API Documentation

See `/docs/api.md` for complete API reference.

## Security

- Passwords hashed with bcrypt (10 rounds)
- Sessions stored in Redis with httpOnly cookies
- All API routes protected by auth middleware
- SQL injection protected by Drizzle ORM
- CSRF protection via SameSite cookies
