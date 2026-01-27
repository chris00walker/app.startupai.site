/**
 * Meta Marketing API Module
 *
 * @story US-AP03
 */

export { MetaAdsClient, MetaApiError, createMetaAdsClient } from './client';
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
