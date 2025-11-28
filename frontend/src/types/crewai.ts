/**
 * CrewAI TypeScript Types
 *
 * These types mirror the Pydantic models from the startupai-crew backend:
 * - src/startupai/flows/state_schemas.py
 * - src/startupai/crews/crew_outputs.py
 * - src/startupai/models/tool_contracts.py
 *
 * Keep these synchronized with the backend schemas.
 */

// =======================================================================================
// ENUMS - Phase & Risk Tracking
// =======================================================================================

export type Phase =
  | 'ideation'
  | 'desirability'
  | 'feasibility'
  | 'viability'
  | 'validated'
  | 'killed'

export type RiskAxis = 'desirability' | 'feasibility' | 'viability'

// =======================================================================================
// INNOVATION PHYSICS SIGNALS
// =======================================================================================

export type ProblemFit = 'unknown' | 'no_fit' | 'partial_fit' | 'strong_fit'

export type DesirabilitySignal =
  | 'no_signal'        // Not yet tested
  | 'no_interest'      // Low traffic / low signup - wrong segment
  | 'weak_interest'    // High CTR, low conversion - zombies detected
  | 'strong_commitment' // Strong signup/preorder evidence

export type FeasibilitySignal =
  | 'unknown'
  | 'green'              // Feasible with current resources
  | 'orange_constrained' // Feasible only with scope reduction
  | 'red_impossible'     // Cannot build with any available resources

export type ViabilitySignal =
  | 'unknown'
  | 'profitable'     // LTV > CAC with healthy margins (LTV/CAC >= 3)
  | 'marginal'       // 1 < LTV/CAC < 3 - needs optimization
  | 'underwater'     // CAC > LTV, bleeding money (LTV/CAC < 1)
  | 'zombie_market'  // CAC < LTV but TAM too small

export type PivotType =
  | 'none'           // No pivot needed
  | 'segment_pivot'  // Wrong audience, change Customer Segment
  | 'value_pivot'    // Wrong promise, change Value Proposition
  | 'channel_pivot'  // Wrong distribution, change Channels
  | 'price_pivot'    // Increase price (viability issue)
  | 'cost_pivot'     // Reduce CAC (viability issue)
  | 'kill'           // Stop project, no viable path

// =======================================================================================
// HUMAN-IN-THE-LOOP STATUS
// =======================================================================================

export type HumanApprovalStatus =
  | 'not_required'
  | 'pending'      // Waiting for human decision
  | 'approved'     // Human approved recommendation
  | 'rejected'     // Human rejected recommendation
  | 'overridden'   // Human chose different path

export type ArtifactApprovalStatus =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'rejected'

// =======================================================================================
// APPROVAL REQUEST TYPES
// =======================================================================================

/**
 * Approval types that can trigger human-in-the-loop decisions.
 * These map to CrewAI task outputs that pause for human input.
 */
export type ApprovalType =
  | 'segment_pivot'      // Change target customer segment
  | 'value_pivot'        // Change value proposition
  | 'feature_downgrade'  // Cut features for feasibility
  | 'strategic_pivot'    // Major strategic direction change
  | 'spend_increase'     // Increase ad/experiment budget
  | 'campaign_launch'    // Launch new marketing campaign
  | 'customer_contact'   // Direct customer outreach
  | 'gate_progression'   // Phase gate advancement decision
  | 'data_sharing'       // Share data with external parties

/**
 * AI Founder roles that own approval decisions.
 * Each founder has a specific domain of expertise.
 */
export type OwnerRole =
  | 'sage'      // CSO - Chief Strategy Officer (Strategic coordination)
  | 'forge'     // CTO - Chief Technology Officer (Technical feasibility)
  | 'pulse'     // CGO - Chief Growth Officer (Growth strategy)
  | 'compass'   // CPO - Chief Product Officer (Product vision)
  | 'guardian'  // CGO - Chief Governance Officer (QA/Compliance)
  | 'ledger'    // CFO - Chief Financial Officer (Financial analysis)

/**
 * Option presented to user in approval decisions.
 */
export interface ApprovalOption {
  id: string
  label: string
  description: string
  recommended?: boolean
  risk_level?: 'low' | 'medium' | 'high'
}

