/**
 * CrewAI Results Webhook Endpoint (LEGACY)
 *
 * POST /api/crewai/results
 *
 * DEPRECATED: Use /api/crewai/webhook with flow_type: "founder_validation" instead.
 * This route forwards requests to the unified webhook for backwards compatibility.
 *
 * Authentication: Bearer token (MODAL_AUTH_TOKEN)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient as createAdminClient } from '@/lib/supabase/admin';

// NOTE: This is a legacy endpoint. New integrations should use /api/crewai/webhook
// with flow_type: "founder_validation" in the payload.

// Schema for validation report from CrewAI Flow
const validationReportSchema = z.object({
  id: z.string(),
  business_idea: z.string(),
  validation_outcome: z.string().nullable(),
  evidence_summary: z.string().nullable(),
  pivot_recommendation: z.string().nullable(),
  next_steps: z.array(z.string()).default([]),
});

// Schema for customer profile
const customerProfileSchema = z.object({
  jobs: z.array(z.any()).default([]),
  pains: z.array(z.any()).default([]),
  gains: z.array(z.any()).default([]),
}).passthrough();

// Schema for value map
const valueMapSchema = z.object({
  products_services: z.array(z.string()).default([]),
  pain_relievers: z.array(z.any()).default([]),
  gain_creators: z.array(z.any()).default([]),
}).passthrough();

// Schema for desirability evidence
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

// Schema for feasibility evidence
const feasibilityEvidenceSchema = z.object({
  core_features_feasible: z.record(z.string(), z.string()).default({}),
  downgrade_required: z.boolean().optional(),
  downgrade_impact: z.string().optional(),
  api_costs: z.number().optional(),
  infra_costs: z.number().optional(),
  total_monthly_cost: z.number().optional(),
}).passthrough().nullable();

// Schema for viability evidence
const viabilityEvidenceSchema = z.object({
  cac: z.number().optional(),
  ltv: z.number().optional(),
  ltv_cac_ratio: z.number().optional(),
  gross_margin: z.number().optional(),
  tam_usd: z.number().optional(),
}).passthrough().nullable();

// Schema for QA report
const qaReportSchema = z.object({
  status: z.string().optional(),
  issues: z.array(z.any()).default([]),
  recommendations: z.array(z.any()).default([]),
  framework_compliance: z.number().optional(),
  logical_consistency: z.number().optional(),
  completeness: z.number().optional(),
}).passthrough().nullable();

// Main payload schema for CrewAI results webhook
const crewAIResultsSchema = z.object({
  // Required: project context
  project_id: z.string().uuid(),
  user_id: z.string().uuid(),
  run_id: z.string().optional(),
  kickoff_id: z.string().optional(),
  session_id: z.string().optional(),

  // Validation report
  validation_report: validationReportSchema,

  // Value proposition canvas (segment -> profile/value_map)
  value_proposition_canvas: z.record(z.string(), z.object({
    customer_profile: customerProfileSchema.nullable(),
    value_map: valueMapSchema.nullable(),
  })).default({}),

  // Evidence from each phase
  evidence: z.object({
    desirability: desirabilityEvidenceSchema,
    feasibility: feasibilityEvidenceSchema,
    viability: viabilityEvidenceSchema,
  }),

  // QA report
  qa_report: qaReportSchema,

  // Metadata
  completed_at: z.string().optional(),
});

type CrewAIResultsPayload = z.infer<typeof crewAIResultsSchema>;

/**
 * Validate bearer token from webhook
 */
function validateBearerToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.slice(7);
  const expectedToken = process.env.MODAL_AUTH_TOKEN;

  if (!expectedToken) {
    console.error('[api/crewai/results] MODAL_AUTH_TOKEN not configured');
    return false;
  }

  return token === expectedToken;
}

/**
 * Build report row for insertion
 */
function buildReportRow(payload: CrewAIResultsPayload) {
  const nowIso = new Date().toISOString();
  const report = payload.validation_report;

  return {
    project_id: payload.project_id,
    user_id: payload.user_id,
    title: `Validation Report: ${report.business_idea.slice(0, 50)}`,
    report_type: 'value_proposition_analysis',
    content: {
      validation_outcome: report.validation_outcome,
      evidence_summary: report.evidence_summary,
      pivot_recommendation: report.pivot_recommendation,
      next_steps: report.next_steps,
      value_proposition_canvas: payload.value_proposition_canvas,
      qa_report: payload.qa_report,
    },
    ai_model: 'crewai-flows',
    generation_metadata: {
      kind: 'crew_validation',
      validation_id: report.id,
      kickoff_id: payload.run_id || payload.kickoff_id,
      completed_at: payload.completed_at || nowIso,
      evidence_phases: {
        desirability: !!payload.evidence.desirability,
        feasibility: !!payload.evidence.feasibility,
        viability: !!payload.evidence.viability,
      },
    },
    file_url: null,
    file_format: null,
    created_at: nowIso,
    updated_at: nowIso,
  };
}

