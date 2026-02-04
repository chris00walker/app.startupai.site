/**
 * Business Model Canvas Schema
 *
 * Stores editable Business Model Canvas data for projects.
 * Supports both CrewAI-generated and user-edited content,
 * tracking the source of each item for conflict resolution.
 *
 * Based on Strategyzer's Business Model Canvas methodology.
 */

import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';
import { projects } from './projects';
import { userProfiles } from './users';

/**
 * BMC Item represents a single entry in a canvas block.
 * Tracks whether it came from CrewAI or was added manually.
 */
export interface BMCItem {
  id: string;
  text: string;
  source: 'crewai' | 'manual';
  createdAt: string;
  updatedAt: string;
}

/**
 * Data source tracking for the entire canvas.
 * - 'crewai': All items came from CrewAI analysis
 * - 'manual': All items were manually entered
 * - 'hybrid': Mix of CrewAI and manual items
 */
export type BMCSource = 'crewai' | 'manual' | 'hybrid';

export const businessModelCanvas = pgTable('business_model_canvas', {
  // Primary key
  id: uuid('id').defaultRandom().primaryKey().notNull(),

  // Foreign keys
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => userProfiles.id, { onDelete: 'cascade' }),

  // Data source tracking
  dataSource: text('data_source')
    .$type<BMCSource>()
    .default('crewai')
    .notNull(),

  // Reference to the CrewAI run that generated initial data
  kickoffId: text('kickoff_id'),

  // ========================================
  // The 9 Building Blocks (Strategyzer BMC)
  // ========================================

  // 1. Customer Segments: Who are your most important customers?
  customerSegments: jsonb('customer_segments').$type<BMCItem[]>().default([]),

  // 2. Value Propositions: What value do you deliver to the customer?
  valuePropositions: jsonb('value_propositions').$type<BMCItem[]>().default([]),

  // 3. Channels: How do you reach your customer segments?
  channels: jsonb('channels').$type<BMCItem[]>().default([]),

  // 4. Customer Relationships: What type of relationship does each segment expect?
  customerRelationships: jsonb('customer_relationships').$type<BMCItem[]>().default([]),

  // 5. Revenue Streams: For what value are customers willing to pay?
  revenueStreams: jsonb('revenue_streams').$type<BMCItem[]>().default([]),

  // 6. Key Resources: What key resources does your value proposition require?
  keyResources: jsonb('key_resources').$type<BMCItem[]>().default([]),

  // 7. Key Activities: What key activities does your value proposition require?
  keyActivities: jsonb('key_activities').$type<BMCItem[]>().default([]),

  // 8. Key Partners: Who are your key partners and suppliers?
  keyPartners: jsonb('key_partners').$type<BMCItem[]>().default([]),

  // 9. Cost Structure: What are the most important costs in your business model?
  costStructure: jsonb('cost_structure').$type<BMCItem[]>().default([]),

  // ========================================
  // Original CrewAI Data (for "Reset to CrewAI" feature)
  // ========================================

  // Store the original CrewAI-generated values before any edits
  originalCrewaiData: jsonb('original_crewai_data').$type<{
    customerSegments?: BMCItem[];
    valuePropositions?: BMCItem[];
    channels?: BMCItem[];
    customerRelationships?: BMCItem[];
    revenueStreams?: BMCItem[];
    keyResources?: BMCItem[];
    keyActivities?: BMCItem[];
    keyPartners?: BMCItem[];
    costStructure?: BMCItem[];
  }>(),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Export inferred types
export type BusinessModelCanvas = typeof businessModelCanvas.$inferSelect;
export type NewBusinessModelCanvas = typeof businessModelCanvas.$inferInsert;

/**
 * Type for updating individual BMC blocks
 */
export type BMCBlockKey =
  | 'customerSegments'
  | 'valuePropositions'
  | 'channels'
  | 'customerRelationships'
  | 'revenueStreams'
  | 'keyResources'
  | 'keyActivities'
  | 'keyPartners'
  | 'costStructure';

/**
 * BMC Block metadata for UI rendering
 */
export const BMC_BLOCK_CONFIG: Record<
  BMCBlockKey,
  {
    title: string;
    description: string;
    position: { row: number; col: number; rowSpan?: number; colSpan?: number };
  }
> = {
  keyPartners: {
    title: 'Key Partners',
    description: 'Who are your key partners and suppliers?',
    position: { row: 1, col: 1, rowSpan: 2 },
  },
  keyActivities: {
    title: 'Key Activities',
    description: 'What key activities does your value proposition require?',
    position: { row: 1, col: 2 },
  },
  keyResources: {
    title: 'Key Resources',
    description: 'What key resources does your value proposition require?',
    position: { row: 2, col: 2 },
  },
  valuePropositions: {
    title: 'Value Propositions',
    description: 'What value do you deliver to the customer?',
    position: { row: 1, col: 3, rowSpan: 2 },
  },
  customerRelationships: {
    title: 'Customer Relationships',
    description: 'What type of relationship does each segment expect?',
    position: { row: 1, col: 4 },
  },
  channels: {
    title: 'Channels',
    description: 'How do you reach your customer segments?',
    position: { row: 2, col: 4 },
  },
  customerSegments: {
    title: 'Customer Segments',
    description: 'Who are your most important customers?',
    position: { row: 1, col: 5, rowSpan: 2 },
  },
  costStructure: {
    title: 'Cost Structure',
    description: 'What are the most important costs in your business model?',
    position: { row: 3, col: 1, colSpan: 2 },
  },
  revenueStreams: {
    title: 'Revenue Streams',
    description: 'For what value are customers willing to pay?',
    position: { row: 3, col: 3, colSpan: 3 },
  },
};