/**
 * Full approval request from CrewAI webhook.
 */
export interface ApprovalRequest {
  id: string
  execution_id: string
  task_id: string
  kickoff_id: string | null
  user_id: string
  project_id: string | null
  approval_type: ApprovalType
  owner_role: OwnerRole
  title: string
  description: string
  task_output: Record<string, unknown>
  evidence_summary: Record<string, unknown>
  options: ApprovalOption[]
  status: 'pending' | 'approved' | 'rejected' | 'expired'
  decision: string | null
  human_feedback: string | null
  decided_by: string | null
  decided_at: string | null
  auto_approvable: boolean
  auto_approve_reason?: string
  expires_at: string
  created_at: string
  updated_at: string
  project?: {
    id: string
    name: string
    stage?: string
  } | null
}

/**
 * User preferences for auto-approving certain decision types.
 */
export interface ApprovalPreferences {
  user_id: string
  auto_approve_types: ApprovalType[]
  max_auto_approve_spend: number
  auto_approve_low_risk: boolean
  notify_email: boolean
  notify_sms: boolean
  escalation_email?: string
}

/**
 * AI Founder metadata for display.
 */
export interface FounderInfo {
  role: OwnerRole
  name: string
  title: string
  specialty: string
  avatarPath: string
}

/**
 * Get founder display info for UI.
 */
export const FOUNDER_INFO: Record<OwnerRole, FounderInfo> = {
  sage: {
    role: 'sage',
    name: 'Sage',
    title: 'Chief Strategy Officer',
    specialty: 'Strategic coordination and synthesis',
    avatarPath: '/avatars/founders/sage.svg',
  },
  forge: {
    role: 'forge',
    name: 'Forge',
    title: 'Chief Technology Officer',
    specialty: 'Technical feasibility and architecture',
    avatarPath: '/avatars/founders/forge.svg',
  },
  pulse: {
    role: 'pulse',
    name: 'Pulse',
    title: 'Chief Growth Officer',
    specialty: 'Growth strategy and experiments',
    avatarPath: '/avatars/founders/pulse.svg',
  },
  compass: {
    role: 'compass',
    name: 'Compass',
    title: 'Chief Product Officer',
    specialty: 'Product vision and customer fit',
    avatarPath: '/avatars/founders/compass.svg',
  },
  guardian: {
    role: 'guardian',
    name: 'Guardian',
    title: 'Chief Governance Officer',
    specialty: 'Quality assurance and compliance',
    avatarPath: '/avatars/founders/guardian.svg',
  },
  ledger: {
    role: 'ledger',
    name: 'Ledger',
    title: 'Chief Financial Officer',
    specialty: 'Financial analysis and viability',
    avatarPath: '/avatars/founders/ledger.svg',
  },
}

/**
 * Get approval type display info for UI.
 */
export function getApprovalTypeInfo(type: ApprovalType): { label: string; description: string; icon: string } {
  const typeInfo: Record<ApprovalType, { label: string; description: string; icon: string }> = {
    segment_pivot: {
      label: 'Segment Pivot',
      description: 'Change target customer segment',
      icon: 'Users',
    },
    value_pivot: {
      label: 'Value Pivot',
      description: 'Change value proposition',
      icon: 'Lightbulb',
    },
    feature_downgrade: {
      label: 'Feature Downgrade',
      description: 'Reduce scope for feasibility',
      icon: 'Scissors',
    },
    strategic_pivot: {
      label: 'Strategic Pivot',
      description: 'Major direction change',
      icon: 'Compass',
    },
    spend_increase: {
      label: 'Budget Increase',
      description: 'Increase experiment budget',
      icon: 'DollarSign',
    },
    campaign_launch: {
      label: 'Campaign Launch',
      description: 'Launch marketing campaign',
      icon: 'Rocket',
    },
    customer_contact: {
      label: 'Customer Contact',
      description: 'Direct customer outreach',
      icon: 'MessageSquare',
    },
    gate_progression: {
      label: 'Gate Progression',
      description: 'Advance to next phase',
      icon: 'ArrowRight',
    },
    data_sharing: {
      label: 'Data Sharing',
      description: 'Share data externally',
      icon: 'Share2',
    },
  }
  return typeInfo[type]
}

