/**
 * Approval History Schema
 *
 * Audit trail for approval request actions.
 * Tracks all state changes and actor interactions.
 *
 * @story US-F08, US-F09
 */

import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';
import { approvalRequests } from './approval-requests';
import { userProfiles } from './users';

/**
 * Approval action types
 */
export type ApprovalAction =
  | 'created'
  | 'approved'
  | 'rejected'
  | 'escalated'
  | 'auto_approved'
  | 'expired'
  | 'feedback_added'
  | 'reassigned';

/**
 * Actor type for audit trail
 */
export type ApprovalActorType = 'user' | 'system' | 'cron' | 'agent';

export const approvalHistory = pgTable('approval_history', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),

  // Foreign key to approval request
  approvalRequestId: uuid('approval_request_id')
    .notNull()
    .references(() => approvalRequests.id, { onDelete: 'cascade' }),

  // Action details
  approvalAction: text('approval_action').$type<ApprovalAction>().notNull(),
  actorId: uuid('actor_id')
    .references(() => userProfiles.id, { onDelete: 'set null' }),
  actorType: text('actor_type').$type<ApprovalActorType>(),

  // Additional context
  details: jsonb('details').$type<Record<string, unknown>>().default({}),

  // Timestamp
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type ApprovalHistoryEntry = typeof approvalHistory.$inferSelect;
export type NewApprovalHistoryEntry = typeof approvalHistory.$inferInsert;
