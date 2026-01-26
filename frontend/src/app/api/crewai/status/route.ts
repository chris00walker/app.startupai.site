/**
 * CrewAI Status Polling Endpoint
 *
 * GET /api/crewai/status?run_id=xxx   (Modal - primary)
 *
 * Returns the current status of a validation workflow execution.
 *
 * @story US-F08
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { createModalClient, calculateOverallProgress, getPhaseName } from '@/lib/crewai/modal-client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const runId = searchParams.get('run_id');

    if (!runId) {
      return NextResponse.json(
        { error: 'run_id required' },
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
      runId,
      provider: 'modal',
      userId: user.id,
    });

    // Try to find in local validation_runs table first
    const admin = createAdminClient();
    const { data: localRun } = await admin
      .from('validation_runs')
      .select('*')
      .eq('run_id', runId)
      .single();

    if (localRun) {
      // If Modal provider, fetch live status from Modal
      if (localRun.provider === 'modal') {
        return await handleModalStatus(runId, user.id, supabase, localRun);
      }
      // Otherwise return cached status from Supabase (updated via webhook/realtime)
      return NextResponse.json(formatLocalRunStatus(localRun));
    }

    return await handleModalStatus(runId, user.id, supabase);

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

    // Build base response
    const response = {
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
      approval_id: null as string | null,
    };

    // If there's a HITL checkpoint, look up the associated approval_id
    // Note: hitl_checkpoint is an object with { checkpoint, title, description, options, ... }
    const checkpointName = modalStatus.hitl_checkpoint?.checkpoint;
    if (checkpointName) {
      const admin = createAdminClient();
      const { data: approval } = await admin
        .from('approval_requests')
        .select('id')
        .eq('execution_id', runId)
        .eq('task_id', checkpointName)
        .eq('status', 'pending')
        .single();

      if (approval) {
        response.approval_id = approval.id;
        console.log('[api/crewai/status] Found approval_id for HITL checkpoint:', {
          runId,
          checkpoint: checkpointName,
          approvalId: approval.id,
        });
      }
    }

    return NextResponse.json(response);
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
    // Note: approval_id not available from cached local run - frontend should fetch if needed
    approval_id: null,
  };
}

/**
 * Map Modal status to legacy state for backwards compatibility
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
