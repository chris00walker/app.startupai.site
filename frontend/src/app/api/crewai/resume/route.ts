/**
 * CrewAI Resume Endpoint
 *
 * POST /api/crewai/resume
 *
 * Resumes a paused validation workflow after HITL checkpoint.
 * This is a fallback endpoint when no approval_id is available.
 * Preferred path is through /api/approvals/[id] which provides audit trail.
 *
 * This endpoint maintains audit trail by updating any pending approval_request.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';

// Schema for resume request
const resumeSchema = z.object({
  run_id: z.string(),
  checkpoint: z.string(),
  decision: z.string(),
  feedback: z.string().nullable().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = resumeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { run_id, checkpoint, decision, feedback } = validation.data;
    const isApproved = decision === 'approved';
    const nowIso = new Date().toISOString();

    console.log('[api/crewai/resume] Resuming workflow:', {
      runId: run_id,
      checkpoint,
      decision,
      userId: user.id,
    });

    // Maintain audit trail: update any pending approval_request for this run_id + checkpoint
    const admin = createAdminClient();
    const { data: pendingApproval } = await admin
      .from('approval_requests')
      .select('id')
      .eq('execution_id', run_id)
      .eq('task_id', checkpoint)
      .eq('status', 'pending')
      .single();

    if (pendingApproval) {
      // Update the approval request
      await admin
        .from('approval_requests')
        .update({
          status: isApproved ? 'approved' : 'rejected',
          decision: decision,
          human_feedback: feedback || null,
          decided_by: user.id,
          decided_at: nowIso,
          updated_at: nowIso,
        })
        .eq('id', pendingApproval.id);

      // Record in history
      await admin.from('approval_history').insert({
        approval_request_id: pendingApproval.id,
        action: isApproved ? 'approved' : 'rejected',
        actor_id: user.id,
        actor_type: 'user',
        details: {
          decision,
          feedback,
          via: 'resume_endpoint', // Mark that this came via fallback path
        },
      });

      console.log('[api/crewai/resume] Updated approval_request:', pendingApproval.id);
    }

    // Resume via Modal HITL endpoint
    const modalUrl = process.env.MODAL_HITL_APPROVE_URL;
    const modalToken = process.env.MODAL_AUTH_TOKEN;

    if (!modalUrl) {
      console.error('[api/crewai/resume] MODAL_HITL_APPROVE_URL not configured');
      return NextResponse.json(
        { error: 'Resume endpoint not configured' },
        { status: 503 }
      );
    }

    const response = await fetch(modalUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(modalToken && { 'Authorization': `Bearer ${modalToken}` }),
      },
      body: JSON.stringify({
        run_id,
        checkpoint,
        decision,
        feedback: feedback || undefined,
        decided_by: user.id,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[api/crewai/resume] Modal resume failed:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to resume workflow', details: errorText },
        { status: 502 }
      );
    }

    const result = await response.json();
    console.log('[api/crewai/resume] Workflow resumed:', result);

    return NextResponse.json({
      success: true,
      message: 'Workflow resumed successfully',
      result,
    });

  } catch (error) {
    console.error('[api/crewai/resume] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to resume workflow',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
