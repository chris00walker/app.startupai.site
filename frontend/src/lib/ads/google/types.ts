/**
 * Google Ads API Types
 *
 * Type definitions for Google Ads API v17 (Responsive Display Ads).
 * Supports the same PAUSED → Preview → Approve → Activate workflow as Meta.
 *
 * @story US-AP07
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Campaign status for Google Ads
 */
export type GoogleCampaignStatus =
  | 'ENABLED'
  | 'PAUSED'
  | 'REMOVED';

/**
 * Ad Group status
 */
export type GoogleAdGroupStatus =
  | 'ENABLED'
  | 'PAUSED'
  | 'REMOVED';

/**
 * Ad status
 */
export type GoogleAdStatus =
  | 'ENABLED'
  | 'PAUSED'
  | 'REMOVED';

/**
 * Ad approval status from Google
 */
export type GoogleApprovalStatus =
  | 'APPROVED'
  | 'APPROVED_LIMITED'
  | 'DISAPPROVED'
  | 'UNDER_REVIEW'
  | 'UNKNOWN';

/**
 * Campaign advertising channel type
 */
export type AdvertisingChannelType =
  | 'DISPLAY'
  | 'SEARCH'
  | 'SHOPPING'
  | 'VIDEO'
  | 'PERFORMANCE_MAX';

/**
 * Bidding strategy types
 */
export type BiddingStrategyType =
  | 'TARGET_CPA'
  | 'TARGET_ROAS'
  | 'MAXIMIZE_CONVERSIONS'
  | 'MAXIMIZE_CONVERSION_VALUE'
  | 'TARGET_IMPRESSION_SHARE'
  | 'MANUAL_CPC'
  | 'MANUAL_CPM';

// ============================================================================
// CAMPAIGN TYPES
// ============================================================================

/**
 * Google Ads Campaign
 */
export interface GoogleCampaign {
  resourceName: string;
  id: string;
  name: string;
  status: GoogleCampaignStatus;
  advertisingChannelType: AdvertisingChannelType;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  campaignBudget?: string; // Resource name
  biddingStrategyType?: BiddingStrategyType;
  targetCpa?: {
    targetCpaMicros: string; // In micros (1,000,000 = $1)
  };
}

/**
 * Campaign budget
 */
export interface GoogleCampaignBudget {
  resourceName: string;
  id: string;
  name: string;
  amountMicros: string; // Daily budget in micros
  deliveryMethod: 'STANDARD' | 'ACCELERATED';
  explicitlyShared: boolean;
}

/**
 * Ad Group
 */
export interface GoogleAdGroup {
  resourceName: string;
  id: string;
  name: string;
  campaign: string; // Campaign resource name
  status: GoogleAdGroupStatus;
  type: 'DISPLAY_STANDARD' | 'SEARCH_STANDARD';
  cpcBidMicros?: string;
  cpmBidMicros?: string;
}

// ============================================================================
// ASSET TYPES
// ============================================================================

/**
 * Asset types for Responsive Display Ads
 */
export type AssetType =
  | 'IMAGE'
  | 'TEXT'
  | 'YOUTUBE_VIDEO'
  | 'MEDIA_BUNDLE'
  | 'LEAD_FORM';

/**
 * Text asset
 */
export interface TextAsset {
  resourceName: string;
  id: string;
  text: string;
  type: 'HEADLINE' | 'DESCRIPTION' | 'LONG_HEADLINE';
}

/**
 * Image asset
 */
export interface ImageAsset {
  resourceName: string;
  id: string;
  data: string; // Base64 encoded
  fileSize: string;
  mimeType: string;
  fullSize?: {
    heightPixels: string;
    widthPixels: string;
    url: string;
  };
}

/**
 * Asset link for responsive display ads
 */
export interface AssetLink {
  asset: string; // Asset resource name
  pinnedField?: 'HEADLINE_1' | 'DESCRIPTION_1' | 'NONE';
}

// ============================================================================
// RESPONSIVE DISPLAY AD TYPES
// ============================================================================

/**
 * Responsive Display Ad Info
 * Google auto-generates combinations from these assets
 */
export interface ResponsiveDisplayAdInfo {
  // Required: At least 1 marketing image
  marketingImages: AssetLink[]; // Max 15
  squareMarketingImages?: AssetLink[]; // Max 15, optional but recommended
  logoImages?: AssetLink[]; // Max 5
  squareLogoImages?: AssetLink[]; // Max 5

  // Required: Headlines and descriptions
  headlines: AssetLink[]; // Min 1, Max 5 (15 chars each recommended)
  longHeadline: AssetLink; // Required (90 chars)
  descriptions: AssetLink[]; // Min 1, Max 5 (90 chars each)

  // Optional
  youtubeVideos?: AssetLink[]; // Max 5
  businessName: string; // Required (25 chars)
  mainColor?: string; // Hex color
  accentColor?: string; // Hex color
  allowFlexibleColor?: boolean;
  callToActionText?: string;
  pricePrefix?: string;
  promoText?: string; // Max 15 chars
  formatSetting?: 'ALL_FORMATS' | 'NON_NATIVE' | 'NATIVE';
}

/**
 * Google Ad with Responsive Display info
 */
export interface GoogleAd {
  resourceName: string;
  id: string;
  name?: string;
  finalUrls: string[];
  responsiveDisplayAd?: ResponsiveDisplayAdInfo;
}