// =======================================================================================
// ASSUMPTION TRACKING
// =======================================================================================

export type AssumptionCategory = 'desirability' | 'feasibility' | 'viability'

export type AssumptionStatus =
  | 'untested'
  | 'testing'
  | 'validated'
  | 'invalidated'
  | 'revised'

export type EvidenceStrength = 'strong' | 'weak' | 'none'

export type CommitmentType =
  | 'skin_in_game'  // Money, time, or reputation committed
  | 'verbal'        // Only verbal interest, no real commitment
  | 'none'          // No commitment or interest

export interface Assumption {
  id: string
  statement: string
  category: AssumptionCategory
  priority: number  // 1-10 (1-3 critical, 4-7 important, 8-10 nice-to-have)
  evidence_needed: string
  status: AssumptionStatus
  evidence_strength?: EvidenceStrength
  test_results: Record<string, unknown>[]
}

// Helper to map priority to criticality label
export function getPriorityCriticality(priority: number): 'critical' | 'important' | 'nice-to-have' {
  if (priority <= 3) return 'critical'
  if (priority <= 7) return 'important'
  return 'nice-to-have'
}

// =======================================================================================
// CUSTOMER & MARKET MODELS (Value Proposition Canvas)
// =======================================================================================

export interface CustomerJob {
  functional: string   // What task are they trying to accomplish?
  emotional: string    // How do they want to feel?
  social: string       // How do they want to be perceived?
  importance: number   // 1-10
}

export interface CustomerProfile {
  segment_name: string
  jobs: CustomerJob[]
  pains: string[]
  gains: string[]
  pain_intensity: Record<string, number>   // Pain -> intensity (1-10)
  gain_importance: Record<string, number>  // Gain -> importance (1-10)
  resonance_score?: number                 // 0-1, from testing
}

export interface ValueMap {
  products_services: string[]
  pain_relievers: Record<string, string>   // Pain -> How we relieve it
  gain_creators: Record<string, string>    // Gain -> How we create it
  differentiators: string[]
}

export interface CompetitorAnalysis {
  competitor_name: string
  strengths: string[]
  weaknesses: string[]
  positioning: string
  price_point?: string
  market_share?: number
}

export interface CompetitorReport {
  competitors: CompetitorAnalysis[]
  positioning_map: Record<string, unknown>
  our_positioning: string
  differentiation_strategy: string
}

// =======================================================================================
// EXPERIMENT ARTIFACTS
// =======================================================================================

export type Platform = 'meta' | 'tiktok' | 'linkedin' | 'google_search' | 'google_display'

export interface DesirabilityMetrics {
  experiment_id: string
  platform: Platform
  ad_ids: string[]
  landing_page_url?: string
  impressions: number
  clicks: number
  signups: number
  spend_usd: number
  ctr: number              // clicks / impressions
  conversion_rate: number  // signups / clicks
}

export interface AdVariant {
  id: string
  platform: Platform
  headline: string
  body: string
  cta: string
  asset_url?: string
  hook_type?: 'problem-agitate-solve' | 'social-proof' | 'urgency' | 'testimonial' | 'curiosity'
  tone?: 'direct' | 'playful' | 'premium' | 'technical' | 'empathetic'
  format?: 'short-form' | 'long-form' | 'listicle' | 'question-lead'
  approval_status: ArtifactApprovalStatus
  human_approval_status: HumanApprovalStatus
  human_comment?: string
}

export interface LandingPageVariant {
  id: string
  variant_tag: string
  preview_url?: string
  deployed_url?: string
  hosting_provider?: string
  route_path?: string
  approval_status: ArtifactApprovalStatus
  human_approval_status: HumanApprovalStatus
  human_comment?: string
}

export interface ExperimentRoutingConfig {
  experiment_id?: string
  platform_campaign_ids: Record<string, string[]>
  platform_budgets: PlatformBudgetConfig[]
}

export interface PlatformBudgetConfig {
  platform: Platform
  duration_days: number
  total_budget_usd: number
  min_impressions: number
  target_cpc_usd?: number
  audience_spec: Record<string, unknown>
}

