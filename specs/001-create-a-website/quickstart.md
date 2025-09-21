# Quickstart Guide: ShadCN Component Aggregator

## Prerequisites

- Node.js 20+ installed
- PostgreSQL 16+ running locally
- Git installed
- 4GB RAM minimum
- 10GB free disk space

## Quick Setup (5 minutes)

```bash
# Clone the repository
git clone https://github.com/yourusername/shadcn-aggregator.git
cd shadcn-aggregator

# Install dependencies
npm install

# Setup database
npm run db:setup

# Start development servers
npm run dev
```

## Environment Configuration

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://postgres@localhost:5432/shadcn_aggregator"

# API
API_PORT=3001
API_URL=http://localhost:3001

# Frontend
VITE_API_URL=http://localhost:3001
VITE_PORT=3000

# Crawling
CRAWL_RATE_LIMIT=1000
CRAWL_USER_AGENT="ShadCN-Aggregator-Bot/1.0"

# Redis (optional for caching)
REDIS_URL="redis://localhost:6379"

# Admin
ADMIN_API_KEY=your-secret-admin-key
```

## First Run Checklist

### 1. Database Setup
```bash
# Create database
createdb shadcn_aggregator

# Run migrations
npm run db:migrate

# Seed initial data (sources and types)
npm run db:seed
```

### 2. Verify Installation
```bash
# Run tests
npm test

# Check linting
npm run lint

# Type checking
npm run typecheck
```

### 3. Start Services
```bash
# Terminal 1: Start backend API
npm run dev:backend

# Terminal 2: Start frontend
npm run dev:frontend

# Terminal 3: Start crawler worker (optional)
npm run dev:crawler
```

## Testing User Scenarios

### Scenario 1: Browse Components by Type
1. Open http://localhost:3000
2. Click "Components" in navigation
3. Select "Buttons" from type filter
4. Verify all button components from all sources appear
5. Click on a component to view details
6. Verify interactive preview loads

**Expected Result**: Grid of button components with live previews

### Scenario 2: Filter by Source Website
1. Open http://localhost:3000
2. Click "Sources" in navigation
3. Select "shadcn/ui" source
4. Verify only shadcn/ui components display
5. Navigate through different component types
6. Verify source filter persists

**Expected Result**: Only components from selected source visible

### Scenario 3: Search Components
1. Open http://localhost:3000
2. Use search bar in header
3. Type "button" and press Enter
4. Verify search results appear
5. Click on a result
6. Verify component details page loads

**Expected Result**: Relevant search results with <200ms response

### Scenario 4: View Component Code
1. Navigate to any component
2. Click "View Code" button
3. Verify source code displays with syntax highlighting
4. Click "Copy Code" button
5. Verify code is copied to clipboard

**Expected Result**: Code viewer with proper formatting

### Scenario 5: Dual-Axis Navigation
1. Open http://localhost:3000
2. Select "Forms" type filter
3. Select "Magic UI" source filter
4. Verify only Magic UI form components display
5. Change source to "Aceternity UI"
6. Verify filter updates correctly

**Expected Result**: Combined filters work correctly

## API Testing

### Test API Endpoints
```bash
# Get all sources
curl http://localhost:3001/api/sources

# Get components by type
curl http://localhost:3001/api/types/button/components

# Search components
curl "http://localhost:3001/api/search?q=card"

# Get specific component
curl http://localhost:3001/api/components/{component-id}
```

### Expected Responses
- All endpoints return JSON
- Response time <500ms
- Proper error messages for invalid requests
- Pagination works correctly

## Crawler Testing

### Manual Crawl Trigger
```bash
# Trigger crawl for a specific source
curl -X POST http://localhost:3001/api/crawl/trigger \
  -H "X-API-Key: your-secret-admin-key" \
  -H "Content-Type: application/json" \
  -d '{"sourceSlug": "shadcn-ui"}'
```

### Monitor Crawl Progress
```bash
# Check crawl status
curl http://localhost:3001/api/crawl/status/{job-id} \
  -H "X-API-Key: your-secret-admin-key"
```

## Performance Validation

### Load Time Check
1. Clear browser cache
2. Open Network tab in DevTools
3. Navigate to http://localhost:3000
4. Verify page loads in <3 seconds
5. Check bundle size is <500KB

### Database Performance
```sql
-- Check query performance
EXPLAIN ANALYZE
SELECT * FROM components
WHERE tags @> ARRAY['button']
LIMIT 20;

-- Verify indexes are used
\d components
```

### Search Performance
1. Open http://localhost:3000
2. Type in search box
3. Verify typeahead appears <200ms
4. Submit search
5. Verify results appear <500ms

## Common Issues & Solutions

### Issue: Database connection failed
**Solution**: Ensure PostgreSQL is running and credentials are correct
```bash
psql -U postgres -d shadcn_aggregator
```

### Issue: Components not rendering
**Solution**: Check browser console for CSP errors, verify sandbox settings

### Issue: Crawl fails immediately
**Solution**: Check source website is accessible, verify robots.txt compliance
```bash
curl -I https://ui.shadcn.com
```

### Issue: Search returns no results
**Solution**: Rebuild search index
```bash
npm run db:reindex
```

## Production Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] SSL certificates installed
- [ ] CDN configured for static assets
- [ ] Redis cache enabled
- [ ] Monitoring setup (Sentry, logs)
- [ ] Backup strategy implemented
- [ ] Rate limiting configured
- [ ] Security headers enabled
- [ ] Performance metrics tracking

## Success Criteria

After setup, verify:
- [ ] Homepage loads in <3 seconds
- [ ] All 7 source websites appear in navigation
- [ ] Component previews render correctly
- [ ] Search returns relevant results
- [ ] Dual-axis filtering works
- [ ] Component code can be viewed and copied
- [ ] Mobile responsive layout works
- [ ] No console errors in browser
- [ ] All tests pass
- [ ] Performance targets met

## Next Steps

1. Configure scheduled crawling (cron job)
2. Setup monitoring dashboards
3. Implement user favorites (optional)
4. Configure CDN for production
5. Setup CI/CD pipeline
6. Create backup automation

## Support

For issues or questions:
- Check logs: `npm run logs`
- Run diagnostics: `npm run diagnose`
- Review documentation: `/docs`
- Submit issues: GitHub Issues

## Quick Commands Reference

```bash
# Development
npm run dev           # Start all services
npm run dev:backend   # Start backend only
npm run dev:frontend  # Start frontend only
npm run dev:crawler   # Start crawler worker

# Database
npm run db:migrate    # Run migrations
npm run db:seed       # Seed data
npm run db:reset      # Reset database
npm run db:backup     # Backup database

# Testing
npm test              # Run all tests
npm run test:unit     # Unit tests only
npm run test:e2e      # E2E tests only
npm run test:coverage # Coverage report

# Production
npm run build         # Build for production
npm run start         # Start production server
npm run deploy        # Deploy to production
```