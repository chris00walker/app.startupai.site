/**
 * LinkedIn Marketing Analytics Client
 *
 * Fetches performance metrics from LinkedIn Ad Analytics API for evidence collection.
 * Supports daily breakdowns and B2B-specific metrics like lead quality.
 *
 * @story US-AP08
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Fields available from LinkedIn Ad Analytics API
 */
export const LINKEDIN_ANALYTICS_FIELDS = [
  'externalWebsiteConversions',
  'externalWebsitePostClickConversions',
  'externalWebsitePostViewConversions',
  'impressions',
  'clicks',
  'costInLocalCurrency',
  'costInUsd',
  'conversionValueInLocalCurrency',
  'landingPageClicks',
  'leadGenerationMailContactInfoShares',
  'leadGenerationMailInterestedClicks',
  'oneClickLeadFormOpens',
  'oneClickLeads',
  'opens',
  'otherEngagements',
  'reactions',
  'sends',
  'shares',
  'textUrlClicks',
  'totalEngagements',
  'videoCompletions',
  'videoFirstQuartileCompletions',
  'videoMidpointCompletions',
  'videoStarts',
  'videoThirdQuartileCompletions',
  'videoViews',
  'viralClicks',
  'viralImpressions',
] as const;

/**
 * Pivot options for analytics breakdown
 */
export type LinkedInAnalyticsPivot =
  | 'CAMPAIGN'
  | 'CREATIVE'
  | 'CAMPAIGN_GROUP'
  | 'CONVERSION'
  | 'COMPANY'
  | 'MEMBER_COMPANY_SIZE'
  | 'MEMBER_INDUSTRY'
  | 'MEMBER_SENIORITY'
  | 'MEMBER_JOB_TITLE'
  | 'MEMBER_JOB_FUNCTION'
  | 'MEMBER_COUNTRY'
  | 'MEMBER_REGION';

/**
 * Time granularity options
 */
export type LinkedInTimeGranularity = 'DAILY' | 'MONTHLY' | 'YEARLY' | 'ALL';

/**
 * Raw analytics row from LinkedIn API
 */
export interface LinkedInAnalyticsRow {
  dateRange: {
    start: {
      day: number;
      month: number;
      year: number;
    };
    end: {
      day: number;
      month: number;
      year: number;
    };
  };
  impressions?: number;
  clicks?: number;
  costInLocalCurrency?: string;
  costInUsd?: string;
  externalWebsiteConversions?: number;
  externalWebsitePostClickConversions?: number;
  externalWebsitePostViewConversions?: number;
  landingPageClicks?: number;
  oneClickLeads?: number;
  oneClickLeadFormOpens?: number;
  leadGenerationMailContactInfoShares?: number;
  leadGenerationMailInterestedClicks?: number;
  totalEngagements?: number;
  reactions?: number;
  shares?: number;
  videoViews?: number;
  videoCompletions?: number;
  conversionValueInLocalCurrency?: string;
  pivotValue?: string;
  pivotValues?: string[];
}

/**
 * Parsed insight data with proper types
 */
export interface LinkedInParsedInsight {
  date: string;
  impressions: number;
  clicks: number;
  ctr: number;
  spendCents: number;
  cpcCents: number;
  cpmCents: number;
  landingPageClicks: number;
  oneClickLeads: number;
  leadFormOpens: number;
  conversions: number;
  postClickConversions: number;
  postViewConversions: number;
  totalEngagements: number;
  reactions: number;
  shares: number;
  videoViews: number;
  videoCompletions: number;
  costPerLeadCents: number;
  costPerConversionCents: number;
  conversionValueCents: number;
}

/**
 * B2B breakdown insight (by job title, industry, etc.)
 */
export interface LinkedInB2BBreakdown {
  dimension: string;
  value: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spendCents: number;
  ctr: number;
}

/**
 * Analytics query parameters
 */
export interface LinkedInAnalyticsQueryParams {
  dateRange: {
    start: string; // YYYY-MM-DD
    end: string; // YYYY-MM-DD
  };
  timeGranularity?: LinkedInTimeGranularity;
  pivot?: LinkedInAnalyticsPivot;
  fields?: readonly string[];
}

// ============================================================================
// CLIENT CLASS
// ============================================================================

export class LinkedInAnalyticsClient {
  private accessToken: string;
  private apiVersion: string;
  private baseUrl: string;

  constructor(config: { accessToken: string; apiVersion?: string }) {
    this.accessToken = config.accessToken;
    this.apiVersion = config.apiVersion || '202401';
    this.baseUrl = 'https://api.linkedin.com/rest';
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private async request<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
      'LinkedIn-Version': this.apiVersion,
    };

