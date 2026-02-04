/**
 * Value Proposition Canvas Schema
 *
 * Stores editable Value Proposition Canvas data for projects.
 * Supports both CrewAI-generated and user-edited content,
 * tracking the source of each item for conflict resolution.
 *
 * Based on Strategyzer's Value Proposition Design methodology.
 *
 * Key differences from BMC:
 * - Supports multiple segments per project (keyed by segmentKey)
 * - Complex item types: Jobs (3 dimensions), Pains/Gains (with intensity)
 * - Pain/Gain to Value Map mappings (pain_relievers, gain_creators)
 */

import { pgTable, text, timestamp, uuid, jsonb, numeric } from 'drizzle-orm/pg-core';
import { projects } from './projects';
import { userProfiles } from './users';

// ============================================================================
// ITEM TYPES
// ============================================================================

/**
 * Base item interface with source tracking
 */
export interface VPCItemBase {
  id: string;
  source: 'crewai' | 'manual';
  createdAt: string;
  updatedAt: string;
}

/**
 * Generic text item (for products/services, differentiators)
 */
export interface VPCItem extends VPCItemBase {
  text: string;
}

/**
 * Job item - Jobs to be Done framework (3 dimensions)
 */
export interface VPCJobItem extends VPCItemBase {
  functional: string; // What task are they trying to accomplish?
  emotional: string; // How do they want to feel?
  social: string; // How do they want to be perceived?
  importance: number; // 1-10 scale
}

/**
 * Pain item - Customer frustrations/obstacles
 */
export interface VPCPainItem extends VPCItemBase {
  description: string;
  intensity?: number; // 1-10 scale (optional, may come from CrewAI)
}

/**
 * Gain item - Customer benefits/desires
 */
export interface VPCGainItem extends VPCItemBase {
  description: string;
  importance?: number; // 1-10 scale (optional, may come from CrewAI)
}

/**
 * Pain Reliever item - How we address pains
 */
export interface VPCPainRelieverItem extends VPCItemBase {
  painDescription: string; // Which pain this addresses
  relief: string; // How we relieve it
}

/**
 * Gain Creator item - How we create gains
 */
export interface VPCGainCreatorItem extends VPCItemBase {
  gainDescription: string; // Which gain this creates
  creator: string; // How we create it
}

// ============================================================================
// SOURCE TRACKING
// ============================================================================

/**
 * Data source tracking for the canvas.
 * - 'crewai': All items came from CrewAI analysis
 * - 'manual': All items were manually entered
 * - 'hybrid': Mix of CrewAI and manual items
 */
export type VPCSource = 'crewai' | 'manual' | 'hybrid';

// ============================================================================
// ORIGINAL DATA SHAPE (for reset)
// ============================================================================

export interface VPCOriginalData {
  jobs?: VPCJobItem[];
  pains?: VPCPainItem[];
  gains?: VPCGainItem[];
  productsAndServices?: VPCItem[];
  painRelievers?: VPCPainRelieverItem[];
  gainCreators?: VPCGainCreatorItem[];
  differentiators?: VPCItem[];
  resonanceScore?: number;
}

// ============================================================================
// TABLE DEFINITION
// ============================================================================

