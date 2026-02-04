/**
 * Design Assets Schema
 *
 * Stores AI-generated design assets (illustrations, backgrounds, marketing images)
 * with metadata for cost tracking, approval workflow, and Figma integration.
 *
 * @story US-DA01, US-DA02
 */

import { pgTable, text, timestamp, uuid, boolean, decimal } from 'drizzle-orm/pg-core';
import { projects } from './projects';

/**
 * Design Assets
 *
 * Stores generated and approved design assets with full metadata.
 * Assets are stored in Supabase Storage, URLs reference that bucket.
 */
export const designAssets = pgTable('design_assets', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),

  // Foreign key to projects (nullable for shared brand assets)
  projectId: uuid('project_id')
    .references(() => projects.id, { onDelete: 'cascade' }),

  // Asset classification
  assetType: text('asset_type')
    .$type<'illustration' | 'background' | 'marketing' | 'icon' | 'hero'>()
    .notNull(),
  assetCategory: text('asset_category'), // 'hero', 'social', 'spot', 'email', etc.

  // Storage information
  storagePath: text('storage_path').notNull(), // Supabase Storage path
  publicUrl: text('public_url').notNull(),

  // Generation metadata
  prompt: text('prompt').notNull(),
  negativePrompt: text('negative_prompt'),
  revisedPrompt: text('revised_prompt'), // Prompt as interpreted by DALL-E
  dimensions: text('dimensions'), // '1024x1024', '1792x1024', etc.
  quality: text('quality')
    .$type<'standard' | 'hd'>()
    .default('standard'),
  style: text('style')
    .$type<'natural' | 'vivid'>()
    .default('vivid'),
  model: text('model').default('dall-e-3'),

  // Cost tracking
  generationCost: decimal('generation_cost', { precision: 10, scale: 4 }),

  // Approval workflow
  status: text('status')
    .$type<'draft' | 'review' | 'approved' | 'rejected'>()
    .default('draft')
    .notNull(),
  approvedBy: text('approved_by'), // User ID who approved
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  rejectionReason: text('rejection_reason'),

  // Figma integration
  figmaFileKey: text('figma_file_key'),
  figmaNodeId: text('figma_node_id'),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type DesignAsset = typeof designAssets.$inferSelect;
export type NewDesignAsset = typeof designAssets.$inferInsert;

/**
 * Figma Project Links
 *
 * Maps Figma file URLs to project UUIDs for agent access.
 * Allows design agents to find the correct Figma file for any project.
 */
export const figmaProjectLinks = pgTable('figma_project_links', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),

  // Foreign key to projects (nullable for shared design system files)
  projectId: uuid('project_id')
    .references(() => projects.id, { onDelete: 'cascade' }),

  // File classification
  fileType: text('file_type')
    .$type<'design-system' | 'feature' | 'marketing' | 'prototype' | 'wireframe'>()
    .notNull(),

  // Figma identifiers
  figmaUrl: text('figma_url').notNull(),
  figmaFileKey: text('figma_file_key'), // Extracted from URL for API calls

  // Metadata
  name: text('name'), // Human-readable name
  description: text('description'),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type FigmaProjectLink = typeof figmaProjectLinks.$inferSelect;
export type NewFigmaProjectLink = typeof figmaProjectLinks.$inferInsert;

/**
 * Design Generation Log
 *
 * Append-only log of all DALL-E generation attempts.
 * Used for cost tracking, debugging, and prompt optimization.
 */
export const designGenerationLog = pgTable('design_generation_log', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),

  // Link to resulting asset (null if generation failed)
  assetId: uuid('asset_id')
    .references(() => designAssets.id, { onDelete: 'set null' }),

  // Request details
  prompt: text('prompt').notNull(),
  negativePrompt: text('negative_prompt'),
  model: text('model').default('dall-e-3'),
  dimensions: text('dimensions'), // '1024x1024', '1792x1024', '1024x1792'
  quality: text('quality')
    .$type<'standard' | 'hd'>(),
  style: text('style')
    .$type<'natural' | 'vivid'>(),

  // Cost tracking
  cost: decimal('cost', { precision: 10, scale: 4 }),

  // Result
  success: boolean('success').notNull(),
  errorMessage: text('error_message'),
  errorCode: text('error_code'), // 'content_policy', 'rate_limit', etc.

  // Response metadata
  revisedPrompt: text('revised_prompt'),
  responseTimeMs: decimal('response_time_ms', { precision: 10, scale: 2 }),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type DesignGenerationLog = typeof designGenerationLog.$inferSelect;
export type NewDesignGenerationLog = typeof designGenerationLog.$inferInsert;
