/**
 * Evidence Explorer Types
 *
 * Types for the unified Evidence Explorer that combines:
 * 1. User-created evidence from the `evidence` table
 * 2. AI-generated evidence from `crewai_validation_states` JSONB columns
 *
 * These types support the Evidence Explorer page at /project/[id]/evidence
 */

import type { Evidence } from '@/db/schema/evidence'
import type {
  DesirabilityEvidence,
  FeasibilityEvidence,
  ViabilityEvidence,
  DesirabilitySignal,
  FeasibilitySignal,
  ViabilitySignal,
  EvidenceStrength,
} from '@/types/crewai'

// =======================================================================================
// CORE TYPES
// =======================================================================================

export type EvidenceDimension = 'desirability' | 'feasibility' | 'viability'
export type EvidenceSource = 'user' | 'ai'

/**
 * User-created evidence item from the `evidence` table
 */
export interface UserEvidenceItem {
  source: 'user'
  id: string
  data: Evidence
  timestamp: Date
  dimension: EvidenceDimension
  title: string
  strength: 'weak' | 'medium' | 'strong'
  isContradiction: boolean
  category: 'Survey' | 'Interview' | 'Experiment' | 'Analytics' | 'Research'
}

/**
 * AI-generated evidence item from CrewAI validation states
 */
export interface AIEvidenceItem {
  source: 'ai'
  id: string
  dimension: EvidenceDimension
  signal: DesirabilitySignal | FeasibilitySignal | ViabilitySignal
  evidence: DesirabilityEvidence | FeasibilityEvidence | ViabilityEvidence
  timestamp: Date
  title: string
  strength: 'weak' | 'medium' | 'strong'
  iteration: number
  validationStateId: string
}

/**
 * Union type for unified evidence display
 */
export type UnifiedEvidenceItem = UserEvidenceItem | AIEvidenceItem

// =======================================================================================
// FILTER TYPES
// =======================================================================================

export interface EvidenceFilters {
  dimension: 'all' | EvidenceDimension
  search: string
  strength: 'all' | 'weak' | 'medium' | 'strong'
  source: 'all' | EvidenceSource
  dateRange: { start: Date; end: Date } | null
  showContradictions: boolean
}

export const DEFAULT_EVIDENCE_FILTERS: EvidenceFilters = {
  dimension: 'all',
  search: '',
  strength: 'all',
  source: 'all',
  dateRange: null,
  showContradictions: false,
}

// =======================================================================================
// TREND & ANALYTICS TYPES
// =======================================================================================

export interface TrendDataPoint {
  date: string
  desirability: number
  feasibility: number
  viability: number
  evidenceCount: number
  iteration: number
}

export interface EvidenceSummary {
  total: number
  byDimension: {
    desirability: number
    feasibility: number
    viability: number
  }
  byStrength: {
    weak: number
    medium: number
    strong: number
  }
  bySource: {
    user: number
    ai: number
  }
  contradictions: number
}

// =======================================================================================
// DISPLAY CONFIGURATION
// =======================================================================================

/**
 * Configuration for dimension-specific display
 */
export interface DimensionConfig {
  label: string
  color: string
  borderColor: string
  bgColor: string
  icon: string
  description: string
}

export const DIMENSION_CONFIG: Record<EvidenceDimension, DimensionConfig> = {
  desirability: {
    label: 'Desirability',
    color: 'text-pink-600',
    borderColor: 'border-l-pink-500',
    bgColor: 'bg-pink-50',
    icon: 'Heart',
    description: 'Do customers want this? Customer demand and problem-solution fit.',
  },
  feasibility: {
    label: 'Feasibility',
    color: 'text-blue-600',
    borderColor: 'border-l-blue-500',
    bgColor: 'bg-blue-50',
    icon: 'Cog',
    description: 'Can we build this? Technical viability and resource constraints.',
  },
  viability: {
    label: 'Viability',
    color: 'text-green-600',
    borderColor: 'border-l-green-500',
    bgColor: 'bg-green-50',
    icon: 'DollarSign',
    description: 'Should we do this? Unit economics and financial sustainability.',
  },
}

/**
 * Evidence strength display configuration
 */
export interface StrengthConfig {
  label: string
  color: string
  bgColor: string
  description: string
}

export const STRENGTH_CONFIG: Record<'weak' | 'medium' | 'strong', StrengthConfig> = {
  weak: {
    label: 'Weak',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    description: 'Early indicator, verbal interest only, or limited data points.',
  },
  medium: {
    label: 'Medium',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    description: 'Some behavioral signal, but not yet conclusive.',
  },
  strong: {
    label: 'Strong',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    description: 'Clear behavioral commitment evidence with statistical significance.',
  },
}

// =======================================================================================
// SIGNAL TO STRENGTH MAPPING
// =======================================================================================

/**
 * Map AI signal values to evidence strength
 */
export function signalToStrength(
  signal: DesirabilitySignal | FeasibilitySignal | ViabilitySignal
): 'weak' | 'medium' | 'strong' {
  // Desirability signals
  if (signal === 'strong_commitment') return 'strong'
  if (signal === 'weak_interest') return 'medium'
  if (signal === 'no_interest' || signal === 'no_signal') return 'weak'

  // Feasibility signals
  if (signal === 'green') return 'strong'
  if (signal === 'orange_constrained') return 'medium'
  if (signal === 'red_impossible' || signal === 'unknown') return 'weak'

  // Viability signals
  if (signal === 'profitable') return 'strong'
  if (signal === 'marginal') return 'medium'
  if (signal === 'underwater' || signal === 'zombie_market' || signal === 'unknown') return 'weak'

  return 'weak'
}

