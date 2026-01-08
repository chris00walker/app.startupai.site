/**
 * CrewAI Status Polling Endpoint
 *
 * GET /api/crewai/status?run_id=xxx   (Modal - primary)
 * GET /api/crewai/status?kickoff_id=xxx  (AMP - fallback, deprecated)
 *
 * Returns the current status of a validation workflow execution.
 * Supports both Modal serverless (recommended) and AMP (deprecated).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { createModalClient, isModalConfigured, calculateOverallProgress, getPhaseName } from '@/lib/crewai/modal-client';
import { getCrewAIStatus } from '@/lib/crewai/amp-client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const runId = searchParams.get('run_id');
    const kickoffId = searchParams.get('kickoff_id'); // Legacy AMP parameter

    // Support both Modal (run_id) and AMP (kickoff_id)
    const validationId = runId || kickoffId;

    if (!validationId) {
      return NextResponse.json(
        { error: 'run_id or kickoff_id required' },
        { status: 400 }
      );
    }

    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[api/crewai/status] Fetching status:', {
      validationId,
      provider: runId ? 'modal' : 'amp',
      userId: user.id,
    });

    // Try Modal first if run_id was provided and Modal is configured
    if (runId && isModalConfigured()) {
      return await handleModalStatus(runId, user.id, supabase);
    }

    // Try to find in local validation_runs table first
    const admin = createAdminClient();
    const { data: localRun } = await admin
      .from('validation_runs')
      .select('*')
      .eq('run_id', validationId)
      .single();

    if (localRun) {
      // If Modal provider, fetch live status from Modal
      if (localRun.provider === 'modal' && isModalConfigured()) {
        return await handleModalStatus(validationId, user.id, supabase, localRun);
      }
      // Otherwise return cached status from Supabase (updated via webhook/realtime)
      return NextResponse.json(formatLocalRunStatus(localRun));
    }

    // Fallback to legacy AMP polling (deprecated)
    if (kickoffId) {
      return await handleAMPStatus(kickoffId, user, supabase);
    }

    return NextResponse.json(
      { error: 'Validation run not found' },
      { status: 404 }
    );

  } catch (error: unknown) {
    console.error('[api/crewai/status] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Handle Modal serverless status check
 */
async function handleModalStatus(
  runId: string,
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
  localRun?: Record<string, unknown>
) {
  const modalClient = createModalClient();

  try {
    const modalStatus = await modalClient.getStatus(runId);

    console.log('[api/crewai/status] Modal status received:', {
      runId,
      status: modalStatus.status,
      phase: modalStatus.current_phase,
      hasHITL: !!modalStatus.hitl_checkpoint,
    });

    // Update local record if we have one
    if (localRun) {
      const admin = createAdminClient();
      await admin
        .from('validation_runs')
        .update({
          status: modalStatus.status,
          current_phase: modalStatus.current_phase,
          phase_name: modalStatus.phase_name,
          progress: modalStatus.progress,
          hitl_checkpoint: modalStatus.hitl_checkpoint,
          outputs: modalStatus.outputs,
          error: modalStatus.error,
          updated_at: new Date().toISOString(),
        })
        .eq('run_id', runId);
    }

    return NextResponse.json({
      run_id: runId,
      provider: 'modal',
      status: modalStatus.status,
      state: mapModalStateToLegacy(modalStatus.status), // Legacy compatibility
      current_phase: modalStatus.current_phase,
      phase_name: modalStatus.phase_name || getPhaseName(modalStatus.current_phase),
      progress: calculateOverallProgress(modalStatus),
      current_agent: modalStatus.progress?.agent || modalStatus.progress?.crew || 'Processing',
      hitl_checkpoint: modalStatus.hitl_checkpoint,
      outputs: modalStatus.outputs,
      error: modalStatus.error,
    });
  } catch (error) {
    console.error('[api/crewai/status] Modal status fetch failed:', error);

    // Return cached status if available
    if (localRun) {
      return NextResponse.json(formatLocalRunStatus(localRun));
    }

    throw error;
  }
}

/**
 * Handle legacy AMP status check (deprecated)
 */