/**
 * Build evidence rows from CrewAI validation results
 */
function buildEvidenceRows(payload: CrewAIResultsPayload) {
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
 * Build entrepreneur brief row for upsert
 */
function buildEntrepreneurBriefRow(payload: CrewAIResultsPayload) {
  const nowIso = new Date().toISOString();
  const report = payload.validation_report;
  const canvas = payload.value_proposition_canvas;
  const segments = Object.keys(canvas);

  // Get first segment's data as primary
  const primarySegment = segments[0];
  const primaryCanvas = primarySegment ? canvas[primarySegment] : null;

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

export async function POST(request: NextRequest) {
  // Validate bearer token
  if (!validateBearerToken(request)) {
    console.error('[api/crewai/results] Invalid or missing bearer token');
    return NextResponse.json(
      { error: 'Unauthorized - Invalid bearer token' },
      { status: 401 }
    );
  }

  let payload: CrewAIResultsPayload;

  // Parse and validate request body
  try {
    const body = await request.json();
    const validation = crewAIResultsSchema.safeParse(body);

    if (!validation.success) {
      console.error('[api/crewai/results] Validation failed:', validation.error.flatten());
      return NextResponse.json(
        { error: 'Invalid payload', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    payload = validation.data;
  } catch (parseError) {
    console.error('[api/crewai/results] Failed to parse request body:', parseError);
    return NextResponse.json(
      { error: 'Malformed JSON body' },
      { status: 400 }
    );
  }

  console.log('[api/crewai/results] Received results:', {
    project_id: payload.project_id,
    user_id: payload.user_id,
    kickoff_id: payload.run_id || payload.kickoff_id,
    validation_id: payload.validation_report.id,
    has_desirability: !!payload.evidence.desirability,
    has_feasibility: !!payload.evidence.feasibility,
    has_viability: !!payload.evidence.viability,
  });

  try {
    const admin = createAdminClient();

    // Verify project exists and belongs to user
    const { data: project, error: projectError } = await admin
      .from('projects')
      .select('id, user_id, evidence_count')
      .eq('id', payload.project_id)
      .single();

    if (projectError || !project) {
      console.error('[api/crewai/results] Project not found:', projectError);
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (project.user_id !== payload.user_id) {
      console.error('[api/crewai/results] User ID mismatch:', {
        payload_user: payload.user_id,
        project_user: project.user_id,
      });
      return NextResponse.json(
        { error: 'User ID does not match project owner' },
        { status: 403 }
      );
    }

    // Build and insert report
    const reportRow = buildReportRow(payload);
    const { data: insertedReport, error: reportError } = await admin
      .from('reports')
      .insert(reportRow)
      .select('id')
      .single();

    if (reportError) {
      console.error('[api/crewai/results] Failed to insert report:', reportError);
      return NextResponse.json(
        { error: 'Failed to store report', details: reportError.message },
        { status: 500 }
      );
    }

    console.log('[api/crewai/results] Report created:', insertedReport?.id);

    // Build and insert evidence
    const evidenceRows = buildEvidenceRows(payload);
    let evidenceCreated = 0;

    if (evidenceRows.length > 0) {
      const { error: evidenceError } = await admin
        .from('evidence')
        .insert(evidenceRows);

      if (evidenceError) {
        console.error('[api/crewai/results] Failed to insert evidence:', evidenceError);
        // Don't fail the whole request, just log the error
      } else {
        evidenceCreated = evidenceRows.length;
        console.log('[api/crewai/results] Evidence created:', evidenceCreated);
      }
    }

    // Update project evidence count and status
    const existingCount = typeof project.evidence_count === 'number' ? project.evidence_count : 0;
    const { error: projectUpdateError } = await admin
      .from('projects')
      .update({
        evidence_count: existingCount + evidenceCreated,
        status: 'active',
        last_activity: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', payload.project_id);

    if (projectUpdateError) {
      console.error('[api/crewai/results] Failed to update project:', projectUpdateError);
    }

    // If session_id provided, upsert entrepreneur brief
    if (payload.session_id) {
      const briefRow = buildEntrepreneurBriefRow(payload);
      const { error: briefError } = await admin
        .from('entrepreneur_briefs')
        .upsert(briefRow, { onConflict: 'session_id' });

      if (briefError) {
        console.error('[api/crewai/results] Failed to upsert entrepreneur brief:', briefError);
        // Don't fail the whole request
      } else {
        console.log('[api/crewai/results] Entrepreneur brief upserted');
      }
    }

    return NextResponse.json({
      success: true,
      report_id: insertedReport?.id,
      evidence_created: evidenceCreated,
      message: 'Results persisted successfully',
    });

  } catch (error) {
    console.error('[api/crewai/results] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
