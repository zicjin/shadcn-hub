# Data Model: ShadCN Component Aggregator

## Entity Definitions

### SourceWebsite
Represents one of the 7 shadcn UI component library websites being crawled.

**Fields:**
- `id`: UUID (Primary Key)
- `name`: String (unique, required) - Display name of the website
- `url`: String (unique, required) - Base URL of the website
- `slug`: String (unique, required) - URL-safe identifier
- `description`: Text (optional) - Brief description of the library
- `logoUrl`: String (optional) - URL to website logo
- `licenseType`: Enum ['MIT', 'Apache', 'Commercial', 'Mixed'] - License type
- `lastCrawledAt`: Timestamp - Last successful crawl time
- `crawlStatus`: Enum ['pending', 'running', 'success', 'failed'] - Current crawl status
- `componentCount`: Integer - Number of components from this source
- `isActive`: Boolean (default true) - Whether to include in crawls
- `metadata`: JSON - Additional website-specific data
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE (slug)
- INDEX (isActive, lastCrawledAt)

### ComponentType
Categories for organizing components across different sources.

**Fields:**
- `id`: UUID (Primary Key)
- `name`: String (unique, required) - Category name (e.g., "Button", "Card")
- `slug`: String (unique, required) - URL-safe identifier
- `description`: Text (optional) - Description of the component type
- `iconName`: String (optional) - Icon identifier for UI display
- `displayOrder`: Integer - Sort order for navigation
- `componentCount`: Integer - Number of components of this type
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE (slug)
- INDEX (displayOrder)

### Component
Individual UI component from a source website.

**Fields:**
- `id`: UUID (Primary Key)
- `sourceWebsiteId`: UUID (Foreign Key -> SourceWebsite)
- `componentTypeId`: UUID (Foreign Key -> ComponentType)
- `name`: String (required) - Component name
- `slug`: String (required) - URL-safe identifier
- `description`: Text (optional) - Component description
- `sourceUrl`: String (required) - Original URL on source website
- `previewUrl`: String (optional) - URL for component preview
- `thumbnailUrl`: String (optional) - Screenshot/thumbnail URL
- `sourceCode`: Text - Component source code
- `codeLanguage`: Enum ['typescript', 'javascript', 'tsx', 'jsx']
- `dependencies`: JSON - Required npm packages
- `props`: JSON - Component prop definitions
- `variants`: JSON - Available component variants
- `tags`: String[] - Searchable tags
- `license`: String - Component license
- `author`: String (optional) - Component author
- `version`: String (optional) - Component version
- `lastUpdatedAt`: Timestamp - Last time component was updated at source
- `contentHash`: String - Hash of component code for change detection
- `isActive`: Boolean (default true) - Whether component is available
- `viewCount`: Integer (default 0) - Number of times viewed
- `metadata`: JSON - Additional component-specific data
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE (sourceWebsiteId, slug)
- INDEX (componentTypeId)
- INDEX (sourceWebsiteId, isActive)
- INDEX (tags) using GIN
- FULLTEXT (name, description, tags)

### ComponentInstance
Specific rendering configuration of a component with props.

**Fields:**
- `id`: UUID (Primary Key)
- `componentId`: UUID (Foreign Key -> Component)
- `name`: String (required) - Instance name (e.g., "Primary Button")
- `propsConfiguration`: JSON (required) - Props for this instance
- `previewCode`: Text - Code snippet for this configuration
- `isDefault`: Boolean (default false) - Whether this is the default example
- `displayOrder`: Integer - Sort order for display
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

**Indexes:**
- PRIMARY KEY (id)
- INDEX (componentId, displayOrder)
- INDEX (componentId, isDefault)

### CrawlJob
Tracks crawling operations for source websites.

