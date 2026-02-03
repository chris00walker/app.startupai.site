/**
 * Consultant Requests Schema (RFQ - Request for Quote)
 *
 * Founders post requests seeking capital, advice, or services.
 * Verified consultants can browse and respond to these requests.
 *
 * @story US-FM07, US-FM08, US-FM09, US-FM11
 */

import { pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';
import { userProfiles } from './users';

/**
 * RFQ status
 * - open: Accepting responses
 * - filled: Founder accepted a response
 * - cancelled: Founder cancelled the RFQ
 */
export const rfqStatusEnum = ['open', 'filled', 'cancelled'] as const;
export type RfqStatus = (typeof rfqStatusEnum)[number];

/**
 * Timeline options for RFQ
 */
export const timelineEnum = ['1_month', '3_months', '6_months', 'flexible'] as const;
export type Timeline = (typeof timelineEnum)[number];

/**
 * Budget range options for RFQ
 */
export const budgetRangeEnum = ['equity_only', 'under_5k', '5k_25k', '25k_100k', 'over_100k'] as const;
export type BudgetRange = (typeof budgetRangeEnum)[number];

export const consultantRequests = pgTable(
  'consultant_requests',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),

    // Who created the RFQ
    founderId: uuid('founder_id')
      .references(() => userProfiles.id, { onDelete: 'cascade' })
      .notNull(),

    // RFQ content
    title: text('title').notNull(),
    description: text('description').notNull(),

    // What type of help they're seeking
    relationshipType: text('relationship_type').notNull(), // advisory, capital, program, service, ecosystem

    // Filtering/matching criteria
    industries: text('industries').array(), // Array of industry strings
    stagePreference: text('stage_preference'), // seed, series_a, etc.
    timeline: text('timeline'), // 1_month, 3_months, 6_months, flexible
    budgetRange: text('budget_range'), // equity_only, under_5k, 5k_25k, 25k_100k, over_100k

    // Status tracking
    status: text('status').default('open').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }), // Default 30 days from creation

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // Index for RFQ Board browsing (open requests by type)
    index('idx_consultant_requests_status_type').on(table.status, table.relationshipType),
    // Index for founder's own RFQs
    index('idx_consultant_requests_founder').on(table.founderId),
    // Index for expiring RFQs
    index('idx_consultant_requests_expires').on(table.expiresAt),
  ]
);

export type ConsultantRequest = typeof consultantRequests.$inferSelect;
export type NewConsultantRequest = typeof consultantRequests.$inferInsert;

/**
 * Type for RFQ list item (what the API returns for browsing)
 * @story US-PH05
 */
export interface RfqListItem {
  id: string;
  title: string;
  descriptionPreview: string; // Truncated to ~200 chars
  relationshipType: string;
  industries: string[] | null;
  stagePreference: string | null;
  timeline: string | null;
  budgetRange: string | null;
  status: RfqStatus;
  responseCount: number; // Derived from consultant_request_responses
  createdAt: Date;
  expiresAt: Date | null;
}

/**
 * Type for full RFQ details (when viewing a specific RFQ)
 * @story US-PH06, US-FM08
 */
export interface RfqDetails extends RfqListItem {
  description: string; // Full description
  founderCompany: string | null; // From user_profiles (only visible to verified consultants)
  founderIndustry: string | null; // From projects
  founderStage: string | null; // From projects
  responses: RfqResponse[]; // Only for founder viewing their own RFQ
}

/**
 * Type for RFQ response (for founder reviewing responses)
 */
export interface RfqResponse {
  id: string;
  consultantId: string;
  consultantName: string;
  consultantOrganization: string | null;
  verificationBadge: 'verified' | 'grace';
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  respondedAt: Date;
}
