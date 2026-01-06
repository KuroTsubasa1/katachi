# Katachi (形)

A visual workspace application inspired by Milanote, built with modern web technologies. Create, organize, and connect notes, images, links, and more on an infinite canvas.

![Nuxt](https://img.shields.io/badge/Nuxt-3.15-00DC82?style=flat&logo=nuxt.js)
![Vue](https://img.shields.io/badge/Vue-3-4FC08D?style=flat&logo=vue.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat&logo=typescript)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker)

## Features

### Canvas & Cards
- **Infinite Canvas**: Pan and zoom across an unlimited workspace
- **8 Card Types**:
  - 📝 **Text Notes**: Simple, quick text notes
  - 📄 **Rich Text**: Full WYSIWYG editor with formatting (TipTap)
  - 📋 **Columns**: Kanban-style organization
  - 🔗 **Link Cards**: URL cards with metadata preview
  - ✏️ **Drawing**: Freehand drawing with pen/eraser tools
  - 🖼️ **Images**: Upload and scale images
  - 📍 **Markdown**: Markdown editor with live preview
  - 🎨 **Shapes**: Rectangles, circles, and more
- **Draw on Images**: Annotate images with freehand drawing
- **Card Connections**: Visual connections between cards
- **Drag & Drop**: Intuitive card manipulation with mouse interactions
- **Card Customization**: Resize, recolor, and position any card

### Collaboration
- **Real-Time Sync**: WebSocket-based instant updates (<200ms latency)
- **Presence Indicators**: Live cursors showing who's viewing and editing
- **Active User Badges**: Colored avatars showing online collaborators
- **Automatic Fallback**: Graceful degradation to polling if WebSocket unavailable
- **Board Sharing**: Share boards with view/edit/admin permissions
- **Passwordless Auth**: Email-based login codes (no passwords!)
- **Multi-User Support**: Multiple users can edit simultaneously
- **Conflict Resolution**: Server-authoritative sync with permission checks

### Organization
- **Multiple Boards**: Organize work into separate boards
- **Board Templates**: 10 pre-built templates (Kanban, Storyboard, Mind Map, Meeting Notes, Sprint Planning, Design Mood Board, Study Notes, SWOT Analysis, Roadmap, Blank)
- **Board Management**: Create (blank or from template), rename, share, and delete boards
- **Template Categories**: General, Planning, Creative, Business, Education
- **Shared Board Access**: View boards shared with you

### Productivity
- **Keyboard Shortcuts**: Comprehensive shortcuts for power users
  - Card operations: Delete, Copy (Cmd+C), Paste (Cmd+V), Duplicate (Cmd+D)
  - View controls: Zoom (Cmd +/-/0)
  - Navigation: Arrow keys to move cards (Shift for 50px jumps)
  - Tool switching: V/1 (select), D/2 (pen), E/3 (eraser), C/4 (connect)
  - Help: Press ? to see all shortcuts
- **Context-Aware**: Shortcuts don't fire when typing in text fields

### Technical
- **WebSocket Real-Time**: Nitro WebSocket with Redis pub/sub for instant updates
- **Responsive Design**: Clean UI with Tailwind CSS and dark mode
- **Docker Support**: Full stack deployment with Docker Compose
- **PostgreSQL Database**: Persistent storage for all data
- **Redis Pub/Sub**: Event broadcasting for real-time collaboration
- **Redis Sessions**: Fast session management
- **Auto-Reconnect**: Exponential backoff with graceful fallback to polling
- **Version History**: Track changes to boards and cards
- **Offline Support**: LocalStorage fallback when offline

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose (for full stack)
- PostgreSQL 16 (if not using Docker)
- Redis 7 (if not using Docker)

### Docker Deployment (Recommended)

```bash
# 1. Clone the repository
git clone <repository-url>
cd mila_note

# 2. Copy environment file
cp .env.example .env

# 3. Update .env with your SMTP settings for email login codes

# 4. Start all services (app + PostgreSQL + Redis)
docker-compose up -d --build

# 5. Push database schema
npm run db:push
```

Open [http://localhost:3000](http://localhost:3000)

### Local Development (Without Docker)

```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL and Redis locally

# 3. Copy and configure environment
cp .env.example .env
# Update DATABASE_URL and REDIS_URL in .env

# 4. Push database schema
npm run db:push

# 5. Start development server (without tests)
npm run dev:notest

# Or with tests running in watch mode
npm run dev
```

### First Time Setup

1. Navigate to [http://localhost:3000/register](http://localhost:3000/register)
2. Enter your email address
3. Check your email for the 6-digit login code
4. Enter the code to log in
5. Start creating boards and cards!

## Project Structure

```
mila_note/
├── components/          # Vue components
│   ├── CanvasBoard.vue        # Main canvas renderer
│   ├── NoteCard.vue           # Card component
│   ├── RenameBoardDialog.vue  # Board rename dialog
│   ├── ShareBoardDialog.vue   # Board sharing dialog
│   └── ...                    # Other components
├── pages/              # Application pages/routes
│   ├── index.vue              # Main workspace
│   ├── login.vue              # Login page
│   └── register.vue           # Registration page
├── stores/             # Pinia state management
│   ├── canvas.ts              # Board and card state
│   └── auth.ts                # Authentication state
├── composables/        # Vue composables
│   └── useSync.ts             # Real-time sync logic
├── server/             # Server-side code
│   ├── api/                   # API endpoints
│   │   ├── auth/              # Authentication endpoints
│   │   └── boards/            # Board sync and sharing
│   ├── db/                    # Database
│   │   └── schema.ts          # Drizzle schema
│   ├── services/              # Business logic
│   │   ├── codeAuthService.ts # Passwordless auth
│   │   ├── syncService.ts     # Sync operations
│   │   └── sharingService.ts  # Board sharing
│   ├── middleware/            # Server middleware
│   └── utils/                 # Utilities
├── types/              # TypeScript definitions
├── docs/               # Project documentation
└── tests/              # Vitest test files
```

## Technology Stack

### Frontend
- **Framework**: Nuxt 3.20.2 + Vue 3.5
- **Language**: TypeScript 5.7
- **State Management**: Pinia 2.2
- **Styling**: Tailwind CSS 6.12
- **Rich Text**: TipTap 2.10
- **Canvas**: Konva 9.3 + Vue-Konva 3.0
- **Utilities**: VueUse 11.2

### Backend
- **Runtime**: Node 20 (Alpine)
- **API**: Nuxt Server Routes + h3
- **WebSocket**: Nitro WebSocket with crossws integration
- **Real-Time**: Redis pub/sub for event broadcasting
- **Database**: PostgreSQL 16 (Alpine)
- **ORM**: Drizzle ORM 0.45
- **Cache**: Redis 7 (Alpine) + ioredis 5.9
- **Sessions**: h3-session 0.2 with Redis storage
- **Email**: Nodemailer 7.0 (SMTP)
- **Authentication**: Bcrypt 6.0 for code generation

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Testing**: Vitest 3.2 + Vue Test Utils 2.4
- **CI/CD**: Husky 9.1 + lint-staged 15.2

## Documentation

Comprehensive documentation is available in the `/docs` directory:

- [Getting Started](./docs/getting-started.md) - Setup and development guide
- [Architecture](./docs/architecture.md) - System design and principles
- [API Documentation](./docs/api.md) - API endpoints and data structures
- [Authentication](./docs/authentication.md) - Passwordless auth system
- [Board Management](./docs/board-management.md) - Board features and sharing
- [Contributing](./docs/contributing.md) - Development guidelines

## Architecture Principles

This project follows industry-standard software engineering principles:

- **SOLID**: Single responsibility, Open/closed, Liskov substitution, Interface segregation, Dependency inversion
- **DRY**: Don't Repeat Yourself
- **KISS**: Keep It Simple, Stupid
- **YAGNI**: You Aren't Gonna Need It
- **POLA**: Principle of Least Astonishment
- **SoC**: Separation of Concerns

## Authentication

Katachi uses **passwordless authentication** for simplicity and security:

- **No Passwords**: Log in with email codes only
- **6-Digit Codes**: Sent via SMTP email
- **2-Minute Expiry**: Short-lived codes for security
- **Auto-Registration**: New users created automatically on first login
- **Session Management**: Redis-based sessions (7-day expiry)

Configure SMTP in `.env`:
```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@domain.com
SMTP_PASS=your-password
SMTP_FROM=noreply@domain.com
```

## Collaboration

### Real-Time Sync Architecture

**WebSocket-First with Polling Fallback:**

The application uses a hybrid approach for maximum reliability:

1. **Primary: WebSocket** (Instant Updates)
   - Latency: <200ms for all operations
   - Protocol: ws:// (or wss:// for HTTPS)
   - Auto-reconnect with exponential backoff
   - Heartbeat ping every 30 seconds

2. **Fallback: Polling** (Reliable Updates)
   - Activates automatically if WebSocket fails
   - 5-second intervals
   - Smart: Skips when WebSocket connected
   - Works through all proxies and firewalls

**Event Broadcasting:**
- Events published to Redis pub/sub
- Board-specific channels (`board:{boardId}`)
- Only sends to subscribed users
- Filters out echo (won't send back to originator)

**Supported Events:**
- `card_created` - New card added
- `card_updated` - Card content/position changed
- `card_deleted` - Card removed
- Real-time across all 13 card types

### Board Sharing
- **Share by Email**: Enter collaborator's email address
- **Permission Levels**:
  - **View**: Can see board content only
  - **Edit**: Can modify cards, connections, shapes
  - **Admin**: Can share board with others
- **Share Links**: Direct links with `?board=BOARD_ID` parameter
- **Automatic Access**: Shared boards appear in recipient's list

## Roadmap

### Completed ✅
- [x] Image card support (base64, synced)
- [x] Rich text editor (WYSIWYG with TipTap)
- [x] Column/Kanban boards with drag-drop
- [x] Drawing functionality
- [x] Draw on images
- [x] Link cards
- [x] Markdown cards
- [x] Storyboard cards (multi-frame visual sequences)
- [x] Todo list cards with checkboxes
- [x] Card connections/arrows
- [x] Shapes (rectangles, circles)
- [x] **WebSocket real-time collaboration** (<200ms updates)
- [x] Polling fallback (automatic graceful degradation)
- [x] **Presence indicators** (live cursors with user names)
- [x] Active user badges (colored avatars showing who's online)
- [x] User authentication (passwordless email codes)
- [x] Board sharing and permissions (view/edit/admin)
- [x] Board renaming with custom dialog
- [x] Board deletion with custom confirmation
- [x] **Board templates** (10 pre-built: Kanban, Storyboard, Mind Map, etc.)
- [x] **Keyboard shortcuts** (Delete, Copy/Paste, Zoom, Navigation, Tool switching)
- [x] Keyboard shortcuts help dialog (press ?)
- [x] Connection status indicator
- [x] Smart sync (skips updates when actively editing)

### In Progress 🚧
- [ ] Link card metadata preview
- [ ] Command palette (Cmd+K) with fuzzy search

### Planned 📋
- [ ] Export to PDF/PNG
- [ ] Mobile app (iOS/Android)
- [ ] Comments and annotations
- [ ] Advanced version history UI
- [ ] Search across boards
- [ ] Undo/Redo functionality
- [ ] Voice/video chat integration
- [ ] Advanced drawing tools (shapes, text on canvas)
- [ ] Card labels and tags
- [ ] Custom board backgrounds

## Development

### Available Scripts

```bash
# Development server with tests in watch mode
npm run dev

# Development server without tests
npm run dev:notest

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests once
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

### Database Management

```bash
# Generate migration files from schema changes
npm run db:generate

# Push schema changes directly to database (development)
npm run db:push

# Open Drizzle Studio (database GUI)
npm run db:studio
```

### Code Quality

The project uses:
- **Husky**: Git hooks for pre-commit checks
- **lint-staged**: Runs tests on staged files before commit
- **Vitest**: Fast unit testing with HMR

## Docker Commands

```bash
# Start production stack
docker-compose up -d --build

# View logs (follow mode)
docker-compose logs -f app

# View all service status
docker-compose ps

# Access database CLI
docker-compose exec db psql -U katachi -d katachi_db

# Restart app service
docker-compose restart app

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v
```

## Troubleshooting

### Authentication Issues
- **"Failed query" errors**: Ensure database schema is up to date with `npm run db:push`
- **Login codes not arriving**: Check SMTP configuration in `.env`
- **Session lost**: Clear cookies and localStorage, then log in again

### Sync Issues
- **Content not syncing**: Hard refresh (Cmd+Shift+R) to clear browser cache
- **Old content appears**: Clear localStorage with `localStorage.clear()` in console
- **Shared boards empty**: Ensure both users are logged in and have proper permissions

### Docker Issues
- **Port conflicts**: Change ports in `docker-compose.yml` if 3000, 5432, or 6379 are in use
- **Database connection errors**: Check `DATABASE_URL` in Docker environment variables
- **Redis connection errors**: Ensure Redis service is running with `docker-compose ps`

### WebSocket Issues
- **Connection shows "Polling" instead of "Real-time"**: Check browser console for WebSocket errors
- **WebSocket fails to connect**: Verify Redis is running with `docker-compose ps`
- **Connection drops frequently**: Check network/proxy settings, WebSocket auto-reconnects
- **Updates delayed**: If WebSocket shows connected but updates slow, check server logs for Redis errors

### Performance
- **Latency**: WebSocket provides <200ms updates, polling provides 0-5 second updates
- **Connection overhead**: Polling uses less memory but more bandwidth than WebSocket
- **Sync debounce**: Client batches rapid changes every 500ms before sending to server

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database Configuration
POSTGRES_USER=katachi
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=katachi_db
DATABASE_URL=postgresql://katachi:your_secure_password@localhost:5432/katachi_db

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Application Configuration
NODE_ENV=development
NUXT_HOST=0.0.0.0
NUXT_PORT=3000

# Session Configuration
SESSION_SECRET=your-super-secret-session-key-change-in-production
SESSION_MAX_AGE=604800000  # 7 days

# Sync Configuration
NUXT_PUBLIC_ENABLE_SYNC=true
NUXT_PUBLIC_SYNC_DEBOUNCE_MS=500

# Email Configuration (SMTP for login codes)
SMTP_HOST=mail.example.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=service@example.com
SMTP_PASS=your-email-password
SMTP_FROM=service@example.com
NUXT_PUBLIC_APP_URL=http://localhost:3000
```

## Key Highlights

### Why Katachi?

- **Passwordless by Design**: No password fatigue - just email codes
- **Real Collaboration**: Multiple users editing the same board in real-time
- **Permission Control**: Share boards with granular view/edit/admin permissions
- **Offline-First**: Works offline with localStorage, syncs when online
- **Developer-Friendly**: Comprehensive documentation, clean architecture, TypeScript throughout
- **Production-Ready**: Docker deployment, database migrations, session management
- **Open Source**: MIT licensed, learn from or build upon it

### Technical Decisions

- **WebSocket + Polling Hybrid**: WebSocket for instant updates with automatic fallback to polling
- **Server-Authoritative**: Server is source of truth for conflict-free collaboration
- **Redis Pub/Sub**: Event broadcasting via Redis for scalable real-time updates
- **Optimistic Updates**: Local changes render immediately, sync asynchronously
- **Smart Polling**: Skips updates when WebSocket connected or user actively editing
- **Deep Copy Reactivity**: Forces Vue to detect all nested state changes
- **Version-Based Keys**: Card components re-render when board version changes
- **Auto-Reconnect**: Exponential backoff (1s → 30s max) ensures reliability

## Contributing

Contributions are welcome! Please read the [Contributing Guide](./docs/contributing.md) for details on our development process and coding standards.

## License

MIT License - feel free to use this project for learning or building your own applications.

## Resources

- [Nuxt 3 Documentation](https://nuxt.com/docs)
- [Vue 3 Documentation](https://vuejs.org/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [TipTap Editor](https://tiptap.dev/)

---

**Katachi** (形) - Japanese for "shape" or "form"

Built with ❤️ using Nuxt 3
