/**
 * Google Ads Reporting API Client
 *
 * Fetches performance metrics from Google Ads Reporting API for evidence collection.
 * Uses GAQL (Google Ads Query Language) for flexible reporting.
 *
 * @story US-AP07
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Metrics available from Google Ads API
 */
export interface GoogleMetricsRow {
  campaign: {
    id: string;
    name: string;
    status: string;
  };
  adGroup?: {
    id: string;
    name: string;
  };
  segments: {
    date: string; // YYYY-MM-DD
  };
  metrics: {
    impressions: string;
    clicks: string;
    ctr: string;
    averageCpc: string; // In micros
    costMicros: string;
    conversions: string;
    conversionsValue: string;
    costPerConversion: string; // In micros
    viewThroughConversions: string;
    allConversions: string;
    videoViews?: string;
    videoQuartileP25Rate?: string;
    videoQuartileP50Rate?: string;
    videoQuartileP75Rate?: string;
    videoQuartileP100Rate?: string;
  };
}

/**
 * Parsed insight with proper types
 */
export interface GoogleParsedInsight {
  date: string;
  campaignId: string;
  campaignName: string;
  impressions: number;
  clicks: number;
  ctr: number;
  cpcCents: number;
  spendCents: number;
  conversions: number;
  conversionsValue: number;
  costPerConversionCents: number;
  viewThroughConversions: number;
  allConversions: number;
}

/**
 * Date range for queries
 */
export interface GoogleDateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

/**
 * Query parameters
 */
export interface GoogleInsightsQueryParams {
  dateRange?: GoogleDateRange;
  segmentByDate?: boolean;
}

// ============================================================================
// CLIENT CLASS
// ============================================================================

