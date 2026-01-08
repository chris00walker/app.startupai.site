/**
 * Unified CrewAI/Modal Webhook Endpoint
 *
 * POST /api/crewai/webhook
 *
 * Single entry point for all validation flow results. Routes internally
 * based on the `flow_type` field in the payload.
 *
 * Supported flow types:
 * - founder_validation: Validation results (AMP or Modal)
 * - consultant_onboarding: Results from ConsultantOnboardingFlow
 * - progress_update: Real-time progress from Modal (NEW)
 * - hitl_checkpoint: HITL checkpoint notifications from Modal (NEW)
 *
 * Authentication:
 * - Bearer token (CREW_CONTRACT_BEARER for AMP, MODAL_AUTH_TOKEN for Modal)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient as createAdminClient } from '@/lib/supabase/admin';

// =============================================================================
// SHARED TYPES AND UTILITIES
// =============================================================================

type FlowType = 'founder_validation' | 'consultant_onboarding' | 'progress_update' | 'hitl_checkpoint';

/**
 * Validate bearer token from CrewAI AMP or Modal
 * Accepts either CREW_CONTRACT_BEARER (AMP) or MODAL_AUTH_TOKEN (Modal)
 */
function validateBearerToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.slice(7);

  // Accept either AMP token or Modal token
  const ampToken = process.env.CREW_CONTRACT_BEARER;
  const modalToken = process.env.MODAL_AUTH_TOKEN;

  if (!ampToken && !modalToken) {
    console.error('[api/crewai/webhook] Neither CREW_CONTRACT_BEARER nor MODAL_AUTH_TOKEN configured');
    return false;
  }

  return token === ampToken || token === modalToken;
}

// =============================================================================
// FOUNDER VALIDATION SCHEMAS
// =============================================================================

const validationReportSchema = z.object({
  id: z.string(),
  business_idea: z.string(),
  validation_outcome: z.string().nullable(),
  evidence_summary: z.string().nullable(),
  pivot_recommendation: z.string().nullable(),
  next_steps: z.array(z.string()).default([]),
});

const customerProfileSchema = z.object({
  jobs: z.array(z.any()).default([]),
  pains: z.array(z.any()).default([]),
  gains: z.array(z.any()).default([]),
}).passthrough();

const valueMapSchema = z.object({
  products_services: z.array(z.string()).default([]),
  pain_relievers: z.array(z.any()).default([]),
  gain_creators: z.array(z.any()).default([]),
}).passthrough();

const desirabilityEvidenceSchema = z.object({
  problem_resonance: z.number().optional(),
  conversion_rate: z.number().optional(),
  commitment_depth: z.string().optional(),
  zombie_ratio: z.number().optional(),  // Added: matches CrewAI contract
  traffic_quality: z.string().optional(),
  key_learnings: z.array(z.string()).default([]),  // Added: matches CrewAI contract
  tested_segments: z.array(z.string()).default([]),  // Added: matches CrewAI contract
  impressions: z.number().optional(),
  clicks: z.number().optional(),
  signups: z.number().optional(),
  spend_usd: z.number().optional(),
  experiments: z.array(z.any()).default([]),
}).passthrough().nullable();

const feasibilityEvidenceSchema = z.object({
  core_features_feasible: z.record(z.string(), z.string()).default({}),
  downgrade_required: z.boolean().optional(),
  downgrade_impact: z.string().optional(),
  api_costs: z.number().optional(),
  infra_costs: z.number().optional(),
  total_monthly_cost: z.number().optional(),
}).passthrough().nullable();

const viabilityEvidenceSchema = z.object({
  cac: z.number().optional(),
  ltv: z.number().optional(),
  ltv_cac_ratio: z.number().optional(),
  gross_margin: z.number().optional(),
  payback_months: z.number().optional(),  // Added: matches CrewAI contract
  break_even_customers: z.number().optional(),  // Added: matches CrewAI contract
  tam_usd: z.number().optional(),
  market_share_target: z.number().optional(),  // Added: matches CrewAI contract
  viability_assessment: z.string().optional(),  // Added: matches CrewAI contract
}).passthrough().nullable();

const qaReportSchema = z.object({
  status: z.string().optional(),
  issues: z.array(z.any()).default([]),
  recommendations: z.array(z.any()).default([]),
  framework_compliance: z.number().optional(),
  logical_consistency: z.number().optional(),
  completeness: z.number().optional(),
}).passthrough().nullable();

