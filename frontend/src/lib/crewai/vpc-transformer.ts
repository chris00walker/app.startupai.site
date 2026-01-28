/**
 * VPC Transformer
 *
 * Transforms CrewAI Value Proposition Canvas data to UI component format.
 * @story US-F06
 * IMPORTANT: Preserves all rich data from the CrewAI backend including:
 * - CustomerJob dimensions (functional, emotional, social, importance)
 * - Pain/Gain intensity and importance mappings
 * - Pain reliever and gain creator relationships (dictionaries)
 * - Resonance scores and differentiators
 *
 * Source of truth: startupai-crew/src/startupai/flows/state_schemas.py
 */

import type {
  CustomerProfile,
  CustomerJob,
  ValueMap,
} from '@/types/crewai';

// =======================================================================================
// CREWAI INPUT FORMATS (from database/webhook - matches backend schema)
// =======================================================================================

/**
 * CrewAI CustomerProfile as stored in crewai_validation_states table.
 * Mirrors: CustomerProfile from state_schemas.py
 */
export interface CrewAICustomerProfile {
  segment_name: string;
  jobs: CustomerJob[];
  pains: string[];
  gains: string[];
  pain_intensity: Record<string, number>;   // Pain -> intensity (1-10)
  gain_importance: Record<string, number>;  // Gain -> importance (1-10)
  resonance_score?: number;                 // 0-1, from testing
}

/**
 * CrewAI ValueMap as stored in crewai_validation_states table.
 * Mirrors: ValueMap from state_schemas.py
 */
export interface CrewAIValueMap {
  products_services: string[];
  pain_relievers: Record<string, string>;   // Pain -> How we relieve it
  gain_creators: Record<string, string>;    // Gain -> How we create it
  differentiators: string[];
}

/**
 * A single VPC segment from CrewAI (customer profile + value map pair)
 */
export interface CrewAIVPCSegment {
  customer_profile: CrewAICustomerProfile | null;
  value_map: CrewAIValueMap | null;
}

/**
 * Full VPC data from CrewAI - keyed by segment name
 */
export interface CrewAIVPCData {
  customer_profiles: Record<string, CrewAICustomerProfile>;
  value_maps: Record<string, CrewAIValueMap>;
}

// =======================================================================================
// UI OUTPUT FORMATS (for React components)
// =======================================================================================

/**
 * A single customer job with all three dimensions.
 * Jobs to be Done framework: functional, emotional, social.
 */
export interface VPCJob {
  functional: string;
  emotional: string;
  social: string;
  importance: number;  // 1-10
}

/**
 * A pain point with optional intensity score.
 */
export interface VPCPain {
  description: string;
  intensity?: number;  // 1-10
  reliever?: string;   // How the value prop relieves this pain
}

/**
 * A gain with optional importance score.
 */
export interface VPCGain {
  description: string;
  importance?: number;  // 1-10
  creator?: string;     // How the value prop creates this gain
}

/**
 * Complete UI-ready VPC segment with all data.
 */
export interface VPCUISegment {
  // Identity
  segmentKey: string;
  segmentName: string;
  valuePropositionTitle: string;
  customerSegmentTitle: string;

  // Customer Profile (right side of VPC)
  customerProfile: {
    jobs: VPCJob[];
    pains: VPCPain[];
    gains: VPCGain[];
    resonanceScore?: number;  // 0-1, overall fit from testing
  };

  // Value Map (left side of VPC)
  valueMap: {
    productsAndServices: string[];
    painRelievers: Record<string, string>;  // Pain -> Relief (preserves dict)
    gainCreators: Record<string, string>;   // Gain -> Creator (preserves dict)
    differentiators: string[];
  };

  // Computed fit indicators
  fit: {
    painsAddressed: number;      // Count of pains with relievers
    gainsCreated: number;        // Count of gains with creators
    totalPains: number;
    totalGains: number;
    fitScore: number;            // 0-1, computed fit
  };
}

/**
 * Legacy simplified format for backward compatibility.
 * Used by components that haven't been upgraded yet.
 */
