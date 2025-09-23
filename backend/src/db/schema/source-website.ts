import { pgTable, uuid, varchar, text, timestamp, integer, boolean, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Enums
export const licenseTypeEnum = pgEnum('license_type', ['MIT', 'Apache', 'Commercial', 'Mixed']);
export const crawlStatusEnum = pgEnum('crawl_status', ['pending', 'running', 'success', 'failed']);

// SourceWebsite table
export const sourceWebsites = pgTable('source_websites', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  url: varchar('url', { length: 500 }).notNull().unique(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  logoUrl: varchar('logo_url', { length: 500 }),
  licenseType: licenseTypeEnum('license_type').notNull().default('MIT'),
  lastCrawledAt: timestamp('last_crawled_at', { withTimezone: true }),
  crawlStatus: crawlStatusEnum('crawl_status').notNull().default('pending'),
  componentCount: integer('component_count').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Validation schemas
export const insertSourceWebsiteSchema = createInsertSchema(sourceWebsites, {
  name: z.string().min(3).max(100),
  url: z.string().url(),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  logoUrl: z.string().url().optional(),
  licenseType: z.enum(['MIT', 'Apache', 'Commercial', 'Mixed']),
});

export const selectSourceWebsiteSchema = createSelectSchema(sourceWebsites);

// Types
export type SourceWebsite = typeof sourceWebsites.$inferSelect;
export type NewSourceWebsite = typeof sourceWebsites.$inferInsert;