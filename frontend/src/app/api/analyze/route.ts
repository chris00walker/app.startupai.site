import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { assertTrialAllowance } from '@/lib/auth/trial-guard';

const analyzeRequestSchema = z.object({
  strategic_question: z.string().min(10, 'Strategic question must be at least 10 characters'),
  project_id: z.string().uuid('project_id must be a valid UUID'),
  project_context: z.string().max(4000).optional(),
  target_sources: z.string().max(2000).optional(),
  report_format: z.enum(['markdown', 'html', 'pdf']).default('markdown'),
  project_deadline: z.string().max(64).optional(),
  priority_level: z.enum(['low', 'medium', 'high']).default('medium'),
  session_id: z.string().optional(),
});

type AnalyzeRequestPayload = z.infer<typeof analyzeRequestSchema>;

type CrewFunctionSuccess = {
  success: true;
  analysis_id: string;
  result: {
    summary?: string;
    insight_summaries?: Array<{ id: string; headline: string; confidence?: string; support?: string }>;
    evidence_items?: Array<{
      id: string;
      title?: string;
      content?: string;
      source?: string;
      strength?: string;
      tags?: string[];
    }>;
    report?: {
      title?: string;
      report_type?: string;
      content?: string;
      model?: string;
      generated_at?: string;
    };
    entrepreneur_brief?: Record<string, unknown>;
    raw_output?: string;
    run_started_at?: string;
    inputs?: Record<string, unknown>;
    user_id?: string;
  };
  metadata?: {
    project_id?: string;
    user_id?: string;
    question?: string;
    execution_time_seconds?: number;
    rate_limit?: {
      limit: number;
      remaining: number;
      window_seconds: number;
    };
  };
};

type CrewFunctionError = { success: false; error?: unknown };

type CrewFunctionResponse = CrewFunctionSuccess | CrewFunctionError;

function isCrewFunctionSuccess(payload: CrewFunctionResponse): payload is CrewFunctionSuccess {
  return payload.success === true && typeof payload.analysis_id === 'string' && typeof payload.result === 'object';
}

const PLAN_ANALYSIS_LIMITS: Record<string, number> = {
  trial: 3,
  sprint: 5,
  founder: 25,
  enterprise: 200,
};

function resolveCrewFunctionUrl(request: NextRequest): string {
  if (process.env.CREW_ANALYZE_URL) {
    return process.env.CREW_ANALYZE_URL;
  }

  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const host = forwardedHost ?? request.headers.get('host');

  if (host) {
    const protocol = forwardedProto ?? (host.includes('localhost') ? 'http' : 'https');
    return `${protocol}://${host}/.netlify/functions/crew-analyze`;
  }

  // Development fallback (Netlify dev server default port)
  return 'http://localhost:8888/.netlify/functions/crew-analyze';
}

function mapPlanTier(subscriptionTier?: string | null): keyof typeof PLAN_ANALYSIS_LIMITS {
  const normalized = (subscriptionTier ?? '').toLowerCase();
  if (normalized.includes('sprint')) return 'sprint';
  if (normalized.includes('founder') || normalized.includes('pro')) return 'founder';
  if (normalized.includes('enterprise')) return 'enterprise';
  return 'trial';
}

async function enforcePlanLimits(params: {
  admin: ReturnType<typeof createAdminClient>;
  userId: string;
  planKey: keyof typeof PLAN_ANALYSIS_LIMITS;
}): Promise<{ allowed: boolean; remaining: number }> {
  const { admin, userId, planKey } = params;
  const limit = PLAN_ANALYSIS_LIMITS[planKey];

  if (!Number.isFinite(limit)) {
    return { allowed: true, remaining: Number.POSITIVE_INFINITY };
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data, error } = await admin
    .from('reports')
    .select('id')
    .eq('user_id', userId)
    .contains('generation_metadata', { kind: 'crew_analysis' })
    .gte('created_at', startOfMonth.toISOString());

  if (error) {
    console.warn('[api/analyze] Failed to check plan limits', error);
    return { allowed: true, remaining: limit };
  }

  const used = data?.length ?? 0;
  const remaining = Math.max(limit - used, 0);

  return {
    allowed: remaining > 0,
    remaining,
  };
}