// Extended schema to capture full StartupValidationState fields
const founderValidationSchema = z.object({
  flow_type: z.literal('founder_validation'),
  project_id: z.string().uuid(),
  user_id: z.string().uuid(),
  kickoff_id: z.string().optional(),  // AMP legacy
  run_id: z.string().optional(),       // Modal (preferred)
  session_id: z.string().optional(),
  validation_report: validationReportSchema,
  value_proposition_canvas: z.record(z.string(), z.object({
    customer_profile: customerProfileSchema.nullable(),
    value_map: valueMapSchema.nullable(),
  })).default({}),
  evidence: z.object({
    desirability: desirabilityEvidenceSchema,
    feasibility: feasibilityEvidenceSchema,
    viability: viabilityEvidenceSchema,
  }),
  qa_report: qaReportSchema,
  completed_at: z.string().optional(),
  // Extended fields for full StartupValidationState persistence
  iteration: z.number().optional(),
  phase: z.string().optional(),
  current_risk_axis: z.string().optional(),
  problem_fit: z.string().optional(),
  current_segment: z.string().optional(),
  current_value_prop: z.string().optional(),
  desirability_signal: z.string().optional(),
  feasibility_signal: z.string().optional(),
  viability_signal: z.string().optional(),
  last_pivot_type: z.string().optional(),
  pending_pivot_type: z.string().optional(),
  pivot_recommendation: z.string().optional(),
  human_approval_status: z.string().optional(),
  human_comment: z.string().optional(),
  human_input_required: z.boolean().optional(),
  human_input_reason: z.string().optional(),
  assumptions: z.array(z.any()).optional(),
  desirability_experiments: z.array(z.any()).optional(),
  downgrade_active: z.boolean().optional(),
  last_feasibility_artifact: z.any().optional(),
  last_viability_metrics: z.any().optional(),
  competitor_report: z.any().optional(),
  target_segments: z.array(z.string()).optional(),
  problem_statement: z.string().optional(),
  solution_description: z.string().optional(),
  revenue_model: z.string().optional(),
  segment_fit_scores: z.record(z.string(), z.number()).optional(),
  analysis_insights: z.array(z.string()).optional(),
  business_model_type: z.string().optional(),
  budget_status: z.string().optional(),
});

type FounderValidationPayload = z.infer<typeof founderValidationSchema>;

// =============================================================================
// PUBLIC ACTIVITY LOG HELPERS
// =============================================================================

type FounderId = 'sage' | 'forge' | 'pulse' | 'compass' | 'guardian' | 'ledger';
type ActivityType = 'analysis' | 'build' | 'validation' | 'research' | 'review';

interface ActivityLogEntry {
  founder_id: FounderId;
  activity_type: ActivityType;
  description: string;
  project_id: string;
  kickoff_id: string | null;
}

/**
 * Detect industry from business idea for anonymization
 */
function detectIndustry(businessIdea: string): string {
  const idea = businessIdea.toLowerCase();

  const industries: Record<string, string[]> = {
    'B2B SaaS': ['saas', 'software', 'platform', 'tool', 'dashboard', 'automation', 'api'],
    'E-commerce': ['ecommerce', 'e-commerce', 'shop', 'store', 'retail', 'selling', 'products'],
    'FinTech': ['finance', 'payment', 'banking', 'investment', 'trading', 'money', 'fintech'],
    'HealthTech': ['health', 'medical', 'fitness', 'wellness', 'healthcare', 'patient', 'clinic'],
    'EdTech': ['education', 'learning', 'course', 'training', 'school', 'teach', 'student'],
    'Marketplace': ['marketplace', 'matching', 'booking', 'rental', 'connect', 'two-sided'],
    'AI/ML': ['ai', 'machine learning', 'ml', 'artificial intelligence', 'gpt', 'llm', 'chatbot'],
  };

  for (const [industry, keywords] of Object.entries(industries)) {
    if (keywords.some((kw) => idea.includes(kw))) {
      return industry;
    }
  }

  return 'tech startup';
}

/**
 * Build anonymized activity log entries from validation payload
 */
function buildActivityLogEntries(payload: FounderValidationPayload): ActivityLogEntry[] {
  const entries: ActivityLogEntry[] = [];
  const industry = detectIndustry(payload.validation_report.business_idea);
  const executionId = payload.run_id || payload.kickoff_id;
  const baseEntry = {
    project_id: payload.project_id,
    kickoff_id: executionId || null,  // Store run_id or kickoff_id in kickoff_id column
  };

  // Sage: VPC/Analysis activities
  if (payload.value_proposition_canvas && Object.keys(payload.value_proposition_canvas).length > 0) {
    const segmentCount = Object.keys(payload.value_proposition_canvas).length;
    entries.push({
      ...baseEntry,
      founder_id: 'sage',
      activity_type: 'analysis',
      description: `Analyzed market positioning for a ${industry} across ${segmentCount} customer segment${segmentCount > 1 ? 's' : ''}`,
    });
  }

  // Pulse: Desirability experiments
  if (payload.evidence.desirability) {
    const d = payload.evidence.desirability;
    const expCount = d.experiments?.length || 0;
    entries.push({
      ...baseEntry,
      founder_id: 'pulse',
      activity_type: 'validation',
      description:
        expCount > 0
          ? `Validated customer desirability with ${expCount}+ experiment${expCount > 1 ? 's' : ''}`
          : `Assessed customer desirability signals for a ${industry}`,
    });
  }

  // Forge: Feasibility assessment
  if (payload.evidence.feasibility) {
    const f = payload.evidence.feasibility;
    const featureCount = Object.keys(f.core_features_feasible || {}).length;
    entries.push({
      ...baseEntry,
      founder_id: 'forge',
      activity_type: 'build',
      description:
        featureCount > 0
          ? `Assessed technical feasibility for ${featureCount} core feature${featureCount > 1 ? 's' : ''}`
          : `Evaluated technical feasibility for a ${industry}`,
    });
  }

  // Ledger: Viability/unit economics
  if (payload.evidence.viability) {
    entries.push({
      ...baseEntry,
      founder_id: 'ledger',
      activity_type: 'validation',
      description: `Calculated unit economics and financial viability metrics`,
    });
  }

  // Guardian: QA review
  if (payload.qa_report && payload.qa_report.status) {
    const compliance = payload.qa_report.framework_compliance;
    entries.push({
      ...baseEntry,
      founder_id: 'guardian',
      activity_type: 'review',
      description:
        typeof compliance === 'number'
          ? `Completed quality review with ${Math.round(compliance * 100)}% framework compliance`
          : `Completed quality assurance review for validation report`,
    });
  }

  // Compass: Synthesis (if there's a final recommendation)
  if (payload.validation_report.validation_outcome) {
    entries.push({
      ...baseEntry,
      founder_id: 'compass',
      activity_type: 'research',
      description: `Synthesized findings into strategic recommendations for a ${industry}`,
    });
  }

  return entries;
}

