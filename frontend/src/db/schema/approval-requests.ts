/**
 * Approval Requests Schema
 *
 * Stores approval requests for HITL checkpoints in CrewAI flows.
 * Includes approval_requests table and approval_history for audit trail.
 *
 * @story US-F08, US-F09
 */

import { pgTable, text, timestamp, uuid, integer, jsonb, boolean } from 'drizzle-orm/pg-core';
import { projects } from './projects';
import { userProfiles } from './users';

/**
 * Approval request status
 */
export type ApprovalRequestStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'auto_approved';

/**
 * Approval type categories
 */
export type ApprovalType =
  | 'brief_review'
  | 'pivot_decision'
  | 'budget_escalation'
  | 'experiment_launch'
  | 'ad_creative'
  | 'phase_gate';

/**
 * Owner role for approval routing
 */
export type ApprovalOwnerRole = 'founder' | 'consultant' | 'admin';

export const approvalRequests = pgTable('approval_requests', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),

  // Execution context
  executionId: text('execution_id').notNull(),
  taskId: text('task_id').notNull(),
  kickoffId: text('kickoff_id'),

  // Foreign keys
  userId: uuid('user_id')
    .notNull()
    .references(() => userProfiles.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id')
    .references(() => projects.id, { onDelete: 'set null' }),

  // Request classification
  approvalType: text('approval_type').$type<ApprovalType>().notNull(),
  ownerRole: text('owner_role').$type<ApprovalOwnerRole>().notNull(),

  // Request content
  title: text('title').notNull(),
  description: text('description').notNull(),
  taskOutput: jsonb('task_output').$type<Record<string, unknown>>().default({}).notNull(),
  evidenceSummary: jsonb('evidence_summary').$type<Record<string, unknown>>().default({}),
  options: jsonb('options').$type<Array<{ key: string; label: string; description?: string }>>().default([]),

  // Status and decision
  status: text('status').$type<ApprovalRequestStatus>().default('pending').notNull(),
  decision: text('decision'),
  humanFeedback: text('human_feedback'),
  decidedBy: uuid('decided_by')
    .references(() => userProfiles.id, { onDelete: 'set null' }),
  decidedAt: timestamp('decided_at', { withTimezone: true }),

  // Auto-approval configuration
  autoApprovable: boolean('auto_approvable').default(false),
  autoApproveReason: text('auto_approve_reason'),

  // Escalation tracking
  escalationLevel: integer('escalation_level').default(0),
  lastEscalatedAt: timestamp('last_escalated_at', { withTimezone: true }),

  // Expiration (default 48 hours from creation)
  expiresAt: timestamp('expires_at', { withTimezone: true }),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type ApprovalRequest = typeof approvalRequests.$inferSelect;
export type NewApprovalRequest = typeof approvalRequests.$inferInsert;
