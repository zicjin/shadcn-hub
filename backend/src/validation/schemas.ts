import { z } from 'zod';

// Pagination validation
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Sort options for components
export const componentSortSchema = z.enum(['newest', 'popular', 'name']).default('newest');

// Filter schemas
export const sourceFilterSchema = z.string().min(1).max(100).optional();
export const typeFilterSchema = z.string().min(1).max(100).optional();
export const tagsFilterSchema = z.array(z.string()).optional();

// Component browse query schema
export const componentBrowseSchema = z.object({
  source: sourceFilterSchema,
  type: typeFilterSchema,
  tags: tagsFilterSchema,
  sort: componentSortSchema,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Search query schema
export const searchQuerySchema = z.object({
  q: z.string().min(2).max(500),
  source: sourceFilterSchema,
  type: typeFilterSchema,
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// UUID validation
export const uuidSchema = z.string().uuid();

// Slug validation
export const slugSchema = z.string().regex(/^[a-z0-9-]+$/);

// Code format options
export const codeFormatSchema = z.enum(['raw', 'formatted', 'minified']).default('formatted');

// Crawl trigger schema
export const crawlTriggerSchema = z.object({
  sourceSlug: slugSchema,
  force: z.boolean().default(false),
});

// Type exports for use in route handlers
export type PaginationQuery = z.infer<typeof paginationSchema>;
export type ComponentBrowseQuery = z.infer<typeof componentBrowseSchema>;
export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type CrawlTriggerBody = z.infer<typeof crawlTriggerSchema>;