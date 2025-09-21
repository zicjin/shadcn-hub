# ShadCN Component Aggregator Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-09-21

## Active Technologies

### Frontend
- **Framework**: React 18 with TypeScript 5.x
- **Routing**: TanStack Router v1
- **State**: Zustand
- **UI**: shadcn/ui + Tailwind CSS
- **Data Fetching**: TanStack Query v5
- **Search**: Fuse.js
- **Build**: Vite

### Backend
- **Runtime**: Node.js 20 LTS
- **API**: Express.js with TypeScript
- **Database**: PostgreSQL 16 (username: postgres, no password)
- **ORM**: Drizzle
- **Validation**: Zod
- **Crawler**: Crawlee with Playwright
- **Queue**: Bull for background jobs

## Project Structure
```
backend/
├── src/
│   ├── models/      # Drizzle schema definitions
│   ├── services/    # Business logic
│   └── api/         # Express routes
└── tests/

frontend/
├── src/
│   ├── components/  # React components
│   ├── pages/       # Route pages
│   └── services/    # API clients
└── tests/
```

## Commands

### Development
```bash
npm run dev           # Start all services
npm run dev:backend   # Backend API only
npm run dev:frontend  # Frontend only
npm run dev:crawler   # Crawler worker
```

### Database
```bash
npm run db:migrate    # Run migrations
npm run db:seed       # Seed initial data
npm run db:reset      # Reset database
```

### Testing
```bash
npm test              # All tests
npm run test:unit     # Unit tests
npm run test:e2e      # E2E tests
npm run lint          # ESLint
npm run typecheck     # TypeScript check
```

## Code Style

### TypeScript
- Strict mode enabled
- Explicit return types for functions
- Interface over type for objects
- Zod for runtime validation

### React
- Functional components only
- Custom hooks for logic reuse
- shadcn/ui components as base
- Tailwind for styling

### Database
- Drizzle schema in `backend/src/db/schema`
- Migrations in `backend/src/db/migrations`
- Use transactions for multi-table operations
- Proper indexes for query performance

## Recent Changes

### Feature 001: Component Aggregator (2025-09-21)
- Added crawling infrastructure with Crawlee
- Implemented dual-axis navigation (source × type)
- Created PostgreSQL schema with Drizzle
- Setup TanStack Query for data fetching
- Integrated shadcn/ui component system

## Performance Requirements
- Initial page load: <3 seconds
- Search response: <200ms
- Component render: <100ms
- 80% test coverage minimum

## Security Notes
- CSP headers for component sandboxing
- Rate limiting on API endpoints
- Input validation with Zod
- SQL injection prevention via Drizzle ORM

<!-- MANUAL ADDITIONS START -->
<!-- Add project-specific notes here -->
<!-- MANUAL ADDITIONS END -->