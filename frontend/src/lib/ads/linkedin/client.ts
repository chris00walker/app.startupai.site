/**
 * LinkedIn Marketing API Client
 *
 * Service layer for interacting with LinkedIn Marketing API v2.
 * Creates PAUSED campaigns for HITL approval before any spend occurs.
 *
 * Optimized for B2B validation with professional targeting options.
 *
 * @story US-AP08
 */

import type {
  LinkedInCampaignGroup,
  LinkedInCampaign,
  LinkedInCreative,
  LinkedInAdPreview,
  LinkedInUrn,
  LinkedInCampaignStatus,
  LinkedInApiResponse,
  CreateCampaignGroupParams,
  CreateCampaignParams,
  CreateSingleImageAdParams,
  LinkedInCampaignCreationResult,
  LinkedInB2BTargeting,
  LinkedInTargetingCriteria,
} from './types';
import { LINKEDIN_CHARACTER_LIMITS } from './types';
import type { CopyBankData } from '@/db/schema/copy-banks';

// ============================================================================
// CLIENT CLASS
// ============================================================================

export class LinkedInAdsClient {
  private accessToken: string;
  private apiVersion: string;
  private baseUrl: string;

  constructor(config: {
    accessToken: string;
    apiVersion?: string;
  }) {
    this.accessToken = config.accessToken;
    this.apiVersion = config.apiVersion || '202401'; // LinkedIn uses date-based versioning
    this.baseUrl = 'https://api.linkedin.com/rest';
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
    body?: Record<string, unknown>
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
      'LinkedIn-Version': this.apiVersion,
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if ((method === 'POST' || method === 'PATCH') && body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    // LinkedIn returns 201 for successful POST, 204 for DELETE
    if (response.status === 204) {
      return {} as T;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new LinkedInApiError(
        data.message || 'LinkedIn API error',
        data.code || response.status,
        data.status || 'UNKNOWN'
      );
    }

    return data as T;
  }

  /**
   * Truncate text to character limit
   */
  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Convert cents to LinkedIn money format (string with decimal)
   */
  private centsToLinkedInMoney(cents: number): string {
    return (cents / 100).toFixed(2);
  }

  /**
   * Build targeting criteria from B2B targeting options
   */
  private buildTargetingCriteria(targeting: LinkedInB2BTargeting): LinkedInTargetingCriteria {
    const andFacets: Array<{ or: Record<string, LinkedInUrn[]> }> = [];

    // Add location targeting (required)
    if (targeting.locations && targeting.locations.length > 0) {
      andFacets.push({
        or: { 'urn:li:adTargetingFacet:locations': targeting.locations },
      });
    }

    // Add job title targeting
    if (targeting.jobTitles && targeting.jobTitles.length > 0) {
      andFacets.push({
        or: { 'urn:li:adTargetingFacet:titles': targeting.jobTitles },
      });
    }

    // Add job function targeting
    if (targeting.jobFunctions && targeting.jobFunctions.length > 0) {
      andFacets.push({
        or: { 'urn:li:adTargetingFacet:functions': targeting.jobFunctions },
      });
    }

    // Add seniority targeting
    if (targeting.seniorityLevels && targeting.seniorityLevels.length > 0) {
      andFacets.push({
        or: { 'urn:li:adTargetingFacet:seniorities': targeting.seniorityLevels },
      });
    }

    // Add industry targeting
    if (targeting.industries && targeting.industries.length > 0) {
      andFacets.push({
        or: { 'urn:li:adTargetingFacet:industries': targeting.industries },
      });
    }

    // Add company size targeting
    if (targeting.companySizes && targeting.companySizes.length > 0) {
      andFacets.push({
        or: { 'urn:li:adTargetingFacet:staffCountRanges': targeting.companySizes },
      });
    }

    // Add skills targeting
    if (targeting.skills && targeting.skills.length > 0) {
      andFacets.push({
        or: { 'urn:li:adTargetingFacet:skills': targeting.skills },
      });
    }

    // Add member interests targeting
    if (targeting.memberInterests && targeting.memberInterests.length > 0) {
      andFacets.push({
        or: { 'urn:li:adTargetingFacet:interests': targeting.memberInterests },
      });
    }

    return {
      include: { and: andFacets },
    };
  }

  // ============================================================================
  // CAMPAIGN GROUP OPERATIONS
  // ============================================================================

  /**
   * Create a campaign group (container for campaigns)
   */
  async createCampaignGroup(params: CreateCampaignGroupParams): Promise<LinkedInCampaignGroup> {
    const body: Record<string, unknown> = {
      account: `urn:li:sponsoredAccount:${params.accountId}`,
      name: params.name,
      status: 'PAUSED', // Always PAUSED for safety
    };

    if (params.totalBudgetCents) {
      body.totalBudget = {
        amount: this.centsToLinkedInMoney(params.totalBudgetCents),
        currencyCode: 'USD',
      };
    }

    if (params.startDate) {
      body.runSchedule = {
        start: params.startDate.getTime(),
        ...(params.endDate && { end: params.endDate.getTime() }),
      };
    }

    const response = await this.request<LinkedInCampaignGroup>(
      '/adCampaignGroups',
      'POST',
      body
    );

    return response;
  }

  /**
   * Get campaign group details
   */
  async getCampaignGroup(campaignGroupId: string): Promise<LinkedInCampaignGroup> {
    return this.request<LinkedInCampaignGroup>(`/adCampaignGroups/${campaignGroupId}`);
  }

  /**
   * Update campaign group status
   */
  async updateCampaignGroupStatus(
    campaignGroupId: string,
    status: LinkedInCampaignStatus
  ): Promise<void> {
    await this.request(`/adCampaignGroups/${campaignGroupId}`, 'PATCH', { status });
  }

  // ============================================================================
  // CAMPAIGN OPERATIONS
  // ============================================================================

  /**
   * Create a PAUSED campaign within a campaign group
   */
  async createCampaign(params: CreateCampaignParams): Promise<LinkedInCampaign> {
    const targetingCriteria = this.buildTargetingCriteria(params.targeting);

    const body: Record<string, unknown> = {
      account: `urn:li:sponsoredAccount:${params.accountId}`,
      campaignGroup: params.campaignGroupUrn,
      name: params.name,
      status: 'PAUSED', // Always PAUSED for safety
      type: 'SPONSORED_UPDATES',
      objectiveType: params.objective,
      costType: params.costType,
      dailyBudget: {
        amount: this.centsToLinkedInMoney(params.dailyBudgetCents),
        currencyCode: 'USD',
      },
      targetingCriteria,
      creativeSelection: 'OPTIMIZED',
      offsiteDeliveryEnabled: false,
      audienceExpansionEnabled: false,
    };

    if (params.totalBudgetCents) {
      body.totalBudget = {
        amount: this.centsToLinkedInMoney(params.totalBudgetCents),
        currencyCode: 'USD',
      };
    }

    if (params.bidAmountCents) {
      body.unitCost = {
        amount: this.centsToLinkedInMoney(params.bidAmountCents),
        currencyCode: 'USD',
      };
    }

    if (params.startDate) {
      body.runSchedule = {
        start: params.startDate.getTime(),
        ...(params.endDate && { end: params.endDate.getTime() }),
      };
    }

    return this.request<LinkedInCampaign>('/adCampaigns', 'POST', body);
  }

  /**
   * Get campaign details
   */
  async getCampaign(campaignId: string): Promise<LinkedInCampaign> {
    return this.request<LinkedInCampaign>(`/adCampaigns/${campaignId}`);
  }

  /**
   * Update campaign status
   */
  async updateCampaignStatus(
    campaignId: string,
    status: LinkedInCampaignStatus
  ): Promise<void> {
    await this.request(`/adCampaigns/${campaignId}`, 'PATCH', { status });
  }

  // ============================================================================
  // ASSET OPERATIONS
  // ============================================================================

  /**
   * Upload image and get asset URN
   */
  async uploadImage(imageUrl: string): Promise<LinkedInUrn> {
    // Step 1: Register upload
    const registerResponse = await this.request<{
      value: {
        asset: string;
        uploadMechanism: {
          'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest': {
            uploadUrl: string;
            headers: Record<string, string>;
          };
        };
      };
    }>('/assets?action=registerUpload', 'POST', {
      registerUploadRequest: {
        recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
        owner: 'urn:li:organization:0', // Will be overwritten
        serviceRelationships: [
          {
            relationshipType: 'OWNER',
            identifier: 'urn:li:userGeneratedContent',
          },
        ],
      },
    });

    const { asset, uploadMechanism } = registerResponse.value;
    const uploadInfo = uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'];

    // Step 2: Fetch image and upload
    const imageResponse = await fetch(imageUrl);
    const imageBlob = await imageResponse.blob();

    const uploadResponse = await fetch(uploadInfo.uploadUrl, {
      method: 'PUT',
      headers: {
        ...uploadInfo.headers,
        'Content-Type': imageBlob.type,
      },
      body: imageBlob,
    });

    if (!uploadResponse.ok) {
      throw new LinkedInApiError('Failed to upload image', uploadResponse.status, 'UPLOAD_FAILED');
    }

    return asset;
  }

  // ============================================================================
  // CREATIVE OPERATIONS
  // ============================================================================

  /**
   * Create a UGC post (share) for Sponsored Content
   */
  async createShare(params: {
    organizationUrn: string;
    text: string;
    title?: string;
    description?: string;
    landingPageUrl: string;
    imageUrn: string;
  }): Promise<LinkedInUrn> {
    const body = {
      author: params.organizationUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: this.truncate(params.text, LINKEDIN_CHARACTER_LIMITS.INTRODUCTORY_TEXT),
          },
          shareMediaCategory: 'IMAGE',
          media: [
            {
              status: 'READY',
              media: params.imageUrn,
              title: {
                text: params.title ? this.truncate(params.title, LINKEDIN_CHARACTER_LIMITS.HEADLINE) : undefined,
              },
              description: {
                text: params.description
                  ? this.truncate(params.description, LINKEDIN_CHARACTER_LIMITS.DESCRIPTION)
                  : undefined,
              },
              originalUrl: params.landingPageUrl,
            },
          ],
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    const response = await this.request<{ id: string }>('/ugcPosts', 'POST', body);
    return response.id;
  }

  /**
   * Create ad creative linking to the share
   */
  async createCreative(params: {
    campaignUrn: string;
    shareUrn: string;
    callToAction?: string;
  }): Promise<LinkedInCreative> {
    const body = {
      campaign: params.campaignUrn,
      reference: params.shareUrn,
      intendedStatus: 'PAUSED',
      variables: {
        data: {
          'com.linkedin.ads.SponsoredUpdateCreativeVariables': {
            activity: params.shareUrn,
            directSponsoredContent: true,
            share: params.shareUrn,
          },
        },
      },
    };

    return this.request<LinkedInCreative>('/creatives', 'POST', body);
  }

  /**
   * Get creative details including review status
   */
  async getCreative(creativeId: string): Promise<LinkedInCreative> {
    return this.request<LinkedInCreative>(`/creatives/${creativeId}`);
  }

  /**
   * Get ad preview URL (valid for 3 hours)
   */
  async getAdPreview(creativeUrn: string): Promise<LinkedInAdPreview> {
    const response = await this.request<{
      elements: Array<{
        creative: string;
        previewUrl: string;
        expiresAt: number;
      }>;
    }>(`/adPreviews?q=creative&creative=${encodeURIComponent(creativeUrn)}`);

    if (!response.elements || response.elements.length === 0) {
      throw new LinkedInApiError('Preview not available', 404, 'NOT_FOUND');
    }

    const preview = response.elements[0];
    return {
      creative: preview.creative,
      previewUrl: preview.previewUrl,
      expiresAt: preview.expiresAt,
      format: 'SINGLE_IMAGE',
    };
  }

  // ============================================================================
  // FULL CAMPAIGN CREATION
  // ============================================================================

  /**
   * Create complete Sponsored Content campaign from Copy Bank data
   */
  async createFullCampaign(params: {
    accountId: string;
    organizationId: string;
    name: string;
    dailyBudgetCents: number;
    totalBudgetCents?: number;
    finalUrl: string;
    copyBank: CopyBankData;
    imageUrl: string;
    targeting: LinkedInB2BTargeting;
    startDate?: Date;
    endDate?: Date;
  }): Promise<LinkedInCampaignCreationResult> {
    // 1. Create campaign group
    const campaignGroup = await this.createCampaignGroup({
      accountId: params.accountId,
      name: `${params.name} - Group`,
      totalBudgetCents: params.totalBudgetCents,
      startDate: params.startDate,
      endDate: params.endDate,
    });

    // 2. Create campaign
    const campaign = await this.createCampaign({
      accountId: params.accountId,
      campaignGroupUrn: `urn:li:sponsoredCampaignGroup:${campaignGroup.id}`,
      name: params.name,
      objective: 'WEBSITE_VISITS',
      dailyBudgetCents: params.dailyBudgetCents,
      totalBudgetCents: params.totalBudgetCents,
      costType: 'CPC',
      targeting: params.targeting,
      startDate: params.startDate,
      endDate: params.endDate,
    });

    // 3. Upload image
    const imageUrn = await this.uploadImage(params.imageUrl);

    // 4. Create share (sponsored content)
    const organizationUrn = `urn:li:organization:${params.organizationId}`;
    const shareUrn = await this.createShare({
      organizationUrn,
      text: params.copyBank.primary_texts.problem_solution,
      title: params.copyBank.headlines.primary,
      description: params.copyBank.primary_texts.benefit_focused,
      landingPageUrl: params.finalUrl,
      imageUrn,
    });

    // 5. Create creative
    const creative = await this.createCreative({
      campaignUrn: `urn:li:sponsoredCampaign:${campaign.id}`,
      shareUrn,
      callToAction: params.copyBank.ctas.primary,
    });

    // 6. Get preview
    let preview: LinkedInAdPreview | undefined;
    try {
      preview = await this.getAdPreview(`urn:li:sponsoredCreative:${creative.id}`);
    } catch {
      // Preview may not be immediately available
    }

    return {
      campaignGroup,
      campaign,
      creative,
      shareUrn,
      preview,
    };
  }

  /**
   * Activate a paused campaign (after HITL approval)
   */
  async activateCampaign(campaignId: string, campaignGroupId: string): Promise<void> {
    // Enable campaign group first
    await this.updateCampaignGroupStatus(campaignGroupId, 'ACTIVE');
    // Then enable campaign
    await this.updateCampaignStatus(campaignId, 'ACTIVE');
  }

  /**
   * Pause an active campaign
   */
  async pauseCampaign(campaignId: string): Promise<void> {
    await this.updateCampaignStatus(campaignId, 'PAUSED');
  }
}

// ============================================================================
// CUSTOM ERROR
// ============================================================================

export class LinkedInApiError extends Error {
  code: number;
  status: string;

  constructor(message: string, code: number, status: string) {
    super(message);
    this.name = 'LinkedInApiError';
    this.code = code;
    this.status = status;
  }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createLinkedInAdsClient(accessToken: string): LinkedInAdsClient {
  return new LinkedInAdsClient({ accessToken });
}
