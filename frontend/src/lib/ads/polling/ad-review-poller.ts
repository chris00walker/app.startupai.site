/**
 * Ad Review Status Poller
 *
 * Polls Meta Marketing API for ad review status since Meta does not
 * support webhooks for ad review events. Uses progressive intervals
 * to balance freshness vs API rate limits.
 *
 * @story US-AP04
 */

import { MetaAdsClient, type EffectiveStatus } from '@/lib/ads/meta';

// ============================================================================
// TYPES
// ============================================================================

export enum AdReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ERROR = 'error',
}

export interface AdReviewResult {
  status: AdReviewStatus;
  effectiveStatus: EffectiveStatus;
  issues?: AdIssue[];
  pollTimestamp: string;
}

export interface AdIssue {
  level: 'ERROR' | 'WARNING';
  errorCode?: number;
  summary: string;
  details?: string;
  fixSuggestion?: string;
}

export interface PollInterval {
  minElapsed: number; // seconds
  maxElapsed: number; // seconds
  interval: number; // seconds
}

// ============================================================================
// POLLING INTERVALS
// ============================================================================

/**
 * Progressive polling intervals - more frequent initially, then spacing out
 */
export const POLL_INTERVALS: PollInterval[] = [
  { minElapsed: 0, maxElapsed: 3600, interval: 60 }, // First hour: every 1 minute
  { minElapsed: 3600, maxElapsed: 18000, interval: 300 }, // Hours 1-5: every 5 minutes
  { minElapsed: 18000, maxElapsed: 86400, interval: 900 }, // Hours 5-24: every 15 minutes
  { minElapsed: 86400, maxElapsed: Infinity, interval: 3600 }, // After 24h: every hour
];

/**
 * Maximum time to poll before escalating (48 hours)
 */
export const MAX_POLL_DURATION_SECONDS = 48 * 3600;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the appropriate polling interval based on elapsed time
 */
export function getPollInterval(elapsedSeconds: number): number {
  for (const interval of POLL_INTERVALS) {
    if (elapsedSeconds >= interval.minElapsed && elapsedSeconds < interval.maxElapsed) {
      return interval.interval;
    }
  }
  return POLL_INTERVALS[POLL_INTERVALS.length - 1].interval;
}

/**
 * Map Meta effective_status to our AdReviewStatus enum
 */
export function mapEffectiveStatus(effectiveStatus: EffectiveStatus): AdReviewStatus {
  switch (effectiveStatus) {
    case 'ACTIVE':
    case 'PAUSED':
    case 'CAMPAIGN_PAUSED':
    case 'ADSET_PAUSED':
    case 'PREAPPROVED':
      return AdReviewStatus.APPROVED;

    case 'PENDING_REVIEW':
    case 'IN_PROCESS':
    case 'PENDING_BILLING_INFO':
      return AdReviewStatus.PENDING;

    case 'DISAPPROVED':
      return AdReviewStatus.REJECTED;

    case 'WITH_ISSUES':
      return AdReviewStatus.ERROR;

    case 'DELETED':
    case 'ARCHIVED':
      return AdReviewStatus.ERROR;

    default:
      return AdReviewStatus.PENDING;
  }
}

/**
 * Check if a campaign should be polled based on its status and last poll time
 */
export function shouldPollCampaign(
  status: string,
  lastPollAt: Date | null,
  createdAt: Date
): boolean {
  // Only poll campaigns in pending_deployment status
  if (status !== 'pending_deployment') {
    return false;
  }

  const now = new Date();
  const elapsedSinceCreation = (now.getTime() - createdAt.getTime()) / 1000;

  // Don't poll if past max duration
  if (elapsedSinceCreation > MAX_POLL_DURATION_SECONDS) {
    return false;
  }

  // If never polled, poll now
  if (!lastPollAt) {
    return true;
  }

  // Check if enough time has passed based on interval
  const elapsedSinceLastPoll = (now.getTime() - lastPollAt.getTime()) / 1000;
  const requiredInterval = getPollInterval(elapsedSinceCreation);

  return elapsedSinceLastPoll >= requiredInterval;
}

// ============================================================================
// MAIN POLLER CLASS
// ============================================================================

export class AdReviewPoller {
  private metaClient: MetaAdsClient;

  constructor(metaClient: MetaAdsClient) {
    this.metaClient = metaClient;
  }

  /**
   * Poll a single ad for its review status
   */
  async pollAdStatus(adId: string): Promise<AdReviewResult> {
    const ad = await this.metaClient.getAd(adId);

    const status = mapEffectiveStatus(ad.effective_status);

    const result: AdReviewResult = {
      status,
      effectiveStatus: ad.effective_status,
      pollTimestamp: new Date().toISOString(),
    };

    // If there are issues, extract them
    if (ad.issues_info && ad.issues_info.length > 0) {
      result.issues = ad.issues_info.map((issue) => ({
        level: issue.level === 'ERROR' ? 'ERROR' : 'WARNING',
        errorCode: issue.error_code,
        summary: issue.error_summary || issue.error_message,
        details: issue.error_message,
      }));
    }

    return result;
  }

  /**
   * Get detailed rejection reasons for a disapproved ad
   */
  async getRejectionReasons(adId: string): Promise<AdIssue[]> {
    const ad = await this.metaClient.getAd(adId);

    if (!ad.issues_info || ad.issues_info.length === 0) {
      return [
        {
          level: 'ERROR',
          summary: 'Ad was disapproved',
          details: 'No specific reason provided by Meta',
        },
      ];
    }

    return ad.issues_info.map((issue) => ({
      level: issue.level === 'ERROR' ? 'ERROR' : 'WARNING',
      errorCode: issue.error_code,
      summary: issue.error_summary || 'Policy violation',
      details: issue.error_message,
    }));
  }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createAdReviewPoller(metaClient: MetaAdsClient): AdReviewPoller {
  return new AdReviewPoller(metaClient);
}