/**
 * Map AI signal to numeric value for trend charts (0-4 scale)
 */
export function signalToNumeric(
  signal: DesirabilitySignal | FeasibilitySignal | ViabilitySignal
): number {
  const signalValues: Record<string, number> = {
    // Desirability (0-3)
    no_signal: 0,
    no_interest: 1,
    weak_interest: 2,
    strong_commitment: 3,
    // Feasibility (0-3)
    unknown: 0,
    red_impossible: 1,
    orange_constrained: 2,
    green: 3,
    // Viability (0-4)
    underwater: 1,
    zombie_market: 1.5,
    marginal: 2,
    profitable: 3,
  }
  return signalValues[signal] ?? 0
}

/**
 * Get signal display info for UI
 */
export function getSignalDisplayInfo(
  signal: DesirabilitySignal | FeasibilitySignal | ViabilitySignal,
  dimension: EvidenceDimension
): { label: string; description: string } {
  const signalInfo: Record<string, { label: string; description: string }> = {
    // Desirability
    no_signal: { label: 'No Signal', description: 'Not yet tested' },
    no_interest: { label: 'No Interest', description: 'Low traffic/signup - wrong segment?' },
    weak_interest: { label: 'Weak Interest', description: 'High CTR but low conversion - zombies detected' },
    strong_commitment: { label: 'Strong Commitment', description: 'Strong signup/preorder evidence' },
    // Feasibility
    unknown: { label: 'Unknown', description: 'Not yet assessed' },
    green: { label: 'Green', description: 'Feasible with current resources' },
    orange_constrained: { label: 'Constrained', description: 'Feasible only with scope reduction' },
    red_impossible: { label: 'Impossible', description: 'Cannot build with available resources' },
    // Viability
    profitable: { label: 'Profitable', description: 'LTV/CAC >= 3 with healthy margins' },
    marginal: { label: 'Marginal', description: 'LTV/CAC between 1-3, needs optimization' },
    underwater: { label: 'Underwater', description: 'CAC > LTV, bleeding money' },
    zombie_market: { label: 'Zombie Market', description: 'Unit economics work but TAM too small' },
  }
  return signalInfo[signal] ?? { label: signal, description: '' }
}

// =======================================================================================
// METHODOLOGY TOOLTIPS
// =======================================================================================

/**
 * Strategyzer methodology context for evidence metrics
 */
export const METHODOLOGY_TOOLTIPS = {
  // Desirability
  problem_resonance: {
    title: 'Problem Resonance',
    description: 'How strongly the problem resonates with target customers (0-100%).',
    methodology: 'From Testing Business Ideas: Measures "Job to be Done" alignment.',
    threshold: { good: 60, warning: 30 },
  },
  conversion_rate: {
    title: 'Conversion Rate',
    description: 'Percentage of visitors who take the desired action (signup, purchase).',
    methodology: 'Key metric for Desirability validation. Higher = stronger demand signal.',
    threshold: { good: 10, warning: 3 },
  },
  commitment_depth: {
    title: 'Commitment Depth',
    description: 'Level of customer commitment demonstrated.',
    methodology: '"Skin in Game" (money/time) > Verbal interest > No commitment.',
    levels: ['Skin in Game', 'Verbal Only', 'None'],
  },
  zombie_ratio: {
    title: 'Zombie Ratio',
    description: 'Percentage showing interest but failing to commit.',
    methodology: 'High ratio indicates Value Proposition or Segment mismatch.',
    threshold: { good: 10, warning: 30 },
  },

  // Feasibility
  core_features_feasible: {
    title: 'Core Features Feasibility',
    description: 'Assessment of each feature\'s buildability.',
    methodology: 'POSSIBLE = can build, CONSTRAINED = needs scope reduction, IMPOSSIBLE = cannot build.',
  },
  technical_risks: {
    title: 'Technical Risks',
    description: 'Identified risks that could block or delay implementation.',
    methodology: 'Address risks before committing resources.',
  },
  monthly_cost_estimate: {
    title: 'Monthly Cost Estimate',
    description: 'Estimated infrastructure and API costs per month.',
    methodology: 'Factor into Viability calculations.',
  },

  // Viability
  ltv_cac_ratio: {
    title: 'LTV/CAC Ratio',
    description: 'Lifetime Value divided by Customer Acquisition Cost.',
    methodology: 'Healthy: >= 3x. Marginal: 1-3x. Underwater: < 1x.',
    threshold: { good: 3, warning: 1 },
  },
  gross_margin: {
    title: 'Gross Margin',
    description: 'Revenue minus cost of goods sold, as percentage.',
    methodology: 'SaaS benchmarks: 60-80%. Below 40% is concerning.',
    threshold: { good: 60, warning: 40 },
  },
  payback_months: {
    title: 'Payback Period',
    description: 'Months to recover customer acquisition cost.',
    methodology: 'Good: < 12 months. Concerning: > 24 months.',
    threshold: { good: 12, warning: 24 },
  },
  tam_usd: {
    title: 'Total Addressable Market',
    description: 'Annual revenue potential if you captured 100% market share.',
    methodology: 'Consider Serviceable Obtainable Market (SOM) for realistic targets.',
  },
} as const

export type MetricKey = keyof typeof METHODOLOGY_TOOLTIPS
