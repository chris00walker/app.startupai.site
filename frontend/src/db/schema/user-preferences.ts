/**
 * User Preferences Schema
 *
 * Stores user platform preferences for theme, canvas defaults, AI settings,
 * and enabled integrations for bi-directional sync.
 *
 * @story US-PR01, US-PR02, US-PR03, US-PR04, US-BI04, US-BI05
 */

import { pgTable, uuid, text, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core';

/**
 * Type for enabled integrations tracking
 * Stores which integrations the user has explicitly enabled
 */
export type EnabledIntegrationsConfig = {
  /** Integration types the user has enabled (e.g., 'notion', 'google_drive') */
  types: string[];
  /** Whether integration selection was skipped during onboarding */
  skippedOnboarding: boolean;
  /** Last time integrations were configured */
  lastConfiguredAt: string | null;
};

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

  // Integration preferences (US-BI04, US-BI05)
  enabledIntegrations: jsonb('enabled_integrations').$type<EnabledIntegrationsConfig>().default({
    types: [],
    skippedOnboarding: false,
    lastConfiguredAt: null,
  }),

  // Whether to show integration discovery banner on dashboard
  showIntegrationBanner: boolean('show_integration_banner').default(true),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type UserPreferences = typeof userPreferences.$inferSelect;
export type NewUserPreferences = typeof userPreferences.$inferInsert;
