# Tasks: ShadCN Component Aggregator

**Input**: Design documents from `/specs/001-create-a-website/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Web app structure**: `backend/src/`, `frontend/src/`
- All paths relative to repository root

## Phase 3.1: Setup & Configuration
- [X] T001 Initialize monorepo structure with frontend/ and backend/ directories
- [X] T002 Create root package.json with npm workspaces configuration
- [X] T003 [P] Setup backend TypeScript configuration in backend/tsconfig.json
- [X] T004 [P] Setup frontend TypeScript configuration in frontend/tsconfig.json
- [X] T005 [P] Configure ESLint and Prettier for entire monorepo
- [X] T006 Create .env.example with all required environment variables
- [X] T007 Setup Git hooks with Husky for pre-commit linting

## Phase 3.2: Database Setup
- [X] T008 Initialize PostgreSQL database schema
- [X] T009 Setup Drizzle ORM configuration in backend/src/db/config.ts
- [X] T010 [P] Create Drizzle schema for SourceWebsite entity in backend/src/db/schema/source-website.ts
- [X] T011 [P] Create Drizzle schema for ComponentType entity in backend/src/db/schema/component-type.ts
- [X] T012 [P] Create Drizzle schema for Component entity in backend/src/db/schema/component.ts
- [X] T013 [P] Create Drizzle schema for ComponentInstance entity in backend/src/db/schema/component-instance.ts
- [X] T014 [P] Create Drizzle schema for CrawlJob entity in backend/src/db/schema/crawl-job.ts
- [X] T015 [P] Create Drizzle schema for UserFavorite entity in backend/src/db/schema/user-favorite.ts
- [X] T016 [P] Create Drizzle schema for SearchLog entity in backend/src/db/schema/search-log.ts
- [X] T017 Create database migrations in backend/src/db/migrations/
- [X] T018 Create database seed script in backend/src/db/seed.ts
- [X] T019 Setup database connection pool in backend/src/db/client.ts

## Phase 3.3: API Contract Tests (TDD - MUST FAIL FIRST)
**CRITICAL: Write these tests BEFORE implementation. They MUST fail initially.**
- [X] T020 [P] Contract test GET /api/sources in backend/tests/contract/test-sources-get.ts
- [X] T021 [P] Contract test GET /api/sources/:slug in backend/tests/contract/test-source-get.ts
- [X] T022 [P] Contract test GET /api/sources/:slug/components in backend/tests/contract/test-source-components.ts
- [X] T023 [P] Contract test GET /api/types in backend/tests/contract/test-types-get.ts
- [X] T024 [P] Contract test GET /api/types/:slug/components in backend/tests/contract/test-type-components.ts
- [X] T025 [P] Contract test GET /api/components in backend/tests/contract/test-components-browse.ts
- [X] T026 [P] Contract test GET /api/components/:id in backend/tests/contract/test-component-get.ts
- [X] T027 [P] Contract test GET /api/components/:id/code in backend/tests/contract/test-component-code.ts
- [ ] T028 [P] Contract test GET /api/components/:id/instances in backend/tests/contract/test-component-instances.ts
- [X] T029 [P] Contract test GET /api/search in backend/tests/contract/test-search.ts
- [ ] T030 [P] Contract test POST /api/crawl/trigger in backend/tests/contract/test-crawl-trigger.ts
- [ ] T031 [P] Contract test GET /api/crawl/status/:id in backend/tests/contract/test-crawl-status.ts
- [X] T032 [P] Contract test GET /api/stats in backend/tests/contract/test-stats.ts

## Phase 3.4: Backend Core Implementation
- [ ] T033 Setup Express server with TypeScript in backend/src/server.ts
- [ ] T034 Configure middleware (CORS, body parser, etc.) in backend/src/middleware/
- [ ] T035 Create Zod validation schemas in backend/src/validation/
- [ ] T036 [P] Implement SourceWebsite service in backend/src/services/source-website.service.ts
- [ ] T037 [P] Implement ComponentType service in backend/src/services/component-type.service.ts
- [ ] T038 [P] Implement Component service in backend/src/services/component.service.ts
- [ ] T039 [P] Implement Search service with PostgreSQL full-text in backend/src/services/search.service.ts
- [ ] T040 [P] Implement Stats service in backend/src/services/stats.service.ts
- [ ] T041 Implement API route handlers in backend/src/routes/sources.routes.ts
- [ ] T042 Implement API route handlers in backend/src/routes/types.routes.ts
- [ ] T043 Implement API route handlers in backend/src/routes/components.routes.ts
- [ ] T044 Implement API route handlers in backend/src/routes/search.routes.ts
- [ ] T045 Implement API route handlers in backend/src/routes/crawl.routes.ts
- [ ] T046 Implement API route handlers in backend/src/routes/stats.routes.ts
- [ ] T047 Setup error handling middleware in backend/src/middleware/error.middleware.ts
- [ ] T048 Setup request logging middleware in backend/src/middleware/logging.middleware.ts

## Phase 3.5: Crawler Implementation
- [ ] T049 Setup Crawlee configuration in backend/src/crawler/config.ts
- [ ] T050 Implement base crawler class in backend/src/crawler/base-crawler.ts
- [ ] T051 [P] Create shadcn/ui crawler adapter in backend/src/crawler/adapters/shadcn-ui.crawler.ts
- [ ] T052 [P] Create Magic UI crawler adapter in backend/src/crawler/adapters/magic-ui.crawler.ts
- [ ] T053 [P] Create Aceternity UI crawler adapter in backend/src/crawler/adapters/aceternity.crawler.ts
- [ ] T054 [P] Create generic shadcn crawler adapter in backend/src/crawler/adapters/generic.crawler.ts
- [ ] T055 Implement crawler orchestrator in backend/src/crawler/orchestrator.ts
- [ ] T056 Setup Bull queue for crawler jobs in backend/src/crawler/queue.ts
- [ ] T057 Implement component parser in backend/src/crawler/parser.ts
- [ ] T058 Implement content hash generator in backend/src/crawler/hasher.ts
- [ ] T059 Setup crawler scheduling with cron in backend/src/crawler/scheduler.ts

## Phase 3.6: Frontend Setup & Core
- [ ] T060 Initialize React app with Vite in frontend/
- [ ] T061 Setup TanStack Router in frontend/src/router.tsx
- [ ] T062 Configure Tailwind CSS and shadcn/ui in frontend/
- [ ] T063 Setup Zustand stores in frontend/src/stores/
- [ ] T064 Configure TanStack Query in frontend/src/lib/query.ts
- [ ] T065 Create API client service in frontend/src/services/api.ts
- [ ] T066 Setup Fuse.js for search in frontend/src/lib/search.ts

## Phase 3.7: Frontend Components
- [ ] T067 [P] Create Layout component with navigation in frontend/src/components/layout/
- [ ] T068 [P] Create SourceSelector component in frontend/src/components/filters/source-selector.tsx
- [ ] T069 [P] Create TypeSelector component in frontend/src/components/filters/type-selector.tsx
- [ ] T070 [P] Create ComponentCard component in frontend/src/components/component-card.tsx
- [ ] T071 [P] Create ComponentGrid component in frontend/src/components/component-grid.tsx
- [ ] T072 [P] Create ComponentDetail component in frontend/src/components/component-detail.tsx
- [ ] T073 [P] Create ComponentPreview with sandboxing in frontend/src/components/component-preview.tsx
- [ ] T074 [P] Create CodeViewer component in frontend/src/components/code-viewer.tsx
- [ ] T075 [P] Create SearchBar component in frontend/src/components/search-bar.tsx
- [ ] T076 [P] Create Pagination component in frontend/src/components/pagination.tsx

## Phase 3.8: Frontend Pages
- [ ] T077 Create HomePage route in frontend/src/pages/home.tsx
- [ ] T078 Create ComponentsPage route in frontend/src/pages/components.tsx
- [ ] T079 Create ComponentDetailPage route in frontend/src/pages/component/[id].tsx
- [ ] T080 Create SourcePage route in frontend/src/pages/source/[slug].tsx
- [ ] T081 Create TypePage route in frontend/src/pages/type/[slug].tsx
- [ ] T082 Create SearchResultsPage route in frontend/src/pages/search.tsx
- [ ] T083 Create StatsPage route in frontend/src/pages/stats.tsx

## Phase 3.9: Integration & Performance
- [ ] T084 Setup Redis caching in backend/src/cache/redis.ts
- [ ] T085 Implement API response caching in backend/src/middleware/cache.middleware.ts
- [ ] T086 Setup monitoring with performance metrics in backend/src/monitoring/
- [ ] T087 Implement rate limiting in backend/src/middleware/rate-limit.middleware.ts
- [ ] T088 Configure CSP headers for component sandboxing in backend/src/middleware/security.middleware.ts
- [ ] T089 Setup CDN integration for static assets
- [ ] T090 Implement lazy loading for component previews in frontend/

## Phase 3.10: Testing & Quality
- [ ] T091 [P] Integration test: Browse by type scenario in backend/tests/integration/browse-by-type.test.ts
- [ ] T092 [P] Integration test: Filter by source scenario in backend/tests/integration/filter-by-source.test.ts
- [ ] T093 [P] Integration test: Search components scenario in backend/tests/integration/search.test.ts
- [ ] T094 [P] Integration test: View component code scenario in backend/tests/integration/view-code.test.ts
- [ ] T095 [P] Integration test: Dual-axis navigation scenario in backend/tests/integration/dual-axis.test.ts
- [ ] T096 [P] E2E test with Playwright in e2e/tests/full-flow.spec.ts
- [ ] T097 [P] Performance test: Page load time validation in e2e/tests/performance.spec.ts
- [ ] T098 [P] Performance test: Search response time in backend/tests/performance/search.perf.ts
- [ ] T099 Unit tests for all services (80% coverage minimum)
- [ ] T100 Accessibility audit with WCAG 2.1 AA compliance

## Phase 3.11: Documentation & Deployment
- [ ] T101 Create API documentation with Swagger in backend/docs/api.md
- [ ] T102 Write deployment guide in docs/deployment.md
- [ ] T103 Create Docker configuration files
- [ ] T104 Setup CI/CD pipeline configuration
- [ ] T105 Create production environment configuration
- [ ] T106 Write troubleshooting guide in docs/troubleshooting.md

## Dependencies
- Database setup (T008-T019) must complete before services (T036-T040)
- Contract tests (T020-T032) must be written before API implementation (T041-T046)
- Frontend setup (T060-T066) before components (T067-T076)
- Components before pages (T077-T083)
- Core implementation before integration (T084-T090)
- All implementation before final testing (T091-T100)

## Parallel Execution Examples

### Launch database schemas in parallel:
```javascript
// Execute T010-T016 simultaneously
Task: "Create Drizzle schema for SourceWebsite entity"
Task: "Create Drizzle schema for ComponentType entity"
Task: "Create Drizzle schema for Component entity"
Task: "Create Drizzle schema for ComponentInstance entity"
Task: "Create Drizzle schema for CrawlJob entity"
Task: "Create Drizzle schema for UserFavorite entity"
Task: "Create Drizzle schema for SearchLog entity"
```

### Launch all contract tests in parallel:
```javascript
// Execute T020-T032 simultaneously
Task: "Contract test GET /api/sources"
Task: "Contract test GET /api/sources/:slug"
Task: "Contract test GET /api/types"
// ... continue for all contract tests
```

### Launch frontend components in parallel:
```javascript
// Execute T067-T076 simultaneously
Task: "Create Layout component with navigation"
Task: "Create SourceSelector component"
Task: "Create TypeSelector component"
// ... continue for all components
```

## Notes
- [P] tasks can run simultaneously as they modify different files
- Contract tests MUST fail initially (TDD approach)
- Maintain 80% test coverage minimum
- Follow TypeScript strict mode
- Use Zod for all runtime validation
- Implement proper error boundaries in React
- Ensure all database queries are indexed
- Monitor performance metrics continuously

## Task Count Summary
- Setup & Config: 7 tasks
- Database: 12 tasks
- Contract Tests: 13 tasks (all parallel)
- Backend Core: 16 tasks
- Crawler: 11 tasks
- Frontend Setup: 7 tasks
- Frontend Components: 10 tasks (all parallel)
- Frontend Pages: 7 tasks
- Integration: 7 tasks
- Testing: 10 tasks
- Documentation: 6 tasks

**Total: 106 tasks**

## Validation Checklist
- [x] All API endpoints have contract tests
- [x] All entities have Drizzle schemas
- [x] All user stories have integration tests
- [x] Parallel tasks modify different files
- [x] Each task specifies exact file paths
- [x] No parallel tasks modify the same file
- [x] TDD approach enforced (tests before implementation)
- [x] Dependencies clearly defined
- [x] Performance requirements addressed