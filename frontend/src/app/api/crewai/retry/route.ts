/**
 * CrewAI Validation Retry
 *
 * POST /api/crewai/retry
 * Body: { run_id: string }
 *
 * Restarts a stuck validation run using the original inputs.
 *
 * @story US-E04
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { createModalClient, type ModalKickoffRequest } from '@/lib/crewai/modal-client';

const retrySchema = z.object({
  run_id: z.string().min(1, 'run_id is required'),
});

type RunInputs = {
  entrepreneur_input?: string;
  strategic_question?: string;
  project_context?: string;
  priority_level?: string;
};

function buildEntrepreneurInput(inputs: RunInputs | null): string | null {
  if (!inputs) return null;

  if (typeof inputs.entrepreneur_input === 'string' && inputs.entrepreneur_input.trim()) {
    return inputs.entrepreneur_input.trim();
  }

  const parts = [
    inputs.strategic_question?.trim(),
    inputs.project_context?.trim() ? `Context: ${inputs.project_context.trim()}` : null,
    inputs.priority_level?.trim() ? `Priority: ${inputs.priority_level.trim()}` : null,
  ].filter(Boolean);

  if (parts.length === 0) return null;
  return parts.join('\n\n');
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const parsed = retrySchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const admin = createAdminClient();
    const { data: run, error: runError } = await admin
      .from('validation_runs')
      .select('*')
      .eq('run_id', parsed.data.run_id)
      .single();

    if (runError || !run) {
      return NextResponse.json(
        { error: 'Validation run not found' },
        { status: 404 }
      );
    }

    if (run.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    if (run.status === 'completed') {
      return NextResponse.json(
        { error: 'Run already completed' },
        { status: 400 }
      );
    }

    const entrepreneurInput = buildEntrepreneurInput(run.inputs as RunInputs | null);
    if (!entrepreneurInput) {
      return NextResponse.json(
        { error: 'Missing inputs needed to retry this run' },
        { status: 400 }
      );
    }

    const modalClient = createModalClient();
    let newRunId: string;

    try {
      const kickoffRequest: ModalKickoffRequest = {
        entrepreneur_input: entrepreneurInput,
        project_id: run.project_id,
        user_id: run.user_id,
        session_id: run.session_id || undefined,
      };

      const kickoffResponse = await modalClient.kickoff(kickoffRequest);
      newRunId = kickoffResponse.run_id;
    } catch (error) {
      console.error('[api/crewai/retry] Modal kickoff failed:', error);
      return NextResponse.json(
        { error: 'Failed to restart validation run' },
        { status: 503 }
      );
    }

    const now = new Date().toISOString();

    const { error: updateError } = await admin
      .from('validation_runs')
      .update({
        status: 'failed',
        error: 'Retry requested by user',
        updated_at: now,
      })
      .eq('run_id', parsed.data.run_id);

    if (updateError) {
      console.warn('[api/crewai/retry] Failed to mark old run failed:', updateError);
    }

    const { error: insertError } = await admin
      .from('validation_runs')
      .insert({
        run_id: newRunId,
        project_id: run.project_id,
        user_id: run.user_id,
        session_id: run.session_id ?? null,
        status: 'pending',
        provider: 'modal',
        current_phase: 0,
        phase_name: 'Onboarding',
        inputs: run.inputs ?? null,
        created_at: now,
        updated_at: now,
      });

    if (insertError) {
      console.error('[api/crewai/retry] Failed to insert new run record:', insertError);
    }

    return NextResponse.json(
      {
        success: true,
        run_id: newRunId,
        status: 'pending',
      },
      { status: 202 }
    );
  } catch (error) {
    console.error('[api/crewai/retry] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
