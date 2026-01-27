/**
 * Meta Marketing API Module
 *
 * @story US-AP03, US-AP06
 */

export { MetaAdsClient, MetaApiError, createMetaAdsClient } from './client';
export {
  MetaInsightsClient,
  MetaInsightsError,
  createMetaInsightsClient,
  INSIGHTS_FIELDS,
} from './insights';
export type {
  MetaCampaign,
  MetaAdSet,
  MetaAdCreative,
  MetaAd,
  MetaAdPreview,
  MetaTargeting,
  CampaignCreationResult,
  CreateCampaignParams,
  CreateAdSetParams,
  CreateFlexibleCreativeParams,
  CreateAdParams,
  AdFormat,
  CampaignObjective,
  CampaignStatus,
  AdSetStatus,
  AdStatus,
  EffectiveStatus,
  BUDGET_LIMITS,
} from './types';
export type {
  ParsedInsight,
  InsightsQueryParams,
  DatePreset,
  MetaInsightRow,
  MetaAction,
} from './insights';
