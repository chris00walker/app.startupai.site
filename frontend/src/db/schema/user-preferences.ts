/**
 * User Preferences Schema
 *
 * Stores user platform preferences for theme, canvas defaults, and AI settings.
 *
 * @story US-PR01, US-PR02, US-PR03, US-PR04
 */

import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

export const userPreferences = pgTable('user_preferences', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  userId: uuid('user_id').notNull().unique(),

  // Theme preference
  theme: text('theme').default('light').notNull(),

  // Canvas preference
  defaultCanvasType: text('default_canvas_type').default('vpc').notNull(),

  // Auto-save preference
  autoSaveInterval: text('auto_save_interval').default('5min').notNull(),

  // AI assistance level
  aiAssistanceLevel: text('ai_assistance_level').default('balanced').notNull(),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type UserPreferences = typeof userPreferences.$inferSelect;
export type NewUserPreferences = typeof userPreferences.$inferInsert;
