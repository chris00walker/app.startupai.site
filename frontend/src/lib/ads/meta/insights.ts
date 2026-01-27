/**
 * Meta Marketing API Insights Client
 *
 * Fetches performance metrics from Meta Insights API for evidence collection.
 * Supports daily breakdowns, conversion tracking, and benchmark comparison.
 *
 * @story US-AP06
 */

import type { MetaApiResponse } from './types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Fields available from Meta Insights API
 */
export const INSIGHTS_FIELDS = [
  'impressions',
  'reach',
  'frequency',
  'clicks',
  'unique_clicks',
  'ctr',
  'spend',
  'cpc',
  'cpm',
  'actions',
  'action_values',
  'cost_per_action_type',
  'conversions',
  'cost_per_conversion',
] as const;

/**
 * Raw insight row from Meta API
 */
export interface MetaInsightRow {
  date_start: string;
  date_stop: string;
  impressions: string;
  reach: string;
  frequency: string;
  clicks: string;
  unique_clicks: string;
  ctr: string;
  spend: string;
  cpc: string;
  cpm: string;
  actions?: MetaAction[];
  action_values?: MetaActionValue[];
  cost_per_action_type?: MetaCostPerAction[];
}

/**
 * Meta action (conversion event)
 */
export interface MetaAction {
  action_type: string;
  value: string;
}

/**
 * Meta action value (revenue)
 */
export interface MetaActionValue {
  action_type: string;
  value: string;
}

/**
 * Meta cost per action
 */
export interface MetaCostPerAction {
  action_type: string;
  value: string;
}

/**
 * Parsed insight data with proper types
 */
export interface ParsedInsight {
  date: string;
  impressions: number;
  reach: number;
  frequency: number;
  clicks: number;
  uniqueClicks: number;
  ctr: number;
  spendCents: number;
  cpcCents: number;
  cpmCents: number;
  landingPageViews: number;
  formSubmissions: number;
  leads: number;
  purchases: number;
  costPerLeadCents: number;
  costPerPurchaseCents: number;
}

/**
 * Date presets for insights queries
 */
export type DatePreset =
  | 'today'
  | 'yesterday'
  | 'last_3d'
  | 'last_7d'
  | 'last_14d'
  | 'last_28d'
  | 'last_30d'
  | 'last_90d'
  | 'this_week_sun_today'
  | 'this_week_mon_today'
  | 'this_month'
  | 'last_month';

/**
 * Insights query parameters
 */
export interface InsightsQueryParams {
  datePreset?: DatePreset;
  timeRange?: { since: string; until: string };
  timeIncrement?: 1 | 7 | 28 | 'monthly' | 'all_days';
  level?: 'ad' | 'adset' | 'campaign' | 'account';
  fields?: readonly string[];
}

// ============================================================================
// CLIENT CLASS
// ============================================================================

export class MetaInsightsClient {
  private accessToken: string;
  private apiVersion: string;
  private baseUrl: string;