export interface VPCUISegmentSimple {
  segmentName: string;
  segmentKey: string;
  valuePropositionTitle: string;
  customerSegmentTitle: string;
  valueMap: {
    productsAndServices: string[];
    gainCreators: string[];
    painRelievers: string[];
  };
  customerProfile: {
    gains: string[];
    pains: string[];
    jobs: string[];
  };
}

// =======================================================================================
// TRANSFORMATION FUNCTIONS
// =======================================================================================

/**
 * Format a segment key to a human-readable title
 * e.g., "small_business_owners" -> "Small Business Owners"
 */
export function formatSegmentTitle(segmentKey: string): string {
  return segmentKey
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Transform a single segment's data to the rich UI format.
 */
export function transformSegment(
  segmentKey: string,
  customerProfile: CrewAICustomerProfile | null,
  valueMap: CrewAIValueMap | null
): VPCUISegment {
  const segmentTitle = formatSegmentTitle(segmentKey);

  // Default empty structures
  const defaultProfile: CrewAICustomerProfile = {
    segment_name: segmentKey,
    jobs: [],
    pains: [],
    gains: [],
    pain_intensity: {},
    gain_importance: {},
  };

  const defaultValueMap: CrewAIValueMap = {
    products_services: [],
    pain_relievers: {},
    gain_creators: {},
    differentiators: [],
  };

  const profile = customerProfile || defaultProfile;
  const vMap = valueMap || defaultValueMap;

  // Transform jobs - preserve full structure
  const jobs: VPCJob[] = (profile.jobs || []).map((job) => {
    if (typeof job === 'string') {
      // Legacy format: single string job
      return {
        functional: job,
        emotional: '',
        social: '',
        importance: 5,
      };
    }
    return {
      functional: job.functional || '',
      emotional: job.emotional || '',
      social: job.social || '',
      importance: job.importance || 5,
    };
  });

  // Transform pains with intensity and reliever mapping
  const pains: VPCPain[] = (profile.pains || []).map((pain) => ({
    description: pain,
    intensity: profile.pain_intensity?.[pain],
    reliever: vMap.pain_relievers?.[pain],
  }));

  // Transform gains with importance and creator mapping
  const gains: VPCGain[] = (profile.gains || []).map((gain) => ({
    description: gain,
    importance: profile.gain_importance?.[gain],
    creator: vMap.gain_creators?.[gain],
  }));

  // Calculate fit metrics
  const painsAddressed = pains.filter((p) => p.reliever).length;
  const gainsCreated = gains.filter((g) => g.creator).length;
  const totalPains = pains.length;
  const totalGains = gains.length;
  const fitScore =
    totalPains + totalGains > 0
      ? (painsAddressed + gainsCreated) / (totalPains + totalGains)
      : 0;

  return {
    segmentKey,
    segmentName: profile.segment_name || segmentTitle,
    valuePropositionTitle: `Value Proposition for ${segmentTitle}`,
    customerSegmentTitle: segmentTitle,
    customerProfile: {
      jobs,
      pains,
      gains,
      resonanceScore: profile.resonance_score,
    },
    valueMap: {
      productsAndServices: vMap.products_services || [],
      painRelievers: vMap.pain_relievers || {},
      gainCreators: vMap.gain_creators || {},
      differentiators: vMap.differentiators || [],
    },
    fit: {
      painsAddressed,
      gainsCreated,
      totalPains,
      totalGains,
      fitScore,
    },
  };
}

/**
 * Transform CrewAI VPC data to rich UI format.
 * Returns an array of segments with all data preserved.
 */
export function transformCrewAIToVPC(
  data: CrewAIVPCData | null | undefined
): VPCUISegment[] {
  if (!data) {
    return [];
  }

  const customerProfiles = data.customer_profiles || {};
  const valueMaps = data.value_maps || {};

  // Get all unique segment keys from both profiles and maps
  const segmentKeys = new Set([
    ...Object.keys(customerProfiles),
    ...Object.keys(valueMaps),
  ]);

  if (segmentKeys.size === 0) {
    return [];
  }

  return Array.from(segmentKeys).map((key) =>
    transformSegment(key, customerProfiles[key] || null, valueMaps[key] || null)
  );
}

/**
 * Transform to legacy simple format for backward compatibility.
 * USE THIS ONLY for components that haven't been upgraded yet.
 */
export function transformCrewAIToVPCSimple(
  data: CrewAIVPCData | null | undefined
): VPCUISegmentSimple[] {
  const richSegments = transformCrewAIToVPC(data);

  return richSegments.map((segment) => ({
    segmentName: segment.segmentName,
    segmentKey: segment.segmentKey,
    valuePropositionTitle: segment.valuePropositionTitle,
    customerSegmentTitle: segment.customerSegmentTitle,
    valueMap: {
      productsAndServices: segment.valueMap.productsAndServices,
      gainCreators: Object.values(segment.valueMap.gainCreators),
      painRelievers: Object.values(segment.valueMap.painRelievers),
    },
    customerProfile: {
      gains: segment.customerProfile.gains.map((g) => g.description),
      pains: segment.customerProfile.pains.map((p) => p.description),
      jobs: segment.customerProfile.jobs.map((j) =>
        j.functional || `${j.emotional} (emotional)` || `${j.social} (social)`
      ),
    },
  }));
}

// =======================================================================================
// UTILITY FUNCTIONS
// =======================================================================================

/**
 * Get segment names from CrewAI VPC data.
 */
export function getSegmentNames(
  data: CrewAIVPCData | null | undefined
): string[] {
  if (!data) {
    return [];
  }
  const customerProfiles = data.customer_profiles || {};
  const valueMaps = data.value_maps || {};
  const segmentKeys = new Set([
    ...Object.keys(customerProfiles),
    ...Object.keys(valueMaps),
  ]);
  return Array.from(segmentKeys).map(formatSegmentTitle);
}

/**
 * Check if a VPC segment has meaningful data.
 */
export function hasSegmentData(segment: VPCUISegment): boolean {
  const hasCustomerData =
    segment.customerProfile.jobs.length > 0 ||
    segment.customerProfile.pains.length > 0 ||
    segment.customerProfile.gains.length > 0;

  const hasValueMapData =
    segment.valueMap.productsAndServices.length > 0 ||
    Object.keys(segment.valueMap.painRelievers).length > 0 ||
    Object.keys(segment.valueMap.gainCreators).length > 0 ||
    segment.valueMap.differentiators.length > 0;

  return hasCustomerData || hasValueMapData;
}

/**
 * Count total items in a VPC segment.
 */
export function countSegmentItems(segment: VPCUISegment): number {
  return (
    segment.customerProfile.jobs.length +
    segment.customerProfile.pains.length +
    segment.customerProfile.gains.length +
    segment.valueMap.productsAndServices.length +
    Object.keys(segment.valueMap.painRelievers).length +
    Object.keys(segment.valueMap.gainCreators).length +
    segment.valueMap.differentiators.length
  );
}

/**
 * Get intensity color for visual indicators.
 */
export function getIntensityColor(intensity: number | undefined): string {
  if (intensity === undefined) return 'gray';
  if (intensity >= 8) return 'red';
  if (intensity >= 5) return 'orange';
  if (intensity >= 3) return 'yellow';
  return 'green';
}

/**
 * Get importance color for visual indicators.
 */
export function getImportanceColor(importance: number | undefined): string {
  if (importance === undefined) return 'gray';
  if (importance >= 8) return 'emerald';
  if (importance >= 5) return 'blue';
  if (importance >= 3) return 'slate';
  return 'gray';
}

/**
 * Calculate fit percentage for display.
 */
export function getFitPercentage(segment: VPCUISegment): number {
  return Math.round(segment.fit.fitScore * 100);
}

/**
 * Get fit status label.
 */
export function getFitStatus(segment: VPCUISegment): 'strong' | 'partial' | 'weak' | 'none' {
  const fitScore = segment.fit.fitScore;
  if (fitScore >= 0.7) return 'strong';
  if (fitScore >= 0.4) return 'partial';
  if (fitScore > 0) return 'weak';
  return 'none';
}
