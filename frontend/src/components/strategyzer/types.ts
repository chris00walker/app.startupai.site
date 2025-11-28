/**
 * Strategyzer Component Types
 *
 * These types are aligned with CrewAI backend schemas while providing
 * transformation functions for the Supabase database layer.
 *
 * Source of truth: /frontend/src/types/crewai.ts (mirrors startupai-crew)
 */

import type {
  Assumption as CrewAIAssumption,
  AssumptionCategory,
  AssumptionStatus,
  EvidenceStrength,
  CommitmentType,
  CustomerProfile,
  ValueMap,
  ExperimentResult,
  DesirabilityEvidence,
  FeasibilityEvidence,
  ViabilityEvidence,
  DesirabilitySignal,
  FeasibilitySignal,
  ViabilitySignal,
  PivotType,
  Phase,
} from '@/types/crewai'

import {
  getPriorityCriticality,
  getAssumptionQuadrant as crewaiGetAssumptionQuadrant,
} from '@/types/crewai'

// Re-export CrewAI types for convenience
export type {
  AssumptionCategory,
  AssumptionStatus,
  EvidenceStrength,
  CommitmentType,
  CustomerProfile,
  ValueMap,
  ExperimentResult,
  DesirabilityEvidence,
  FeasibilityEvidence,
  ViabilityEvidence,
  DesirabilitySignal,
  FeasibilitySignal,
  ViabilitySignal,
  PivotType,
  Phase,
}

export { getPriorityCriticality }

// =======================================================================================
// ASSUMPTION (CrewAI-aligned)
// =======================================================================================

/**
 * Assumption type aligned with CrewAI's Assumption model
 * Uses priority (1-10) instead of importance (high/medium/low)
 */
export interface Assumption extends CrewAIAssumption {
  // Additional frontend/database fields
  created_at?: string
  updated_at?: string
  project_id?: string
  source?: string  // BMC or VPC section
}

/**
 * Quadrant classification for Assumption Map
 * Based on priority + status from CrewAI model
 */
export type AssumptionQuadrant = 'test-first' | 'validated' | 'park' | 'deprioritize'

// Legacy type alias for backward compatibility
export type MatrixQuadrant = AssumptionQuadrant

/**
 * Assumption Map quadrants configuration
 */
export const quadrantConfig: Record<AssumptionQuadrant, {
  label: string
  description: string
  action: string
  color: string
  textColor: string
  badgeColor: string
}> = {
  'test-first': {
    label: 'Test First',
    description: 'High priority (1-3), untested - critical assumptions to validate',
    action: 'Priority: Design experiments immediately',
    color: 'border-red-200 bg-red-50',
    textColor: 'text-red-900',
    badgeColor: 'bg-red-100 text-red-800',
  },
  'validated': {
    label: 'Validated',
    description: 'Assumptions confirmed through evidence',
    action: 'Share with stakeholders',
    color: 'border-green-200 bg-green-50',
    textColor: 'text-green-900',
    badgeColor: 'bg-green-100 text-green-800',
  },
  'park': {
    label: 'Park',
    description: 'Lower priority (4-10), untested - revisit after critical assumptions',
    action: 'Monitor, test later if needed',
    color: 'border-orange-200 bg-orange-50',
    textColor: 'text-orange-900',
    badgeColor: 'bg-orange-100 text-orange-800',
  },
  'deprioritize': {
    label: 'Deprioritize',
    description: 'Invalidated or no longer relevant',
    action: 'No action needed',
    color: 'border-gray-200 bg-gray-50',
    textColor: 'text-gray-700',
    badgeColor: 'bg-gray-100 text-gray-800',
  },
}

/**
 * Category configuration for assumption types (D-F-V)
 */
export const categoryConfig: Record<AssumptionCategory, {
  label: string
  color: string
  description: string
}> = {
  desirability: {
    label: 'Desirability',
    color: 'bg-pink-100 text-pink-800 border-pink-200',
    description: 'Do customers want this?',
  },
  feasibility: {
    label: 'Feasibility',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Can we build and deliver this?',
  },
  viability: {
    label: 'Viability',
    color: 'bg-green-100 text-green-800 border-green-200',
    description: 'Should we do this? Is it profitable?',
  },
}

/**
 * Priority configuration (CrewAI uses 1-10 scale)
 */