**Fields:**
- `id`: UUID (Primary Key)
- `sourceWebsiteId`: UUID (Foreign Key -> SourceWebsite)
- `status`: Enum ['pending', 'running', 'success', 'failed', 'cancelled']
- `startedAt`: Timestamp
- `completedAt`: Timestamp (nullable)
- `componentsFound`: Integer (default 0)
- `componentsUpdated`: Integer (default 0)
- `componentsAdded`: Integer (default 0)
- `componentsRemoved`: Integer (default 0)
- `errorMessage`: Text (nullable) - Error details if failed
- `errorStack`: Text (nullable) - Full error stack trace
- `duration`: Integer (nullable) - Duration in milliseconds
- `metadata`: JSON - Additional crawl data (URLs visited, etc.)
- `createdAt`: Timestamp

**Indexes:**
- PRIMARY KEY (id)
- INDEX (sourceWebsiteId, status)
- INDEX (createdAt DESC)

### UserFavorite
Tracks user's favorite components (if user system implemented).

**Fields:**
- `id`: UUID (Primary Key)
- `userId`: UUID (Foreign Key -> User, if implemented)
- `componentId`: UUID (Foreign Key -> Component)
- `createdAt`: Timestamp

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE (userId, componentId)
- INDEX (userId, createdAt DESC)

### SearchLog
Tracks search queries for analytics and optimization.

**Fields:**
- `id`: UUID (Primary Key)
- `query`: String (required) - Search query text
- `filters`: JSON - Applied filters
- `resultsCount`: Integer - Number of results returned
- `clickedResultId`: UUID (nullable) - Component clicked from results
- `sessionId`: String - Browser session identifier
- `responseTime`: Integer - Query response time in ms
- `createdAt`: Timestamp

**Indexes:**
- PRIMARY KEY (id)
- INDEX (query)
- INDEX (createdAt DESC)

## Relationships

```
SourceWebsite (1) ──> (N) Component
ComponentType (1) ──> (N) Component
Component (1) ──> (N) ComponentInstance
SourceWebsite (1) ──> (N) CrawlJob
Component (1) ──> (N) UserFavorite
Component (1) ──> (N) SearchLog (via clickedResultId)
```

## State Transitions

### Component Lifecycle
```
Draft -> Active -> Deprecated -> Archived
```
- **Draft**: Component discovered but not yet fully processed
- **Active**: Component available for display
- **Deprecated**: Component marked as outdated
- **Archived**: Component removed from display but kept for history

### CrawlJob Status Flow
```
pending -> running -> [success | failed | cancelled]
```
- **pending**: Job created but not started
- **running**: Currently crawling
- **success**: Completed successfully
- **failed**: Encountered unrecoverable error
- **cancelled**: Manually stopped

## Validation Rules

### SourceWebsite
- URL must be valid HTTPS URL
- Name must be 3-50 characters
- Slug must be lowercase, alphanumeric with hyphens only

### Component
- Name required, 2-100 characters
- Source code cannot be empty
- Content hash must be unique per source website
- At least one tag required

### ComponentType
- Name must be unique, 2-50 characters
- Display order must be positive integer

### CrawlJob
- Only one running job per source website at a time
- Duration calculated automatically on completion
- Failed jobs must have error message

## Database Migrations

### Initial Schema (v1.0.0)
```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable full text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create tables in dependency order
CREATE TABLE source_websites (...);
CREATE TABLE component_types (...);
CREATE TABLE components (...);
CREATE TABLE component_instances (...);
CREATE TABLE crawl_jobs (...);
CREATE TABLE user_favorites (...);
CREATE TABLE search_logs (...);

-- Create indexes
CREATE INDEX ... ;

-- Add foreign key constraints
ALTER TABLE components ADD CONSTRAINT ... ;
```

## Performance Considerations

### Indexing Strategy
- Full-text search on component name, description, tags
- GIN index for JSON fields and array columns
- Partial indexes for active records only
- Covering indexes for common query patterns

### Partitioning
- SearchLog table partitioned by month
- CrawlJob table partitioned by year
- Old partitions archived after 90 days

### Caching Strategy
- Component listings cached for 5 minutes
- Individual components cached for 1 hour
- Search results cached for 10 minutes
- Source website metadata cached for 24 hours