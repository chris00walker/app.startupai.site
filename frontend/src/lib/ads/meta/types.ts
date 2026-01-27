/**
 * Meta Marketing API Types
 *
 * Type definitions for Meta (Facebook) Marketing API integration.
 *
 * @story US-AP03
 */

// ============================================================================
// CAMPAIGN TYPES
// ============================================================================

export type CampaignObjective =
  | 'OUTCOME_AWARENESS'
  | 'OUTCOME_ENGAGEMENT'
  | 'OUTCOME_LEADS'
  | 'OUTCOME_SALES'
  | 'OUTCOME_TRAFFIC'
  | 'OUTCOME_APP_PROMOTION';

export type CampaignStatus = 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';

export interface MetaCampaign {
  id: string;
  name: string;
  objective: CampaignObjective;
  status: CampaignStatus;
  account_id: string;
  created_time: string;
  updated_time: string;
}

export interface CreateCampaignParams {
  name: string;
  objective: CampaignObjective;
  status?: CampaignStatus;
  special_ad_categories?: string[];
}

// ============================================================================
// AD SET TYPES
// ============================================================================

export type AdSetStatus = 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';

export type BillingEvent = 'IMPRESSIONS' | 'LINK_CLICKS' | 'APP_INSTALLS';

export type OptimizationGoal =
  | 'LINK_CLICKS'
  | 'IMPRESSIONS'
  | 'REACH'
  | 'LANDING_PAGE_VIEWS'
  | 'LEAD_GENERATION'
  | 'CONVERSIONS';

export interface MetaTargeting {
  age_min?: number;
  age_max?: number;
  genders?: number[]; // 1 = male, 2 = female
  geo_locations?: {
    countries?: string[];
    regions?: Array<{ key: string }>;
    cities?: Array<{ key: string; radius?: number; distance_unit?: string }>;
  };
  interests?: Array<{ id: string; name?: string }>;
  behaviors?: Array<{ id: string; name?: string }>;
  custom_audiences?: Array<{ id: string }>;
  excluded_custom_audiences?: Array<{ id: string }>;
  locales?: number[];
}

export interface MetaAdSet {
  id: string;
  name: string;
  campaign_id: string;
  status: AdSetStatus;
  billing_event: BillingEvent;
  optimization_goal: OptimizationGoal;
  daily_budget?: string; // In cents
  lifetime_budget?: string; // In cents
  targeting: MetaTargeting;
  start_time?: string;
  end_time?: string;
}

export interface CreateAdSetParams {
  name: string;
  campaign_id: string;
  billing_event: BillingEvent;
  optimization_goal: OptimizationGoal;
  daily_budget?: number; // In cents
  lifetime_budget?: number; // In cents
  targeting: MetaTargeting;
  status?: AdSetStatus;
  start_time?: string;
  end_time?: string;
}

// ============================================================================
// AD CREATIVE TYPES
// ============================================================================

export interface AssetFeedSpec {
  images?: Array<{ hash: string }>;
  videos?: Array<{ video_id: string }>;
  bodies?: Array<{ text: string }>;
  titles?: Array<{ text: string }>;
  descriptions?: Array<{ text: string }>;
  link_urls?: Array<{ website_url: string }>;
  call_to_action_types?: string[];
}

export interface DegreesOfFreedomSpec {
  creative_features_spec?: {
    standard_enhancements?: {
      enroll_status: 'OPT_IN' | 'OPT_OUT';
    };
  };
}

export interface MetaAdCreative {
  id: string;
  name: string;
  account_id: string;
  asset_feed_spec?: AssetFeedSpec;
  degrees_of_freedom_spec?: DegreesOfFreedomSpec;
  object_story_spec?: {
    page_id: string;
    link_data?: {
      link: string;
      message?: string;
      name?: string;
      description?: string;
      image_hash?: string;
      call_to_action?: {
        type: string;
        value?: { link?: string };
      };
    };
  };
}

export interface CreateFlexibleCreativeParams {
  name: string;
  page_id: string;
  asset_feed_spec: AssetFeedSpec;
  degrees_of_freedom_spec?: DegreesOfFreedomSpec;
}

// ============================================================================
// AD TYPES
// ============================================================================

export type AdStatus = 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED' | 'PENDING_REVIEW' | 'DISAPPROVED';

export type EffectiveStatus =
  | 'ACTIVE'
  | 'PAUSED'
  | 'DELETED'
  | 'PENDING_REVIEW'
  | 'DISAPPROVED'
  | 'PREAPPROVED'
  | 'PENDING_BILLING_INFO'
  | 'CAMPAIGN_PAUSED'
  | 'ARCHIVED'
  | 'ADSET_PAUSED'
  | 'IN_PROCESS'
  | 'WITH_ISSUES';

export interface MetaAd {
  id: string;
  name: string;
  adset_id: string;
  creative: { id: string };
  status: AdStatus;
  effective_status: EffectiveStatus;
  issues_info?: Array<{
    error_code: number;
    error_message: string;
    error_summary: string;
    level: string;
  }>;
}

export interface CreateAdParams {
  name: string;
  adset_id: string;
  creative_id: string;
  status?: AdStatus;
}

// ============================================================================
// PREVIEW TYPES
// ============================================================================

export type AdFormat =
  | 'DESKTOP_FEED_STANDARD'
  | 'MOBILE_FEED_STANDARD'
  | 'INSTAGRAM_STANDARD'
  | 'INSTAGRAM_STORY'
  | 'INSTAGRAM_REELS'
  | 'RIGHT_COLUMN_STANDARD'
  | 'AUDIENCE_NETWORK_OUTSTREAM_VIDEO';

export interface AdPreview {
  body: string; // HTML iframe content
}

export interface MetaAdPreview {
  format: AdFormat;
  html: string;
}

// ============================================================================
// IMAGE UPLOAD TYPES
// ============================================================================

export interface UploadedImage {
  hash: string;
  url?: string;
  width?: number;
  height?: number;
}

// ============================================================================
// BUDGET LIMITS
// ============================================================================

export const BUDGET_LIMITS = {
  MAX_DAILY_SPEND_CENTS: 5000, // $50/day
  MAX_LIFETIME_SPEND_CENTS: 50000, // $500 lifetime
  REQUIRE_HITL_ABOVE_CENTS: 10000, // Require approval for >$100
  AUTO_PAUSE_CPA_MULTIPLIER: 2, // Pause if CPA > 2× target
} as const;

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface MetaApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
  paging?: {
    cursors?: { before?: string; after?: string };
    next?: string;
    previous?: string;
  };
}

// ============================================================================
// FULL CAMPAIGN CREATION RESULT
// ============================================================================

export interface CampaignCreationResult {
  campaign: MetaCampaign;
  adSet: MetaAdSet;
  creative: MetaAdCreative;
  ad: MetaAd;
  previews: MetaAdPreview[];
  imageHashes: string[];
}