    const response = await fetch(url, { headers });
    const data = await response.json();

    if (!response.ok) {
      throw new LinkedInAnalyticsError(
        data.message || 'LinkedIn Analytics API error',
        data.code || response.status,
        data.status || 'UNKNOWN'
      );
    }

    return data as T;
  }

  /**
   * Parse LinkedIn money format (string) to cents
   */
  private dollarsToCents(value: string | number | undefined): number {
    if (!value) return 0;
    const dollars = typeof value === 'string' ? parseFloat(value) : value;
    return Math.round(dollars * 100);
  }

  /**
   * Format date range for API query
   */
  private formatDateRange(dateRange: { start: string; end: string }): string {
    const [startYear, startMonth, startDay] = dateRange.start.split('-').map(Number);
    const [endYear, endMonth, endDay] = dateRange.end.split('-').map(Number);

    return `(start:(year:${startYear},month:${startMonth},day:${startDay}),end:(year:${endYear},month:${endMonth},day:${endDay}))`;
  }

  /**
   * Parse date from LinkedIn date object
   */
  private parseDate(dateObj: { day: number; month: number; year: number }): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${dateObj.year}-${pad(dateObj.month)}-${pad(dateObj.day)}`;
  }

  /**
   * Parse analytics row into structured data
   */
  private parseAnalyticsRow(row: LinkedInAnalyticsRow): LinkedInParsedInsight {
    const impressions = row.impressions || 0;
    const clicks = row.clicks || 0;
    const spendCents = this.dollarsToCents(row.costInUsd || row.costInLocalCurrency);
    const oneClickLeads = row.oneClickLeads || 0;
    const conversions = row.externalWebsiteConversions || 0;

    // Calculate derived metrics
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const cpcCents = clicks > 0 ? Math.round(spendCents / clicks) : 0;
    const cpmCents = impressions > 0 ? Math.round((spendCents / impressions) * 1000) : 0;
    const costPerLeadCents = oneClickLeads > 0 ? Math.round(spendCents / oneClickLeads) : 0;
    const costPerConversionCents = conversions > 0 ? Math.round(spendCents / conversions) : 0;

    return {
      date: this.parseDate(row.dateRange.start),
      impressions,
      clicks,
      ctr,
      spendCents,
      cpcCents,
      cpmCents,
      landingPageClicks: row.landingPageClicks || 0,
      oneClickLeads,
      leadFormOpens: row.oneClickLeadFormOpens || 0,
      conversions,
      postClickConversions: row.externalWebsitePostClickConversions || 0,
      postViewConversions: row.externalWebsitePostViewConversions || 0,
      totalEngagements: row.totalEngagements || 0,
      reactions: row.reactions || 0,
      shares: row.shares || 0,
      videoViews: row.videoViews || 0,
      videoCompletions: row.videoCompletions || 0,
      costPerLeadCents,
      costPerConversionCents,
      conversionValueCents: this.dollarsToCents(row.conversionValueInLocalCurrency),
    };
  }

  // ============================================================================
  // PUBLIC METHODS
  // ============================================================================

  /**
   * Get campaign analytics with daily breakdown
   */
  async getCampaignAnalytics(
    campaignUrns: string[],
    params: LinkedInAnalyticsQueryParams
  ): Promise<LinkedInParsedInsight[]> {
    const { dateRange, timeGranularity = 'DAILY', fields = LINKEDIN_ANALYTICS_FIELDS } = params;

    const campaignParam = campaignUrns.map((urn) => `urn:li:sponsoredCampaign:${urn}`).join(',');
    const dateRangeParam = this.formatDateRange(dateRange);

    const endpoint =
      `/adAnalytics?q=analytics` +
      `&dateRange=${encodeURIComponent(dateRangeParam)}` +
      `&timeGranularity=${timeGranularity}` +
      `&campaigns=List(${encodeURIComponent(campaignParam)})` +
      `&fields=${fields.join(',')}`;

    const response = await this.request<{ elements: LinkedInAnalyticsRow[] }>(endpoint);

    return (response.elements || []).map((row) => this.parseAnalyticsRow(row));
  }

  /**
   * Get creative-level analytics
   */
  async getCreativeAnalytics(
    creativeUrns: string[],
    params: LinkedInAnalyticsQueryParams
  ): Promise<LinkedInParsedInsight[]> {
    const { dateRange, timeGranularity = 'DAILY', fields = LINKEDIN_ANALYTICS_FIELDS } = params;

    const creativeParam = creativeUrns.map((urn) => `urn:li:sponsoredCreative:${urn}`).join(',');
    const dateRangeParam = this.formatDateRange(dateRange);

    const endpoint =
      `/adAnalytics?q=analytics` +
      `&dateRange=${encodeURIComponent(dateRangeParam)}` +
      `&timeGranularity=${timeGranularity}` +
      `&creatives=List(${encodeURIComponent(creativeParam)})` +
      `&fields=${fields.join(',')}`;

    const response = await this.request<{ elements: LinkedInAnalyticsRow[] }>(endpoint);

    return (response.elements || []).map((row) => this.parseAnalyticsRow(row));
  }

  /**
   * Get B2B breakdown by dimension (job title, industry, seniority, etc.)
   */
  async getB2BBreakdown(
    campaignUrns: string[],
    params: LinkedInAnalyticsQueryParams & { pivot: LinkedInAnalyticsPivot }
  ): Promise<LinkedInB2BBreakdown[]> {
    const { dateRange, pivot, timeGranularity = 'ALL' } = params;

    const campaignParam = campaignUrns.map((urn) => `urn:li:sponsoredCampaign:${urn}`).join(',');
    const dateRangeParam = this.formatDateRange(dateRange);

    const endpoint =
      `/adAnalytics?q=analytics` +
      `&dateRange=${encodeURIComponent(dateRangeParam)}` +
      `&timeGranularity=${timeGranularity}` +
      `&campaigns=List(${encodeURIComponent(campaignParam)})` +
      `&pivot=${pivot}` +
      `&fields=impressions,clicks,externalWebsiteConversions,costInUsd`;

    const response = await this.request<{ elements: LinkedInAnalyticsRow[] }>(endpoint);

    return (response.elements || []).map((row) => {
      const impressions = row.impressions || 0;
      const clicks = row.clicks || 0;
      const spendCents = this.dollarsToCents(row.costInUsd);

      return {
        dimension: pivot,
        value: row.pivotValue || row.pivotValues?.[0] || 'unknown',
        impressions,
        clicks,
        conversions: row.externalWebsiteConversions || 0,
        spendCents,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      };
    });
  }

  /**
   * Get aggregated totals for a campaign (no daily breakdown)
   */
  async getCampaignTotals(
    campaignUrn: string,
    dateRange: { start: string; end: string }
  ): Promise<LinkedInParsedInsight | null> {
    const insights = await this.getCampaignAnalytics([campaignUrn], {
      dateRange,
      timeGranularity: 'ALL',
    });

    return insights.length > 0 ? insights[0] : null;
  }

  /**
   * Get job title performance breakdown for B2B analysis
   */
  async getJobTitleBreakdown(
    campaignUrns: string[],
    dateRange: { start: string; end: string }
  ): Promise<LinkedInB2BBreakdown[]> {
    return this.getB2BBreakdown(campaignUrns, {
      dateRange,
      pivot: 'MEMBER_JOB_TITLE',
    });
  }

  /**
   * Get industry performance breakdown for B2B analysis
   */
  async getIndustryBreakdown(
    campaignUrns: string[],
    dateRange: { start: string; end: string }
  ): Promise<LinkedInB2BBreakdown[]> {
    return this.getB2BBreakdown(campaignUrns, {
      dateRange,
      pivot: 'MEMBER_INDUSTRY',
    });
  }

  /**
   * Get seniority performance breakdown for B2B analysis
   */
  async getSeniorityBreakdown(
    campaignUrns: string[],
    dateRange: { start: string; end: string }
  ): Promise<LinkedInB2BBreakdown[]> {
    return this.getB2BBreakdown(campaignUrns, {
      dateRange,
      pivot: 'MEMBER_SENIORITY',
    });
  }

  /**
   * Get company size performance breakdown for B2B analysis
   */
  async getCompanySizeBreakdown(
    campaignUrns: string[],
    dateRange: { start: string; end: string }
  ): Promise<LinkedInB2BBreakdown[]> {
    return this.getB2BBreakdown(campaignUrns, {
      dateRange,
      pivot: 'MEMBER_COMPANY_SIZE',
    });
  }
}

// ============================================================================
// CUSTOM ERROR
// ============================================================================

export class LinkedInAnalyticsError extends Error {
  code: number;
  status: string;

  constructor(message: string, code: number, status: string) {
    super(message);
    this.name = 'LinkedInAnalyticsError';
    this.code = code;
    this.status = status;
  }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createLinkedInAnalyticsClient(accessToken: string): LinkedInAnalyticsClient {
  return new LinkedInAnalyticsClient({ accessToken });
}