export interface DesirabilityExperimentRun {
  id: string
  downgrade_active: boolean
  ad_variants: AdVariant[]
  landing_page_variants: LandingPageVariant[]
  routing: ExperimentRoutingConfig
  per_platform_metrics: DesirabilityMetrics[]
  aggregate_metrics?: DesirabilityMetrics
  approval_status: ArtifactApprovalStatus
  guardian_issues: string[]
}

// =======================================================================================
// FEASIBILITY ARTIFACT
// =======================================================================================

export interface FeatureToggle {
  feature_id: string
  feature_name: string
  enabled: boolean
  complexity: number  // 1-10
  monthly_cost_usd: number
  dependencies: string[]
  can_downgrade: boolean
}

export interface FeasibilityArtifact {
  build_id: string
  mvp_url?: string
  features: FeatureToggle[]
  removed_features: string[]
  retained_features: string[]
  api_costs: Record<string, number>
  infra_costs: Record<string, number>
  total_monthly_cost_usd: number
  technical_complexity_score: number  // 1-10
  notes?: string
}

// =======================================================================================
// VIABILITY METRICS
// =======================================================================================

export type BusinessModelType =
  | 'saas_b2b_smb'
  | 'saas_b2b_midmarket'
  | 'saas_b2b_enterprise'
  | 'saas_b2c_freemium'
  | 'saas_b2c_subscription'
  | 'ecommerce_dtc'
  | 'ecommerce_marketplace'
  | 'fintech_b2b'
  | 'fintech_b2c'
  | 'consulting'
  | 'unknown'

export interface ViabilityMetrics {
  cac_usd: number
  ltv_usd: number
  ltv_cac_ratio: number
  gross_margin_pct: number
  tam_annual_revenue_potential_usd: number
  monthly_churn_pct: number
  payback_months: number
  cac_breakdown: Record<string, number>
  ltv_breakdown: Record<string, number>
  business_model_type?: BusinessModelType
  model_assumptions: Record<string, unknown>
  benchmark_source?: string
}

// =======================================================================================
// EVIDENCE MODELS
// =======================================================================================

export interface DesirabilityEvidence {
  problem_resonance: number   // 0-1 scale
  conversion_rate: number
  commitment_depth: CommitmentType
  zombie_ratio: number        // High interest but no commitment
  experiments: Record<string, unknown>[]
  key_learnings: string[]
  tested_segments: string[]
  impressions: number
  clicks: number
  signups: number
  spend_usd: number
}

export interface FeasibilityEvidence {
  core_features_feasible: Record<string, 'POSSIBLE' | 'CONSTRAINED' | 'IMPOSSIBLE'>
  technical_risks: string[]
  skill_requirements: string[]
  estimated_effort?: string
  downgrade_required: boolean
  downgrade_impact?: string
  removed_features: string[]
  alternative_approaches: string[]
  monthly_cost_estimate_usd: number
}

export interface ViabilityEvidence {
  cac: number
  ltv: number
  ltv_cac_ratio: number
  gross_margin: number
  payback_months: number
  break_even_customers: number
  tam_usd: number
  market_share_target: number
  viability_assessment?: string
}

// =======================================================================================
// QA & GOVERNANCE
// =======================================================================================

export type QAStatus = 'passed' | 'failed' | 'conditional' | 'escalated'

export interface QAReport {
  status: QAStatus
  framework_compliance: boolean
  logical_consistency: boolean
  completeness: boolean
  specific_issues: string[]
  required_changes: string[]
  confidence_score: number  // 0-1
}

// =======================================================================================
// CREW OUTPUT MODELS
// =======================================================================================

export interface ServiceCrewOutput {
  business_idea: string
  target_segments: string[]
  problem_statement: string
  solution_description: string
  assumptions: Array<{
    assumption: string
    category: AssumptionCategory
    criticality: 'high' | 'medium' | 'low'
  }>
  revenue_model: string
}

export interface AnalysisCrewOutput {
  customer_profiles: Record<string, CustomerProfile>
  value_maps: Record<string, ValueMap>
  competitor_report?: CompetitorReport
  primary_segment: string
}

export interface BuildCrewOutput {
  feasibility_status: string
  build_id: string
  core_features_feasible: Record<string, string>
  removed_features: string[]
  estimated_monthly_cost_usd: number
  technical_complexity_score: number
  notes: string
}

