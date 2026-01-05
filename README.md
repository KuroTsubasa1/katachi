# Katachi (形)

A visual workspace application inspired by Milanote, built with modern web technologies. Create, organize, and connect notes, images, links, and more on an infinite canvas.

![Nuxt](https://img.shields.io/badge/Nuxt-3.15-00DC82?style=flat&logo=nuxt.js)
![Vue](https://img.shields.io/badge/Vue-3-4FC08D?style=flat&logo=vue.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat&logo=typescript)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker)

## Features

- **Infinite Canvas**: Pan and zoom across an unlimited workspace
- **5 Card Types**:
  - 📝 **Text Notes**: Simple, quick text notes
  - 📄 **Rich Text**: Full WYSIWYG editor with formatting
  - 📋 **Columns**: Kanban-style organization
  - ✏️ **Drawing**: Freehand drawing with pen/eraser tools
  - 🖼️ **Images**: Upload and scale images
- **Draw on Images**: Annotate images with freehand drawing
- **Drag & Drop**: Intuitive card manipulation with mouse interactions
- **Multiple Boards**: Organize your work into separate boards
- **Card Customization**: Resize, recolor, and position any card
- **Real-time Updates**: State management with Pinia
- **Responsive Design**: Clean UI with Tailwind CSS
- **Docker Support**: Easy deployment with Docker Compose

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Docker Development

```bash
# Start all services (app + database + redis)
docker-compose -f docker-compose.dev.yml up --build
```

### Production Deployment

```bash
# Build and start production stack
docker-compose up -d --build
```

## Project Structure

```
mila_note/
├── components/      # Vue components
├── pages/          # Application pages/routes
├── stores/         # Pinia state management
├── types/          # TypeScript definitions
├── docs/           # Project documentation
├── server/         # Server API endpoints
└── assets/         # Static assets (CSS, images)
```

## Technology Stack

- **Frontend**: Nuxt 3, Vue 3, TypeScript
- **State Management**: Pinia
- **Styling**: Tailwind CSS
- **Utilities**: VueUse
- **Backend**: Nuxt Server API
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Infrastructure**: Docker, Docker Compose

## Documentation

Comprehensive documentation is available in the `/docs` directory:

- [Architecture](./docs/architecture.md) - System design and principles
- [Getting Started](./docs/getting-started.md) - Setup and development guide
- [API Documentation](./docs/api.md) - API endpoints and data structures
- [Contributing](./docs/contributing.md) - Development guidelines

## Architecture Principles

This project follows industry-standard software engineering principles:

- **SOLID**: Single responsibility, Open/closed, Liskov substitution, Interface segregation, Dependency inversion
- **DRY**: Don't Repeat Yourself
- **KISS**: Keep It Simple, Stupid
- **YAGNI**: You Aren't Gonna Need It
- **POLA**: Principle of Least Astonishment
- **SoC**: Separation of Concerns

## Roadmap

- [x] Image card support
- [x] Rich text editor (WYSIWYG)
- [x] Column/Kanban boards
- [x] Drawing functionality
- [x] Draw on images
- [ ] Link card previews with metadata
- [ ] Todo list cards with checkboxes
- [ ] Card connections/arrows
- [ ] Sticky notes and shapes
- [ ] Real-time collaboration
- [ ] User authentication
- [ ] Board sharing and permissions
- [ ] Export to PDF/PNG
- [ ] Mobile app
- [ ] Comments and annotations
- [ ] Version history

## Development

```bash
# Install dependencies
npm install

# Development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Generate static site
npm run generate
```

## Docker Commands

```bash
# Development
docker-compose -f docker-compose.dev.yml up

# Production
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
POSTGRES_USER=mila_note
POSTGRES_PASSWORD=your_password
POSTGRES_DB=mila_note_db
REDIS_URL=redis://redis:6379
NODE_ENV=production
```

## Contributing

Contributions are welcome! Please read the [Contributing Guide](./docs/contributing.md) for details on our development process and coding standards.

## License

MIT License - feel free to use this project for learning or building your own applications.

## Resources

- [Nuxt 3 Documentation](https://nuxt.com/docs)
- [Vue 3 Documentation](https://vuejs.org/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [Tailwind CSS](https://tailwindcss.com/)

---

Built with ❤️ using Nuxt 3
