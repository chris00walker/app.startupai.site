/**
 * Server-Side Analytics
 *
 * Tracks events from API routes using PostHog's HTTP API.
 * This ensures analytics are captured even if client-side JS fails.
 *
 * @story US-FM01-11, US-PH01-07
 */

const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

interface EventProperties {
  [key: string]: string | number | boolean | undefined | null;
}

/**
 * Track an event server-side via PostHog HTTP API
 */
export async function trackServerEvent(
  eventName: string,
  userId: string,
  properties?: EventProperties
): Promise<void> {
  if (!POSTHOG_KEY) {
    console.warn('[analytics/server] POSTHOG_KEY not configured, skipping event:', eventName);
    return;
  }

  try {
    const response = await fetch(`${POSTHOG_HOST}/capture/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: POSTHOG_KEY,
        event: eventName,
        distinct_id: userId,
        properties: {
          ...properties,
          $lib: 'server',
          timestamp: new Date().toISOString(),
        },
      }),
    });

    if (!response.ok) {
      console.error('[analytics/server] Failed to track event:', eventName, response.status);
    }
  } catch (error) {
    // Don't let analytics failures break the request
    console.error('[analytics/server] Error tracking event:', eventName, error);
  }
}

/**
 * Marketplace server-side analytics
 * Event names follow marketplace-analytics.md spec
 */
export const trackMarketplaceServerEvent = {
  // Connection events
  connectionRequestedByFounder: (userId: string, consultantId: string, relationshipType: string, hasMessage: boolean) =>
    trackServerEvent('marketplace.connection.requested_by_founder', userId, {
      consultant_id: consultantId,
      relationship_type: relationshipType,
      has_message: hasMessage,
    }),

  connectionRequestedByConsultant: (userId: string, founderId: string, relationshipType: string, hasMessage: boolean) =>
    trackServerEvent('marketplace.connection.requested_by_consultant', userId, {
      founder_id: founderId,
      relationship_type: relationshipType,
      has_message: hasMessage,
    }),

  connectionAccepted: (
    userId: string,
    connectionId: string,
    relationshipType: string,
    initiatedBy: 'founder' | 'consultant',
    daysToAccept: number
  ) =>
    trackServerEvent('marketplace.connection.accepted', userId, {
      connection_id: connectionId,
      relationship_type: relationshipType,
      initiated_by: initiatedBy,
      days_to_accept: daysToAccept,
    }),

  connectionDeclined: (
    userId: string,
    connectionId: string,
    relationshipType: string,
    initiatedBy: 'founder' | 'consultant',
    declineReason?: string
  ) =>
    trackServerEvent('marketplace.connection.declined', userId, {
      connection_id: connectionId,
      relationship_type: relationshipType,
      initiated_by: initiatedBy,
      decline_reason: declineReason,
    }),

  // RFQ events
  rfqCreated: (
    userId: string,
    rfqId: string,
    relationshipType: string,
    industries?: string[],
    timeline?: string,
    budgetRange?: string
  ) =>
    trackServerEvent('marketplace.rfq.created', userId, {
      rfq_id: rfqId,
      relationship_type: relationshipType,
      industries: industries?.join(','),
      timeline,
      budget_range: budgetRange,
    }),

  rfqResponseSent: (userId: string, rfqId: string, messageLength: number) =>
    trackServerEvent('marketplace.rfq.response_sent', userId, {
      rfq_id: rfqId,
      message_length: messageLength,
    }),

  rfqResponseAccepted: (userId: string, rfqId: string, responseId: string, daysToAccept: number) =>
    trackServerEvent('marketplace.rfq.response_accepted', userId, {
      rfq_id: rfqId,
      response_id: responseId,
      days_to_accept: daysToAccept,
    }),

  rfqResponseDeclined: (userId: string, rfqId: string, responseId: string, declineReason?: string) =>
    trackServerEvent('marketplace.rfq.response_declined', userId, {
      rfq_id: rfqId,
      response_id: responseId,
      decline_reason: declineReason,
    }),

  // Opt-in events
  consultantOptInEnabled: (consultantId: string, defaultRelationshipType?: string | null) =>
    trackServerEvent('marketplace.opt_in.consultant_enabled', consultantId, {
      consultant_id: consultantId,
      default_relationship_type: defaultRelationshipType,
    }),

  consultantOptInDisabled: (consultantId: string, daysOptedIn?: number) =>
    trackServerEvent('marketplace.opt_in.consultant_disabled', consultantId, {
      consultant_id: consultantId,
      days_opted_in: daysOptedIn,
    }),

  founderOptInEnabled: (founderId: string, problemFit?: string) =>
    trackServerEvent('marketplace.opt_in.founder_enabled', founderId, {
      founder_id: founderId,
      problem_fit: problemFit,
    }),

  founderOptInDisabled: (founderId: string, daysOptedIn?: number) =>
    trackServerEvent('marketplace.opt_in.founder_disabled', founderId, {
      founder_id: founderId,
      days_opted_in: daysOptedIn,
    }),
};
