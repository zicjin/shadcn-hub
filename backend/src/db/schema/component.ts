import { pgTable, uuid, varchar, text, timestamp, integer, boolean, jsonb, pgEnum, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { sourceWebsites } from './source-website';
import { componentTypes } from './component-type';

// Enums
export const codeLanguageEnum = pgEnum('code_language', ['typescript', 'javascript', 'tsx', 'jsx']);

// Component table
export const components = pgTable('components', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourceWebsiteId: uuid('source_website_id').notNull().references(() => sourceWebsites.id, { onDelete: 'cascade' }),
  componentTypeId: uuid('component_type_id').notNull().references(() => componentTypes.id, { onDelete: 'restrict' }),
  name: varchar('name', { length: 200 }).notNull(),
  slug: varchar('slug', { length: 200 }).notNull(),
  description: text('description'),
  sourceUrl: varchar('source_url', { length: 1000 }).notNull(),
  previewUrl: varchar('preview_url', { length: 1000 }),
  thumbnailUrl: varchar('thumbnail_url', { length: 1000 }),
  sourceCode: text('source_code').notNull(),
  codeLanguage: codeLanguageEnum('code_language').notNull().default('typescript'),
  dependencies: jsonb('dependencies').default({}),
  props: jsonb('props').default({}),
  variants: jsonb('variants').default([]),
  tags: jsonb('tags').notNull().default([]),
  license: varchar('license', { length: 100 }),
  author: varchar('author', { length: 200 }),
  version: varchar('version', { length: 50 }),
  lastUpdatedAt: timestamp('last_updated_at', { withTimezone: true }),
  contentHash: varchar('content_hash', { length: 64 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  viewCount: integer('view_count').notNull().default(0),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  return {
    sourceSlugIdx: index('components_source_slug_idx').on(table.sourceWebsiteId, table.slug),
    componentTypeIdx: index('components_type_idx').on(table.componentTypeId),
    sourceActiveIdx: index('components_source_active_idx').on(table.sourceWebsiteId, table.isActive),
    tagsIdx: index('components_tags_idx').using('gin', table.tags),
    contentHashIdx: index('components_content_hash_idx').on(table.contentHash),
  };
});

// Relations
export const componentsRelations = relations(components, ({ one, many }) => ({
  sourceWebsite: one(sourceWebsites, {
    fields: [components.sourceWebsiteId],
    references: [sourceWebsites.id],
  }),
  componentType: one(componentTypes, {
    fields: [components.componentTypeId],
    references: [componentTypes.id],
  }),
}));

// Validation schemas
export const insertComponentSchema = createInsertSchema(components, {
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(200),
  description: z.string().optional(),
  sourceUrl: z.string().url(),
  previewUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  sourceCode: z.string().min(1),
  codeLanguage: z.enum(['typescript', 'javascript', 'tsx', 'jsx']),
  dependencies: z.record(z.string()).optional(),
  props: z.record(z.any()).optional(),
  variants: z.array(z.any()).optional(),
  tags: z.array(z.string()).min(1),
  license: z.string().max(100).optional(),
  author: z.string().max(200).optional(),
  version: z.string().max(50).optional(),
  contentHash: z.string().length(64),
});

export const selectComponentSchema = createSelectSchema(components);

// Types
export type Component = typeof components.$inferSelect;
export type NewComponent = typeof components.$inferInsert;