/**
 * Meta Marketing API Client
 *
 * Service layer for interacting with Meta (Facebook) Marketing API.
 * Creates PAUSED campaigns for HITL approval before any spend occurs.
 *
 * @story US-AP03
 */

import type {
  MetaCampaign,
  MetaAdSet,
  MetaAdCreative,
  MetaAd,
  MetaAdPreview,
  CreateCampaignParams,
  CreateAdSetParams,
  CreateFlexibleCreativeParams,
  CreateAdParams,
  MetaApiResponse,
  AdFormat,
  UploadedImage,
  CampaignCreationResult,
  BUDGET_LIMITS,
} from './types';
import type { CopyBankData } from '@/db/schema/copy-banks';

// ============================================================================
// CLIENT CLASS
// ============================================================================

export class MetaAdsClient {
  private accessToken: string;
  private adAccountId: string;
  private pageId: string;
  private apiVersion: string;
  private baseUrl: string;

  constructor(config: {
    accessToken: string;
    adAccountId: string;
    pageId: string;
    apiVersion?: string;
  }) {
    this.accessToken = config.accessToken;
    this.adAccountId = config.adAccountId.startsWith('act_')
      ? config.adAccountId
      : `act_${config.adAccountId}`;
    this.pageId = config.pageId;
    this.apiVersion = config.apiVersion || 'v21.0';
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'DELETE' = 'GET',
    body?: Record<string, unknown>
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (method === 'POST' && body) {
      options.body = JSON.stringify({
        ...body,
        access_token: this.accessToken,
      });
    }

    // For GET requests, append access token to URL
    const requestUrl =
      method === 'GET'
        ? `${url}${url.includes('?') ? '&' : '?'}access_token=${this.accessToken}`
        : url;

    const response = await fetch(requestUrl, options);
    const data = (await response.json()) as MetaApiResponse<T>;

    if (data.error) {
      throw new MetaApiError(data.error.message, data.error.code, data.error.type);
    }

    return data.data || (data as unknown as T);
  }

  // ============================================================================
  // CAMPAIGN OPERATIONS
  // ============================================================================

  /**
   * Create a PAUSED campaign - no spend until explicitly activated
   */
  async createPausedCampaign(params: CreateCampaignParams): Promise<MetaCampaign> {
    const response = await this.request<{ id: string }>(`/${this.adAccountId}/campaigns`, 'POST', {
      name: params.name,
      objective: params.objective,
      status: 'PAUSED', // Always create as PAUSED for safety
      special_ad_categories: params.special_ad_categories || [],
    });

    // Fetch full campaign details
    return this.getCampaign(response.id);
  }

  async getCampaign(campaignId: string): Promise<MetaCampaign> {
    return this.request<MetaCampaign>(
      `/${campaignId}?fields=id,name,objective,status,account_id,created_time,updated_time`
    );
  }

  async updateCampaignStatus(campaignId: string, status: 'ACTIVE' | 'PAUSED'): Promise<void> {
    await this.request(`/${campaignId}`, 'POST', { status });
  }

  // ============================================================================
  // AD SET OPERATIONS
  // ============================================================================

  /**
   * Create ad set with targeting derived from VPC audience template
   */
  async createAdSet(params: CreateAdSetParams): Promise<MetaAdSet> {
    const body: Record<string, unknown> = {
      name: params.name,
      campaign_id: params.campaign_id,
      billing_event: params.billing_event,
      optimization_goal: params.optimization_goal,
      targeting: params.targeting,
      status: params.status || 'PAUSED',
    };

    if (params.daily_budget) {
      body.daily_budget = params.daily_budget;
    }
    if (params.lifetime_budget) {
      body.lifetime_budget = params.lifetime_budget;
    }
    if (params.start_time) {
      body.start_time = params.start_time;
    }
    if (params.end_time) {
      body.end_time = params.end_time;
    }

    const response = await this.request<{ id: string }>(`/${this.adAccountId}/adsets`, 'POST', body);

    return this.getAdSet(response.id);
  }