export const valuePropositionCanvas = pgTable('value_proposition_canvas', {
  // Primary key
  id: uuid('id').defaultRandom().primaryKey().notNull(),

  // Foreign keys
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => userProfiles.id, { onDelete: 'cascade' }),

  // ========================================
  // Segment Identification
  // ========================================

  // Unique key for this segment (e.g., "small_business_owners")
  segmentKey: text('segment_key').notNull(),

  // Human-readable name (e.g., "Small Business Owners")
  segmentName: text('segment_name').notNull(),

  // Data source tracking
  dataSource: text('data_source').$type<VPCSource>().default('crewai').notNull(),

  // Reference to the CrewAI run that generated initial data
  kickoffId: text('kickoff_id'),

  // ========================================
  // Customer Profile (Right side of VPC)
  // ========================================

  // Jobs to be Done
  jobs: jsonb('jobs').$type<VPCJobItem[]>().default([]),

  // Customer Pains (frustrations, risks, obstacles)
  pains: jsonb('pains').$type<VPCPainItem[]>().default([]),

  // Customer Gains (benefits, desires, requirements)
  gains: jsonb('gains').$type<VPCGainItem[]>().default([]),

  // Resonance score from testing (0-1)
  resonanceScore: numeric('resonance_score', { precision: 3, scale: 2 }),

  // ========================================
  // Value Map (Left side of VPC)
  // ========================================

  // Products & Services offered
  productsAndServices: jsonb('products_and_services').$type<VPCItem[]>().default([]),

  // Pain Relievers - how we address each pain
  painRelievers: jsonb('pain_relievers').$type<VPCPainRelieverItem[]>().default([]),

  // Gain Creators - how we create each gain
  gainCreators: jsonb('gain_creators').$type<VPCGainCreatorItem[]>().default([]),

  // Differentiators - what makes us unique
  differentiators: jsonb('differentiators').$type<VPCItem[]>().default([]),

  // ========================================
  // Original CrewAI Data (for "Reset to CrewAI" feature)
  // ========================================

  originalCrewaiData: jsonb('original_crewai_data').$type<VPCOriginalData>(),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// INFERRED TYPES
// ============================================================================

export type ValuePropositionCanvas = typeof valuePropositionCanvas.$inferSelect;
export type NewValuePropositionCanvas = typeof valuePropositionCanvas.$inferInsert;

// ============================================================================
// BLOCK KEYS FOR CRUD OPERATIONS
// ============================================================================

/**
 * Keys for VPC blocks that can be updated
 */
export type VPCBlockKey =
  | 'jobs'
  | 'pains'
  | 'gains'
  | 'productsAndServices'
  | 'painRelievers'
  | 'gainCreators'
  | 'differentiators';

/**
 * Map from camelCase block keys to snake_case column names
 */
export const VPC_COLUMN_MAP: Record<VPCBlockKey, string> = {
  jobs: 'jobs',
  pains: 'pains',
  gains: 'gains',
  productsAndServices: 'products_and_services',
  painRelievers: 'pain_relievers',
  gainCreators: 'gain_creators',
  differentiators: 'differentiators',
};

// ============================================================================
// BLOCK CONFIGURATION FOR UI
// ============================================================================

/**
 * VPC Block metadata for UI rendering
 */
export const VPC_BLOCK_CONFIG: Record<
  VPCBlockKey,
  {
    title: string;
    description: string;
    side: 'customer' | 'value';
    icon?: string;
  }
> = {
  // Customer Profile (Right side)
  jobs: {
    title: 'Customer Jobs',
    description: 'What tasks are they trying to accomplish?',
    side: 'customer',
    icon: 'Briefcase',
  },
  pains: {
    title: 'Pains',
    description: 'Frustrations, risks, and obstacles',
    side: 'customer',
    icon: 'Frown',
  },
  gains: {
    title: 'Gains',
    description: 'Benefits, desires, and requirements',
    side: 'customer',
    icon: 'Smile',
  },

  // Value Map (Left side)
  productsAndServices: {
    title: 'Products & Services',
    description: 'What do you offer?',
    side: 'value',
    icon: 'Package',
  },
  painRelievers: {
    title: 'Pain Relievers',
    description: 'How do you alleviate pains?',
    side: 'value',
    icon: 'Bandage',
  },
  gainCreators: {
    title: 'Gain Creators',
    description: 'How do you create gains?',
    side: 'value',
    icon: 'TrendingUp',
  },
  differentiators: {
    title: 'Differentiators',
    description: 'What makes you unique?',
    side: 'value',
    icon: 'Star',
  },
};