function normalizeEvidenceItems(userId: string, projectId: string, items?: CrewFunctionSuccess['result']['evidence_items']) {
  if (!items || !Array.isArray(items)) {
    return [];
  }

  const nowIso = new Date().toISOString();
  return items.map((item, index) => ({
    project_id: projectId,
    user_id: userId,
    title: item.title || `AI Evidence ${index + 1}`,
    content: item.content || item.title || 'AI generated insight',
    source: item.source || 'CrewAI synthesis',
    strength: item.strength ?? 'medium',
    tags: item.tags ?? ['crew_ai'],
    created_at: nowIso,
    updated_at: nowIso,
  }));
}

function buildReportRow(args: {
  userId: string;
  projectId: string;
  analysis: CrewFunctionSuccess;
}) {
  const { userId, projectId, analysis } = args;
  const nowIso = new Date().toISOString();
  const report = analysis.result.report ?? {};

  return {
    project_id: projectId,
    user_id: userId,
    title: report.title || 'CrewAI Strategic Analysis',
    report_type: report.report_type || 'recommendation',
    content: report.content || analysis.result.summary || 'AI generated analysis summary unavailable.',
    ai_model: report.model || 'crewai',
    generation_metadata: {
      kind: 'crew_analysis',
      analysis_id: analysis.analysis_id,
      insight_ids: analysis.result.insight_summaries?.map((insight) => insight.id) ?? [],
      run_started_at: analysis.result.run_started_at ?? nowIso,
      insights: analysis.result.insight_summaries?.map((insight) => insight.headline) ?? [],
    },
    file_url: null,
    file_format: null,
    created_at: nowIso,
    updated_at: nowIso,
  };
}

function buildEntrepreneurBriefRow(args: {
  userId: string;
  sessionId: string;
  analysis: CrewFunctionSuccess;
}) {
  const { userId, sessionId, analysis } = args;
  const brief = analysis.result.entrepreneur_brief ?? {};
  const nowIso = new Date().toISOString();

  return {
    session_id: sessionId,
    user_id: userId,
    customer_segments: (brief.customer_segments as string[] | undefined) ?? [],
    primary_customer_segment: brief.primary_customer_segment ?? null,
    customer_segment_confidence: brief.customer_segment_confidence ?? 6,
    problem_description: (brief.problem_description as string | undefined) ?? analysis.result.summary ?? null,
    problem_pain_level: brief.problem_pain_level ?? 6,
    problem_frequency: brief.problem_frequency ?? 'weekly',
    problem_impact: brief.problem_impact ?? {},
    problem_evidence: brief.problem_evidence ?? [],
    solution_description: brief.solution_description ?? analysis.metadata?.question ?? null,
    solution_mechanism: brief.solution_mechanism ?? null,
    unique_value_proposition: brief.unique_value_proposition ?? null,
    differentiation_factors: brief.differentiation_factors ?? [],
    solution_confidence: brief.solution_confidence ?? 6,
    competitors: brief.competitors ?? [],
    competitive_alternatives: brief.competitive_alternatives ?? [],
    switching_barriers: brief.switching_barriers ?? [],
    competitive_advantages: brief.competitive_advantages ?? [],
    budget_range: brief.budget_range ?? null,
    budget_constraints: brief.budget_constraints ?? {},
    available_channels: brief.available_channels ?? [],
    existing_assets: brief.existing_assets ?? [],
    team_capabilities: brief.team_capabilities ?? [],
    time_constraints: brief.time_constraints ?? {},
    business_stage: brief.business_stage ?? 'validation',
    three_month_goals: brief.three_month_goals ?? [],
    six_month_goals: brief.six_month_goals ?? [],
    success_criteria: brief.success_criteria ?? [],
    key_metrics: brief.key_metrics ?? [],
    completeness_score: brief.completeness_score ?? 65,
    clarity_score: brief.clarity_score ?? 60,
    consistency_score: brief.consistency_score ?? 58,
    overall_quality_score: brief.overall_quality_score ?? 61,
    ai_confidence_scores: brief.ai_confidence_scores ?? { analysis: 0.6 },
    validation_flags: brief.validation_flags ?? [],
    recommended_next_steps: brief.recommended_next_steps ?? [],
    created_at: nowIso,
    updated_at: nowIso,
  };
}

