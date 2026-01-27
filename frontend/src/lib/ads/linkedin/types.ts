/**
 * LinkedIn Marketing API Types
 *
 * Type definitions for LinkedIn Marketing API v2.
 * Supports Sponsored Content ads for B2B audience validation.
 *
 * @story US-AP08
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Campaign status
 */
export type LinkedInCampaignStatus =
  | 'ACTIVE'
  | 'PAUSED'
  | 'ARCHIVED'
  | 'COMPLETED'
  | 'CANCELED'
  | 'DRAFT'
  | 'PENDING_DELETION';

/**
 * Campaign type
 */
export type LinkedInCampaignType =
  | 'SPONSORED_UPDATES'     // Sponsored Content (Single Image, Video, Carousel)
  | 'SPONSORED_INMAILS'     // Message Ads
  | 'TEXT_ADS'              // Text Ads
  | 'DYNAMIC_ADS';          // Dynamic Ads

/**
 * Ad format for Sponsored Content
 */
export type LinkedInAdFormat =
  | 'SINGLE_IMAGE'
  | 'CAROUSEL'
  | 'VIDEO'
  | 'DOCUMENT'
  | 'EVENT';

/**
 * Creative status
 */
export type LinkedInCreativeStatus =
  | 'ACTIVE'
  | 'PAUSED'
  | 'DRAFT'
  | 'ARCHIVED'
  | 'PENDING_REVIEW'
  | 'REJECTED';

/**
 * Objective type
 */
export type LinkedInObjective =
  | 'BRAND_AWARENESS'
  | 'WEBSITE_VISITS'
  | 'ENGAGEMENT'
  | 'VIDEO_VIEWS'
  | 'LEAD_GENERATION'
  | 'WEBSITE_CONVERSIONS'
  | 'JOB_APPLICANTS';

/**
 * Bid type
 */
export type LinkedInBidType =
  | 'CPM'       // Cost per mille (1000 impressions)
  | 'CPC'       // Cost per click
  | 'CPV';      // Cost per view (video)

/**
 * Cost type
 */
export type LinkedInCostType =
  | 'CPM'
  | 'CPC'
  | 'CPV'
  | 'NONE';

// ============================================================================
// URN TYPES
// ============================================================================

/**
 * LinkedIn URN format: urn:li:{type}:{id}
 */
export type LinkedInUrn = string;

// ============================================================================
// CAMPAIGN GROUP (Account level container)
// ============================================================================

export interface LinkedInCampaignGroup {
  id: string;
  account: LinkedInUrn; // urn:li:sponsoredAccount:{id}
  name: string;
  status: LinkedInCampaignStatus;
  totalBudget?: {
    amount: string;
    currencyCode: string;
  };
  runSchedule?: {
    start: number; // Unix timestamp ms
    end?: number;
  };
  test?: boolean;
}

// ============================================================================
// CAMPAIGN
// ============================================================================

export interface LinkedInCampaign {
  id: string;
  account: LinkedInUrn;
  campaignGroup: LinkedInUrn;
  name: string;
  status: LinkedInCampaignStatus;
  type: LinkedInCampaignType;
  objectiveType: LinkedInObjective;
  costType: LinkedInCostType;
  dailyBudget?: {
    amount: string;
    currencyCode: string;
  };
  totalBudget?: {
    amount: string;
    currencyCode: string;
  };
  unitCost?: {
    amount: string;
    currencyCode: string;
  };
  bidType?: LinkedInBidType;
  runSchedule?: {
    start: number;
    end?: number;
  };
  targeting?: LinkedInTargetingCriteria;
  creativeSelection?: 'ROUND_ROBIN' | 'OPTIMIZED';
  offsiteDeliveryEnabled?: boolean;
  audienceExpansionEnabled?: boolean;
}

// ============================================================================
// TARGETING (B2B focused)
// ============================================================================

export interface LinkedInTargetingCriteria {
  include: {
    and: LinkedInTargetingFacet[];
  };
  exclude?: {
    or: LinkedInTargetingFacet[];
  };
}

export interface LinkedInTargetingFacet {
  or: Record<string, LinkedInUrn[]>;
}

/**
 * B2B targeting options unique to LinkedIn
 */
export interface LinkedInB2BTargeting {
  // Professional targeting
  jobTitles?: string[];           // urn:li:title:{id}
  jobFunctions?: string[];        // urn:li:function:{id}
  seniorityLevels?: string[];     // urn:li:seniority:{id} (CXO, VP, Director, Manager, etc.)
  industries?: string[];          // urn:li:industry:{id}
  skills?: string[];              // urn:li:skill:{id}

  // Company targeting
  companySizes?: string[];        // urn:li:companySize:{id} (1-10, 11-50, 51-200, etc.)
  companyNames?: string[];        // urn:li:organization:{id}
  companyCategories?: string[];   // urn:li:companyCategory:{id}
  companyGrowthRate?: string[];   // urn:li:companyGrowthRate:{id}