export const priorityConfig = {
  critical: { range: [1, 3], label: 'Critical', color: 'bg-red-100 text-red-800' },
  important: { range: [4, 7], label: 'Important', color: 'bg-orange-100 text-orange-800' },
  'nice-to-have': { range: [8, 10], label: 'Nice to Have', color: 'bg-gray-100 text-gray-800' },
} as const

/**
 * Evidence strength configuration (CrewAI: strong, weak, none)
 */
export const evidenceStrengthConfig: Record<EvidenceStrength, {
  label: string
  color: string
  description: string
}> = {
  strong: {
    label: 'Strong',
    color: 'bg-green-100 text-green-800',
    description: '>60% positive signal with behavioral commitment',
  },
  weak: {
    label: 'Weak',
    color: 'bg-yellow-100 text-yellow-800',
    description: '30-60% positive signal or verbal only',
  },
  none: {
    label: 'None',
    color: 'bg-gray-100 text-gray-800',
    description: '<30% positive signal or negative',
  },
}

/**
 * Status configuration
 */
export const statusConfig: Record<AssumptionStatus, {
  label: string
  color: string
}> = {
  untested: { label: 'Untested', color: 'bg-gray-100 text-gray-800' },
  testing: { label: 'Testing', color: 'bg-blue-100 text-blue-800' },
  validated: { label: 'Validated', color: 'bg-green-100 text-green-800' },
  invalidated: { label: 'Invalidated', color: 'bg-red-100 text-red-800' },
  revised: { label: 'Revised', color: 'bg-purple-100 text-purple-800' },
}

// =======================================================================================
// EXPERIMENT CARD (CrewAI-aligned)
// =======================================================================================

export type ExperimentStatus = 'draft' | 'planned' | 'running' | 'completed' | 'cancelled'

/**
 * Strategyzer Experiment - extends CrewAI ExperimentResult
 * with additional frontend/database tracking fields
 *
 * Core fields inherited from ExperimentResult:
 * - name, hypothesis, method, success_criteria, results, passed
 * - metric, expected_outcome, actual_outcome, cost_time, cost_money
 * - evidence_strength, assumption_id, learning_card_id, status
 * - start_date, end_date, owner
 */
export interface StrategyzerExperiment extends ExperimentResult {
  // Required fields for database operations
  id: string
  name: string
  status: ExperimentStatus  // Override to make required

  // Frontend/database specific fields
  project_id?: string
  actual_metric_value?: string  // The actual measured value (extends results)
  created_at?: string
  updated_at?: string
}

// Legacy type alias
export type StrategyzerExperimentCard = StrategyzerExperiment

/**
 * Experiment method configuration (from Testing Business Ideas)
 * Maps to CrewAI's experiment types with evidence strength
 */
export const experimentMethodConfig: Record<string, {
  label: string
  evidenceStrength: EvidenceStrength
  description: string
  costLevel: 'low' | 'medium' | 'high'
}> = {
  // Discovery experiments (weak evidence)
  desk_research: {
    label: 'Desk Research',
    evidenceStrength: 'weak',
    description: 'Secondary research, market analysis',
    costLevel: 'low',
  },
  expert_interview: {
    label: 'Expert Interview',
    evidenceStrength: 'weak',
    description: 'Conversations with industry experts',
    costLevel: 'low',
  },
  customer_interview: {
    label: 'Customer Interview',
    evidenceStrength: 'weak',
    description: 'Problem discovery conversations',
    costLevel: 'low',
  },
  survey: {
    label: 'Survey',
    evidenceStrength: 'weak',
    description: 'Quantitative data collection',
    costLevel: 'low',
  },
  // Validation experiments (strong evidence)
  landing_page: {
    label: 'Landing Page Test',
    evidenceStrength: 'strong',
    description: 'Measure interest through signups',
    costLevel: 'medium',
  },
  ad_campaign: {
    label: 'Ad Campaign',
    evidenceStrength: 'strong',
    description: 'Paid traffic to measure demand (CrewAI Growth Crew)',
    costLevel: 'medium',
  },
  smoke_test: {
    label: 'Smoke Test',
    evidenceStrength: 'strong',
    description: 'Fake door / coming soon page',
    costLevel: 'low',
  },
  pre_order: {
    label: 'Pre-order',
    evidenceStrength: 'strong',
    description: 'Collect payment before building',
    costLevel: 'medium',
  },
  letter_of_intent: {
    label: 'Letter of Intent',
    evidenceStrength: 'strong',
    description: 'Written commitment from customers',
    costLevel: 'low',
  },
  concierge_mvp: {
    label: 'Concierge MVP',
    evidenceStrength: 'strong',
    description: 'Manual service delivery',
    costLevel: 'high',
  },
  wizard_of_oz: {
    label: 'Wizard of Oz',
    evidenceStrength: 'strong',
    description: 'Human-powered prototype',
    costLevel: 'high',
  },
  prototype: {
    label: 'Prototype Test',
    evidenceStrength: 'strong',
    description: 'Functional prototype testing',
    costLevel: 'high',
  },
  mvp: {
    label: 'MVP',
    evidenceStrength: 'strong',
    description: 'Minimum viable product',
    costLevel: 'high',
  },
}