async function persistAnalysisResult(args: {
  admin: ReturnType<typeof createAdminClient>;
  analysis: CrewFunctionSuccess;
  userId: string;
  projectId: string;
  sessionId?: string;
  existingEvidenceCount: number;
}) {
  const { admin, analysis, userId, projectId, sessionId, existingEvidenceCount } = args;

  const evidenceRows = normalizeEvidenceItems(userId, projectId, analysis.result.evidence_items);
  const reportRow = buildReportRow({ userId, projectId, analysis });

  if (evidenceRows.length > 0) {
    const { error: evidenceError } = await admin
      .from('evidence')
      .insert(evidenceRows);

    if (evidenceError) {
      console.error('[api/analyze] Failed to insert evidence', evidenceError);
    }
  }

  const { error: reportError } = await admin
    .from('reports')
    .insert(reportRow);

  if (reportError) {
    console.error('[api/analyze] Failed to insert report', reportError);
  }

  const newEvidenceTotal = existingEvidenceCount + evidenceRows.length;
  const { error: projectUpdateError } = await admin
    .from('projects')
    .update({
      evidence_count: newEvidenceTotal,
      last_activity: new Date().toISOString(),
    })
    .eq('id', projectId);

  if (projectUpdateError) {
    console.error('[api/analyze] Failed to update project counters', projectUpdateError);
  }

  if (sessionId) {
    try {
      const briefRow = buildEntrepreneurBriefRow({ userId, sessionId, analysis });
      const { error: briefError } = await admin
        .from('entrepreneur_briefs')
        .upsert(briefRow, { onConflict: 'session_id' });

      if (briefError) {
        console.error('[api/analyze] Failed to upsert entrepreneur brief', briefError);
      }
    } catch (briefBuildError) {
      console.error('[api/analyze] Unable to build entrepreneur brief payload', briefBuildError);
    }
  }

  return {
    evidenceCreated: evidenceRows.length,
    reportCreated: !reportError,
    evidenceCount: newEvidenceTotal,
  };
}

