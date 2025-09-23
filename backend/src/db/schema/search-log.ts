import { pgTable, uuid, varchar, text, timestamp, integer, jsonb, index } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// SearchLog table
export const searchLogs = pgTable('search_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  query: varchar('query', { length: 500 }).notNull(),
  filters: jsonb('filters').default({}),
  resultsCount: integer('results_count').notNull().default(0),
  clickedResultId: uuid('clicked_result_id'),
  sessionId: varchar('session_id', { length: 100 }).notNull(),
  responseTime: integer('response_time').notNull(), // in milliseconds
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  return {
    queryIdx: index('search_logs_query_idx').on(table.query),
    createdAtIdx: index('search_logs_created_at_idx').on(table.createdAt),
    sessionIdx: index('search_logs_session_idx').on(table.sessionId),
  };
});

// Validation schemas
export const insertSearchLogSchema = createInsertSchema(searchLogs, {
  query: z.string().min(1).max(500),
  filters: z.record(z.any()).optional(),
  resultsCount: z.number().int().min(0),
  clickedResultId: z.string().uuid().optional(),
  sessionId: z.string().min(1).max(100),
  responseTime: z.number().int().min(0),
});

export const selectSearchLogSchema = createSelectSchema(searchLogs);

// Types
export type SearchLog = typeof searchLogs.$inferSelect;
export type NewSearchLog = typeof searchLogs.$inferInsert;