async function handleAMPStatus(
  kickoffId: string,
  user: { id: string },
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  console.log('[api/crewai/status] Using deprecated AMP status polling');

  const status = await getCrewAIStatus(kickoffId);

  console.log('[api/crewai/status] AMP status received:', {
    kickoffId,
    state: status.state,
    hasResult: !!status.result,
  });

  // If completed, store result in database
  if (status.state === 'COMPLETED' && status.result) {
    console.log('[api/crewai/status] Workflow completed, storing results');

    // Find project by workflow ID
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('initial_analysis_workflow_id', kickoffId)
      .single();

    if (projectError) {
      console.error('[api/crewai/status] Failed to find project:', projectError);
    } else if (project) {
      // Verify project ownership
      if (project.user_id !== user.id) {
        return NextResponse.json(
          { error: 'Unauthorized - project ownership mismatch' },
          { status: 403 }
        );
      }

      // Store analysis result in reports table
      const { error: reportError } = await supabase
        .from('reports')
        .insert({
          project_id: project.id,
          user_id: user.id,
          report_type: 'value_proposition_analysis',
          content: status.result,
          status: 'completed',
          created_at: new Date().toISOString(),
        });

      if (reportError) {
        console.error('[api/crewai/status] Failed to store report:', reportError);
      } else {
        console.log('[api/crewai/status] Report stored successfully');
      }

      // Update project status to active
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', project.id);

      if (updateError) {
        console.error('[api/crewai/status] Failed to update project status:', updateError);
      } else {
        console.log('[api/crewai/status] Project status updated to active');
      }
    }
  }

  // Return status to frontend (legacy format)
  return NextResponse.json({
    kickoff_id: kickoffId,
    provider: 'amp',
    state: status.state,
    status: status.status,
    progress: calculateAMPProgress(status),
    current_agent: status.last_executed_task?.name || 'Unknown',
    result: status.result,
    result_json: status.result_json,
  });
}

/**
 * Format local validation_runs record to API response
 */
function formatLocalRunStatus(run: Record<string, unknown>) {
  return {
    run_id: run.run_id,
    provider: run.provider || 'unknown',
    status: run.status,
    state: mapModalStateToLegacy(run.status as string),
    current_phase: run.current_phase,
    phase_name: run.phase_name,
    progress: typeof run.progress === 'object' && run.progress !== null
      ? (run.progress as { progress_pct?: number }).progress_pct || 0
      : 0,
    current_agent: typeof run.progress === 'object' && run.progress !== null
      ? (run.progress as { agent?: string; crew?: string }).agent ||
        (run.progress as { agent?: string; crew?: string }).crew ||
        'Processing'
      : 'Processing',
    hitl_checkpoint: run.hitl_checkpoint,
    outputs: run.outputs,
    error: run.error,
  };
}

/**
 * Map Modal status to legacy AMP state for backwards compatibility
 */
function mapModalStateToLegacy(status: string): string {
  switch (status) {
    case 'pending':
      return 'PENDING';
    case 'running':
      return 'RUNNING';
    case 'paused':
      return 'PAUSED';
    case 'completed':
      return 'COMPLETED';
    case 'failed':
      return 'FAILED';
    default:
      return status.toUpperCase();
  }
}

/**
 * Calculate progress percentage from AMP CrewAI status (deprecated)
 */
function calculateAMPProgress(status: {
  state?: string;
  last_executed_task?: { name?: string } | null;
}): number {
  if (status.state === 'COMPLETED') {
    return 100;
  }

  if (status.state === 'FAILED') {
    return 0;
  }

  // Estimate progress based on completed tasks
  // StartupAI crew has 6 agents, so each is ~16.67%
  const lastTask = status.last_executed_task;
  if (lastTask?.name) {
    const taskNames = [
      'onboarding',
      'customer_research',
      'competitor_analysis',
      'value_design',
      'validation',
      'qa',
    ];

    const taskIndex = taskNames.findIndex(name =>
      lastTask.name!.toLowerCase().includes(name)
    );

    if (taskIndex !== -1) {
      return Math.min(95, Math.floor(((taskIndex + 1) / 6) * 100));
    }
  }

  // Default to in-progress state
  if (status.state === 'RUNNING' || status.state === 'STARTED') {
    return 30;
  }

  return 0;
}