  async getAdSet(adSetId: string): Promise<MetaAdSet> {
    return this.request<MetaAdSet>(
      `/${adSetId}?fields=id,name,campaign_id,status,billing_event,optimization_goal,daily_budget,lifetime_budget,targeting,start_time,end_time`
    );
  }

  // ============================================================================
  // AD CREATIVE OPERATIONS
  // ============================================================================

  /**
   * Create Flexible Ad Creative with multiple assets for Meta to test
   */
  async createFlexibleCreative(params: CreateFlexibleCreativeParams): Promise<MetaAdCreative> {
    const response = await this.request<{ id: string }>(
      `/${this.adAccountId}/adcreatives`,
      'POST',
      {
        name: params.name,
        asset_feed_spec: params.asset_feed_spec,
        degrees_of_freedom_spec: params.degrees_of_freedom_spec || {
          creative_features_spec: {
            standard_enhancements: { enroll_status: 'OPT_IN' },
          },
        },
        object_story_spec: {
          page_id: params.page_id,
        },
      }
    );

    return this.getCreative(response.id);
  }

  async getCreative(creativeId: string): Promise<MetaAdCreative> {
    return this.request<MetaAdCreative>(
      `/${creativeId}?fields=id,name,account_id,asset_feed_spec,degrees_of_freedom_spec,object_story_spec`
    );
  }

  // ============================================================================
  // AD OPERATIONS
  // ============================================================================

  async createAd(params: CreateAdParams): Promise<MetaAd> {
    const response = await this.request<{ id: string }>(`/${this.adAccountId}/ads`, 'POST', {
      name: params.name,
      adset_id: params.adset_id,
      creative: { creative_id: params.creative_id },
      status: params.status || 'PAUSED',
    });

    return this.getAd(response.id);
  }

  async getAd(adId: string): Promise<MetaAd> {
    return this.request<MetaAd>(
      `/${adId}?fields=id,name,adset_id,creative,status,effective_status,issues_info`
    );
  }

  // ============================================================================
  // IMAGE UPLOAD
  // ============================================================================

  /**
   * Upload images and get hashes for use in ad creatives
   */
  async uploadImages(imageUrls: string[]): Promise<UploadedImage[]> {
    const results: UploadedImage[] = [];

    for (const imageUrl of imageUrls) {
      try {
        // Meta API accepts image URLs directly
        const response = await this.request<{ images: Record<string, { hash: string }> }>(
          `/${this.adAccountId}/adimages`,
          'POST',
          {
            url: imageUrl,
          }
        );

        // Response format: { images: { "<filename>": { hash: "..." } } }
        const imageData = Object.values(response.images)[0];
        if (imageData) {
          results.push({
            hash: imageData.hash,
            url: imageUrl,
          });
        }
      } catch (error) {
        console.error(`Failed to upload image ${imageUrl}:`, error);
        // Continue with other images
      }
    }

    return results;
  }

  // ============================================================================
  // PREVIEW GENERATION
  // ============================================================================

  /**
   * Generate preview renders for HITL approval
   */
  async generatePreviews(creativeId: string): Promise<MetaAdPreview[]> {
    const formats: AdFormat[] = [
      'DESKTOP_FEED_STANDARD',
      'MOBILE_FEED_STANDARD',
      'INSTAGRAM_STANDARD',
      'INSTAGRAM_STORY',
    ];

    const previews: MetaAdPreview[] = [];

    for (const format of formats) {
      try {
        const response = await this.request<Array<{ body: string }>>(
          `/${creativeId}/previews?ad_format=${format}`
        );

        if (response && response[0]) {
          previews.push({
            format,
            html: response[0].body,
          });
        }
      } catch (error) {
        console.error(`Failed to generate preview for ${format}:`, error);
        // Continue with other formats
      }
    }

    return previews;
  }

  // ============================================================================
  // FULL CAMPAIGN CREATION FLOW
  // ============================================================================

