/**
 * Assistant Conversations Schema
 *
 * Stores chat history for the dashboard AI assistant.
 */

import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';
import { userProfiles, userRoleEnum } from './users';
import { projects } from './projects';

export const assistantConversations = pgTable('assistant_conversations', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),

  userId: uuid('user_id')
    .notNull()
    .references(() => userProfiles.id, { onDelete: 'cascade' }),

  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
  clientId: uuid('client_id').references(() => userProfiles.id, { onDelete: 'set null' }),

  userRole: userRoleEnum('user_role').notNull(),

  userMessage: text('user_message'),
  assistantMessage: text('assistant_message'),
  toolCalls: jsonb('tool_calls').$type<unknown[]>().default([]),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type AssistantConversation = typeof assistantConversations.$inferSelect;
export type NewAssistantConversation = typeof assistantConversations.$inferInsert;
