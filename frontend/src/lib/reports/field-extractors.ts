/**
 * Field Extractors for CrewAI Report Viewer
 *
 * Maps 65+ StartupValidationState fields into organized report sections
 * for dual D-F-V and Strategyzer Phase views.
 */

import type {
  StartupValidationState,
  Phase,
  RiskAxis,
  ProblemFit,
  DesirabilitySignal,
  FeasibilitySignal,
  ViabilitySignal,
  PivotType,
  QAStatus,
  BudgetStatus,
  BusinessModelType,
  Assumption,
  CustomerProfile,
  ValueMap,
  CompetitorReport,
  DesirabilityEvidence,
  FeasibilityEvidence,
  ViabilityEvidence,
  DesirabilityExperimentRun,
  FeasibilityArtifact,
  ViabilityMetrics,
  QAReport,
} from '@/types/crewai'

// ============================================================================
// SECTION TYPES
// ============================================================================

export interface DesirabilityReportSection {
  // Signal
  signal: DesirabilitySignal
  evidence: DesirabilityEvidence | null

  // VPC Data
  customerProfiles: Record<string, CustomerProfile>
  valueMaps: Record<string, ValueMap>
  segmentFitScores: Record<string, number>
  problemFit: ProblemFit
  currentSegment: string | null

  // Market Analysis
  competitorReport: CompetitorReport | null
  analysisInsights: string[]

  // Experiments
  experiments: DesirabilityExperimentRun[]
  adMetrics: {
    impressions: number
    clicks: number
    signups: number
    spend: number
  }

  // Assumptions (desirability category)
  assumptions: Assumption[]
}

export interface FeasibilityReportSection {
  // Signal
  signal: FeasibilitySignal
  evidence: FeasibilityEvidence | null

  // Build Artifact
  artifact: FeasibilityArtifact | null
  downgradeActive: boolean

  // Cost Breakdown
  apiCosts: Record<string, number>
  infraCosts: Record<string, number>
  totalMonthlyCost: number

  // Assumptions (feasibility category)
  assumptions: Assumption[]
}

export interface ViabilityReportSection {
  // Signal
  signal: ViabilitySignal
  evidence: ViabilityEvidence | null

  // Detailed Metrics
  metrics: ViabilityMetrics | null
  cac: number
  ltv: number
  ltvCacRatio: number
  grossMargin: number
  tam: number

  // Business Model
  businessModelType: BusinessModelType | null
  revenueModel: string | null

  // Assumptions (viability category)
  assumptions: Assumption[]
}

export interface GovernanceReportSection {
  // QA
  qaReports: QAReport[]
  currentQaStatus: QAStatus | null
  frameworkCompliance: boolean
  logicalConsistency: boolean
  completeness: boolean

  // Synthesis
  evidenceSummary: string | null
  finalRecommendation: string | null
  nextSteps: string[]
  synthesisConfidence: number

  // Pivot
  pivotRecommendation: PivotType | null
  lastPivotType: PivotType
  pendingPivotType: PivotType

  // Human Approval
  humanApprovalStatus: string | null
  humanInputRequired: boolean
  humanInputReason: string | null
  humanComment: string | null

  // Budget
  dailySpendUsd: number
  campaignSpendUsd: number
  budgetStatus: BudgetStatus
  budgetEscalationTriggered: boolean
  budgetKillTriggered: boolean
}

export interface ReportMetadata {
  id: string
  projectId: string
  sessionId: string | null
  kickoffId: string | null
  iteration: number
  phase: Phase
  currentRiskAxis: RiskAxis

  // Business Context
  businessIdea: string | null
  entrepreneurInput: string | null
  targetSegments: string[]
  problemStatement: string | null
  solutionDescription: string | null
}

// Strategyzer Phase sections (alternative organization)
export interface ProblemFitSection {
  problemFit: ProblemFit
  customerProfiles: Record<string, CustomerProfile>
  currentSegment: string | null
  desirabilitySignal: DesirabilitySignal
  desirabilityEvidence: DesirabilityEvidence | null
  assumptions: Assumption[]
  analysisInsights: string[]
}