// =============================================================================
// CONSULTANT ONBOARDING SCHEMAS
// =============================================================================

const consultantOnboardingSchema = z.object({
  flow_type: z.literal('consultant_onboarding'),
  consultant_id: z.string().uuid(),
  session_id: z.string().optional(),
  practice_analysis: z.object({
    strengths: z.array(z.string()).default([]),
    gaps: z.array(z.string()).default([]),
    positioning: z.string().default(''),
    opportunities: z.array(z.string()).default([]),
    client_profile: z.string().default(''),
  }).passthrough(),
  recommendations: z.array(z.string()).default([]),
  onboarding_tips: z.array(z.string()).default([]),
  suggested_templates: z.array(z.string()).default([]),
  suggested_workflows: z.array(z.string()).default([]),
  white_label_suggestions: z.record(z.string(), z.any()).default({}),
  completed_at: z.string().optional(),
});

type ConsultantOnboardingPayload = z.infer<typeof consultantOnboardingSchema>;

// =============================================================================
// FOUNDER VALIDATION HANDLER
// =============================================================================

function buildReportRow(payload: FounderValidationPayload) {
  const nowIso = new Date().toISOString();
  const report = payload.validation_report;
  const executionId = payload.run_id || payload.kickoff_id;

  return {
    project_id: payload.project_id,
    title: `Validation Report: ${report.business_idea.slice(0, 50)}`,
    report_type: 'value_proposition_analysis',
    content: {
      validation_outcome: report.validation_outcome,
      evidence_summary: report.evidence_summary,
      pivot_recommendation: report.pivot_recommendation,
      next_steps: report.next_steps,
      value_proposition_canvas: payload.value_proposition_canvas,
      qa_report: payload.qa_report,
      // Store metadata in content since reports table doesn't have dedicated columns
      _metadata: {
        user_id: payload.user_id,
        validation_id: report.id,
        execution_id: executionId,  // run_id (Modal) or kickoff_id (AMP)
        completed_at: payload.completed_at || nowIso,
        evidence_phases: {
          desirability: !!payload.evidence.desirability,
          feasibility: !!payload.evidence.feasibility,
          viability: !!payload.evidence.viability,
        },
      },
    },
    model: 'crewai-flows',
    generated_at: nowIso,
    updated_at: nowIso,
  };
}

function buildEvidenceRows(payload: FounderValidationPayload) {
  const nowIso = new Date().toISOString();
  const evidenceRows: any[] = [];

  // Desirability evidence
  if (payload.evidence.desirability) {
    const d = payload.evidence.desirability;
    evidenceRows.push({
      project_id: payload.project_id,
      title: 'Desirability Evidence',
      category: 'Research',
      summary: `Problem resonance: ${(d.problem_resonance || 0) * 100}%, Conversion: ${(d.conversion_rate || 0) * 100}%`,
      content: JSON.stringify(d),
      strength: d.problem_resonance && d.problem_resonance > 0.6 ? 'strong' : d.problem_resonance && d.problem_resonance > 0.3 ? 'medium' : 'weak',
      fit_type: 'Desirability',
      source_type: 'crew_analysis',
      source: 'CrewAI Growth Crew',
      tags: ['desirability', 'crew_ai', 'validation'],
      created_at: nowIso,
      updated_at: nowIso,
    });

    // Create evidence items for each experiment
    if (d.experiments && Array.isArray(d.experiments)) {
      d.experiments.forEach((exp: any, index: number) => {
        evidenceRows.push({
          project_id: payload.project_id,
          title: exp.name || `Experiment ${index + 1}`,
          category: 'Experiment',
          summary: exp.summary || exp.key_learnings?.join('; ') || 'Experiment result',
          content: JSON.stringify(exp),
          strength: exp.success ? 'strong' : 'weak',
          fit_type: 'Desirability',
          source_type: 'experiment',
          source: 'CrewAI Growth Crew',
          tags: ['experiment', 'desirability', 'crew_ai'],
          created_at: nowIso,
          updated_at: nowIso,
        });
      });
    }
  }

  // Feasibility evidence
  if (payload.evidence.feasibility) {
    const f = payload.evidence.feasibility;
    const feasibleCount = Object.values(f.core_features_feasible || {}).filter(v => v === 'POSSIBLE').length;
    const totalFeatures = Object.keys(f.core_features_feasible || {}).length;

    evidenceRows.push({
      project_id: payload.project_id,
      title: 'Feasibility Evidence',
      category: 'Research',
      summary: `${feasibleCount}/${totalFeatures} core features feasible. Monthly cost: $${f.total_monthly_cost || 0}`,
      content: JSON.stringify(f),
      strength: f.downgrade_required ? 'medium' : totalFeatures > 0 && feasibleCount === totalFeatures ? 'strong' : 'weak',
      fit_type: 'Feasibility',
      source_type: 'crew_analysis',
      source: 'CrewAI Build Crew',
      tags: ['feasibility', 'crew_ai', 'validation'],
      created_at: nowIso,
      updated_at: nowIso,
    });
  }

  // Viability evidence
  if (payload.evidence.viability) {
    const v = payload.evidence.viability;
    const ltvCacRatio = v.ltv_cac_ratio || 0;

    evidenceRows.push({
      project_id: payload.project_id,
      title: 'Viability Evidence',
      category: 'Analytics',
      summary: `CAC: $${v.cac || 0}, LTV: $${v.ltv || 0}, LTV/CAC: ${ltvCacRatio.toFixed(1)}, Gross Margin: ${((v.gross_margin || 0) * 100).toFixed(0)}%`,
      content: JSON.stringify(v),
      strength: ltvCacRatio > 3 ? 'strong' : ltvCacRatio > 1 ? 'medium' : 'weak',
      fit_type: 'Viability',
      source_type: 'crew_analysis',
      source: 'CrewAI Finance Crew',
      tags: ['viability', 'crew_ai', 'validation', 'unit_economics'],
      created_at: nowIso,
      updated_at: nowIso,
    });
  }

  return evidenceRows;
}

