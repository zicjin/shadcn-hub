# Research Findings: ShadCN Component Aggregator

## Resolved Clarifications

### 1. Source Websites Selection
**Decision**: The following 7 shadcn UI component websites will be crawled:
1. shadcn/ui (Official) - https://ui.shadcn.com/
2. Shadcnblocks - https://www.shadcnblocks.com/ (free blocks only)
3. Magic UI - https://magicui.design/
4. Aceternity UI - https://ui.aceternity.com/ (free components only)
5. Origin UI - Via shadcn registry
6. Cult UI - https://www.cult-ui.com/
7. Neobrutalism Components - https://www.neobrutalism.dev/

**Rationale**: Mix of official, community, and specialized libraries providing diverse component styles
**Alternatives Considered**: Premium-only libraries rejected due to license restrictions

### 2. Update Frequency
**Decision**: Daily scheduled crawling at 3 AM UTC
**Rationale**: Balances freshness with server load, most updates happen during work hours
**Alternatives Considered**:
- Real-time: Too resource intensive
- Weekly: May miss important updates

### 3. Performance Targets
**Decision**:
- Initial load: <3 seconds (as per constitution)
- Search response: <200ms (P95)
- Component render: <100ms
- Concurrent users: 1000

**Rationale**: Aligns with constitution requirements and user expectations
**Alternatives Considered**: More aggressive targets would require additional infrastructure

### 4. Error Handling Strategy
**Decision**: Three-tier fallback system:
1. Show cached version with "stale data" indicator
2. Retry with exponential backoff (up to 3 attempts)
3. Display error message with manual refresh option

**Rationale**: Ensures users always see something useful
**Alternatives Considered**: Immediate error display (poor UX)

### 5. Data Retention Policy
**Decision**:
- Component code: 30-day cache with version history
- Metadata: Indefinite retention
- Crawl logs: 7 days

**Rationale**: Balances storage costs with historical tracking needs
**Alternatives Considered**: No history (loses valuable version information)

### 6. Authentication Handling
**Decision**: Only crawl publicly accessible components, skip auth-gated content
**Rationale**: Legal compliance and ethical crawling
**Alternatives Considered**: API partnerships (too complex for initial version)

### 7. Legal Compliance
**Decision**:
- Only index MIT/Apache licensed components
- Provide clear attribution and source links
- Respect robots.txt
- Include disclaimer about third-party content

**Rationale**: Ensures legal compliance and respects creators
**Alternatives Considered**: Ignoring licenses (legal risk)

### 8. Component Rendering Strategy
**Decision**: Shadow DOM isolation with fallback to sandboxed iframes
**Rationale**:
- Shadow DOM provides best performance and isolation
- Iframe fallback for complex components requiring full document context

**Alternatives Considered**:
- Direct rendering (style conflicts)
- Only iframes (performance overhead)

### 9. Update Detection Method
**Decision**: Content hash comparison with ETag support
**Rationale**: Efficient detection without unnecessary downloads
**Alternatives Considered**:
- Webhooks (not available)
- RSS feeds (incomplete coverage)

### 10. Storage Architecture
**Decision**:
- PostgreSQL for structured data (components, metadata)
- CDN for static component previews
- Redis for search cache
- Total allocation: 100GB initial, scalable

**Rationale**: Proven stack with good performance characteristics
**Alternatives Considered**: NoSQL (less suitable for relational data)

## Technology Stack Decisions

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: TanStack Router v1
- **State Management**: Zustand for global state
- **Data Fetching**: TanStack Query v5
- **UI Components**: shadcn/ui + custom components
- **Styling**: Tailwind CSS v3
- **Search**: Fuse.js for client-side fuzzy search
- **Build Tool**: Vite for optimal bundling

### Backend Architecture
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js with TypeScript
- **ORM**: Drizzle with PostgreSQL
- **Validation**: Zod for runtime type checking
- **Crawler**: Crawlee with Playwright
- **Queue**: Bull for background jobs
- **Caching**: Redis for API responses

### Infrastructure
- **Database**: PostgreSQL 16 (username: postgres, no password for dev)
- **Search Index**: PostgreSQL full-text search with GIN indexes
- **File Storage**: Local filesystem with CDN for production
- **Monitoring**: Built-in performance metrics API

## Security Considerations

### Sandboxing Strategy
1. **Content Security Policy**: Strict CSP headers for component rendering
2. **Origin Isolation**: Components served from separate subdomain
3. **Script Execution**: Limited to component preview context only
4. **Network Access**: Blocked for rendered components
5. **Storage Access**: No localStorage/cookies for sandboxed content

### Crawling Ethics
1. **Rate Limiting**: 1 request per second per domain
2. **User Agent**: Honest identification as "ShadCN-Aggregator-Bot"
3. **Robots.txt**: Full compliance with exclusion rules
4. **Retry Logic**: Exponential backoff to prevent overload
5. **Caching**: Aggressive caching to minimize requests

## Performance Optimizations

### Frontend Optimizations
- Code splitting by route
- Lazy loading for component previews
- Virtual scrolling for large lists
- Service worker for offline caching
- Image optimization with WebP format

### Backend Optimizations
- Database connection pooling
- Query result caching with Redis
- Indexed full-text search
- Pagination with cursor-based navigation
- Gzip compression for API responses

### Search Optimizations
- Client-side search with Fuse.js for instant results
- Server-side search for advanced queries
- Search result caching for popular queries
- Typeahead suggestions from cached searches

## Monitoring & Analytics

### Key Metrics
- Component load time (target: <100ms P95)
- Search response time (target: <200ms P95)
- Crawl success rate (target: >95%)
- Cache hit rate (target: >80%)
- User engagement (components viewed per session)

### Error Tracking
- Sentry for production error monitoring
- Structured logging with correlation IDs
- Failed crawl alerts
- Component render failure tracking

## Compliance & Attribution

### License Display
- Clear license badge on each component
- Link to original source
- Author attribution
- Version information

### Terms of Service
- Clear statement about third-party content
- DMCA compliance process
- User agreement for component usage
- Privacy policy for data handling