export interface SolutionFitSection {
  valueMaps: Record<string, ValueMap>
  segmentFitScores: Record<string, number>
  competitorReport: CompetitorReport | null
  experiments: DesirabilityExperimentRun[]
  adMetrics: {
    impressions: number
    clicks: number
    signups: number
    spend: number
  }
}

export interface ProductMarketFitSection {
  feasibilitySignal: FeasibilitySignal
  feasibilityEvidence: FeasibilityEvidence | null
  feasibilityArtifact: FeasibilityArtifact | null
  apiCosts: Record<string, number>
  infraCosts: Record<string, number>
  totalMonthlyCost: number
  downgradeActive: boolean
  assumptions: Assumption[]
}

export interface BusinessModelSection {
  viabilitySignal: ViabilitySignal
  viabilityEvidence: ViabilityEvidence | null
  viabilityMetrics: ViabilityMetrics | null
  cac: number
  ltv: number
  ltvCacRatio: number
  grossMargin: number
  tam: number
  businessModelType: BusinessModelType | null
  revenueModel: string | null
  assumptions: Assumption[]
}

// Complete report data structure
export interface ReportData {
  // D-F-V Risk Axis Organization
  desirability: DesirabilityReportSection
  feasibility: FeasibilityReportSection
  viability: ViabilityReportSection
  governance: GovernanceReportSection

  // Strategyzer Phase Organization
  problemFit: ProblemFitSection
  solutionFit: SolutionFitSection
  productMarket: ProductMarketFitSection
  businessModel: BusinessModelSection

  // Metadata
  metadata: ReportMetadata

  // Raw state for any additional needs
  rawState: Partial<StartupValidationState>
}

// ============================================================================
// EXTRACTORS
// ============================================================================

export function extractDesirabilityFields(
  state: Partial<StartupValidationState>
): DesirabilityReportSection {
  const assumptions = (state.assumptions || []).filter(
    (a) => a.category === 'desirability'
  )

  return {
    signal: state.desirability_signal || 'no_signal',
    evidence: state.desirability_evidence || null,
    customerProfiles: state.customer_profiles || {},
    valueMaps: state.value_maps || {},
    segmentFitScores: state.segment_fit_scores || {},
    problemFit: state.problem_fit || 'unknown',
    currentSegment: state.current_segment || null,
    competitorReport: state.competitor_report || null,
    analysisInsights: state.analysis_insights || [],
    experiments: state.desirability_experiments || [],
    adMetrics: {
      impressions: state.ad_impressions || 0,
      clicks: state.ad_clicks || 0,
      signups: state.ad_signups || 0,
      spend: state.ad_spend || 0,
    },
    assumptions,
  }
}

export function extractFeasibilityFields(
  state: Partial<StartupValidationState>
): FeasibilityReportSection {
  const assumptions = (state.assumptions || []).filter(
    (a) => a.category === 'feasibility'
  )

  return {
    signal: state.feasibility_signal || 'unknown',
    evidence: state.feasibility_evidence || null,
    artifact: state.last_feasibility_artifact || null,
    downgradeActive: state.downgrade_active || false,
    apiCosts: state.api_costs || {},
    infraCosts: state.infra_costs || {},
    totalMonthlyCost: state.total_monthly_cost || 0,
    assumptions,
  }
}

export function extractViabilityFields(
  state: Partial<StartupValidationState>
): ViabilityReportSection {
  const assumptions = (state.assumptions || []).filter(
    (a) => a.category === 'viability'
  )

  return {
    signal: state.viability_signal || 'unknown',
    evidence: state.viability_evidence || null,
    metrics: state.last_viability_metrics || null,
    cac: state.cac || 0,
    ltv: state.ltv || 0,
    ltvCacRatio: state.ltv_cac_ratio || 0,
    grossMargin: state.gross_margin || 0,
    tam: state.tam || 0,
    businessModelType: state.business_model_type || null,
    revenueModel: state.revenue_model || null,
    assumptions,
  }
}

