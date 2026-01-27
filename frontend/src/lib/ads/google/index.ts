/**
 * Google Ads API Module
 *
 * @story US-AP07
 */

export { GoogleAdsClient, GoogleAdsApiError, createGoogleAdsClient } from './client';
export {
  GoogleInsightsClient,
  GoogleInsightsError,
  createGoogleInsightsClient,
} from './insights';
export type {
  GoogleCampaign,
  GoogleCampaignBudget,
  GoogleAdGroup,
  GoogleAdGroupAd,
  GoogleAd,
  ResponsiveDisplayAdInfo,
  GoogleAudienceTargeting,
  GoogleCampaignCreationResult,
  CreateGoogleCampaignParams,
  CreateGoogleAdGroupParams,
  CreateResponsiveDisplayAdParams,
  GoogleCampaignStatus,
  GoogleAdGroupStatus,
  GoogleAdStatus,
  GoogleApprovalStatus,
  BiddingStrategyType,
  GOOGLE_BUDGET_LIMITS,
  GOOGLE_CHARACTER_LIMITS,
} from './types';
export type {
  GoogleParsedInsight,
  GoogleInsightsQueryParams,
  GoogleDateRange,
  GoogleMetricsRow,
} from './insights';