/**
 * Build row for crewai_validation_states table (full state persistence)
 */
function buildValidationStateRow(payload: FounderValidationPayload) {
  const nowIso = new Date().toISOString();
  const canvas = payload.value_proposition_canvas;
  const segments = Object.keys(canvas);
  const executionId = payload.run_id || payload.kickoff_id;

  // Transform VPC data into the expected format
  const customerProfiles: Record<string, any> = {};
  const valueMaps: Record<string, any> = {};

  for (const [segmentName, segmentData] of Object.entries(canvas)) {
    if (segmentData.customer_profile) {
      customerProfiles[segmentName] = segmentData.customer_profile;
    }
    if (segmentData.value_map) {
      valueMaps[segmentName] = segmentData.value_map;
    }
  }

  // Derive signals from evidence if not explicitly provided
  const desirabilitySignal = payload.desirability_signal ||
    (payload.evidence.desirability?.problem_resonance
      ? payload.evidence.desirability.problem_resonance > 0.6
        ? 'strong_commitment'
        : payload.evidence.desirability.problem_resonance > 0.3
          ? 'weak_interest'
          : 'no_interest'
      : 'no_signal');

  const feasibilitySignal = payload.feasibility_signal ||
    (payload.evidence.feasibility
      ? payload.evidence.feasibility.downgrade_required
        ? 'orange_constrained'
        : 'green'
      : 'unknown');

  const viabilitySignal = payload.viability_signal ||
    (payload.evidence.viability?.ltv_cac_ratio
      ? payload.evidence.viability.ltv_cac_ratio >= 3
        ? 'profitable'
        : payload.evidence.viability.ltv_cac_ratio >= 1
          ? 'marginal'
          : 'underwater'
      : 'unknown');

  return {
    project_id: payload.project_id,
    user_id: payload.user_id,
    session_id: payload.session_id || null,
    kickoff_id: executionId || null,  // Store run_id or kickoff_id
    iteration: payload.iteration || 1,
    phase: payload.phase || 'desirability',
    current_risk_axis: payload.current_risk_axis || 'desirability',
    problem_fit: payload.problem_fit || 'unknown',
    current_segment: payload.current_segment || segments[0] || null,
    current_value_prop: payload.current_value_prop || null,

    // Innovation Physics Signals
    desirability_signal: desirabilitySignal,
    feasibility_signal: feasibilitySignal,
    viability_signal: viabilitySignal,

    // Pivot tracking
    last_pivot_type: payload.last_pivot_type || 'none',
    pending_pivot_type: payload.pending_pivot_type || 'none',
    pivot_recommendation: payload.pivot_recommendation ||
      payload.validation_report.pivot_recommendation || null,

    // Human approval
    human_approval_status: payload.human_approval_status || 'not_required',
    human_comment: payload.human_comment || null,
    human_input_required: payload.human_input_required || false,
    human_input_reason: payload.human_input_reason || null,

    // Evidence containers
    desirability_evidence: payload.evidence.desirability || null,
    feasibility_evidence: payload.evidence.feasibility || null,
    viability_evidence: payload.evidence.viability || null,

    // VPC data
    customer_profiles: Object.keys(customerProfiles).length > 0 ? customerProfiles : null,
    value_maps: Object.keys(valueMaps).length > 0 ? valueMaps : null,
    competitor_report: payload.competitor_report || null,

    // Assumptions and artifacts
    assumptions: payload.assumptions || null,
    desirability_experiments: payload.desirability_experiments || null,
    downgrade_active: payload.downgrade_active || false,
    last_feasibility_artifact: payload.last_feasibility_artifact || null,
    last_viability_metrics: payload.last_viability_metrics || null,

    // QA and Governance
    qa_reports: payload.qa_report ? [payload.qa_report] : null,
    current_qa_status: payload.qa_report?.status || null,
    framework_compliance: typeof payload.qa_report?.framework_compliance === 'number'
      ? payload.qa_report.framework_compliance > 0.7
      : false,
    logical_consistency: typeof payload.qa_report?.logical_consistency === 'number'
      ? payload.qa_report.logical_consistency > 0.7
      : false,
    completeness: typeof payload.qa_report?.completeness === 'number'
      ? payload.qa_report.completeness > 0.7
      : false,

    // Service Crew outputs
    business_idea: payload.validation_report.business_idea,
    entrepreneur_input: payload.validation_report.business_idea,
    target_segments: payload.target_segments || segments,
    problem_statement: payload.problem_statement || null,
    solution_description: payload.solution_description || null,
    revenue_model: payload.revenue_model || null,

    // Analysis outputs
    segment_fit_scores: payload.segment_fit_scores || null,
    analysis_insights: payload.analysis_insights || null,

    // Growth outputs (from desirability evidence)
    ad_impressions: payload.evidence.desirability?.impressions || 0,
    ad_clicks: payload.evidence.desirability?.clicks || 0,
    ad_signups: payload.evidence.desirability?.signups || 0,
    ad_spend: payload.evidence.desirability?.spend_usd || 0,

    // Build outputs (from feasibility evidence)
    api_costs: payload.evidence.feasibility?.api_costs
      ? { total: payload.evidence.feasibility.api_costs }
      : null,
    infra_costs: payload.evidence.feasibility?.infra_costs
      ? { total: payload.evidence.feasibility.infra_costs }
      : null,
    total_monthly_cost: payload.evidence.feasibility?.total_monthly_cost || 0,

    // Finance outputs (from viability evidence)
    cac: payload.evidence.viability?.cac || 0,
    ltv: payload.evidence.viability?.ltv || 0,
    ltv_cac_ratio: payload.evidence.viability?.ltv_cac_ratio || 0,
    gross_margin: payload.evidence.viability?.gross_margin || 0,
    tam: payload.evidence.viability?.tam_usd || 0,

    // Synthesis outputs
    synthesis_confidence: 0.7, // Default confidence
    evidence_summary: payload.validation_report.evidence_summary,
    final_recommendation: payload.validation_report.validation_outcome,
    next_steps: payload.validation_report.next_steps,

    // Budget tracking
    budget_status: payload.budget_status || 'ok',
    budget_escalation_triggered: false,
    budget_kill_triggered: false,

    // Business model
    business_model_type: payload.business_model_type || null,
    business_model_inferred_from: null,

    // Timestamps
    created_at: nowIso,
    updated_at: nowIso,
  };
}

