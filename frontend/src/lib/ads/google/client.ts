/**
 * Google Ads API Client
 *
 * Service layer for interacting with Google Ads API v17.
 * Creates PAUSED campaigns for HITL approval before any spend occurs.
 *
 * Uses same workflow as Meta:
 * 1. Create PAUSED campaign
 * 2. Generate responsive display ad with Copy Bank content
 * 3. Show preview for HITL approval
 * 4. Activate after approval
 *
 * @story US-AP07
 */

import type {
  GoogleCampaign,
  GoogleCampaignBudget,
  GoogleAdGroup,
  GoogleAdGroupAd,
  GoogleAdsResponse,
  CreateGoogleCampaignParams,
  CreateGoogleAdGroupParams,
  CreateResponsiveDisplayAdParams,
  GoogleCampaignCreationResult,
  GoogleApprovalStatus,
  GOOGLE_BUDGET_LIMITS,
  GOOGLE_CHARACTER_LIMITS,
} from './types';
import type { CopyBankData } from '@/db/schema/copy-banks';

// ============================================================================
// CLIENT CLASS
// ============================================================================

export class GoogleAdsClient {
  private developerToken: string;
  private customerId: string;
  private accessToken: string;
  private apiVersion: string;
  private baseUrl: string;

  constructor(config: {
    developerToken: string;
    customerId: string;
    accessToken: string;
    apiVersion?: string;
  }) {
    this.developerToken = config.developerToken;
    // Customer ID should not have hyphens
    this.customerId = config.customerId.replace(/-/g, '');
    this.accessToken = config.accessToken;
    this.apiVersion = config.apiVersion || 'v17';
    this.baseUrl = `https://googleads.googleapis.com/${this.apiVersion}`;
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    body?: Record<string, unknown>
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.accessToken}`,
      'developer-token': this.developerToken,
      'Content-Type': 'application/json',
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (method === 'POST' && body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      const error = data.error || data;
      throw new GoogleAdsApiError(
        error.message || 'Google Ads API error',
        error.code || response.status,
        error.status || 'UNKNOWN'
      );
    }

    return data as T;
  }

  /**
   * Create a resource name for the customer
   */
  private customerResource(resource: string): string {
    return `customers/${this.customerId}/${resource}`;
  }

  /**
   * Truncate text to character limit
   */
  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Convert dollars to micros (1 dollar = 1,000,000 micros)
   */
  private dollarsToMicros(dollars: number): string {
    return Math.round(dollars * 1_000_000).toString();
  }

  // ============================================================================
  // CAMPAIGN OPERATIONS
  // ============================================================================

  /**
   * Create a PAUSED campaign with budget - no spend until activated
   */
  async createPausedCampaign(params: CreateGoogleCampaignParams): Promise<{
    campaign: GoogleCampaign;
    budget: GoogleCampaignBudget;
  }> {
    // First create the budget
    const budgetResponse = await this.request<GoogleAdsResponse<{ campaignBudget: GoogleCampaignBudget }>>(
      `/customers/${this.customerId}/campaignBudgets:mutate`,
      'POST',
      {
        operations: [
          {
            create: {
              name: `${params.name} - Budget`,
              amountMicros: params.dailyBudgetMicros,
              deliveryMethod: 'STANDARD',
              explicitlyShared: false,
            },
          },
        ],
      }
    );

    const budget = budgetResponse.results?.[0]?.campaignBudget;
    if (!budget) {
      throw new GoogleAdsApiError('Failed to create budget', 0, 'BUDGET_CREATION_FAILED');
    }

    // Create the campaign in PAUSED state
    const campaignResponse = await this.request<GoogleAdsResponse<{ campaign: GoogleCampaign }>>(
      `/customers/${this.customerId}/campaigns:mutate`,
      'POST',
      {
        operations: [
          {
            create: {
              name: params.name,
              status: 'PAUSED', // Always create PAUSED for safety
              advertisingChannelType: 'DISPLAY',
              campaignBudget: budget.resourceName,
              startDate: params.startDate,
              endDate: params.endDate,
              // Bidding strategy
              [params.biddingStrategy === 'TARGET_CPA' ? 'targetCpa' : 'maximizeConversions']:
                params.biddingStrategy === 'TARGET_CPA' && params.targetCpaMicros
                  ? { targetCpaMicros: params.targetCpaMicros }
                  : {},
            },
          },
        ],
      }
    );

    const campaign = campaignResponse.results?.[0]?.campaign;
    if (!campaign) {
      throw new GoogleAdsApiError('Failed to create campaign', 0, 'CAMPAIGN_CREATION_FAILED');
    }

    return { campaign, budget };
  }

  /**
   * Get campaign details
   */
  async getCampaign(campaignId: string): Promise<GoogleCampaign> {
    const response = await this.request<GoogleAdsResponse<{ campaign: GoogleCampaign }>>(
      `/customers/${this.customerId}/googleAds:searchStream`,
      'POST',
      {
        query: `
          SELECT
            campaign.id,
            campaign.name,
            campaign.status,
            campaign.advertising_channel_type,
            campaign.start_date,
            campaign.end_date,
            campaign.campaign_budget
          FROM campaign
          WHERE campaign.id = '${campaignId}'
        `,
      }
    );

    const campaign = response.results?.[0]?.campaign;
    if (!campaign) {
      throw new GoogleAdsApiError('Campaign not found', 404, 'NOT_FOUND');
    }

    return campaign;
  }

  /**
   * Update campaign status
   */
  async updateCampaignStatus(
    campaignResourceName: string,
    status: 'ENABLED' | 'PAUSED'
  ): Promise<void> {
    await this.request(
      `/customers/${this.customerId}/campaigns:mutate`,
      'POST',
      {
        operations: [
          {
            update: {
              resourceName: campaignResourceName,
              status,
            },
            updateMask: 'status',
          },
        ],
      }
    );
  }

  // ============================================================================
  // AD GROUP OPERATIONS
  // ============================================================================

  /**
   * Create ad group for the campaign
   */
  async createAdGroup(params: CreateGoogleAdGroupParams): Promise<GoogleAdGroup> {
    const response = await this.request<GoogleAdsResponse<{ adGroup: GoogleAdGroup }>>(
      `/customers/${this.customerId}/adGroups:mutate`,
      'POST',
      {
        operations: [
          {
            create: {
              name: params.name,
              campaign: params.campaignResourceName,
              status: 'PAUSED',
              type: 'DISPLAY_STANDARD',
              cpcBidMicros: params.cpcBidMicros || '1000000', // $1 default
            },
          },
        ],
      }
    );

    const adGroup = response.results?.[0]?.adGroup;
    if (!adGroup) {
      throw new GoogleAdsApiError('Failed to create ad group', 0, 'AD_GROUP_CREATION_FAILED');
    }

    return adGroup;
  }

  // ============================================================================
  // ASSET OPERATIONS
  // ============================================================================

  /**
   * Upload text assets (headlines, descriptions)
   */
  async createTextAssets(texts: string[]): Promise<string[]> {
    const operations = texts.map((text) => ({
      create: {
        textAsset: { text },
      },
    }));

    const response = await this.request<GoogleAdsResponse<{ asset: { resourceName: string } }>>(
      `/customers/${this.customerId}/assets:mutate`,
      'POST',
      { operations }
    );

    return (response.results || []).map((r) => r.asset?.resourceName).filter(Boolean) as string[];
  }

  /**
   * Upload image asset from URL
   */
  async createImageAsset(imageUrl: string, name: string): Promise<string> {
    // Fetch image and convert to base64
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Data = Buffer.from(imageBuffer).toString('base64');

    const response = await this.request<GoogleAdsResponse<{ asset: { resourceName: string } }>>(
      `/customers/${this.customerId}/assets:mutate`,
      'POST',
      {
        operations: [
          {
            create: {
              name,
              imageAsset: {
                data: base64Data,
              },
            },
          },
        ],
      }
    );

    const resourceName = response.results?.[0]?.asset?.resourceName;
    if (!resourceName) {
      throw new GoogleAdsApiError('Failed to upload image', 0, 'IMAGE_UPLOAD_FAILED');
    }

    return resourceName;
  }

  // ============================================================================
  // RESPONSIVE DISPLAY AD OPERATIONS
  // ============================================================================

  /**
   * Create responsive display ad with all assets
   */
  async createResponsiveDisplayAd(
    params: CreateResponsiveDisplayAdParams
  ): Promise<GoogleAdGroupAd> {
    // Upload text assets
    const headlineAssets = await this.createTextAssets(
      params.headlines.map((h) => this.truncate(h, 30))
    );
    const descriptionAssets = await this.createTextAssets(
      params.descriptions.map((d) => this.truncate(d, 90))
    );
    const longHeadlineAssets = await this.createTextAssets([
      this.truncate(params.longHeadline, 90),
    ]);

    // Upload image assets
    const marketingImageAssets: string[] = [];
    for (let i = 0; i < params.marketingImageUrls.length; i++) {
      const assetName = await this.createImageAsset(
        params.marketingImageUrls[i],
        `Marketing Image ${i + 1}`
      );
      marketingImageAssets.push(assetName);
    }

    // Build responsive display ad info
    const responsiveDisplayAd = {
      headlines: headlineAssets.map((asset) => ({ asset })),
      longHeadline: { asset: longHeadlineAssets[0] },
      descriptions: descriptionAssets.map((asset) => ({ asset })),
      marketingImages: marketingImageAssets.map((asset) => ({ asset })),
      businessName: this.truncate(params.businessName, 25),
      callToActionText: params.callToActionText,
      formatSetting: 'ALL_FORMATS',
    };

    // Create the ad
    const response = await this.request<GoogleAdsResponse<{ adGroupAd: GoogleAdGroupAd }>>(
      `/customers/${this.customerId}/adGroupAds:mutate`,
      'POST',
      {
        operations: [
          {
            create: {
              adGroup: params.adGroupResourceName,
              status: 'PAUSED',
              ad: {
                finalUrls: [params.finalUrl],
                responsiveDisplayAd,
              },
            },
          },
        ],
      }
    );

    const adGroupAd = response.results?.[0]?.adGroupAd;
    if (!adGroupAd) {
      throw new GoogleAdsApiError('Failed to create ad', 0, 'AD_CREATION_FAILED');
    }

    return adGroupAd;
  }

  /**
   * Get ad approval status
   */
  async getAdApprovalStatus(adGroupAdResourceName: string): Promise<{
    approvalStatus: GoogleApprovalStatus;
    reviewStatus: string;
    policyIssues: Array<{ topic: string; type: string }>;
  }> {
    const response = await this.request<GoogleAdsResponse<{ adGroupAd: GoogleAdGroupAd }>>(
      `/customers/${this.customerId}/googleAds:searchStream`,
      'POST',
      {
        query: `
          SELECT
            ad_group_ad.policy_summary.approval_status,
            ad_group_ad.policy_summary.review_status,
            ad_group_ad.policy_summary.policy_topic_entries
          FROM ad_group_ad
          WHERE ad_group_ad.resource_name = '${adGroupAdResourceName}'
        `,
      }
    );

    const adGroupAd = response.results?.[0]?.adGroupAd;
    const policySummary = adGroupAd?.policySummary;

    return {
      approvalStatus: policySummary?.approvalStatus || 'UNKNOWN',
      reviewStatus: policySummary?.reviewStatus || 'UNKNOWN',
      policyIssues: (policySummary?.policyTopicEntries || []).map((entry) => ({
        topic: entry.topic,
        type: entry.type,
      })),
    };
  }

  // ============================================================================
  // FULL CAMPAIGN CREATION
  // ============================================================================

  /**
   * Create complete responsive display campaign from Copy Bank data
   */
  async createFullCampaign(params: {
    name: string;
    dailyBudgetDollars: number;
    targetCpaDollars?: number;
    finalUrl: string;
    copyBank: CopyBankData;
    imageUrls: string[];
    startDate?: string;
    endDate?: string;
  }): Promise<GoogleCampaignCreationResult> {
    // 1. Create campaign with budget
    const { campaign, budget } = await this.createPausedCampaign({
      name: params.name,
      dailyBudgetMicros: this.dollarsToMicros(params.dailyBudgetDollars),
      biddingStrategy: params.targetCpaDollars ? 'TARGET_CPA' : 'MAXIMIZE_CONVERSIONS',
      targetCpaMicros: params.targetCpaDollars
        ? this.dollarsToMicros(params.targetCpaDollars)
        : undefined,
      startDate: params.startDate,
      endDate: params.endDate,
    });

    // 2. Create ad group
    const adGroup = await this.createAdGroup({
      campaignResourceName: campaign.resourceName,
      name: `${params.name} - Ad Group`,
    });

    // 3. Prepare copy from Copy Bank
    const headlines = [
      params.copyBank.headlines.primary,
      params.copyBank.headlines.benefit,
      params.copyBank.headlines.question,
      params.copyBank.headlines.social,
      params.copyBank.headlines.urgency,
    ].slice(0, 5);

    const descriptions = [
      params.copyBank.primary_texts.problem_solution,
      params.copyBank.primary_texts.benefit_focused,
      params.copyBank.primary_texts.social_proof,
    ].slice(0, 5);

    const longHeadline = `${params.copyBank.product.differentiator} ${params.copyBank.product.category}: ${params.copyBank.headlines.benefit}`;

    // 4. Create responsive display ad
    const adGroupAd = await this.createResponsiveDisplayAd({
      adGroupResourceName: adGroup.resourceName,
      finalUrl: params.finalUrl,
      businessName: params.copyBank.product.name,
      headlines,
      longHeadline,
      descriptions,
      marketingImageUrls: params.imageUrls.slice(0, 15), // Max 15 images
      callToActionText: params.copyBank.ctas.primary,
    });

    return {
      campaign,
      budget,
      adGroup,
      adGroupAd,
      assetResourceNames: {
        headlines: [], // Would be populated from actual asset creation
        descriptions: [],
        marketingImages: [],
        longHeadline: '',
      },
    };
  }

  /**
   * Activate a paused campaign (after HITL approval)
   */
  async activateCampaign(campaignResourceName: string): Promise<void> {
    // Enable campaign
    await this.updateCampaignStatus(campaignResourceName, 'ENABLED');

    // Also need to enable associated ad groups and ads
    // This would require querying for associated resources
    // For now, just enable the campaign
  }

  /**
   * Pause an active campaign
   */
  async pauseCampaign(campaignResourceName: string): Promise<void> {
    await this.updateCampaignStatus(campaignResourceName, 'PAUSED');
  }
}

// ============================================================================
// CUSTOM ERROR
// ============================================================================

export class GoogleAdsApiError extends Error {
  code: number;
  status: string;

  constructor(message: string, code: number, status: string) {
    super(message);
    this.name = 'GoogleAdsApiError';
    this.code = code;
    this.status = status;
  }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createGoogleAdsClient(config: {
  developerToken: string;
  customerId: string;
  accessToken: string;
}): GoogleAdsClient {
  return new GoogleAdsClient(config);
}
