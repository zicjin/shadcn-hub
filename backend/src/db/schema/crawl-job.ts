import { pgTable, uuid, varchar, text, timestamp, integer, jsonb, pgEnum, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { sourceWebsites } from './source-website';

// Enums
export const crawlJobStatusEnum = pgEnum('crawl_job_status', ['pending', 'running', 'success', 'failed', 'cancelled']);

// CrawlJob table
export const crawlJobs = pgTable('crawl_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourceWebsiteId: uuid('source_website_id').notNull().references(() => sourceWebsites.id, { onDelete: 'cascade' }),
  status: crawlJobStatusEnum('status').notNull().default('pending'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  componentsFound: integer('components_found').notNull().default(0),
  componentsUpdated: integer('components_updated').notNull().default(0),
  componentsAdded: integer('components_added').notNull().default(0),
  componentsRemoved: integer('components_removed').notNull().default(0),
  errorMessage: text('error_message'),
  errorStack: text('error_stack'),
  duration: integer('duration'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  return {
    sourceStatusIdx: index('crawl_jobs_source_status_idx').on(table.sourceWebsiteId, table.status),
    createdAtIdx: index('crawl_jobs_created_at_idx').on(table.createdAt),
  };
});

// Relations
export const crawlJobsRelations = relations(crawlJobs, ({ one }) => ({
  sourceWebsite: one(sourceWebsites, {
    fields: [crawlJobs.sourceWebsiteId],
    references: [sourceWebsites.id],
  }),
}));

// Validation schemas
export const insertCrawlJobSchema = createInsertSchema(crawlJobs, {
  status: z.enum(['pending', 'running', 'success', 'failed', 'cancelled']),
  componentsFound: z.number().int().min(0),
  componentsUpdated: z.number().int().min(0),
  componentsAdded: z.number().int().min(0),
  componentsRemoved: z.number().int().min(0),
  errorMessage: z.string().optional(),
  errorStack: z.string().optional(),
  duration: z.number().int().min(0).optional(),
  metadata: z.record(z.any()).optional(),
});

export const selectCrawlJobSchema = createSelectSchema(crawlJobs);

// Types
export type CrawlJob = typeof crawlJobs.$inferSelect;
export type NewCrawlJob = typeof crawlJobs.$inferInsert;