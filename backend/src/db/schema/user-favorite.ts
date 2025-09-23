import { pgTable, uuid, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { components } from './component';

// UserFavorite table
export const userFavorites = pgTable('user_favorites', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(), // Will reference User table when implemented
  componentId: uuid('component_id').notNull().references(() => components.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  return {
    userComponentIdx: index('user_favorites_user_component_idx').on(table.userId, table.componentId).unique(),
    userCreatedIdx: index('user_favorites_user_created_idx').on(table.userId, table.createdAt),
  };
});

// Relations
export const userFavoritesRelations = relations(userFavorites, ({ one }) => ({
  component: one(components, {
    fields: [userFavorites.componentId],
    references: [components.id],
  }),
}));

// Validation schemas
export const insertUserFavoriteSchema = createInsertSchema(userFavorites, {
  userId: z.string().uuid(),
  componentId: z.string().uuid(),
});

export const selectUserFavoriteSchema = createSelectSchema(userFavorites);

// Types
export type UserFavorite = typeof userFavorites.$inferSelect;
export type NewUserFavorite = typeof userFavorites.$inferInsert;