  /**
   * Create complete PAUSED campaign with all components ready for HITL approval
   */
  async createFullCampaign(config: {
    projectName: string;
    copyBank: CopyBankData;
    imageUrls: string[];
    landingPageUrl: string;
    targeting: CreateAdSetParams['targeting'];
    dailyBudgetCents?: number;
  }): Promise<CampaignCreationResult> {
    const {
      projectName,
      copyBank,
      imageUrls,
      landingPageUrl,
      targeting,
      dailyBudgetCents = 2000, // Default $20/day
    } = config;

    // Step 1: Upload images
    const uploadedImages = await this.uploadImages(imageUrls);
    if (uploadedImages.length === 0) {
      throw new Error('Failed to upload any images');
    }

    // Step 2: Create PAUSED campaign
    const campaign = await this.createPausedCampaign({
      name: `${projectName} - Validation`,
      objective: 'OUTCOME_TRAFFIC',
    });

    // Step 3: Create ad set with targeting
    const adSet = await this.createAdSet({
      name: 'Validation Ad Set',
      campaign_id: campaign.id,
      billing_event: 'IMPRESSIONS',
      optimization_goal: 'LINK_CLICKS',
      daily_budget: dailyBudgetCents,
      targeting,
      status: 'PAUSED',
    });

    // Step 4: Create Flexible Ad Creative
    const creative = await this.createFlexibleCreative({
      name: 'Validation Creative',
      page_id: this.pageId,
      asset_feed_spec: {
        images: uploadedImages.map((img) => ({ hash: img.hash })),
        bodies: [
          { text: copyBank.primary_texts.problem_solution },
          { text: copyBank.primary_texts.benefit_focused },
          { text: copyBank.primary_texts.social_proof },
        ],
        titles: [
          { text: copyBank.headlines.primary.slice(0, 40) },
          { text: copyBank.headlines.benefit.slice(0, 40) },
          { text: copyBank.headlines.question.slice(0, 40) },
        ],
        link_urls: [{ website_url: landingPageUrl }],
        call_to_action_types: ['SIGN_UP', 'LEARN_MORE'],
      },
    });

    // Step 5: Create ad
    const ad = await this.createAd({
      name: 'Validation Ad',
      adset_id: adSet.id,
      creative_id: creative.id,
      status: 'PAUSED',
    });

    // Step 6: Generate previews for HITL
    const previews = await this.generatePreviews(creative.id);

    return {
      campaign,
      adSet,
      creative,
      ad,
      previews,
      imageHashes: uploadedImages.map((img) => img.hash),
    };
  }

  // ============================================================================
  // CAMPAIGN ACTIVATION
  // ============================================================================

  /**
   * Activate a PAUSED campaign after HITL approval
   */
  async activateCampaign(campaignId: string, adSetId: string, adId: string): Promise<void> {
    // Activate in order: campaign -> ad set -> ad
    await this.updateCampaignStatus(campaignId, 'ACTIVE');
    await this.request(`/${adSetId}`, 'POST', { status: 'ACTIVE' });
    await this.request(`/${adId}`, 'POST', { status: 'ACTIVE' });
  }

  /**
   * Pause an active campaign
   */
  async pauseCampaign(campaignId: string, adSetId: string, adId: string): Promise<void> {
    // Pause in reverse order: ad -> ad set -> campaign
    await this.request(`/${adId}`, 'POST', { status: 'PAUSED' });
    await this.request(`/${adSetId}`, 'POST', { status: 'PAUSED' });
    await this.updateCampaignStatus(campaignId, 'PAUSED');
  }
}

// ============================================================================
// ERROR CLASS
// ============================================================================

export class MetaApiError extends Error {
  code: number;
  type: string;

  constructor(message: string, code: number, type: string) {
    super(message);
    this.name = 'MetaApiError';
    this.code = code;
    this.type = type;
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a Meta Ads client from platform connection credentials
 */
export async function createMetaAdsClient(credentials: {
  accessToken: string;
  adAccountId: string;
  pageId: string;
}): Promise<MetaAdsClient> {
  return new MetaAdsClient(credentials);
}
