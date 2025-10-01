/**
 * Projects Schema
 * 
 * Stores user projects for evidence-led strategy development.
 * Each project contains evidence, reports, and AI-generated insights.
 */

import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { userProfiles } from './users';

export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  
  // Foreign key to user_profiles
  userId: uuid('user_id')
    .notNull()
    .references(() => userProfiles.id, { onDelete: 'cascade' }),
  
  name: text('name').notNull(),
  description: text('description'),
  
  // Project status and metadata
  status: text('status').default('active').notNull(), // active, archived, completed
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
