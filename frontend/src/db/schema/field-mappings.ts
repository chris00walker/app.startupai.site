/**
 * Field Mappings Schema
 *
 * Stores reusable field mappings between external data sources
 * and StartupAI's schema (VPC, BMC, Evidence, Project).
 *
 * @story US-BI03
 */

import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  boolean,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { integrationTypeEnum } from './integrations';

/**
 * Field mapping entry
 */
export interface FieldMappingEntry {
  /** Source field name from imported data */
  sourceField: string;
  /** Target section in StartupAI schema */
  targetSection: 'vpc' | 'bmc' | 'evidence' | 'project';
  /** Target field within the section */
  targetField: string;
  /** Optional transform function name */
  transform?: string;
}

/**
 * Field mappings table
 *
 * Stores user-defined mappings for transforming external data
 * into StartupAI's data model.
 */
export const fieldMappings = pgTable(
  'field_mappings',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // User context
    userId: uuid('user_id').notNull(),

    // Mapping metadata
    name: text('name').notNull(),
    description: text('description'),

    // Integration type this mapping applies to
    integrationType: integrationTypeEnum('integration_type').notNull(),

    // Source schema detected from imported data
    sourceSchema: jsonb('source_schema').notNull().default('[]'),

    // The actual field mappings
    mappings: jsonb('mappings').$type<FieldMappingEntry[]>().notNull().default([]),

    // Fields that weren't mapped
    unmappedFields: jsonb('unmapped_fields').$type<string[]>().default([]),

    // Whether this is a default mapping for the integration type
    isDefault: boolean('is_default').default(false),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('field_mappings_user_id_idx').on(table.userId),
    index('field_mappings_type_idx').on(table.integrationType),
    uniqueIndex('field_mappings_user_name_unique').on(table.userId, table.name),
  ]
);

// Type exports
export type FieldMapping = typeof fieldMappings.$inferSelect;
export type NewFieldMapping = typeof fieldMappings.$inferInsert;