  constructor(config: { accessToken: string; apiVersion?: string }) {
    this.accessToken = config.accessToken;
    this.apiVersion = config.apiVersion || 'v21.0';
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private async request<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}${endpoint.includes('?') ? '&' : '?'}access_token=${this.accessToken}`;

    const response = await fetch(url);
    const data = (await response.json()) as MetaApiResponse<T>;

    if (data.error) {
      throw new MetaInsightsError(data.error.message, data.error.code, data.error.type);
    }

    return data.data || (data as unknown as T);
  }

  /**
   * Parse Meta API dollar values to cents
   */
  private dollarsToCents(value: string | number | undefined): number {
    if (!value) return 0;
    const dollars = typeof value === 'string' ? parseFloat(value) : value;
    return Math.round(dollars * 100);
  }

  /**
   * Parse insights row into structured data
   */
  private parseInsightRow(row: MetaInsightRow): ParsedInsight {
    // Extract action counts by type
    const getActionCount = (actionType: string): number => {
      const action = row.actions?.find((a) => a.action_type === actionType);
      return action ? parseInt(action.value, 10) : 0;
    };

    // Extract cost per action by type
    const getCostPerAction = (actionType: string): number => {
      const cost = row.cost_per_action_type?.find((c) => c.action_type === actionType);
      return cost ? this.dollarsToCents(cost.value) : 0;
    };

    return {
      date: row.date_start,
      impressions: parseInt(row.impressions || '0', 10),
      reach: parseInt(row.reach || '0', 10),
      frequency: parseFloat(row.frequency || '0'),
      clicks: parseInt(row.clicks || '0', 10),
      uniqueClicks: parseInt(row.unique_clicks || '0', 10),
      ctr: parseFloat(row.ctr || '0'),
      spendCents: this.dollarsToCents(row.spend),
      cpcCents: this.dollarsToCents(row.cpc),
      cpmCents: this.dollarsToCents(row.cpm),
      landingPageViews: getActionCount('landing_page_view'),
      formSubmissions: getActionCount('leadgen.other') + getActionCount('lead'),
      leads: getActionCount('lead'),
      purchases: getActionCount('purchase'),
      costPerLeadCents: getCostPerAction('lead'),
      costPerPurchaseCents: getCostPerAction('purchase'),
    };
  }

  // ============================================================================
  // PUBLIC METHODS
  // ============================================================================

  /**
   * Get campaign insights with daily breakdown
   */
  async getCampaignInsights(
    campaignId: string,
    params: InsightsQueryParams = {}
  ): Promise<ParsedInsight[]> {
    const {
      datePreset = 'last_7d',
      timeRange,
      timeIncrement = 1,
      fields = INSIGHTS_FIELDS,
    } = params;

    let endpoint = `/${campaignId}/insights?fields=${fields.join(',')}`;

    if (timeRange) {
      endpoint += `&time_range=${JSON.stringify(timeRange)}`;
    } else {
      endpoint += `&date_preset=${datePreset}`;
    }

    endpoint += `&time_increment=${timeIncrement}`;

    const response = await this.request<MetaInsightRow[]>(endpoint);

    return (response || []).map((row) => this.parseInsightRow(row));
  }

  /**
   * Get ad set insights with daily breakdown
   */
  async getAdSetInsights(
    adSetId: string,
    params: InsightsQueryParams = {}
  ): Promise<ParsedInsight[]> {
    const {
      datePreset = 'last_7d',
      timeRange,
      timeIncrement = 1,
      fields = INSIGHTS_FIELDS,
    } = params;

    let endpoint = `/${adSetId}/insights?fields=${fields.join(',')}`;

    if (timeRange) {
      endpoint += `&time_range=${JSON.stringify(timeRange)}`;
    } else {
      endpoint += `&date_preset=${datePreset}`;
    }

    endpoint += `&time_increment=${timeIncrement}`;

    const response = await this.request<MetaInsightRow[]>(endpoint);

    return (response || []).map((row) => this.parseInsightRow(row));
  }

  /**
   * Get ad insights with daily breakdown
   */
  async getAdInsights(adId: string, params: InsightsQueryParams = {}): Promise<ParsedInsight[]> {
    const {
      datePreset = 'last_7d',
      timeRange,
      timeIncrement = 1,
      fields = INSIGHTS_FIELDS,
    } = params;

    let endpoint = `/${adId}/insights?fields=${fields.join(',')}`;

    if (timeRange) {
      endpoint += `&time_range=${JSON.stringify(timeRange)}`;
    } else {
      endpoint += `&date_preset=${datePreset}`;
    }

    endpoint += `&time_increment=${timeIncrement}`;

    const response = await this.request<MetaInsightRow[]>(endpoint);

    return (response || []).map((row) => this.parseInsightRow(row));
  }

  /**
   * Get aggregated totals for a campaign (no daily breakdown)
   */
  async getCampaignTotals(
    campaignId: string,
    datePreset: DatePreset = 'last_7d'
  ): Promise<ParsedInsight | null> {
    const endpoint = `/${campaignId}/insights?fields=${INSIGHTS_FIELDS.join(',')}&date_preset=${datePreset}&time_increment=all_days`;

    const response = await this.request<MetaInsightRow[]>(endpoint);

    if (!response || response.length === 0) {
      return null;
    }

    return this.parseInsightRow(response[0]);
  }

  /**
   * Get insights for all ads in a campaign
   */
  async getCampaignAdsInsights(
    campaignId: string,
    params: InsightsQueryParams = {}
  ): Promise<Array<{ adId: string; insights: ParsedInsight[] }>> {
    const {
      datePreset = 'last_7d',
      timeIncrement = 1,
      fields = INSIGHTS_FIELDS,
    } = params;

    // First get all ads in the campaign
    const adsEndpoint = `/${campaignId}/ads?fields=id,name`;
    const adsResponse = await this.request<Array<{ id: string; name: string }>>(adsEndpoint);

    if (!adsResponse || adsResponse.length === 0) {
      return [];
    }

    // Get insights for each ad
    const results = await Promise.all(
      adsResponse.map(async (ad) => {
        const insights = await this.getAdInsights(ad.id, {
          datePreset,
          timeIncrement,
          fields,
        });
        return { adId: ad.id, insights };
      })
    );

    return results;
  }
}

// ============================================================================
// CUSTOM ERROR
// ============================================================================

export class MetaInsightsError extends Error {
  code: number;
  type: string;

  constructor(message: string, code: number, type: string) {
    super(message);
    this.name = 'MetaInsightsError';
    this.code = code;
    this.type = type;
  }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createMetaInsightsClient(accessToken: string): MetaInsightsClient {
  return new MetaInsightsClient({ accessToken });
}