export interface GrowthCrewOutput {
  experiment_id: string
  platform: string
  impressions: number
  clicks: number
  signups: number
  spend_usd: number
  ctr: number
  conversion_rate: number
  desirability_signal: DesirabilitySignal
}

export interface FinanceCrewOutput {
  cac_usd: number
  ltv_usd: number
  ltv_cac_ratio: number
  gross_margin_pct: number
  payback_months: number
  viability_signal: ViabilitySignal
  recommendation: 'proceed' | 'price_pivot' | 'cost_pivot' | 'kill'
}

export interface GovernanceCrewOutput {
  status: QAStatus
  framework_compliance: boolean
  logical_consistency: boolean
  completeness: boolean
  issues: string[]
  required_changes: string[]
  confidence_score: number
}

export interface SynthesisCrewOutput {
  evidence_summary: Record<string, unknown>
  pivot_recommendation: PivotType
  pivot_rationale: string
  confidence_level: 'low' | 'medium' | 'high'
  next_steps: string[]
  human_input_required: boolean
}

// =======================================================================================
// EXPERIMENT RESULT (from Growth Crew)
// Extended with Strategyzer Testing Business Ideas fields
// =======================================================================================

export interface ExperimentResult {
  // Core CrewAI fields (from crew_outputs.py)
  name: string
  hypothesis: string
  method: string
  success_criteria: string
  results?: Record<string, unknown>
  passed?: boolean

  // Extended Strategyzer fields (Testing Business Ideas methodology)
  id?: string
  metric?: string                                      // What we're measuring
  expected_outcome?: 'pivot' | 'iterate' | 'kill'      // Expected decision
  actual_outcome?: 'pivot' | 'iterate' | 'kill'        // Actual decision after test
  actual_metric_value?: string                         // The measured value
  cost_time?: string                                   // Time investment
  cost_money?: number                                  // Financial investment (USD)
  evidence_strength?: EvidenceStrength                 // Strength of evidence gathered
  assumption_id?: string                               // Linked assumption
  learning_card_id?: string                            // Post-experiment learnings
  status?: 'draft' | 'planned' | 'running' | 'completed' | 'cancelled'
  start_date?: string
  end_date?: string
  owner?: string
}

// =======================================================================================
// BUDGET TRACKING
// =======================================================================================

export type BudgetStatus = 'ok' | 'warning' | 'exceeded' | 'kill'

// =======================================================================================
// MAIN STATE: StartupValidationState
// =======================================================================================

export interface StartupValidationState {
  // Identity & Bookkeeping
  id: string
  project_id: string
  user_id: string
  session_id: string
  kickoff_id: string
  iteration: number
  phase: Phase
  current_risk_axis: RiskAxis

  // Problem/Solution Fit
  problem_fit: ProblemFit
  current_segment?: string
  current_value_prop?: string
  vpc_document_url?: string
  bmc_document_url?: string

  // Innovation Physics Signals
  desirability_signal: DesirabilitySignal
  feasibility_signal: FeasibilitySignal
  viability_signal: ViabilitySignal

  // Desirability Artifacts
  desirability_experiments: DesirabilityExperimentRun[]
  downgrade_active: boolean

  // Feasibility Artifact
  last_feasibility_artifact?: FeasibilityArtifact

  // Viability Metrics
  last_viability_metrics?: ViabilityMetrics

  // Pivot & Routing
  last_pivot_type: PivotType
  pending_pivot_type: PivotType

  // Human Approvals
  human_approval_status: HumanApprovalStatus
  human_comment?: string

  // Evidence Containers
  desirability_evidence?: DesirabilityEvidence
  feasibility_evidence?: FeasibilityEvidence
  viability_evidence?: ViabilityEvidence

  // Signal Tracking
  commitment_type?: CommitmentType
  evidence_strength?: EvidenceStrength
  feasibility_status?: FeasibilitySignal
  unit_economics_status?: ViabilitySignal

  // Output Tracking
  evidence_summary?: string
  final_recommendation?: string
  next_steps: string[]

  // QA and Governance
  qa_reports: QAReport[]
  current_qa_status?: QAStatus

  // HITL Workflow
  human_input_required: boolean
  human_input_reason?: string
  pivot_recommendation?: PivotType