export async function POST(request: NextRequest) {
  let parsedPayload: AnalyzeRequestPayload;

  try {
    const body = await request.json();
    const validation = analyzeRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request payload', details: validation.error.flatten() },
        { status: 400 },
      );
    }

    parsedPayload = validation.data;
  } catch (parseError) {
    console.error('[api/analyze] Failed to parse request body', parseError);
    return NextResponse.json(
      { error: 'Malformed JSON body' },
      { status: 400 },
    );
  }

  try {
    const supabase = await createServerClient();
    const [{ data: userData, error: userError }, { data: sessionData }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.auth.getSession(),
    ]);

    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) {
      return NextResponse.json({ error: 'Missing session token' }, { status: 401 });
    }

    const userId = userData.user.id;

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id, evidence_count')
      .eq('id', parsedPayload.project_id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_tier, plan_status, role')
      .eq('id', userId)
      .single();

    const planKey = mapPlanTier(profile?.subscription_tier);
    const admin = createAdminClient();

    if (planKey === 'trial') {
      const trialStatus = await assertTrialAllowance({ userId, action: 'workflows.run' });
      if (!trialStatus.allowed) {
        return NextResponse.json(
          {
            error: 'Trial workflow limit reached',
            remaining: 0,
            retryable: false,
          },
          { status: 403 },
        );
      }
    } else {
      const limitCheck = await enforcePlanLimits({ admin, userId, planKey });
      if (!limitCheck.allowed) {
        return NextResponse.json(
          {
            error: 'Plan analysis limit reached',
            remaining: limitCheck.remaining,
            retryable: false,
          },
          { status: 403 },
        );
      }
    }

    // Optionally verify session ownership when provided
    if (parsedPayload.session_id) {
      const { data: sessionRecord, error: sessionError } = await admin
        .from('onboarding_sessions')
        .select('session_id, user_id')
        .eq('session_id', parsedPayload.session_id)
        .single();

      if (sessionError || !sessionRecord || sessionRecord.user_id !== userId) {
        return NextResponse.json(
          { error: 'Invalid onboarding session reference' },
          { status: 400 },
        );
      }
    }

    const functionUrl = resolveCrewFunctionUrl(request);
    const payloadForCrew = {
      strategic_question: parsedPayload.strategic_question,
      project_id: parsedPayload.project_id,
      project_context: parsedPayload.project_context,
      target_sources: parsedPayload.target_sources,
      report_format: parsedPayload.report_format,
      project_deadline: parsedPayload.project_deadline,
      priority_level: parsedPayload.priority_level,
      session_id: parsedPayload.session_id,
    };

    let crewResponse: Response | null = null;
    let fetchError: unknown = null;
    const maxAttempts = 2;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        crewResponse = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payloadForCrew),
        });

        if (crewResponse.ok) {
          break;
        }

        if (crewResponse.status >= 500 && attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 500));
          continue;
        }

        break;
      } catch (error) {
        fetchError = error;
        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 500));
          continue;
        }
      }
    }

    if (!crewResponse) {
      console.error('[api/analyze] Crew fetch failed', fetchError);
      return NextResponse.json(
        { error: 'CrewAI service unavailable', retryable: true },
        { status: 503 },
      );
    }

    if (crewResponse.status === 429) {
      const rateInfo = await crewResponse.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: rateInfo?.error || 'CrewAI rate limit reached',
          retryable: true,
          metadata: rateInfo,
        },
        { status: 429 },
      );
    }

    if (!crewResponse.ok) {
      const errorBody = await crewResponse.text();
      console.error('[api/analyze] Crew response error', crewResponse.status, errorBody);
      return NextResponse.json(
        { error: 'CrewAI analysis failed', details: errorBody },
        { status: 502 },
      );
    }

    const crewPayload = (await crewResponse.json()) as CrewFunctionResponse;

    if (!crewPayload || !isCrewFunctionSuccess(crewPayload)) {
      console.error('[api/analyze] Crew payload missing success', crewPayload);
      return NextResponse.json(
        { error: 'CrewAI response malformed' },
        { status: 502 },
      );
    }

    const existingEvidenceCount =
      typeof project.evidence_count === 'number'
        ? project.evidence_count
        : Number(project.evidence_count ?? 0);

    const persistenceResult = await persistAnalysisResult({
      admin,
      analysis: crewPayload,
      userId,
      projectId: parsedPayload.project_id,
      sessionId: parsedPayload.session_id,
      existingEvidenceCount: Number.isFinite(existingEvidenceCount) ? existingEvidenceCount : 0,
    });

    return NextResponse.json({
      success: true,
      analysisId: crewPayload.analysis_id,
      summary: crewPayload.result.summary,
      insights: crewPayload.result.insight_summaries,
      evidenceCount: persistenceResult.evidenceCount,
      evidenceCreated: persistenceResult.evidenceCreated,
      reportCreated: persistenceResult.reportCreated,
      metadata: crewPayload.metadata,
      rawOutput: crewPayload.result.raw_output,
    });
  } catch (error) {
    console.error('[api/analyze] Unexpected error', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
