/**
 * Import History Schema
 *
 * Stores history of data imports from external integrations.
 * Tracks what was imported, when, and the mapping used.
 *
 * @story US-BI01
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
 * Import history table
 *
 * Tracks each import operation performed by users.
 */
export const importHistory = pgTable(
  'import_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // User and project context
    userId: uuid('user_id').notNull(),
    projectId: uuid('project_id').notNull(),

    // Integration source
    integrationType: integrationTypeEnum('integration_type').notNull(),

    // Source item details
    sourceId: text('source_id').notNull(),
    sourceName: text('source_name').notNull(),
    sourceType: text('source_type').notNull(), // e.g., 'page', 'database', 'file'
    sourceUrl: text('source_url'),

    // Imported data (the raw extracted fields)
    importedData: jsonb('imported_data').notNull(),

    // Mapping applied (reference to field_mappings)
    mappingId: uuid('mapping_id'),

    // Status
    status: text('status').notNull().default('pending'), // pending, mapped, error

    // Error info if status is 'error'
    errorMessage: text('error_message'),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('import_history_user_id_idx').on(table.userId),
    index('import_history_project_id_idx').on(table.projectId),
    index('import_history_type_idx').on(table.integrationType),
    index('import_history_created_idx').on(table.createdAt),
  ]
);

// Type exports
export type ImportHistory = typeof importHistory.$inferSelect;
export type NewImportHistory = typeof importHistory.$inferInsert;
