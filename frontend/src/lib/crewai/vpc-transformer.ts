/**
 * VPC Transformer
 *
 * Transforms CrewAI Value Proposition Canvas data (snake_case)
 * to UI component format (camelCase).
 */

// CrewAI format (snake_case) - from database/webhook
export interface CrewAICustomerProfile {
  jobs?: string[];
  pains?: string[];
  gains?: string[];
}

export interface CrewAIValueMap {
  products_services?: string[];
  pain_relievers?: string[];
  gain_creators?: string[];
}

export interface CrewAIVPCSegment {
  customer_profile: CrewAICustomerProfile | null;
  value_map: CrewAIValueMap | null;
}

export interface CrewAIVPCData {
  [segmentName: string]: CrewAIVPCSegment;
}

// UI format (camelCase) - for ValuePropositionCanvas component
export interface VPCUISegment {
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

/**
 * Format a segment key to a human-readable title
 * e.g., "small_business_owners" → "Small Business Owners"
 */
export function formatSegmentTitle(segmentKey: string): string {
  return segmentKey
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Transform a single CrewAI VPC segment to UI format
 */
export function transformSegment(
  segmentKey: string,
  segment: CrewAIVPCSegment
): VPCUISegment {
  const customerProfile = segment.customer_profile || {};
  const valueMap = segment.value_map || {};
  const segmentTitle = formatSegmentTitle(segmentKey);

  return {
    segmentName: segmentTitle,
    segmentKey,
    valuePropositionTitle: `Value Proposition for ${segmentTitle}`,
    customerSegmentTitle: segmentTitle,
    valueMap: {
      productsAndServices: valueMap.products_services || [],
      gainCreators: valueMap.gain_creators || [],
      painRelievers: valueMap.pain_relievers || [],
    },
    customerProfile: {
      gains: customerProfile.gains || [],
      pains: customerProfile.pains || [],
      jobs: customerProfile.jobs || [],
    },
  };
}

/**
 * Transform CrewAI VPC data to UI format
 * Returns an array of segments, empty array if no data
 */
export function transformCrewAIToVPC(
  crewAIData: CrewAIVPCData | null | undefined
): VPCUISegment[] {
  if (!crewAIData || typeof crewAIData !== 'object') {
    return [];
  }

  const segmentKeys = Object.keys(crewAIData);
  if (segmentKeys.length === 0) {
    return [];
  }

  return segmentKeys.map((key) => transformSegment(key, crewAIData[key]));
}

/**
 * Get segment names from CrewAI VPC data
 */
export function getSegmentNames(
  crewAIData: CrewAIVPCData | null | undefined
): string[] {
  if (!crewAIData || typeof crewAIData !== 'object') {
    return [];
  }
  return Object.keys(crewAIData).map(formatSegmentTitle);
}

/**
 * Check if a VPC segment has meaningful data
 */
export function hasSegmentData(segment: VPCUISegment): boolean {
  const hasCustomerData =
    segment.customerProfile.jobs.length > 0 ||
    segment.customerProfile.pains.length > 0 ||
    segment.customerProfile.gains.length > 0;

  const hasValueMapData =
    segment.valueMap.productsAndServices.length > 0 ||
    segment.valueMap.painRelievers.length > 0 ||
    segment.valueMap.gainCreators.length > 0;

  return hasCustomerData || hasValueMapData;
}

/**
 * Count total items in a VPC segment
 */
export function countSegmentItems(segment: VPCUISegment): number {
  return (
    segment.customerProfile.jobs.length +
    segment.customerProfile.pains.length +
    segment.customerProfile.gains.length +
    segment.valueMap.productsAndServices.length +
    segment.valueMap.painRelievers.length +
    segment.valueMap.gainCreators.length
  );
}
