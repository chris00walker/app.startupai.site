/**
 * Admin Workflow Retry API Route
 *
 * POST: Retry a failed workflow as admin (bypasses ownership check)
 *
 * @story US-A04
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { validateAdminRole } from '@/lib/auth/validate-admin';
import { logWorkflowRetry } from '@/lib/admin/audit';
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  handleApiError,
  validationErrorResponse,
} from '@/lib/api/response';
import { createModalClient, type ModalKickoffRequest } from '@/lib/crewai/modal-client';
import { z } from 'zod';

const RetryRequestSchema = z.object({
  reason: z.string().min(1).max(500).optional(),
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workflowId } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorizedResponse();
    }

    // Verify admin role
    const { isAdmin, error: adminError } = await validateAdminRole(supabase, user.id);
    if (!isAdmin) {
      return forbiddenResponse(adminError || 'Admin access required');
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const result = RetryRequestSchema.safeParse(body);

    if (!result.success) {
      return validationErrorResponse(result.error.flatten());
    }

    const { reason } = result.data;

    // Use admin client to bypass RLS
    const admin = createAdminClient();

    // First try validation_runs table
    const { data: run, error: runError } = await admin
      .from('validation_runs')
      .select('*')
      .eq('run_id', workflowId)
      .single();

    if (runError || !run) {
      // Try crewai_validation_states as fallback
      const { data: state, error: stateError } = await admin
        .from('crewai_validation_states')
        .select('*')
        .or(`id.eq.${workflowId},run_id.eq.${workflowId}`)
        .single();

      if (stateError || !state) {
        return notFoundResponse('Workflow not found');
      }

      // Build kickoff from validation state
      const entrepreneurInput = state.entrepreneur_input || state.business_idea;
      if (!entrepreneurInput) {
        return validationErrorResponse({
          formErrors: ['Missing inputs needed to retry this workflow'],
          fieldErrors: {},
        });
      }

      const modalClient = createModalClient();
      let newRunId: string;

      try {
        const kickoffRequest: ModalKickoffRequest = {
          entrepreneur_input: entrepreneurInput,
          project_id: state.project_id,
          user_id: state.user_id,
          session_id: state.session_id || undefined,
        };

        const kickoffResponse = await modalClient.kickoff(kickoffRequest);
        newRunId = kickoffResponse.run_id;
      } catch (error) {
        console.error('[api/admin/workflows/retry] Modal kickoff failed:', error);
        return handleApiError(new Error('Failed to restart workflow - Modal service unavailable'), 'api/admin/workflows/retry');
      }

      // Log the admin action
      await logWorkflowRetry(
        user.id,
        workflowId,
        newRunId,
        reason || 'Admin retry'
      );

      return successResponse({
        success: true,
        oldRunId: workflowId,
        newRunId,
        status: 'pending',
      });
    }

    // Process from validation_runs
    if (run.status === 'completed') {
      return validationErrorResponse({
        formErrors: ['Workflow already completed'],
        fieldErrors: {},
      });
    }

    const entrepreneurInput = buildEntrepreneurInput(run.inputs as RunInputs | null);
    if (!entrepreneurInput) {
      return validationErrorResponse({
        formErrors: ['Missing inputs needed to retry this workflow'],
        fieldErrors: {},
      });
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
      console.error('[api/admin/workflows/retry] Modal kickoff failed:', error);
      return handleApiError(new Error('Failed to restart workflow - Modal service unavailable'), 'api/admin/workflows/retry');
    }

    const now = new Date().toISOString();

    // Mark old run as failed due to admin retry
    await admin
      .from('validation_runs')
      .update({
        status: 'failed',
        error: `Admin retry requested: ${reason || 'No reason provided'}`,
        updated_at: now,
      })
      .eq('run_id', workflowId);

    // Insert new run record
    await admin
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

    // Log the admin action
    await logWorkflowRetry(
      user.id,
      workflowId,
      newRunId,
      reason || 'Admin retry'
    );

    return successResponse({
      success: true,
      oldRunId: workflowId,
      newRunId,
      status: 'pending',
    });
  } catch (error) {
    return handleApiError(error, 'api/admin/workflows/retry');
  }
}
