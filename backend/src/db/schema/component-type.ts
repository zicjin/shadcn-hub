import { pgTable, uuid, varchar, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// ComponentType table
export const componentTypes = pgTable('component_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  iconName: varchar('icon_name', { length: 50 }),
  displayOrder: integer('display_order').notNull().default(0),
  componentCount: integer('component_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Validation schemas
export const insertComponentTypeSchema = createInsertSchema(componentTypes, {
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  iconName: z.string().max(50).optional(),
  displayOrder: z.number().int().min(0),
});

export const selectComponentTypeSchema = createSelectSchema(componentTypes);

// Types
export type ComponentType = typeof componentTypes.$inferSelect;
export type NewComponentType = typeof componentTypes.$inferInsert;