export class GoogleInsightsClient {
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
    this.customerId = config.customerId.replace(/-/g, '');
    this.accessToken = config.accessToken;
    this.apiVersion = config.apiVersion || 'v17';
    this.baseUrl = `https://googleads.googleapis.com/${this.apiVersion}`;
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private async query<T>(gaql: string): Promise<T[]> {
    const url = `${this.baseUrl}/customers/${this.customerId}/googleAds:searchStream`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'developer-token': this.developerToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: gaql }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new GoogleInsightsError(
        error.error?.message || 'Google Ads API error',
        error.error?.code || response.status
      );
    }

    const data = await response.json();
    return (data.results || []) as T[];
  }

  /**
   * Convert micros to cents (1,000,000 micros = $1 = 100 cents)
   */
  private microsToCents(micros: string | number | undefined): number {
    if (!micros) return 0;
    const microsNum = typeof micros === 'string' ? parseInt(micros, 10) : micros;
    return Math.round(microsNum / 10000); // 1,000,000 micros = 100 cents
  }

  /**
   * Parse a metrics row into structured data
   */
  private parseRow(row: GoogleMetricsRow): GoogleParsedInsight {
    const m = row.metrics;
    return {
      date: row.segments.date,
      campaignId: row.campaign.id,
      campaignName: row.campaign.name,
      impressions: parseInt(m.impressions || '0', 10),
      clicks: parseInt(m.clicks || '0', 10),
      ctr: parseFloat(m.ctr || '0'),
      cpcCents: this.microsToCents(m.averageCpc),
      spendCents: this.microsToCents(m.costMicros),
      conversions: parseFloat(m.conversions || '0'),
      conversionsValue: parseFloat(m.conversionsValue || '0'),
      costPerConversionCents: this.microsToCents(m.costPerConversion),
      viewThroughConversions: parseFloat(m.viewThroughConversions || '0'),
      allConversions: parseFloat(m.allConversions || '0'),
    };
  }

  /**
   * Get date range string for GAQL
   */
  private getDateRangeCondition(dateRange?: GoogleDateRange): string {
    if (dateRange) {
      return `segments.date BETWEEN '${dateRange.startDate}' AND '${dateRange.endDate}'`;
    }
    // Default to last 7 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    return `segments.date BETWEEN '${startDate.toISOString().split('T')[0]}' AND '${endDate.toISOString().split('T')[0]}'`;
  }

  // ============================================================================
  // PUBLIC METHODS
  // ============================================================================

  /**
   * Get campaign performance with daily breakdown
   */
  async getCampaignInsights(
    campaignId: string,
    params: GoogleInsightsQueryParams = {}
  ): Promise<GoogleParsedInsight[]> {
    const dateCondition = this.getDateRangeCondition(params.dateRange);

    const gaql = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        segments.date,
        metrics.impressions,
        metrics.clicks,
        metrics.ctr,
        metrics.average_cpc,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value,
        metrics.cost_per_conversion,
        metrics.view_through_conversions,
        metrics.all_conversions
      FROM campaign
      WHERE campaign.id = '${campaignId}'
        AND ${dateCondition}
      ORDER BY segments.date DESC
    `;

    const results = await this.query<GoogleMetricsRow>(gaql);
    return results.map((row) => this.parseRow(row));
  }

  /**
   * Get all campaigns performance for the account
   */
  async getAllCampaignsInsights(
    params: GoogleInsightsQueryParams = {}
  ): Promise<GoogleParsedInsight[]> {
    const dateCondition = this.getDateRangeCondition(params.dateRange);

    const gaql = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        segments.date,
        metrics.impressions,
        metrics.clicks,
        metrics.ctr,
        metrics.average_cpc,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value,
        metrics.cost_per_conversion,
        metrics.view_through_conversions,
        metrics.all_conversions
      FROM campaign
      WHERE campaign.status = 'ENABLED'
        AND ${dateCondition}
      ORDER BY campaign.id, segments.date DESC
    `;

    const results = await this.query<GoogleMetricsRow>(gaql);
    return results.map((row) => this.parseRow(row));
  }

  /**
   * Get ad group level insights
   */
  async getAdGroupInsights(
    adGroupId: string,
    params: GoogleInsightsQueryParams = {}
  ): Promise<GoogleParsedInsight[]> {
    const dateCondition = this.getDateRangeCondition(params.dateRange);

    const gaql = `
      SELECT
        campaign.id,
        campaign.name,
        ad_group.id,
        ad_group.name,
        segments.date,
        metrics.impressions,
        metrics.clicks,
        metrics.ctr,
        metrics.average_cpc,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value,
        metrics.cost_per_conversion
      FROM ad_group
      WHERE ad_group.id = '${adGroupId}'
        AND ${dateCondition}
      ORDER BY segments.date DESC
    `;

    const results = await this.query<GoogleMetricsRow>(gaql);
    return results.map((row) => this.parseRow(row));
  }

  /**
   * Get aggregated totals for a campaign (no daily breakdown)
   */
  async getCampaignTotals(
    campaignId: string,
    params: GoogleInsightsQueryParams = {}
  ): Promise<GoogleParsedInsight | null> {
    const dateCondition = this.getDateRangeCondition(params.dateRange);

    const gaql = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        metrics.impressions,
        metrics.clicks,
        metrics.ctr,
        metrics.average_cpc,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value,
        metrics.cost_per_conversion,
        metrics.view_through_conversions,
        metrics.all_conversions
      FROM campaign
      WHERE campaign.id = '${campaignId}'
        AND ${dateCondition}
    `;

    const results = await this.query<GoogleMetricsRow>(gaql);
    if (results.length === 0) return null;

    // Aggregate all rows
    const totals = results.reduce(
      (acc, row) => {
        const m = row.metrics;
        return {
          impressions: acc.impressions + parseInt(m.impressions || '0', 10),
          clicks: acc.clicks + parseInt(m.clicks || '0', 10),
          costMicros: acc.costMicros + parseInt(m.costMicros || '0', 10),
          conversions: acc.conversions + parseFloat(m.conversions || '0'),
          conversionsValue: acc.conversionsValue + parseFloat(m.conversionsValue || '0'),
        };
      },
      { impressions: 0, clicks: 0, costMicros: 0, conversions: 0, conversionsValue: 0 }
    );

    return {
      date: params.dateRange?.endDate || new Date().toISOString().split('T')[0],
      campaignId: results[0].campaign.id,
      campaignName: results[0].campaign.name,
      impressions: totals.impressions,
      clicks: totals.clicks,
      ctr: totals.impressions > 0 ? totals.clicks / totals.impressions : 0,
      cpcCents: totals.clicks > 0 ? this.microsToCents(totals.costMicros / totals.clicks) : 0,
      spendCents: this.microsToCents(totals.costMicros),
      conversions: totals.conversions,
      conversionsValue: totals.conversionsValue,
      costPerConversionCents:
        totals.conversions > 0 ? this.microsToCents(totals.costMicros / totals.conversions) : 0,
      viewThroughConversions: 0,
      allConversions: totals.conversions,
    };
  }
}

// ============================================================================
// CUSTOM ERROR
// ============================================================================

export class GoogleInsightsError extends Error {
  code: number;

  constructor(message: string, code: number) {
    super(message);
    this.name = 'GoogleInsightsError';
    this.code = code;
  }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createGoogleInsightsClient(config: {
  developerToken: string;
  customerId: string;
  accessToken: string;
}): GoogleInsightsClient {
  return new GoogleInsightsClient(config);
}
