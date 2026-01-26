/**
 * Sync History Schema
 *
 * Tracks synchronization of StartupAI project data to external platforms.
 *
 * @story US-BI02
 */

import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { integrationTypeEnum } from './integrations';

/**
 * Sync status types
 */
export type SyncStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

/**
 * Synced data structure
 */
export interface SyncedData {
  sections: {
    vpc?: Record<string, unknown>;
    bmc?: Record<string, unknown>;
    project?: Record<string, unknown>;
  };
  fieldCount: number;
}

/**
 * Sync history table
 *
 * Tracks each sync operation from StartupAI to external platforms.
 */
export const syncHistory = pgTable(
  'sync_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // User context
    userId: uuid('user_id').notNull(),

    // Project being synced
    projectId: uuid('project_id').notNull(),

    // Target integration
    integrationType: integrationTypeEnum('integration_type').notNull(),

    // External target reference
    targetId: text('target_id'),
    targetUrl: text('target_url'),

    // Data that was synced
    syncedData: jsonb('synced_data').$type<SyncedData>().notNull(),

    // Status tracking
    status: text('status').$type<SyncStatus>().default('pending'),
    errorMessage: text('error_message'),

    // Timestamps
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => [
    index('sync_history_user_id_idx').on(table.userId),
    index('sync_history_project_id_idx').on(table.projectId),
    index('sync_history_type_idx').on(table.integrationType),
    index('sync_history_status_idx').on(table.status),
  ]
);

// Type exports
export type SyncHistoryRecord = typeof syncHistory.$inferSelect;
export type NewSyncHistoryRecord = typeof syncHistory.$inferInsert;