function buildEntrepreneurBriefRow(payload: FounderValidationPayload) {
  const nowIso = new Date().toISOString();
  const report = payload.validation_report;
  const canvas = payload.value_proposition_canvas;
  const segments = Object.keys(canvas);
  const primarySegment = segments[0];

  return {
    session_id: payload.session_id,
    user_id: payload.user_id,
    customer_segments: segments,
    primary_customer_segment: primarySegment || null,
    customer_segment_confidence: payload.evidence.desirability?.problem_resonance
      ? Math.round((payload.evidence.desirability.problem_resonance) * 10)
      : 5,
    problem_description: report.evidence_summary || report.business_idea,
    problem_pain_level: payload.evidence.desirability?.problem_resonance
      ? Math.round((payload.evidence.desirability.problem_resonance) * 10)
      : 5,
    solution_description: report.business_idea,
    unique_value_proposition: report.validation_outcome,
    differentiation_factors: report.next_steps,
    competitors: [],
    competitive_alternatives: [],
    budget_range: payload.evidence.feasibility?.total_monthly_cost
      ? `$${payload.evidence.feasibility.total_monthly_cost}/month`
      : null,
    available_channels: [],
    business_stage: 'validation',
    three_month_goals: report.next_steps.slice(0, 3),
    six_month_goals: report.next_steps.slice(3, 6),
    success_criteria: [],
    key_metrics: payload.evidence.viability ? [
      `CAC: $${payload.evidence.viability.cac || 0}`,
      `LTV: $${payload.evidence.viability.ltv || 0}`,
      `LTV/CAC: ${(payload.evidence.viability.ltv_cac_ratio || 0).toFixed(1)}`,
    ] : [],
    completeness_score: 70,
    clarity_score: 65,
    consistency_score: 60,
    overall_quality_score: 65,
    ai_confidence_scores: {
      desirability: payload.evidence.desirability?.problem_resonance || 0.5,
      feasibility: payload.evidence.feasibility ? 0.7 : 0.3,
      viability: payload.evidence.viability?.ltv_cac_ratio ? Math.min(payload.evidence.viability.ltv_cac_ratio / 5, 1) : 0.3,
    },
    validation_flags: [],
    recommended_next_steps: report.next_steps,
    created_at: nowIso,
    updated_at: nowIso,
  };
}