export function extractGovernanceFields(
  state: Partial<StartupValidationState>
): GovernanceReportSection {
  return {
    qaReports: state.qa_reports || [],
    currentQaStatus: state.current_qa_status || null,
    frameworkCompliance: state.framework_compliance || false,
    logicalConsistency: state.logical_consistency || false,
    completeness: state.completeness || false,
    evidenceSummary: state.evidence_summary || null,
    finalRecommendation: state.final_recommendation || null,
    nextSteps: state.next_steps || [],
    synthesisConfidence: state.synthesis_confidence || 0,
    pivotRecommendation: state.pivot_recommendation || null,
    lastPivotType: state.last_pivot_type || 'none',
    pendingPivotType: state.pending_pivot_type || 'none',
    humanApprovalStatus: state.human_approval_status || null,
    humanInputRequired: state.human_input_required || false,
    humanInputReason: state.human_input_reason || null,
    humanComment: state.human_comment || null,
    dailySpendUsd: state.daily_spend_usd || 0,
    campaignSpendUsd: state.campaign_spend_usd || 0,
    budgetStatus: state.budget_status || 'ok',
    budgetEscalationTriggered: state.budget_escalation_triggered || false,
    budgetKillTriggered: state.budget_kill_triggered || false,
  }
}

export function extractMetadata(
  state: Partial<StartupValidationState>
): ReportMetadata {
  return {
    id: state.id || '',
    projectId: state.project_id || '',
    sessionId: state.session_id || null,
    kickoffId: state.kickoff_id || null,
    iteration: state.iteration || 1,
    phase: state.phase || 'ideation',
    currentRiskAxis: state.current_risk_axis || 'desirability',
    businessIdea: state.business_idea || null,
    entrepreneurInput: state.entrepreneur_input || null,
    targetSegments: state.target_segments || [],
    problemStatement: state.problem_statement || null,
    solutionDescription: state.solution_description || null,
  }
}

// Strategyzer Phase extractors

export function extractProblemFitFields(
  state: Partial<StartupValidationState>
): ProblemFitSection {
  const assumptions = (state.assumptions || []).filter(
    (a) => a.category === 'desirability'
  )

  return {
    problemFit: state.problem_fit || 'unknown',
    customerProfiles: state.customer_profiles || {},
    currentSegment: state.current_segment || null,
    desirabilitySignal: state.desirability_signal || 'no_signal',
    desirabilityEvidence: state.desirability_evidence || null,
    assumptions,
    analysisInsights: state.analysis_insights || [],
  }
}

export function extractSolutionFitFields(
  state: Partial<StartupValidationState>
): SolutionFitSection {
  return {
    valueMaps: state.value_maps || {},
    segmentFitScores: state.segment_fit_scores || {},
    competitorReport: state.competitor_report || null,
    experiments: state.desirability_experiments || [],
    adMetrics: {
      impressions: state.ad_impressions || 0,
      clicks: state.ad_clicks || 0,
      signups: state.ad_signups || 0,
      spend: state.ad_spend || 0,
    },
  }
}

export function extractProductMarketFields(
  state: Partial<StartupValidationState>
): ProductMarketFitSection {
  const assumptions = (state.assumptions || []).filter(
    (a) => a.category === 'feasibility'
  )

  return {
    feasibilitySignal: state.feasibility_signal || 'unknown',
    feasibilityEvidence: state.feasibility_evidence || null,
    feasibilityArtifact: state.last_feasibility_artifact || null,
    apiCosts: state.api_costs || {},
    infraCosts: state.infra_costs || {},
    totalMonthlyCost: state.total_monthly_cost || 0,
    downgradeActive: state.downgrade_active || false,
    assumptions,
  }
}

