/**
 * Reports Schema
 * 
 * Stores AI-generated reports and insights for projects.
 * Content is stored as JSONB for flexible report structures.
 */

import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';
import { projects } from './projects';

export const reports = pgTable('reports', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  
  // Foreign key to projects
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  
  // Report metadata
  reportType: text('report_type').notNull(), // 'strategy', 'validation', 'market_analysis', 'competitor', etc.
  title: text('title').notNull(),
  
  // Report content as JSONB for flexible structure
  content: jsonb('content').notNull(),
  
  // Generation metadata
  model: text('model'), // 'gpt-4', 'claude-3', 'gemini-pro'
  tokensUsed: text('tokens_used'),
  
  // Timestamps
  generatedAt: timestamp('generated_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