async function handleFounderValidation(payload: FounderValidationPayload): Promise<NextResponse> {
  // Use run_id (Modal) or kickoff_id (AMP) for identification
  const executionId = payload.run_id || payload.kickoff_id;

  console.log('[api/crewai/webhook] Processing founder_validation:', {
    project_id: payload.project_id,
    user_id: payload.user_id,
    execution_id: executionId,
    validation_id: payload.validation_report.id,
    has_desirability: !!payload.evidence.desirability,
    has_feasibility: !!payload.evidence.feasibility,
    has_viability: !!payload.evidence.viability,
  });

  const admin = createAdminClient();

  // Verify project exists and belongs to user
  const { data: project, error: projectError } = await admin
    .from('projects')
    .select('id, user_id, evidence_count')
    .eq('id', payload.project_id)
    .single();

  if (projectError || !project) {
    console.error('[api/crewai/webhook] Project not found:', projectError);
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  if (project.user_id !== payload.user_id) {
    console.error('[api/crewai/webhook] User ID mismatch');
    return NextResponse.json({ error: 'User ID does not match project owner' }, { status: 403 });
  }

  // Build and insert report
  const reportRow = buildReportRow(payload);
  const { data: insertedReport, error: reportError } = await admin
    .from('reports')
    .insert(reportRow)
    .select('id')
    .single();

  if (reportError) {
    console.error('[api/crewai/webhook] Failed to insert report:', reportError);
    return NextResponse.json({ error: 'Failed to store report', details: reportError.message }, { status: 500 });
  }

  console.log('[api/crewai/webhook] Report created:', insertedReport?.id);

  // Build and insert evidence
  const evidenceRows = buildEvidenceRows(payload);
  let evidenceCreated = 0;

  if (evidenceRows.length > 0) {
    const { error: evidenceError } = await admin.from('evidence').insert(evidenceRows);
    if (!evidenceError) {
      evidenceCreated = evidenceRows.length;
      console.log('[api/crewai/webhook] Evidence created:', evidenceCreated);
    }
  }

  // Update project evidence count and status
  const existingCount = typeof project.evidence_count === 'number' ? project.evidence_count : 0;
  await admin
    .from('projects')
    .update({
      evidence_count: existingCount + evidenceCreated,
      status: 'active',
      last_activity: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', payload.project_id);

  // If session_id provided, upsert entrepreneur brief
  if (payload.session_id) {
    const briefRow = buildEntrepreneurBriefRow(payload);
    await admin.from('entrepreneur_briefs').upsert(briefRow, { onConflict: 'session_id' });
  }

  // Persist full validation state to crewai_validation_states table
  const validationStateRow = buildValidationStateRow(payload);
  const { data: validationState, error: stateError } = await admin
    .from('crewai_validation_states')
    .upsert(validationStateRow, {
      onConflict: 'project_id',
      ignoreDuplicates: false,
    })
    .select('id')
    .single();

  if (stateError) {
    // Log but don't fail the request - other data was already saved
    console.error('[api/crewai/webhook] Failed to persist validation state:', stateError);
  } else {
    console.log('[api/crewai/webhook] Validation state persisted:', validationState?.id);
  }

  // Persist public activity log entries for marketing feed
  const activityEntries = buildActivityLogEntries(payload);
  let activitiesCreated = 0;

  if (activityEntries.length > 0) {
    // Check for duplicate execution_id (run_id or kickoff_id) to ensure idempotency
    if (executionId) {
      const { data: existing } = await admin
        .from('public_activity_log')
        .select('id')
        .eq('kickoff_id', executionId)
        .limit(1);

      if (existing && existing.length > 0) {
        console.log(
          '[api/crewai/webhook] Skipping duplicate activity entries for execution_id:',
          executionId
        );
      } else {
        const { error: activityError } = await admin.from('public_activity_log').insert(activityEntries);
        if (activityError) {
          console.error('[api/crewai/webhook] Failed to insert activity log:', activityError);
        } else {
          activitiesCreated = activityEntries.length;
          console.log(`[api/crewai/webhook] Created ${activitiesCreated} public activity entries`);
        }
      }
    } else {
      // No execution_id, insert without deduplication
      const { error: activityError } = await admin.from('public_activity_log').insert(activityEntries);
      if (!activityError) {
        activitiesCreated = activityEntries.length;
        console.log(`[api/crewai/webhook] Created ${activitiesCreated} public activity entries`);
      }
    }
  }

  return NextResponse.json({
    success: true,
    flow_type: 'founder_validation',
    report_id: insertedReport?.id,
    evidence_created: evidenceCreated,
    validation_state_id: validationState?.id || null,
    activities_created: activitiesCreated,
    message: 'Founder validation results persisted successfully',
  });
}

// =============================================================================
// CONSULTANT ONBOARDING HANDLER
// =============================================================================

async function handleConsultantOnboarding(payload: ConsultantOnboardingPayload): Promise<NextResponse> {
  console.log('[api/crewai/webhook] Processing consultant_onboarding:', {
    consultant_id: payload.consultant_id,
    session_id: payload.session_id,
    recommendations_count: payload.recommendations.length,
    templates_count: payload.suggested_templates.length,
  });

  const admin = createAdminClient();

  // Verify consultant profile exists
  const { data: profile, error: profileError } = await admin
    .from('consultant_profiles')
    .select('id, onboarding_completed')
    .eq('id', payload.consultant_id)
    .single();

  if (profileError || !profile) {
    console.error('[api/crewai/webhook] Consultant profile not found:', profileError);
    return NextResponse.json({ error: 'Consultant profile not found' }, { status: 404 });
  }

  // Build the update payload
  const updatePayload: Record<string, any> = {
    ai_practice_analysis: payload.practice_analysis,
    ai_recommendations: payload.recommendations,
    ai_onboarding_tips: payload.onboarding_tips,
    ai_suggested_templates: payload.suggested_templates,
    ai_suggested_workflows: payload.suggested_workflows,
    ai_analysis_completed: true,
    ai_analysis_completed_at: payload.completed_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (Object.keys(payload.white_label_suggestions).length > 0) {
    updatePayload.ai_white_label_suggestions = payload.white_label_suggestions;
  }

  // Update consultant profile
  const { error: updateError } = await admin
    .from('consultant_profiles')
    .update(updatePayload)
    .eq('id', payload.consultant_id);

  if (updateError) {
    console.error('[api/crewai/webhook] Failed to update consultant profile:', updateError);
    return NextResponse.json({ error: 'Failed to update consultant profile', details: updateError.message }, { status: 500 });
  }

  console.log('[api/crewai/webhook] Consultant profile updated with AI recommendations');

  return NextResponse.json({
    success: true,
    flow_type: 'consultant_onboarding',
    consultant_id: payload.consultant_id,
    recommendations_stored: payload.recommendations.length,
    templates_suggested: payload.suggested_templates.length,
    message: 'Consultant onboarding results stored successfully',
  });
}

// =============================================================================
// MODAL PROGRESS UPDATE SCHEMAS AND HANDLER
// =============================================================================

const progressUpdateSchema = z.object({
  flow_type: z.literal('progress_update'),
  run_id: z.string(),
  project_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  status: z.enum(['pending', 'running', 'paused', 'completed', 'failed']),
  current_phase: z.number(),
  phase_name: z.string(),
  progress: z.object({
    crew: z.string().optional(),
    task: z.string().optional(),
    agent: z.string().optional(),
    progress_pct: z.number(),
  }).optional(),
  error: z.string().optional(),
  timestamp: z.string().optional(),
});

type ProgressUpdatePayload = z.infer<typeof progressUpdateSchema>;

async function handleProgressUpdate(payload: ProgressUpdatePayload): Promise<NextResponse> {
  console.log('[api/crewai/webhook] Processing progress_update:', {
    run_id: payload.run_id,
    status: payload.status,
    phase: payload.current_phase,
    progress_pct: payload.progress?.progress_pct,
  });

  const admin = createAdminClient();

  // Update validation_runs table with progress
  const { error: updateError } = await admin
    .from('validation_runs')
    .update({
      status: payload.status,
      current_phase: payload.current_phase,
      phase_name: payload.phase_name,
      progress: payload.progress,
      error: payload.error,
      updated_at: new Date().toISOString(),
    })
    .eq('run_id', payload.run_id);

  if (updateError) {
    console.error('[api/crewai/webhook] Failed to update validation_runs:', updateError);
    // Don't fail - progress updates are best-effort
  }

  // Also insert into validation_progress for Realtime subscriptions
  const { error: progressError } = await admin
    .from('validation_progress')
    .insert({
      run_id: payload.run_id,
      project_id: payload.project_id,
      user_id: payload.user_id,
      status: payload.status,
      current_phase: payload.current_phase,
      phase_name: payload.phase_name,
      crew: payload.progress?.crew,
      task: payload.progress?.task,
      agent: payload.progress?.agent,
      progress_pct: payload.progress?.progress_pct ?? 0,
      error: payload.error,
      created_at: payload.timestamp || new Date().toISOString(),
    });

  if (progressError) {
    console.error('[api/crewai/webhook] Failed to insert progress:', progressError);
  }

  return NextResponse.json({
    success: true,
    flow_type: 'progress_update',
    run_id: payload.run_id,
    message: 'Progress update recorded',
  });
}

// =============================================================================
// MODAL HITL CHECKPOINT SCHEMAS AND HANDLER
// =============================================================================

const hitlCheckpointSchema = z.object({
  flow_type: z.literal('hitl_checkpoint'),
  run_id: z.string(),
  project_id: z.string().uuid(),
  user_id: z.string().uuid(),
  checkpoint: z.string(),
  title: z.string(),
  description: z.string(),
  options: z.array(z.object({
    id: z.string(),
    label: z.string(),
    description: z.string().optional(),
  })),
  recommended: z.string().optional(),
  context: z.record(z.string(), z.any()).optional(),
  expires_at: z.string().optional(),
  timestamp: z.string().optional(),
});

type HITLCheckpointPayload = z.infer<typeof hitlCheckpointSchema>;

async function handleHITLCheckpoint(payload: HITLCheckpointPayload): Promise<NextResponse> {
  console.log('[api/crewai/webhook] Processing hitl_checkpoint:', {
    run_id: payload.run_id,
    checkpoint: payload.checkpoint,
    title: payload.title,
    options_count: payload.options.length,
  });

  const admin = createAdminClient();
  const nowIso = new Date().toISOString();

  // Update validation_runs to paused status
  await admin
    .from('validation_runs')
    .update({
      status: 'paused',
      hitl_checkpoint: {
        checkpoint: payload.checkpoint,
        title: payload.title,
        description: payload.description,
        options: payload.options,
        recommended: payload.recommended,
        context: payload.context,
      },
      updated_at: nowIso,
    })
    .eq('run_id', payload.run_id);

  // Create approval request in approval_requests table
  const { data: approvalRequest, error: approvalError } = await admin
    .from('approval_requests')
    .insert({
      project_id: payload.project_id,
      user_id: payload.user_id,
      execution_id: payload.run_id,  // Store run_id as execution_id
      task_id: payload.checkpoint,    // Store checkpoint name as task_id
      approval_type: 'hitl_checkpoint',
      status: 'pending',
      title: payload.title,
      description: payload.description,
      options: payload.options,
      recommended_option: payload.recommended,
      context: payload.context,
      expires_at: payload.expires_at,
      created_at: nowIso,
      updated_at: nowIso,
    })
    .select('id')
    .single();

  if (approvalError) {
    console.error('[api/crewai/webhook] Failed to create approval request:', approvalError);
    return NextResponse.json(
      { error: 'Failed to create approval request', details: approvalError.message },
      { status: 500 }
    );
  }

  console.log('[api/crewai/webhook] HITL checkpoint approval request created:', approvalRequest?.id);

  // Insert HITL progress event for Realtime
  await admin
    .from('validation_progress')
    .insert({
      run_id: payload.run_id,
      project_id: payload.project_id,
      user_id: payload.user_id,
      status: 'paused',
      current_phase: 0,  // Will be updated from validation_runs
      phase_name: 'Awaiting Approval',
      crew: 'HITL',
      task: payload.checkpoint,
      agent: 'Human',
      progress_pct: 0,
      created_at: nowIso,
    });

  return NextResponse.json({
    success: true,
    flow_type: 'hitl_checkpoint',
    run_id: payload.run_id,
    checkpoint: payload.checkpoint,
    approval_request_id: approvalRequest?.id,
    message: 'HITL checkpoint recorded and approval request created',
  });
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  // Validate bearer token
  if (!validateBearerToken(request)) {
    console.error('[api/crewai/webhook] Invalid or missing bearer token');
    return NextResponse.json(
      { error: 'Unauthorized - Invalid bearer token' },
      { status: 401 }
    );
  }

  let body: any;

  // Parse request body
  try {
    body = await request.json();
  } catch (parseError) {
    console.error('[api/crewai/webhook] Failed to parse request body:', parseError);
    return NextResponse.json(
      { error: 'Malformed JSON body' },
      { status: 400 }
    );
  }

  // Determine flow type
  const flowType = body.flow_type as FlowType | undefined;

  if (!flowType) {
    console.error('[api/crewai/webhook] Missing flow_type in payload');
    return NextResponse.json(
      { error: 'Missing flow_type field. Expected: founder_validation | consultant_onboarding' },
      { status: 400 }
    );
  }

  console.log(`[api/crewai/webhook] Received ${flowType} webhook`);

  try {
    switch (flowType) {
      case 'founder_validation': {
        const validation = founderValidationSchema.safeParse(body);
        if (!validation.success) {
          console.error('[api/crewai/webhook] founder_validation validation failed:', validation.error.flatten());
          return NextResponse.json(
            { error: 'Invalid payload for founder_validation', details: validation.error.flatten() },
            { status: 400 }
          );
        }
        return await handleFounderValidation(validation.data);
      }

      case 'consultant_onboarding': {
        const validation = consultantOnboardingSchema.safeParse(body);
        if (!validation.success) {
          console.error('[api/crewai/webhook] consultant_onboarding validation failed:', validation.error.flatten());
          return NextResponse.json(
            { error: 'Invalid payload for consultant_onboarding', details: validation.error.flatten() },
            { status: 400 }
          );
        }
        return await handleConsultantOnboarding(validation.data);
      }

      case 'progress_update': {
        const validation = progressUpdateSchema.safeParse(body);
        if (!validation.success) {
          console.error('[api/crewai/webhook] progress_update validation failed:', validation.error.flatten());
          return NextResponse.json(
            { error: 'Invalid payload for progress_update', details: validation.error.flatten() },
            { status: 400 }
          );
        }
        return await handleProgressUpdate(validation.data);
      }

      case 'hitl_checkpoint': {
        const validation = hitlCheckpointSchema.safeParse(body);
        if (!validation.success) {
          console.error('[api/crewai/webhook] hitl_checkpoint validation failed:', validation.error.flatten());
          return NextResponse.json(
            { error: 'Invalid payload for hitl_checkpoint', details: validation.error.flatten() },
            { status: 400 }
          );
        }
        return await handleHITLCheckpoint(validation.data);
      }

      default:
        console.error('[api/crewai/webhook] Unknown flow_type:', flowType);
        return NextResponse.json(
          { error: `Unknown flow_type: ${flowType}. Expected: founder_validation | consultant_onboarding | progress_update | hitl_checkpoint` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[api/crewai/webhook] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
