/**
 * LinkedIn Marketing API Module
 *
 * @story US-AP08
 */

export { LinkedInAdsClient, LinkedInApiError, createLinkedInAdsClient } from './client';
export {
  LinkedInAnalyticsClient,
  LinkedInAnalyticsError,
  createLinkedInAnalyticsClient,
  LINKEDIN_ANALYTICS_FIELDS,
} from './analytics';
export type {
  LinkedInCampaignGroup,
  LinkedInCampaign,
  LinkedInCreative,
  LinkedInAdPreview,
  LinkedInUrn,
  LinkedInB2BTargeting,
  LinkedInTargetingCriteria,
  LinkedInCampaignCreationResult,
  CreateCampaignGroupParams,
  CreateCampaignParams,
  CreateSingleImageAdParams,
  LinkedInCampaignStatus,
  LinkedInCampaignType,
  LinkedInAdFormat,
  LinkedInCreativeStatus,
  LinkedInObjective,
  LinkedInBidType,
  LinkedInCostType,
  LINKEDIN_BUDGET_LIMITS,
  LINKEDIN_CHARACTER_LIMITS,
} from './types';
export type {
  LinkedInParsedInsight,
  LinkedInB2BBreakdown,
  LinkedInAnalyticsQueryParams,
  LinkedInAnalyticsPivot,
  LinkedInTimeGranularity,
} from './analytics';