  // Education targeting
  schools?: string[];             // urn:li:school:{id}
  degrees?: string[];             // urn:li:degree:{id}
  fieldsOfStudy?: string[];       // urn:li:fieldOfStudy:{id}

  // Interest targeting
  memberInterests?: string[];     // urn:li:interest:{id}
  memberTraits?: string[];        // urn:li:memberTrait:{id}
  memberGroups?: string[];        // urn:li:group:{id}

  // Geographic targeting
  locations?: string[];           // urn:li:geo:{id} or urn:li:region:{id}
  localeCountry?: string;
  localeLanguage?: string;

  // Demographic
  ageRanges?: Array<'18-24' | '25-34' | '35-54' | '55+'>;
  genders?: Array<'MALE' | 'FEMALE'>;
}

// ============================================================================
// CREATIVE
// ============================================================================

export interface LinkedInCreative {
  id: string;
  campaign: LinkedInUrn;
  status: LinkedInCreativeStatus;
  type: LinkedInAdFormat;
  intendedStatus?: LinkedInCreativeStatus;
  review?: {
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    rejectionReasons?: string[];
  };
}

/**
 * Single Image Ad content
 */
export interface LinkedInSingleImageContent {
  title: string;           // 200 chars max
  description?: string;    // 300 chars max (optional)
  media: LinkedInUrn;      // urn:li:digitalmediaAsset:{id}
}

/**
 * Carousel Ad content
 */
export interface LinkedInCarouselContent {
  cards: Array<{
    title: string;         // 45 chars max
    description?: string;  // 70 chars max
    media: LinkedInUrn;
    landingPageUrl: string;
  }>;
}

/**
 * Sponsored Content Ad (share)
 */
export interface LinkedInAdShare {
  owner: LinkedInUrn;      // urn:li:organization:{id}
  subject?: string;
  text: {
    text: string;          // 700 chars max for Sponsored Content
  };
  content?: {
    contentEntities: Array<{
      entityLocation: string;  // Landing page URL
      thumbnails?: Array<{ resolvedUrl: string }>;
    }>;
    title?: string;
    description?: string;
  };
  distribution: {
    linkedInDistributionTarget: Record<string, never>;
  };
}

// ============================================================================
// AD PREVIEW
// ============================================================================

/**
 * Ad preview (iFrame URL, valid for 3 hours)
 */
export interface LinkedInAdPreview {
  creative: LinkedInUrn;
  previewUrl: string;      // iFrame URL
  expiresAt: number;       // Unix timestamp when preview expires
  format: LinkedInAdFormat;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateCampaignGroupParams {
  accountId: string;
  name: string;
  totalBudgetCents?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface CreateCampaignParams {
  accountId: string;
  campaignGroupUrn: string;
  name: string;
  objective: LinkedInObjective;
  dailyBudgetCents: number;
  totalBudgetCents?: number;
  bidAmountCents?: number;
  costType: LinkedInCostType;
  targeting: LinkedInB2BTargeting;
  startDate?: Date;
  endDate?: Date;
}

export interface CreateSingleImageAdParams {
  campaignUrn: string;
  organizationUrn: string;
  title: string;
  description?: string;
  text: string;           // Introductory text (700 chars)
  landingPageUrl: string;
  imageUrn: string;       // Already uploaded image
  callToAction?: string;
}

export interface LinkedInApiResponse<T> {
  elements?: T[];
  paging?: {
    count: number;
    start: number;
    total?: number;
    links?: Array<{ rel: string; href: string }>;
  };
}

// ============================================================================
// CAMPAIGN CREATION RESULT
// ============================================================================

export interface LinkedInCampaignCreationResult {
  campaignGroup: LinkedInCampaignGroup;
  campaign: LinkedInCampaign;
  creative: LinkedInCreative;
  shareUrn: LinkedInUrn;
  preview?: LinkedInAdPreview;
}

// ============================================================================
// BUDGET LIMITS
// ============================================================================

export const LINKEDIN_BUDGET_LIMITS = {
  MIN_DAILY_SPEND_CENTS: 1000,    // $10/day minimum for LinkedIn
  MAX_DAILY_SPEND_CENTS: 50000,   // $500/day
  MAX_LIFETIME_SPEND_CENTS: 500000, // $5000 lifetime
  REQUIRE_HITL_ABOVE_CENTS: 10000,  // Require approval for >$100
  MIN_BID_CPC_CENTS: 200,         // $2 minimum CPC
  MIN_BID_CPM_CENTS: 200,         // $2 minimum CPM
} as const;

// ============================================================================
// CHARACTER LIMITS
// ============================================================================

export const LINKEDIN_CHARACTER_LIMITS = {
  INTRODUCTORY_TEXT: 700,         // Main post text
  HEADLINE: 200,                   // Ad headline
  DESCRIPTION: 300,                // Optional description
  CAROUSEL_TITLE: 45,              // Carousel card title
  CAROUSEL_DESCRIPTION: 70,        // Carousel card description
  COMPANY_NAME: 100,               // Company name in ad
} as const;