/**
 * Outcome configuration
 */
export const outcomeConfig = {
  pivot: { label: 'Pivot', color: 'bg-red-100 text-red-800', description: 'Major change needed' },
  iterate: { label: 'Iterate', color: 'bg-yellow-100 text-yellow-800', description: 'Minor adjustments' },
  kill: { label: 'Kill', color: 'bg-gray-100 text-gray-800', description: 'Stop pursuing this' },
} as const

// =======================================================================================
// LEARNING CARD
// =======================================================================================

/**
 * Learning Card - captures insights from experiments
 * Aligned with CrewAI's key_learnings pattern
 */
export interface LearningCard {
  id: string
  experiment_id: string
  project_id?: string

  // Core learnings
  what_we_learned: string
  what_surprised_us?: string
  observations?: string
  insights?: string

  // Evidence assessment (CrewAI alignment)
  evidence_strength: EvidenceStrength
  commitment_type?: CommitmentType

  // Decision
  decision: 'pivot' | 'iterate' | 'kill'
  assumption_validated?: boolean
  pivot_recommended?: PivotType
  pivot_rationale?: string

  // Next steps
  next_actions?: string[]

  // Metadata
  owner?: string
  decision_date?: string
  status: 'draft' | 'published'
  created_at?: string
  updated_at?: string
}

// =======================================================================================
// SIGNAL DISPLAY CONFIG (for Innovation Physics signals from CrewAI)
// =======================================================================================

export const signalConfig = {
  desirability: {
    no_signal: { label: 'Not Tested', color: 'text-gray-500', bgColor: 'bg-gray-100', icon: 'circle' },
    no_interest: { label: 'No Interest', color: 'text-red-600', bgColor: 'bg-red-100', icon: 'x-circle' },
    weak_interest: { label: 'Weak Interest (Zombies)', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: 'alert-triangle' },
    strong_commitment: { label: 'Strong Commitment', color: 'text-green-600', bgColor: 'bg-green-100', icon: 'check-circle' },
  },
  feasibility: {
    unknown: { label: 'Unknown', color: 'text-gray-500', bgColor: 'bg-gray-100', icon: 'circle' },
    green: { label: 'Feasible', color: 'text-green-600', bgColor: 'bg-green-100', icon: 'check-circle' },
    orange_constrained: { label: 'Constrained', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: 'alert-triangle' },
    red_impossible: { label: 'Impossible', color: 'text-red-600', bgColor: 'bg-red-100', icon: 'x-circle' },
  },
  viability: {
    unknown: { label: 'Unknown', color: 'text-gray-500', bgColor: 'bg-gray-100', icon: 'circle' },
    profitable: { label: 'Profitable (LTV/CAC >= 3)', color: 'text-green-600', bgColor: 'bg-green-100', icon: 'check-circle' },
    marginal: { label: 'Marginal (1 < LTV/CAC < 3)', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: 'alert-triangle' },
    underwater: { label: 'Underwater (LTV/CAC < 1)', color: 'text-red-600', bgColor: 'bg-red-100', icon: 'x-circle' },
    zombie_market: { label: 'Zombie Market (TAM too small)', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: 'skull' },
  },
} as const

/**
 * Pivot type display configuration
 */
