/**
 * Evidence Schema
 * 
 * Stores evidence collected for projects with vector embeddings for semantic search.
 * Supports pgvector for similarity search using OpenAI embeddings (1536 dimensions).
 */

import { pgTable, text, timestamp, uuid, vector, boolean, date } from 'drizzle-orm/pg-core';
import { projects } from './projects';

export const evidence = pgTable('evidence', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  
  // Foreign key to projects
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  
  title: text('title'),
  evidenceCategory: text('evidence_category')
    .$type<'Survey' | 'Interview' | 'Experiment' | 'Analytics' | 'Research'>(),
  summary: text('summary'),
  fullText: text('full_text'),

  content: text('content').notNull(),
  
  // Vector embedding for semantic search (OpenAI ada-002: 1536 dimensions)
  embedding: vector('embedding', { dimensions: 1536 }),
  
  strength: text('strength')
    .$type<'weak' | 'medium' | 'strong'>(),
  isContradiction: boolean('is_contradiction').default(false),
  fitType: text('fit_type')
    .$type<'Desirability' | 'Feasibility' | 'Viability'>(),

  // Source information
  sourceType: text('source_type'), // 'user_input', 'web_scrape', 'document', 'api'
  sourceUrl: text('source_url'),
  author: text('author'),
  evidenceSource: text('evidence_source'),
  occurredOn: date('occurred_on'),
  linkedAssumptions: text('linked_assumptions').array(),
  
  // Metadata
  tags: text('tags').array(),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Evidence = typeof evidence.$inferSelect;
export type NewEvidence = typeof evidence.$inferInsert;
