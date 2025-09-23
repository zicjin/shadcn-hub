import { pgTable, uuid, varchar, text, timestamp, integer, boolean, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { components } from './component';

// ComponentInstance table
export const componentInstances = pgTable('component_instances', {
  id: uuid('id').primaryKey().defaultRandom(),
  componentId: uuid('component_id').notNull().references(() => components.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 200 }).notNull(),
  propsConfiguration: jsonb('props_configuration').notNull(),
  previewCode: text('preview_code'),
  isDefault: boolean('is_default').notNull().default(false),
  displayOrder: integer('display_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  return {
    componentOrderIdx: index('component_instances_component_order_idx').on(table.componentId, table.displayOrder),
    componentDefaultIdx: index('component_instances_component_default_idx').on(table.componentId, table.isDefault),
  };
});

// Relations
export const componentInstancesRelations = relations(componentInstances, ({ one }) => ({
  component: one(components, {
    fields: [componentInstances.componentId],
    references: [components.id],
  }),
}));

// Validation schemas
export const insertComponentInstanceSchema = createInsertSchema(componentInstances, {
  name: z.string().min(1).max(200),
  propsConfiguration: z.record(z.any()),
  previewCode: z.string().optional(),
  isDefault: z.boolean(),
  displayOrder: z.number().int().min(0),
});

export const selectComponentInstanceSchema = createSelectSchema(componentInstances);

// Types
export type ComponentInstance = typeof componentInstances.$inferSelect;
export type NewComponentInstance = typeof componentInstances.$inferInsert;