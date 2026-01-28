/**
 * Approval Preferences Schema
 *
 * User preferences for auto-approval behavior in HITL checkpoints.
 * Controls which approval types can be auto-approved and notification settings.
 *
 * @story US-F01, US-F02
 */

import { pgTable, uuid, text, numeric, boolean, timestamp } from 'drizzle-orm/pg-core';
import { userProfiles } from './users';

export const approvalPreferences = pgTable('approval_preferences', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  userId: uuid('user_id')
    .notNull()
    .references(() => userProfiles.id, { onDelete: 'cascade' }),

  // Auto-approve settings
  autoApproveTypes: text('auto_approve_types').array().default([]),
  maxAutoApproveSpend: numeric('max_auto_approve_spend', { precision: 10, scale: 2 }).default('0'),
  autoApproveLowRisk: boolean('auto_approve_low_risk').default(false),

  // Notification settings
  notifyEmail: boolean('notify_email').default(true),
  notifySms: boolean('notify_sms').default(false),
  escalationEmail: text('escalation_email'),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export type ApprovalPreference = typeof approvalPreferences.$inferSelect;
export type NewApprovalPreference = typeof approvalPreferences.$inferInsert;