export const pivotConfig: Record<PivotType, {
  label: string
  description: string
  severity: 'none' | 'low' | 'medium' | 'high'
  color: string
}> = {
  none: { label: 'No Pivot', description: 'Continue current direction', severity: 'none', color: 'text-green-600' },
  segment_pivot: { label: 'Segment Pivot', description: 'Change target customer segment', severity: 'medium', color: 'text-orange-600' },
  value_pivot: { label: 'Value Pivot', description: 'Change value proposition', severity: 'medium', color: 'text-orange-600' },
  channel_pivot: { label: 'Channel Pivot', description: 'Change distribution channels', severity: 'low', color: 'text-yellow-600' },
  price_pivot: { label: 'Price Pivot', description: 'Adjust pricing strategy', severity: 'low', color: 'text-yellow-600' },
  cost_pivot: { label: 'Cost Pivot', description: 'Reduce customer acquisition cost', severity: 'low', color: 'text-yellow-600' },
  kill: { label: 'Kill Project', description: 'No viable path forward', severity: 'high', color: 'text-red-600' },
}

// =======================================================================================
// DATABASE TRANSFORMATION FUNCTIONS
// =======================================================================================

/**
 * Database record type for hypotheses table (current schema)
 */
export interface DbHypothesisRecord {
  id: string
  project_id: string
  statement: string
  type: string  // 'desirability' | 'feasibility' | 'viability'
  status: string
  importance: string  // 'high' | 'medium' | 'low'
  evidence_strength: string | null
  source?: string | null
  created_at: string
  updated_at: string
}

/**
 * Database record type for experiments table
 */
export interface DbExperimentRecord {
  id: string
  name: string
  project_id: string
  status: string
  fit_type?: string | null
  hypothesis_id?: string | null
  hypothesis?: string | null
  test_method?: string | null
  metric?: string | null
  success_criteria?: string | null
  expected_outcome?: string | null
  actual_outcome?: string | null
  cost_time?: string | null
  cost_money?: number | null
  start_date?: string | null
  end_date?: string | null
  learning_card_id?: string | null
  owner?: string | null
  created_at: string
  updated_at: string
}

/**
 * Transform database hypothesis record to CrewAI-aligned Assumption
 */
export function transformDbToAssumption(record: DbHypothesisRecord): Assumption {
  // Map old importance to new priority (1-10)
  const importanceToPriority: Record<string, number> = {
    high: 2,    // Critical (1-3)
    medium: 5,  // Important (4-7)
    low: 8,     // Nice-to-have (8-10)
  }

  // Map old evidence_strength to CrewAI EvidenceStrength
  const mapEvidenceStrength = (strength: string | null): EvidenceStrength | undefined => {
    if (!strength) return undefined
    if (strength === 'strong' || strength === 'medium') return 'strong'
    if (strength === 'weak') return 'weak'
    return 'none'
  }

  return {
    id: record.id,
    statement: record.statement,
    category: record.type as AssumptionCategory,
    priority: importanceToPriority[record.importance] || 5,
    evidence_needed: '', // Not in old schema - should be added
    status: record.status as AssumptionStatus,
    evidence_strength: mapEvidenceStrength(record.evidence_strength),
    test_results: [],
    project_id: record.project_id,
    source: record.source || undefined,
    created_at: record.created_at,
    updated_at: record.updated_at,
  }
}

/**
 * Transform CrewAI Assumption to database format
 */
export function transformAssumptionToDb(assumption: Assumption): Omit<DbHypothesisRecord, 'created_at' | 'updated_at'> {
  // Map priority back to importance
  const priorityToImportance = (priority: number): string => {
    if (priority <= 3) return 'high'
    if (priority <= 7) return 'medium'
    return 'low'
  }

  // Map CrewAI EvidenceStrength to db format
  const mapEvidenceStrengthToDb = (strength?: EvidenceStrength): string | null => {
    if (!strength) return null
    return strength
  }

  return {
    id: assumption.id,
    project_id: assumption.project_id || '',
    statement: assumption.statement,
    type: assumption.category,
    status: assumption.status,
    importance: priorityToImportance(assumption.priority),
    evidence_strength: mapEvidenceStrengthToDb(assumption.evidence_strength),
    source: assumption.source || null,
  }
}

/**
 * Transform database experiment to StrategyzerExperiment
 * Maps all CrewAI ExperimentResult fields + frontend extensions
 */
