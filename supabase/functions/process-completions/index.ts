/**
 * Process Completions Queue Worker (Supabase Edge Function)
 *
 * Part of ADR-005 Split API Architecture:
 * Processes Stage 7 onboarding completions from the pending_completions queue.
 *
 * This worker:
 * 1. Claims a pending item atomically (FOR UPDATE SKIP LOCKED)
 * 2. Creates a project from the onboarding data
 * 3. Calls Modal /kickoff to start CrewAI validation
 * 4. Updates the queue item with workflow_id/project_id
 * 5. Handles failures with retry (max 10) or dead_letter
 *
 * Triggered by:
 * - pg_cron (every 1 minute)
 * - Manual invocation for testing
 *
 * @see Plan: /home/chris/.claude/plans/shiny-growing-sprout.md
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// ============================================================================
// Types
// ============================================================================

interface QueueItem {
  id: string;
  session_id: string;
  user_id: string;
  conversation_history: unknown[];
  stage_data: Record<string, unknown>;
  attempts: number;
  created_at: string;
}

interface ClaimResult {
  status: 'claimed' | 'empty';
  item?: QueueItem;
  message?: string;
}

interface ModalKickoffResponse {
  run_id: string;
  status: string;
}

// ============================================================================
// Environment
// ============================================================================

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const MODAL_KICKOFF_URL = Deno.env.get('CREW_ANALYZE_URL') ||
  'https://chris00walker--startupai-validation-fastapi-app.modal.run/kickoff';
const MODAL_BEARER_TOKEN = Deno.env.get('CREW_CONTRACT_BEARER');

// ============================================================================
// Main Handler
// ============================================================================

serve(async (req: Request) => {
  try {
    console.log('[process-completions] Worker started');

    // Create Supabase client with service role (bypasses RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // ========================================================================
    // 1. Claim a pending item
    // ========================================================================
    const { data: claimData, error: claimError } = await supabase.rpc('claim_pending_completion');

    if (claimError) {
      console.error('[process-completions] Claim RPC error:', claimError);
      return new Response(JSON.stringify({ error: claimError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const claimResult = claimData as ClaimResult;

    if (claimResult.status === 'empty') {
      console.log('[process-completions] No pending items');
      return new Response(JSON.stringify({ status: 'empty', message: 'No pending completions' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const item = claimResult.item!;
    console.log('[process-completions] Claimed item:', {
      id: item.id,
      session_id: item.session_id,
      attempts: item.attempts,
    });

    // ========================================================================
    // 2. Extract brief data from stage_data
    // ========================================================================
    const stageData = item.stage_data || {};
    const briefData = (stageData.brief as Record<string, unknown>) || {};

    // Build CrewAI brief data
    const crewBriefData = {
      customer_segments: briefData.target_customers || [],
      primary_customer_segment: briefData.primary_segment || briefData.target_customers,
      problem_description: briefData.problem_description || briefData.problem,
      problem_pain_level: briefData.pain_level || 5,
      solution_description: briefData.solution_description || briefData.solution,
      unique_value_proposition: briefData.unique_value_prop || briefData.differentiation,
      differentiation_factors: briefData.differentiation || briefData.differentiators || [],
      competitors: briefData.competitors || [],
      budget_range: briefData.budget_range || briefData.budget || 'not specified',
      available_channels: briefData.available_channels || briefData.channels || [],
      business_stage: briefData.current_stage || briefData.business_stage || 'idea',
      three_month_goals: briefData.short_term_goals || briefData.goals || [],
    };

    // ========================================================================
    // 3. Save to entrepreneur_briefs table
    // ========================================================================
    const { error: briefError } = await supabase.rpc('upsert_entrepreneur_brief', {
      p_session_id: item.session_id,
      p_user_id: item.user_id,
      p_brief_data: crewBriefData,
    });

    if (briefError) {
      console.warn('[process-completions] Brief upsert warning:', briefError);
      // Non-fatal - continue with project creation
    }

    // ========================================================================
    // 4. Create project from onboarding session
    // ========================================================================
    const { data: projectId, error: projectError } = await supabase.rpc(
      'create_project_from_onboarding',
      { p_session_id: item.session_id }
    );

    if (projectError) {
      console.error('[process-completions] Project creation error:', projectError);
      await handleFailure(supabase, item.id, `Project creation failed: ${projectError.message}`);
      return new Response(JSON.stringify({ error: projectError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('[process-completions] Project created:', projectId);

    // ========================================================================
    // 5. Call Modal /kickoff endpoint
    // ========================================================================
    const conversationTranscript = JSON.stringify(item.conversation_history || []);

    const validationInputs = {
      entrepreneur_input: {
        raw_transcript: conversationTranscript,
        ...crewBriefData,
      },
      project_id: projectId as string,
      user_id: item.user_id,
      session_id: item.session_id,
    };

    console.log('[process-completions] Calling Modal kickoff');

    const modalHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (MODAL_BEARER_TOKEN) {
      modalHeaders['Authorization'] = `Bearer ${MODAL_BEARER_TOKEN}`;
    }

    const modalResponse = await fetch(MODAL_KICKOFF_URL, {
      method: 'POST',
      headers: modalHeaders,
      body: JSON.stringify(validationInputs),
    });

    if (!modalResponse.ok) {
      const errorText = await modalResponse.text();
      console.error('[process-completions] Modal kickoff failed:', errorText);
      await handleFailure(supabase, item.id, `Modal kickoff failed: ${modalResponse.status} - ${errorText}`);
      return new Response(JSON.stringify({ error: 'Modal kickoff failed', details: errorText }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const modalResult = await modalResponse.json() as ModalKickoffResponse;
    const workflowId = modalResult.run_id;
    console.log('[process-completions] Modal workflow started:', workflowId);

    // ========================================================================
    // 6. Update project with workflow ID
    // ========================================================================
    await supabase
      .from('projects')
      .update({
        initial_analysis_workflow_id: workflowId,
        status: 'analyzing',
      })
      .eq('id', projectId);

    // ========================================================================
    // 7. Update onboarding session with completion info
    // ========================================================================
    // First get current stage_data to merge
    const { data: sessionData } = await supabase
      .from('onboarding_sessions')
      .select('stage_data')
      .eq('session_id', item.session_id)
      .single();

    const currentStageData = (sessionData?.stage_data as Record<string, unknown>) || {};

    await supabase
      .from('onboarding_sessions')
      .update({
        stage_data: {
          ...currentStageData,
          completion: {
            ...(currentStageData.completion as Record<string, unknown> || {}),
            projectId,
            workflowId,
            processedAt: new Date().toISOString(),
          },
        },
      })
      .eq('session_id', item.session_id);

    // ========================================================================
    // 8. Mark queue item as completed
    // ========================================================================
    const { error: completeError } = await supabase.rpc('complete_pending_completion', {
      p_id: item.id,
      p_workflow_id: workflowId,
      p_project_id: projectId,
    });

    if (completeError) {
      console.error('[process-completions] Complete RPC error:', completeError);
      // Non-fatal - the work is done even if we can't update the queue
    }

    console.log('[process-completions] Successfully processed:', {
      session_id: item.session_id,
      project_id: projectId,
      workflow_id: workflowId,
    });

    return new Response(JSON.stringify({
      status: 'completed',
      session_id: item.session_id,
      project_id: projectId,
      workflow_id: workflowId,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[process-completions] Unexpected error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

// ============================================================================
// Helper: Handle Failure
// ============================================================================

async function handleFailure(
  supabase: ReturnType<typeof createClient>,
  itemId: string,
  errorMessage: string
): Promise<void> {
  try {
    const { data: result } = await supabase.rpc('fail_pending_completion', {
      p_id: itemId,
      p_error_message: errorMessage,
    });

    const status = (result as { status: string })?.status;

    if (status === 'dead_letter') {
      console.error('[process-completions] Item moved to dead_letter:', itemId);
      // TODO: Send alert (Slack webhook, email, etc.)
      // await sendDeadLetterAlert(itemId, errorMessage);
    } else {
      console.log('[process-completions] Item will be retried:', itemId);
    }
  } catch (error) {
    console.error('[process-completions] Failed to update failure status:', error);
  }
}
