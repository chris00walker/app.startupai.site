/**
 * Feature Flags Schema
 *
 * Manages feature flag configuration for gradual rollout and A/B testing.
 *
 * Evaluation Priority (first match wins):
 * 1. User-specific override (targetUserIds contains userId)
 * 2. Percentage rollout (deterministic hash of userId + flagKey)
 * 3. Global flag (enabledGlobally)
 * 4. Default: false
 *
 * @story US-A06
 */

import { pgTable, uuid, text, timestamp, boolean, integer, index } from 'drizzle-orm/pg-core';
import { userProfiles } from './users';

export const featureFlags = pgTable(
  'feature_flags',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),

    // Unique identifier for the flag (e.g., 'quick_start_v2', 'new_dashboard')
    key: text('key').notNull().unique(),

    // Human-readable name and description
    name: text('name').notNull(),
    description: text('description'),

    // Global enable/disable
    enabledGlobally: boolean('enabled_globally').default(false).notNull(),

    // Percentage rollout (0-100)
    // Uses deterministic hash: hashCode(userId + key) % 100 < percentageRollout
    percentageRollout: integer('percentage_rollout').default(0).notNull(),

    // Specific user IDs that always have the flag enabled (overrides percentage)
    // Stored as comma-separated UUIDs for simplicity
    targetUserIds: text('target_user_ids'),

    // Audit fields
    createdById: uuid('created_by_id').references(() => userProfiles.id, { onDelete: 'set null' }),
    updatedById: uuid('updated_by_id').references(() => userProfiles.id, { onDelete: 'set null' }),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('idx_feature_flags_key').on(table.key)]
);

export type FeatureFlag = typeof featureFlags.$inferSelect;
export type NewFeatureFlag = typeof featureFlags.$inferInsert;

/**
 * Default feature flags to seed in the database
 */
export const DEFAULT_FEATURE_FLAGS = [
  {
    key: 'quick_start_v2',
    name: 'Quick Start V2',
    description: 'New streamlined quick start flow with improved UX',
    enabledGlobally: false,
    percentageRollout: 0,
  },
  {
    key: 'phase_2_agents',
    name: 'Phase 2 Validation Agents',
    description: 'Enable Phase 2 desirability validation agents',
    enabledGlobally: true,
    percentageRollout: 100,
  },
  {
    key: 'ad_platform_integration',
    name: 'Ad Platform Integration',
    description: 'Enable live ad platform connections for validation campaigns',
    enabledGlobally: false,
    percentageRollout: 0,
  },
  {
    key: 'consultant_trial',
    name: 'Consultant Trial Mode',
    description: 'Enable consultant trial experience for advisor personas',
    enabledGlobally: true,
    percentageRollout: 100,
  },
  {
    key: 'impersonation_mode',
    name: 'Admin Impersonation',
    description: 'Allow admins to view the app as a specific user (read-only)',
    enabledGlobally: true,
    percentageRollout: 100,
  },
  {
    key: 'dashboard_ai_assistant',
    name: 'Dashboard AI Assistant',
    description: 'Floating AI chatbot on founder/consultant dashboards (US-F16)',
    enabledGlobally: false,
    percentageRollout: 0,
  },
] as const;