/**
 * Ad Group Ad (links ad to ad group)
 */
export interface GoogleAdGroupAd {
  resourceName: string;
  adGroup: string; // Ad group resource name
  status: GoogleAdStatus;
  ad: GoogleAd;
  policySummary?: {
    approvalStatus: GoogleApprovalStatus;
    reviewStatus: 'REVIEW_IN_PROGRESS' | 'REVIEWED' | 'UNDER_APPEAL' | 'ELIGIBLE_MAY_SERVE';
    policyTopicEntries?: Array<{
      type: 'PROHIBITED' | 'LIMITED' | 'FULLY_LIMITED' | 'DESCRIPTIVE' | 'BROADENING' | 'AREA_OF_INTEREST_ONLY';
      topic: string;
      evidences?: Array<{
        textList?: { texts: string[] };
      }>;
    }>;
  };
}

// ============================================================================
// TARGETING TYPES
// ============================================================================

/**
 * Audience targeting for Display campaigns
 */
export interface GoogleAudienceTargeting {
  // Affinity audiences (interests)
  affinityAudiences?: string[]; // Resource names

  // In-market audiences (purchase intent)
  inMarketAudiences?: string[]; // Resource names

  // Custom audiences
  customAudiences?: string[]; // Resource names

  // Demographics
  ageRanges?: Array<'AGE_RANGE_18_24' | 'AGE_RANGE_25_34' | 'AGE_RANGE_35_44' | 'AGE_RANGE_45_54' | 'AGE_RANGE_55_64' | 'AGE_RANGE_65_UP'>;
  genders?: Array<'MALE' | 'FEMALE' | 'UNDETERMINED'>;
  parentalStatus?: Array<'PARENT' | 'NOT_A_PARENT' | 'UNDETERMINED'>;
  householdIncome?: Array<'INCOME_RANGE_0_50' | 'INCOME_RANGE_50_60' | 'INCOME_RANGE_60_70' | 'INCOME_RANGE_70_80' | 'INCOME_RANGE_80_90' | 'INCOME_RANGE_90_100'>;

  // Placement targeting
  placements?: Array<{
    type: 'WEBSITE' | 'MOBILE_APP_CATEGORY' | 'MOBILE_APPLICATION' | 'YOUTUBE_CHANNEL' | 'YOUTUBE_VIDEO';
    url?: string;
  }>;

  // Geographic targeting
  locations?: Array<{
    geoTargetConstant: string; // Resource name (e.g., geoTargetConstants/2840 for US)
    negative?: boolean;
  }>;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Create campaign params
 */
export interface CreateGoogleCampaignParams {
  name: string;
  dailyBudgetMicros: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  biddingStrategy: BiddingStrategyType;
  targetCpaMicros?: string;
}

/**
 * Create ad group params
 */
export interface CreateGoogleAdGroupParams {
  campaignResourceName: string;
  name: string;
  cpcBidMicros?: string;
}

/**
 * Create responsive display ad params
 */
export interface CreateResponsiveDisplayAdParams {
  adGroupResourceName: string;
  finalUrl: string;
  businessName: string;
  headlines: string[]; // Max 5, 30 chars each
  longHeadline: string; // 90 chars
  descriptions: string[]; // Max 5, 90 chars each
  marketingImageUrls: string[]; // Will be uploaded as assets
  squareMarketingImageUrls?: string[];
  logoImageUrl?: string;
  callToActionText?: string;
}

/**
 * Google Ads API response wrapper
 */
export interface GoogleAdsResponse<T> {
  results?: T[];
  partialFailureError?: {
    code: number;
    message: string;
    details?: Array<{
      errors: Array<{
        errorCode: Record<string, string>;
        message: string;
        location?: {
          fieldPathElements: Array<{ fieldName: string; index?: number }>;
        };
      }>;
    }>;
  };
  requestId?: string;
}

/**
 * Mutate operation for batch requests
 */
export interface MutateOperation<T> {
  create?: T;
  update?: T;
  remove?: string; // Resource name to remove
}

// ============================================================================
// CAMPAIGN CREATION RESULT
// ============================================================================

/**
 * Full result from creating a Google Ads campaign
 */
export interface GoogleCampaignCreationResult {
  campaign: GoogleCampaign;
  budget: GoogleCampaignBudget;
  adGroup: GoogleAdGroup;
  adGroupAd: GoogleAdGroupAd;
  assetResourceNames: {
    headlines: string[];
    descriptions: string[];
    marketingImages: string[];
    longHeadline: string;
  };
}

// ============================================================================
// BUDGET LIMITS
// ============================================================================

export const GOOGLE_BUDGET_LIMITS = {
  MAX_DAILY_SPEND_MICROS: 50_000_000, // $50/day
  MAX_LIFETIME_SPEND_MICROS: 500_000_000, // $500 lifetime
  MIN_DAILY_BUDGET_MICROS: 1_000_000, // $1/day minimum for Display
  REQUIRE_HITL_ABOVE_MICROS: 100_000_000, // Require approval for >$100
} as const;

// ============================================================================
// CHARACTER LIMITS
// ============================================================================

export const GOOGLE_CHARACTER_LIMITS = {
  HEADLINE: 30,
  LONG_HEADLINE: 90,
  DESCRIPTION: 90,
  BUSINESS_NAME: 25,
  PROMO_TEXT: 15,
  CALL_TO_ACTION: 10,
} as const;
