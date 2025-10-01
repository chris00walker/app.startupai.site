/**
 * Evidence Schema
 * 
 * Stores evidence collected for projects with vector embeddings for semantic search.
 * Supports pgvector for similarity search using OpenAI embeddings (1536 dimensions).
 */

import { pgTable, text, timestamp, uuid, vector } from 'drizzle-orm/pg-core';
import { projects } from './projects';

export const evidence = pgTable('evidence', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  
  // Foreign key to projects
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  
  content: text('content').notNull(),
  
  // Vector embedding for semantic search (OpenAI ada-002: 1536 dimensions)
  embedding: vector('embedding', { dimensions: 1536 }),
  
  // Source information
  sourceType: text('source_type'), // 'user_input', 'web_scrape', 'document', 'api'
  sourceUrl: text('source_url'),
  
  // Metadata
  tags: text('tags').array(),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Evidence = typeof evidence.$inferSelect;
export type NewEvidence = typeof evidence.$inferInsert;