export function extractBusinessModelFields(
  state: Partial<StartupValidationState>
): BusinessModelSection {
  const assumptions = (state.assumptions || []).filter(
    (a) => a.category === 'viability'
  )

  return {
    viabilitySignal: state.viability_signal || 'unknown',
    viabilityEvidence: state.viability_evidence || null,
    viabilityMetrics: state.last_viability_metrics || null,
    cac: state.cac || 0,
    ltv: state.ltv || 0,
    ltvCacRatio: state.ltv_cac_ratio || 0,
    grossMargin: state.gross_margin || 0,
    tam: state.tam || 0,
    businessModelType: state.business_model_type || null,
    revenueModel: state.revenue_model || null,
    assumptions,
  }
}

/**
 * Extract all report data from a StartupValidationState
 */
export function extractReportData(
  state: Partial<StartupValidationState> | null
): ReportData | null {
  if (!state) return null

  return {
    // D-F-V Risk Axis
    desirability: extractDesirabilityFields(state),
    feasibility: extractFeasibilityFields(state),
    viability: extractViabilityFields(state),
    governance: extractGovernanceFields(state),

    // Strategyzer Phase
    problemFit: extractProblemFitFields(state),
    solutionFit: extractSolutionFitFields(state),
    productMarket: extractProductMarketFields(state),
    businessModel: extractBusinessModelFields(state),

    // Metadata
    metadata: extractMetadata(state),

    // Raw state
    rawState: state,
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Check if a section has meaningful data
 */
export function hasDesirabilityData(section: DesirabilityReportSection): boolean {
  return (
    section.signal !== 'no_signal' ||
    Object.keys(section.customerProfiles).length > 0 ||
    section.analysisInsights.length > 0 ||
    section.experiments.length > 0
  )
}

export function hasFeasibilityData(section: FeasibilityReportSection): boolean {
  return (
    section.signal !== 'unknown' ||
    section.artifact !== null ||
    section.totalMonthlyCost > 0
  )
}

export function hasViabilityData(section: ViabilityReportSection): boolean {
  return (
    section.signal !== 'unknown' ||
    section.metrics !== null ||
    section.ltvCacRatio > 0
  )
}

export function hasGovernanceData(section: GovernanceReportSection): boolean {
  return (
    section.qaReports.length > 0 ||
    section.evidenceSummary !== null ||
    section.nextSteps.length > 0
  )
}

/**
 * Count total fields populated in report
 */
export function countPopulatedFields(data: ReportData): number {
  let count = 0

  // Count desirability fields
  if (data.desirability.signal !== 'no_signal') count++
  if (data.desirability.evidence) count++
  count += Object.keys(data.desirability.customerProfiles).length
  count += Object.keys(data.desirability.valueMaps).length
  if (data.desirability.competitorReport) count++
  count += data.desirability.analysisInsights.length
  count += data.desirability.experiments.length
  count += data.desirability.assumptions.length

  // Count feasibility fields
  if (data.feasibility.signal !== 'unknown') count++
  if (data.feasibility.evidence) count++
  if (data.feasibility.artifact) count++
  count += Object.keys(data.feasibility.apiCosts).length
  count += Object.keys(data.feasibility.infraCosts).length
  count += data.feasibility.assumptions.length

  // Count viability fields
  if (data.viability.signal !== 'unknown') count++
  if (data.viability.evidence) count++
  if (data.viability.metrics) count++
  if (data.viability.businessModelType) count++
  count += data.viability.assumptions.length

  // Count governance fields
  count += data.governance.qaReports.length
  if (data.governance.evidenceSummary) count++
  if (data.governance.finalRecommendation) count++
  count += data.governance.nextSteps.length

  return count
}

/**
 * Format currency for display
 */
export function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`
  }
  return `$${value.toFixed(0)}`
}

/**
 * Format percentage for display
 */
export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

/**
 * Format ratio for display
 */
export function formatRatio(value: number): string {
  return value.toFixed(2)
}
