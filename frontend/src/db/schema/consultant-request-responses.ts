/**
 * Consultant Request Responses Schema
 *
 * Tracks responses from verified consultants to founder RFQs.
 * One response per consultant per RFQ (enforced by unique constraint).
 *
 * @story US-PH06, US-FM08, US-FM09, US-FM11
 */

import { pgTable, text, timestamp, uuid, index, unique } from 'drizzle-orm/pg-core';
import { consultantRequests } from './consultant-requests';
import { userProfiles } from './users';

/**
 * Response status
 * - pending: Awaiting founder review
 * - accepted: Founder accepted, connection created
 * - declined: Founder declined
 */
export const responseStatusEnum = ['pending', 'accepted', 'declined'] as const;
export type ResponseStatus = (typeof responseStatusEnum)[number];

export const consultantRequestResponses = pgTable(
  'consultant_request_responses',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),

    // Which RFQ this responds to
    requestId: uuid('request_id')
      .references(() => consultantRequests.id, { onDelete: 'cascade' })
      .notNull(),

    // Who responded
    consultantId: uuid('consultant_id')
      .references(() => userProfiles.id, { onDelete: 'cascade' })
      .notNull(),

    // Response content
    message: text('message').notNull(),

    // Status tracking
    status: text('status').default('pending').notNull(),

    // Timestamps
    respondedAt: timestamp('responded_at', { withTimezone: true }).defaultNow().notNull(),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }), // When founder accepted/declined
  },
  (table) => [
    // One response per consultant per request
    unique('unique_consultant_request').on(table.requestId, table.consultantId),
    // Index for finding responses to a specific RFQ
    index('idx_request_responses_request').on(table.requestId),
    // Index for finding a consultant's responses
    index('idx_request_responses_consultant').on(table.consultantId),
    // Index for pending responses (for founder review)
    index('idx_request_responses_pending').on(table.requestId, table.status),
  ]
);

export type ConsultantRequestResponse = typeof consultantRequestResponses.$inferSelect;
export type NewConsultantRequestResponse = typeof consultantRequestResponses.$inferInsert;

/**
 * Type for response with consultant details (for founder viewing)
 * @story US-FM08
 */
export interface ResponseWithConsultant {
  id: string;
  requestId: string;
  consultantId: string;
  message: string;
  status: ResponseStatus;
  respondedAt: Date;
  reviewedAt: Date | null;
  // Joined from consultant_profiles + user_profiles
  consultant: {
    name: string;
    organization: string | null;
    verificationBadge: 'verified' | 'grace';
    expertiseAreas: string[];
  };
}
