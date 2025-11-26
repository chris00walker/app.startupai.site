/**
 * Unified CrewAI Webhook Endpoint
 *
 * POST /api/crewai/webhook
 *
 * Single entry point for all CrewAI flow results. Routes internally
 * based on the `flow_type` field in the payload.
 *
 * Supported flow types:
 * - founder_validation: Validation results from InternalValidationFlow
 * - consultant_onboarding: Results from ConsultantOnboardingFlow
 *
 * Authentication: Bearer token (CREW_CONTRACT_BEARER)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient as createAdminClient } from '@/lib/supabase/admin';

// =============================================================================
// SHARED TYPES AND UTILITIES
// =============================================================================

type FlowType = 'founder_validation' | 'consultant_onboarding';

/**
 * Validate bearer token from CrewAI
 */
function validateBearerToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.slice(7);
  const expectedToken = process.env.CREW_CONTRACT_BEARER;

  if (!expectedToken) {
    console.error('[api/crewai/webhook] CREW_CONTRACT_BEARER not configured');
    return false;
  }

  return token === expectedToken;
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
  traffic_quality: z.string().optional(),
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
  tam_usd: z.number().optional(),
}).passthrough().nullable();

const qaReportSchema = z.object({
  status: z.string().optional(),
  issues: z.array(z.any()).default([]),
  recommendations: z.array(z.any()).default([]),
  framework_compliance: z.number().optional(),
  logical_consistency: z.number().optional(),
  completeness: z.number().optional(),
}).passthrough().nullable();

const founderValidationSchema = z.object({
  flow_type: z.literal('founder_validation'),
  project_id: z.string().uuid(),
  user_id: z.string().uuid(),
  kickoff_id: z.string().optional(),
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
});

type FounderValidationPayload = z.infer<typeof founderValidationSchema>;

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
        kickoff_id: payload.kickoff_id,
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
  console.log('[api/crewai/webhook] Processing founder_validation:', {
    project_id: payload.project_id,
    user_id: payload.user_id,
    kickoff_id: payload.kickoff_id,
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

  return NextResponse.json({
    success: true,
    flow_type: 'founder_validation',
    report_id: insertedReport?.id,
    evidence_created: evidenceCreated,
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

      default:
        console.error('[api/crewai/webhook] Unknown flow_type:', flowType);
        return NextResponse.json(
          { error: `Unknown flow_type: ${flowType}. Expected: founder_validation | consultant_onboarding` },
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