  // Legacy Compatibility Fields
  business_idea?: string
  entrepreneur_input?: string
  target_segments: string[]
  assumptions: Assumption[]
  customer_profiles: Record<string, CustomerProfile>
  value_maps: Record<string, ValueMap>
  competitor_report?: CompetitorReport

  // Service Crew Outputs
  problem_statement?: string
  solution_description?: string
  revenue_model?: string

  // Analysis Crew Outputs
  segment_fit_scores: Record<string, number>
  analysis_insights: string[]

  // Growth Crew Outputs
  ad_impressions: number
  ad_clicks: number
  ad_signups: number
  ad_spend: number

  // Build Crew Outputs
  api_costs: Record<string, number>
  infra_costs: Record<string, number>
  total_monthly_cost: number

  // Finance Crew Outputs
  cac: number
  ltv: number
  ltv_cac_ratio: number
  gross_margin: number
  tam: number

  // Synthesis Crew Outputs
  synthesis_confidence: number

  // Governance Crew Outputs
  framework_compliance: boolean
  logical_consistency: boolean
  completeness: boolean

  // Budget Tracking
  daily_spend_usd: number
  campaign_spend_usd: number
  budget_status: BudgetStatus
  budget_escalation_triggered: boolean
  budget_kill_triggered: boolean

  // Business Model
  business_model_type?: BusinessModelType
  business_model_inferred_from?: string
}

// =======================================================================================
// TOOL RESULT ENVELOPE
// =======================================================================================

export type ToolStatus =
  | 'success'
  | 'partial'
  | 'failure'
  | 'rate_limited'
  | 'timeout'
  | 'invalid_input'

export interface ToolResult<T> {
  status: ToolStatus
  data?: T
  error_message?: string
  error_code?: string
  metadata: Record<string, unknown>
  warnings: string[]
  timestamp: string
}

// =======================================================================================
// HELPER FUNCTIONS
// =======================================================================================

/**
 * Map CrewAI assumption to Assumption Map quadrant
 * Based on priority (criticality) and status
 */
export function getAssumptionQuadrant(assumption: Assumption): 'test-first' | 'validated' | 'park' | 'deprioritize' {
  const isCritical = assumption.priority <= 3
  const isValidated = assumption.status === 'validated'
  const isInvalidated = assumption.status === 'invalidated'

  if (isValidated) return 'validated'
  if (isInvalidated) return 'deprioritize'
  if (isCritical) return 'test-first'
  return 'park'
}

/**
 * Get signal color for UI display
 */
export function getSignalColor(signal: DesirabilitySignal | FeasibilitySignal | ViabilitySignal): string {
  const colorMap: Record<string, string> = {
    // Desirability
    no_signal: 'gray',
    no_interest: 'red',
    weak_interest: 'yellow',
    strong_commitment: 'green',
    // Feasibility
    unknown: 'gray',
    green: 'green',
    orange_constrained: 'orange',
    red_impossible: 'red',
    // Viability
    profitable: 'green',
    marginal: 'yellow',
    underwater: 'red',
    zombie_market: 'purple',
  }
  return colorMap[signal] || 'gray'
}

/**
 * Get pivot type display info
 */
export function getPivotInfo(pivotType: PivotType): { label: string; description: string; severity: 'none' | 'low' | 'medium' | 'high' } {
  const pivotInfo: Record<PivotType, { label: string; description: string; severity: 'none' | 'low' | 'medium' | 'high' }> = {
    none: { label: 'No Pivot', description: 'Continue current direction', severity: 'none' },
    segment_pivot: { label: 'Segment Pivot', description: 'Change target customer segment', severity: 'medium' },
    value_pivot: { label: 'Value Pivot', description: 'Change value proposition', severity: 'medium' },
    channel_pivot: { label: 'Channel Pivot', description: 'Change distribution channels', severity: 'low' },
    price_pivot: { label: 'Price Pivot', description: 'Adjust pricing strategy', severity: 'low' },
    cost_pivot: { label: 'Cost Pivot', description: 'Reduce customer acquisition cost', severity: 'low' },
    kill: { label: 'Kill Project', description: 'No viable path forward', severity: 'high' },
  }
  return pivotInfo[pivotType]
}