export function transformDbToExperiment(record: DbExperimentRecord): StrategyzerExperiment {
  // Map test method to evidence strength using config
  const methodConfig = experimentMethodConfig[record.test_method || '']
  const evidenceStrength: EvidenceStrength = methodConfig?.evidenceStrength || 'none'

  return {
    // Core CrewAI ExperimentResult fields
    id: record.id,
    name: record.name,
    hypothesis: record.hypothesis || '',
    method: record.test_method || '',
    success_criteria: record.success_criteria || '',
    results: undefined,  // Populated from experiment results if available
    passed: undefined,   // Determined after experiment completion

    // Extended Strategyzer fields (from ExperimentResult)
    metric: record.metric || undefined,
    expected_outcome: record.expected_outcome as 'pivot' | 'iterate' | 'kill' | undefined,
    actual_outcome: record.actual_outcome as 'pivot' | 'iterate' | 'kill' | undefined,
    cost_time: record.cost_time || undefined,
    cost_money: record.cost_money || undefined,
    evidence_strength: evidenceStrength,
    assumption_id: record.hypothesis_id || undefined,
    learning_card_id: record.learning_card_id || undefined,
    status: record.status as ExperimentStatus,
    start_date: record.start_date || undefined,
    end_date: record.end_date || undefined,
    owner: record.owner || undefined,

    // Frontend/database specific fields
    project_id: record.project_id,
    created_at: record.created_at,
    updated_at: record.updated_at,
  }
}

// =======================================================================================
// UTILITY FUNCTIONS
// =======================================================================================

/**
 * Calculate assumption quadrant using CrewAI logic
 * Based on priority (1-10) and status
 */
export function getAssumptionQuadrant(assumption: Assumption): AssumptionQuadrant {
  return crewaiGetAssumptionQuadrant(assumption)
}

/**
 * Group assumptions by quadrant
 */
export interface AssumptionMapQuadrants {
  testFirst: Assumption[]
  validated: Assumption[]
  park: Assumption[]
  deprioritize: Assumption[]
}

export function categorizeAssumptions(assumptions: Assumption[]): AssumptionMapQuadrants {
  const result: AssumptionMapQuadrants = {
    testFirst: [],
    validated: [],
    park: [],
    deprioritize: [],
  }

  for (const assumption of assumptions) {
    const quadrant = getAssumptionQuadrant(assumption)
    switch (quadrant) {
      case 'test-first':
        result.testFirst.push(assumption)
        break
      case 'validated':
        result.validated.push(assumption)
        break
      case 'park':
        result.park.push(assumption)
        break
      case 'deprioritize':
        result.deprioritize.push(assumption)
        break
    }
  }

  return result
}

/**
 * Get priority label from number
 */
export function getPriorityLabel(priority: number): string {
  if (priority <= 3) return 'Critical'
  if (priority <= 7) return 'Important'
  return 'Nice to Have'
}

/**
 * Get priority color from number
 */
export function getPriorityColor(priority: number): string {
  if (priority <= 3) return 'bg-red-100 text-red-800'
  if (priority <= 7) return 'bg-orange-100 text-orange-800'
  return 'bg-gray-100 text-gray-800'
}

// =======================================================================================
// LEGACY TYPE ALIASES (for backward compatibility)
// =======================================================================================

// These maintain backward compatibility with existing components

export type AssumptionCriticality = 'high' | 'medium' | 'low'
export type EvidenceLevel = 'none' | 'weak' | 'medium' | 'strong'
export type ExperimentMethod = string
export type ExpectedOutcome = 'pivot' | 'iterate' | 'kill'
export type LearningDecision = 'pivot' | 'iterate' | 'kill'
export type LearningStatus = 'draft' | 'published'

// Legacy config aliases
export const criticalityConfig = {
  high: { label: 'High', color: 'bg-red-100 text-red-800' },
  medium: { label: 'Medium', color: 'bg-orange-100 text-orange-800' },
  low: { label: 'Low', color: 'bg-gray-100 text-gray-800' },
} as const

export const evidenceLevelConfig = {
  none: { label: 'No Evidence', color: 'bg-red-100 text-red-800' },
  weak: { label: 'Weak', color: 'bg-orange-100 text-orange-800' },
  medium: { label: 'Moderate', color: 'bg-yellow-100 text-yellow-800' },
  strong: { label: 'Strong', color: 'bg-green-100 text-green-800' },
} as const

// Legacy transform function name
export const transformDbAssumption = transformDbToAssumption
export const transformDbExperimentCard = transformDbToExperiment
