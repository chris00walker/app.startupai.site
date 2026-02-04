/**
 * CrewAI Webhook Endpoint
 *
 * POST /api/crewai/webhook
 *
 * Single entry point for all validation flow results. Routes internally
 * based on the `flow_type` field in the payload.
 *
 * Supported flow types:
 * - founder_validation: Validation results
 * - consultant_onboarding: Results from ConsultantOnboardingFlow
 * - progress_update: Real-time progress from Modal (NEW)
 * - hitl_checkpoint: HITL checkpoint notifications from Modal (NEW)
 *
 * Authentication:
 * - Bearer token (MODAL_AUTH_TOKEN)
 *
 * @story US-F06, US-F08, US-F09, US-H01
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';

// Import shared schemas - single source of truth for validation
import {
  founderValidationSchema,
  consultantOnboardingSchema,
  progressUpdateSchema,
  hitlCheckpointSchema,
  type FlowType,
  type FounderValidationPayload,
  type ConsultantOnboardingPayload,
  type ProgressUpdatePayload,
  type HITLCheckpointPayload,
} from './schemas';

// =============================================================================
// SHARED UTILITIES
// =============================================================================

/**
 * Validate bearer token from Modal webhook
 */
function validateBearerToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.slice(7);

  const modalToken = process.env.MODAL_AUTH_TOKEN;

  if (!modalToken) {
    console.error('[api/crewai/webhook] MODAL_AUTH_TOKEN not configured');
    return false;
  }

  return token === modalToken;
}


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
  const executionId = payload.run_id;
  const baseEntry = {
    project_id: payload.project_id,
    kickoff_id: executionId || null,  // Store run_id in legacy kickoff_id column
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
// FOUNDER VALIDATION HANDLER
// =============================================================================

function buildReportRow(payload: FounderValidationPayload) {
  const nowIso = new Date().toISOString();
  const report = payload.validation_report;
  const executionId = payload.run_id;

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
        execution_id: executionId,
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
      evidence_category: 'Research',
      summary: `Problem resonance: ${(d.problem_resonance || 0) * 100}%, Conversion: ${(d.conversion_rate || 0) * 100}%`,
      content: JSON.stringify(d),
      strength: d.problem_resonance && d.problem_resonance > 0.6 ? 'strong' : d.problem_resonance && d.problem_resonance > 0.3 ? 'medium' : 'weak',
      fit_type: 'Desirability',
      source_type: 'crew_analysis',
      evidence_source: 'CrewAI Growth Crew',
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
          evidence_category: 'Experiment',
          summary: exp.summary || exp.key_learnings?.join('; ') || 'Experiment result',
          content: JSON.stringify(exp),
          strength: exp.success ? 'strong' : 'weak',
          fit_type: 'Desirability',
          source_type: 'experiment',
          evidence_source: 'CrewAI Growth Crew',
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
      evidence_category: 'Research',
      summary: `${feasibleCount}/${totalFeatures} core features feasible. Monthly cost: $${f.total_monthly_cost || 0}`,
      content: JSON.stringify(f),
      strength: f.downgrade_required ? 'medium' : totalFeatures > 0 && feasibleCount === totalFeatures ? 'strong' : 'weak',
      fit_type: 'Feasibility',
      source_type: 'crew_analysis',
      evidence_source: 'CrewAI Build Crew',
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
      evidence_category: 'Analytics',
      summary: `CAC: $${v.cac || 0}, LTV: $${v.ltv || 0}, LTV/CAC: ${ltvCacRatio.toFixed(1)}, Gross Margin: ${((v.gross_margin || 0) * 100).toFixed(0)}%`,
      content: JSON.stringify(v),
      strength: ltvCacRatio > 3 ? 'strong' : ltvCacRatio > 1 ? 'medium' : 'weak',
      fit_type: 'Viability',
      source_type: 'crew_analysis',
      evidence_source: 'CrewAI Finance Crew',
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
  const executionId = payload.run_id;

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
    kickoff_id: executionId || null,  // Store run_id in legacy kickoff_id column
    iteration: payload.iteration || 1,
    validation_phase: payload.phase || 'desirability',
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
  // Use run_id for identification
  const executionId = payload.run_id;

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

  // REMOVED: entrepreneur_briefs upsert
  // The TWO-ARTIFACT FIX: entrepreneur_briefs (Layer 1) is created by /api/chat completeOnboarding
  // founders_briefs (Layer 2) is created by handleHITLCheckpoint on approve_founders_brief
  // This code was incorrectly overwriting Layer 1 with Layer 2 data
  // if (payload.session_id) {
  //   const briefRow = buildEntrepreneurBriefRow(payload);
  //   await admin.from('entrepreneur_briefs').upsert(briefRow, { onConflict: 'session_id' });
  // }

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
    // Check for duplicate execution_id to ensure idempotency
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
// MODAL PROGRESS UPDATE HANDLER
// =============================================================================

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
  const progressStatusMap: Record<ProgressUpdatePayload['status'], string> = {
    pending: 'started',
    running: 'in_progress',
    paused: 'in_progress',
    completed: 'completed',
    failed: 'failed',
  };

  const progressStatus = progressStatusMap[payload.status] || 'in_progress';

  const { error: progressError } = await admin
    .from('validation_progress')
    .insert({
      run_id: payload.run_id,
      validation_phase: payload.current_phase,
      status: progressStatus,
      crew: payload.progress?.crew || 'unknown',
      task: payload.progress?.task,
      agent: payload.progress?.agent,
      progress_pct: payload.progress?.progress_pct ?? 0,
      error_message: payload.error,
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
// MODAL HITL CHECKPOINT HANDLER
// =============================================================================

/**
 * Transform checkpoint-specific context into evidence_summary format for UI display.
 *
 * The EvidenceSummary component expects specific fields:
 * - desirability_signal, feasibility_signal, viability_signal (D-F-V signals)
 * - ltv, cac, ltv_cac_ratio, conversion_rate (metrics)
 * - impressions, signups (experiment metrics)
 * - key_learnings (string[]), summary (string)
 *
 * This function transforms checkpoint-specific data into that format.
 */
function buildEvidenceSummaryFromContext(
  checkpoint: string,
  context: Record<string, unknown> | undefined
): Record<string, unknown> {
  if (!context) return {};

  const evidenceSummary: Record<string, unknown> = {};

  switch (checkpoint) {
    case 'approve_founders_brief': {
      // Phase 0: Founder's Brief approval
      const foundersBreif = context.founders_brief as Record<string, unknown> | undefined;
      const businessIdea = (foundersBreif?.business_idea || context.business_idea || '') as string;
      const assumptions = (foundersBreif?.assumptions || context.assumptions || []) as string[];

      evidenceSummary.summary = businessIdea
        ? `Founder's Brief prepared: ${businessIdea.slice(0, 100)}${businessIdea.length > 100 ? '...' : ''}`
        : 'Founder\'s Brief ready for review';
      evidenceSummary.key_learnings = assumptions.slice(0, 5);
      break;
    }

    case 'approve_vpc_completion': {
      // Phase 1: VPC Discovery complete
      const fitAssessment = context.fit_assessment as Record<string, unknown> | undefined;
      const customerProfile = context.customer_profile_summary as Record<string, unknown> | undefined;
      const valueMap = context.value_map_summary as Record<string, unknown> | undefined;

      // Build summary from VPC data
      const fitScore = fitAssessment?.fit_score ?? 0;
      const segment = customerProfile?.segment ?? 'Unknown segment';
      const jobsCount = customerProfile?.jobs_count ?? 0;
      const painsCount = customerProfile?.pains_count ?? 0;
      const gainsCount = customerProfile?.gains_count ?? 0;
      const productsCount = valueMap?.products_count ?? 0;
      const painRelieversCount = valueMap?.pain_relievers_count ?? 0;
      const gainCreatorsCount = valueMap?.gain_creators_count ?? 0;

      evidenceSummary.summary = `VPC fit score: ${fitScore}/100. ` +
        `Customer: ${segment} (${jobsCount} jobs, ${painsCount} pains, ${gainsCount} gains). ` +
        `Value Map: ${productsCount} product(s), ${painRelieversCount} pain relievers, ${gainCreatorsCount} gain creators.`;

      // Key learnings from blockers
      const blockers = (fitAssessment?.blockers || []) as string[];
      evidenceSummary.key_learnings = blockers;

      // No D-F-V signals yet in Phase 1 (VPC is pre-experimentation)
      break;
    }

    case 'approve_desirability_gate': {
      // Phase 2: Desirability validation complete
      const desirabilitySignal = context.desirability_signal as string | undefined;
      const conversionRate = context.conversion_rate as number | undefined;
      const impressions = context.impressions as number | undefined;
      const signups = context.signups as number | undefined;
      const keyLearnings = (context.key_learnings || []) as string[];

      evidenceSummary.desirability_signal = desirabilitySignal || 'no_signal';
      if (conversionRate !== undefined) evidenceSummary.conversion_rate = conversionRate;
      if (impressions !== undefined) evidenceSummary.impressions = impressions;
      if (signups !== undefined) evidenceSummary.signups = signups;
      evidenceSummary.key_learnings = keyLearnings;
      evidenceSummary.summary = context.summary as string || 'Desirability validation complete';
      break;
    }

    case 'approve_feasibility_gate': {
      // Phase 3: Feasibility validation complete
      const feasibilitySignal = context.feasibility_signal as string | undefined;
      const keyLearnings = (context.key_learnings || []) as string[];

      evidenceSummary.feasibility_signal = feasibilitySignal || 'unknown';
      evidenceSummary.key_learnings = keyLearnings;
      evidenceSummary.summary = context.summary as string || 'Feasibility assessment complete';
      break;
    }

    case 'approve_viability_gate': {
      // Phase 4: Viability validation complete
      const viabilitySignal = context.viability_signal as string | undefined;
      const ltv = context.ltv as number | undefined;
      const cac = context.cac as number | undefined;
      const ltvCacRatio = context.ltv_cac_ratio as number | undefined;
      const keyLearnings = (context.key_learnings || []) as string[];

      evidenceSummary.viability_signal = viabilitySignal || 'unknown';
      if (ltv !== undefined) evidenceSummary.ltv = ltv;
      if (cac !== undefined) evidenceSummary.cac = cac;
      if (ltvCacRatio !== undefined) evidenceSummary.ltv_cac_ratio = ltvCacRatio;
      evidenceSummary.key_learnings = keyLearnings;
      evidenceSummary.summary = context.summary as string || 'Viability assessment complete';
      break;
    }

    default: {
      // Generic handling for other checkpoints
      if (context.summary) evidenceSummary.summary = context.summary;
      if (context.key_learnings) evidenceSummary.key_learnings = context.key_learnings;
      if (context.desirability_signal) evidenceSummary.desirability_signal = context.desirability_signal;
      if (context.feasibility_signal) evidenceSummary.feasibility_signal = context.feasibility_signal;
      if (context.viability_signal) evidenceSummary.viability_signal = context.viability_signal;
      break;
    }
  }

  return evidenceSummary;
}

async function handleHITLCheckpoint(payload: HITLCheckpointPayload): Promise<NextResponse> {
  console.log('[api/crewai/webhook] Processing hitl_checkpoint:', {
    run_id: payload.run_id,
    checkpoint: payload.checkpoint,
    title: payload.title,
    options_count: payload.options.length,
  });

  const admin = createAdminClient();
  const nowIso = new Date().toISOString();

  // === PHASE 0 SPECIFIC: Create founders_briefs (Layer 2) on approve_founders_brief ===
  // This is the TWO-ARTIFACT FIX: entrepreneur_briefs (Layer 1) stays untouched
  // founders_briefs (Layer 2) is created from S1 agent's compiled output
  if (payload.checkpoint === 'approve_founders_brief' && payload.context?.founders_brief) {
    const foundersBrief = payload.context.founders_brief as Record<string, any>;

    console.log('[api/crewai/webhook] Creating founders_brief (Layer 2) from S1 output');

    const { error: briefError } = await admin.from('founders_briefs').insert({
      session_id: payload.context.session_id as string || null,
      user_id: payload.user_id,
      // The Idea
      idea_one_liner: foundersBrief.the_idea?.one_liner || foundersBrief.business_idea || 'No idea provided',
      idea_description: foundersBrief.the_idea?.description || foundersBrief.business_idea || '',
      idea_inspiration: foundersBrief.the_idea?.inspiration || null,
      idea_unique_insight: foundersBrief.the_idea?.unique_insight || null,
      // Problem Hypothesis
      problem_statement: foundersBrief.problem_hypothesis?.problem_statement || '',
      problem_who_has_this: foundersBrief.problem_hypothesis?.who_has_this_problem || '',
      problem_frequency: foundersBrief.problem_hypothesis?.frequency || null,
      problem_current_alternatives: foundersBrief.problem_hypothesis?.current_alternatives || null,
      problem_why_alternatives_fail: foundersBrief.problem_hypothesis?.why_alternatives_fail || null,
      problem_evidence: foundersBrief.problem_hypothesis?.evidence || null,
      // Customer Hypothesis
      customer_primary_segment: foundersBrief.customer_hypothesis?.primary_segment || '',
      customer_segment_description: foundersBrief.customer_hypothesis?.segment_description || null,
      customer_characteristics: foundersBrief.customer_hypothesis?.characteristics || [],
      customer_where_to_find: foundersBrief.customer_hypothesis?.where_to_find || null,
      customer_estimated_size: foundersBrief.customer_hypothesis?.estimated_size || null,
      // Solution Hypothesis
      solution_proposed: foundersBrief.solution_hypothesis?.proposed_solution || '',
      solution_key_features: foundersBrief.solution_hypothesis?.key_features || [],
      solution_differentiation: foundersBrief.solution_hypothesis?.differentiation || null,
      solution_unfair_advantage: foundersBrief.solution_hypothesis?.unfair_advantage || null,
      // Key Assumptions (array of objects with risk_level, how_to_test)
      key_assumptions: foundersBrief.key_assumptions || [],
      // QA Status from GV1/GV2 agents
      qa_legitimacy_check: foundersBrief.qa_status?.legitimacy_check || 'pending',
      qa_legitimacy_notes: foundersBrief.qa_status?.legitimacy_notes || null,
      qa_intent_verification: foundersBrief.qa_status?.intent_verification || 'pending',
      qa_intent_notes: foundersBrief.qa_status?.intent_notes || null,
      qa_overall_status: foundersBrief.qa_status?.overall_status || 'pending',
      // Interview metadata from O1 agent
      interview_duration_minutes: foundersBrief.metadata?.interview_duration_minutes || 0,
      interview_turns: foundersBrief.metadata?.interview_turns || 0,
      interview_followup_questions: foundersBrief.metadata?.followup_questions || 0,
      interview_confidence_score: foundersBrief.metadata?.confidence_score || 0,
      // Approval workflow
      approval_status: 'pending',
      created_at: nowIso,
      updated_at: nowIso,
    });

    if (briefError) {
      console.error('[api/crewai/webhook] Failed to create founders_brief (Layer 2):', briefError);
      // Don't fail the whole request - continue with approval request creation
    } else {
      console.log('[api/crewai/webhook] founders_brief (Layer 2) created successfully');
    }
  }

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

  // Determine approval_type based on checkpoint name
  // Map HITL checkpoints to valid approval_type values from schema
  const approvalTypeMap: Record<string, string> = {
    'approve_founders_brief': 'gate_progression',
    'approve_vpc_completion': 'gate_progression',
    'approve_experiment_plan': 'gate_progression',
    'approve_pricing_test': 'gate_progression',
    'approve_campaign_launch': 'campaign_launch',
    'approve_spend_increase': 'spend_increase',
    'approve_desirability_gate': 'gate_progression',
    'approve_feasibility_gate': 'gate_progression',
    'approve_viability_gate': 'gate_progression',
    'approve_pivot': 'segment_pivot',
    'approve_proceed': 'gate_progression',
    'request_human_decision': 'gate_progression',
  };

  // Determine owner_role based on checkpoint phase/type
  const ownerRoleMap: Record<string, string> = {
    'approve_founders_brief': 'compass',     // Phase 0 - Compass leads synthesis
    'approve_vpc_completion': 'compass',     // Phase 1 - VPC
    'approve_experiment_plan': 'pulse',      // Phase 1 - Pulse runs experiments
    'approve_pricing_test': 'ledger',        // Phase 1 - Ledger handles pricing
    'approve_campaign_launch': 'pulse',      // Phase 2 - Marketing
    'approve_spend_increase': 'ledger',      // Phase 2 - Budget
    'approve_desirability_gate': 'compass',  // Phase 2 - Gate
    'approve_feasibility_gate': 'forge',     // Phase 3 - Technical
    'approve_viability_gate': 'ledger',      // Phase 4 - Financial
    'approve_pivot': 'compass',              // Phase 4 - Strategy
    'approve_proceed': 'compass',            // Phase 4 - Final
    'request_human_decision': 'compass',     // Phase 4 - Final decision
  };

  const approvalType = approvalTypeMap[payload.checkpoint] || 'gate_progression';
  const ownerRole = ownerRoleMap[payload.checkpoint] || 'compass';

  // Transform context into evidence_summary for UI display
  const evidenceSummary = buildEvidenceSummaryFromContext(payload.checkpoint, payload.context);

  // Create approval request in approval_requests table
  const { data: approvalRequest, error: approvalError } = await admin
    .from('approval_requests')
    .insert({
      project_id: payload.project_id,
      user_id: payload.user_id,
      execution_id: payload.run_id,  // Store run_id as execution_id
      task_id: payload.checkpoint,    // Store checkpoint name as task_id
      approval_type: approvalType,
      owner_role: ownerRole,
      status: 'pending',
      title: payload.title,
      description: payload.description,
      task_output: payload.context || {},  // Raw context for reference
      evidence_summary: evidenceSummary,   // Transformed for UI display
      options: payload.options,
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
