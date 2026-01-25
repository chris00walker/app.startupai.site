/**
 * MFA Recovery Codes Schema
 *
 * Stores hashed recovery codes for 2FA backup access.
 * Users receive plain codes once during enrollment to save securely.
 *
 * @story US-AS03
 */

import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const mfaRecoveryCodes = pgTable('mfa_recovery_codes', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  userId: uuid('user_id').notNull(),

  // Hashed recovery code (bcrypt or similar)
  codeHash: text('code_hash').notNull(),

  // Track usage
  usedAt: timestamp('used_at', { withTimezone: true }),
  isUsed: boolean('is_used').default(false).notNull(),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type MfaRecoveryCode = typeof mfaRecoveryCodes.$inferSelect;
export type NewMfaRecoveryCode = typeof mfaRecoveryCodes.$inferInsert;
