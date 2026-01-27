/**
 * Copy Banks Schema
 *
 * Pre-computed ad copy variants generated from VPC data.
 * Enables zero-inference ad generation by storing all copy
 * at VPC creation time.
 *
 * @story US-AP01
 */

import { pgTable, text, timestamp, uuid, jsonb, integer } from 'drizzle-orm/pg-core';
import { projects } from './projects';
import { userProfiles } from './users';

// ============================================================================
// COPY BANK TYPES
// ============================================================================

/**
 * Headline variants (platform-agnostic, truncate to platform limits later)
 */
export interface CopyBankHeadlines {
  primary: string;      // "Stop Wasting Hours on Manual Data Entry"
  benefit: string;      // "Automate Your Workflow in Minutes"
  question: string;     // "Tired of Repetitive Tasks?"
  social: string;       // "Join 10,000+ Teams Who Automated"
  urgency: string;      // "Limited Beta Access Available"
}

/**
 * Primary text variants (longer form copy)
 */
export interface CopyBankPrimaryTexts {
  problem_solution: string;   // Pain → Solution narrative
  benefit_focused: string;    // Lead with gains
  social_proof: string;       // Credibility focused
  feature_list: string;       // Key capabilities
  urgency: string;            // Scarcity/time-limited
}

/**
 * Product descriptor
 */
export interface CopyBankProduct {
  name: string;              // "DataFlow"
  category: string;          // "automation tool"
  differentiator: string;    // "AI-powered"
}

/**
 * Call-to-action variants
 */
export interface CopyBankCTAs {
  primary: string;     // "Start Free Trial"
  secondary: string;   // "See How It Works"
  urgency: string;     // "Claim Your Spot"
  learn: string;       // "Learn More"
}

/**
 * Complete Copy Bank data structure
 */
export interface CopyBankData {
  headlines: CopyBankHeadlines;
  primary_texts: CopyBankPrimaryTexts;
  pains: string[];           // ["manual data entry", "error-prone processes", "wasted time"]
  gains: string[];           // ["save 10 hours/week", "99.9% accuracy", "instant setup"]
  product: CopyBankProduct;
  image_keywords: string[];  // ["office productivity", "automation", "happy team"]
  ctas: CopyBankCTAs;
}

// ============================================================================
// TABLE DEFINITION
// ============================================================================

export const copyBanks = pgTable('copy_banks', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),

  // Foreign keys
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => userProfiles.id, { onDelete: 'cascade' }),

  // VPC tracking
  vpcId: uuid('vpc_id'),                    // Reference to the VPC that generated this
  vpcVersion: integer('vpc_version').default(1).notNull(),  // Track which VPC version this was generated from
  segmentKey: text('segment_key'),          // Which customer segment this is for

  // Copy Bank data (JSONB for flexibility)
  headlines: jsonb('headlines').$type<CopyBankHeadlines>().notNull(),
  primaryTexts: jsonb('primary_texts').$type<CopyBankPrimaryTexts>().notNull(),
  pains: jsonb('pains').$type<string[]>().notNull(),
  gains: jsonb('gains').$type<string[]>().notNull(),
  product: jsonb('product').$type<CopyBankProduct>().notNull(),
  imageKeywords: jsonb('image_keywords').$type<string[]>().notNull(),
  ctas: jsonb('ctas').$type<CopyBankCTAs>().notNull(),

  // Generation metadata
  modelUsed: text('model_used'),            // e.g., "gpt-4o-mini"
  promptVersion: text('prompt_version'),    // For tracking prompt iterations
  generationCost: text('generation_cost'),  // e.g., "$0.02"

  // Timestamps
  generatedAt: timestamp('generated_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// INFERRED TYPES
// ============================================================================

export type CopyBank = typeof copyBanks.$inferSelect;
export type NewCopyBank = typeof copyBanks.$inferInsert;
