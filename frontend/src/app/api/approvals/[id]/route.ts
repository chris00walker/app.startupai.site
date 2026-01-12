/**
 * Approval Request API
 *
 * GET /api/approvals/[id] - Get approval details
 * PATCH /api/approvals/[id] - Approve or reject
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { createClient as createBrowserClient, type SupabaseClient } from '@supabase/supabase-js';

// Schema for approval decision
const approvalDecisionSchema = z.object({
  action: z.enum(['approve', 'reject']),
  decision: z.string().optional(), // The chosen option ID
  feedback: z.string().optional(), // User's reasoning
});

/**
 * Helper to get authenticated user from request (supports both cookies and Authorization header)
 */
async function getAuthenticatedUser(request: NextRequest): Promise<{
  user: { id: string; email?: string } | null;
  supabase: SupabaseClient;
}> {
  // Check for Authorization header (for API/testing access)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    console.log('[api/approvals] Using Authorization header');

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser(token);
    return { user, supabase };
  }

  // Use cookie-based auth (normal browser flow)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { user, supabase };
}

/**
 * GET - Fetch approval request details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Get current user (supports both cookies and Authorization header)
  const { user, supabase } = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Fetch approval request
  const { data: approval, error: fetchError } = await supabase
    .from('approval_requests')
    .select(`
      *,
      projects (
        id,
        name,
        stage
      )
    `)
    .eq('id', id)
    .single();

  if (fetchError || !approval) {
    return NextResponse.json(
      { error: 'Approval request not found' },
      { status: 404 }
    );
  }

  // Check access (user must own the approval or be consultant of the owner)
  const admin = createAdminClient();
  const { data: ownerProfile } = await admin
    .from('user_profiles')
    .select('consultant_id')
    .eq('id', approval.user_id)
    .single();

  const hasAccess = approval.user_id === user.id ||
    ownerProfile?.consultant_id === user.id;

  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    );
  }

  // Record view in history
  await admin.from('approval_history').insert({
    approval_request_id: id,
    action: 'viewed',
    actor_id: user.id,
    actor_type: 'user',
  });

  return NextResponse.json(approval);
}

/**
 * PATCH - Approve or reject the request
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Get current user (supports both cookies and Authorization header)
  const { user } = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Parse request body
  let body;
  try {
    body = await request.json();
    const validation = approvalDecisionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      );
    }
    body = validation.data;
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Fetch approval request
  const { data: approval, error: fetchError } = await admin
    .from('approval_requests')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !approval) {
    return NextResponse.json(
      { error: 'Approval request not found' },
      { status: 404 }
    );
  }

  // Check if already decided
  if (approval.status !== 'pending') {
    return NextResponse.json(
      { error: `Approval already ${approval.status}` },
      { status: 400 }
    );
  }

  // Check access (user must own the approval or be consultant of the owner)
  const { data: ownerProfile } = await admin
    .from('user_profiles')
    .select('consultant_id')
    .eq('id', approval.user_id)
    .single();

  const hasAccess = approval.user_id === user.id ||
    ownerProfile?.consultant_id === user.id;

  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    );
  }

  const isApproved = body.action === 'approve';
  const now = new Date().toISOString();

  // Update approval request
  const { data: updated, error: updateError } = await admin
    .from('approval_requests')
    .update({
      status: isApproved ? 'approved' : 'rejected',
      decision: body.decision || (isApproved ? 'approved' : 'rejected'),
      human_feedback: body.feedback || null,
      decided_by: user.id,
      decided_at: now,
      updated_at: now,
    })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    console.error('[api/approvals] Update failed:', updateError);
    return NextResponse.json(
      { error: 'Failed to update approval', details: updateError.message },
      { status: 500 }
    );
  }

  // Record in history
  await admin.from('approval_history').insert({
    approval_request_id: id,
    action: isApproved ? 'approved' : 'rejected',
    actor_id: user.id,
    actor_type: 'user',
    details: {
      decision: body.decision,
      feedback: body.feedback,
    },
  });

  // If approved, resume CrewAI execution
  if (isApproved) {
    // Map frontend decision values to Modal expected values
    // Modal expects: approved, rejected, override_proceed, iterate, segment_[1-9], custom_segment
    const modalDecision = body.decision === 'approve' ? 'approved' :
                          body.decision === 'reject' ? 'rejected' :
                          body.decision || 'approved';

    await resumeCrewAIExecution(
      approval.execution_id,
      approval.task_id,
      modalDecision,
      body.feedback || 'Approved by user',
      user.id
    );
  }

  console.log(`[api/approvals] Approval ${id} ${body.action}ed by ${user.id}`);

  return NextResponse.json({
    success: true,
    approval: updated,
    message: `Approval ${body.action}ed successfully`,
  });
}

/**
 * Resume validation execution after HITL approval.
 */
async function resumeCrewAIExecution(
  executionId: string,
  taskId: string,
  decision: string,
  feedback: string,
  decidedBy?: string
): Promise<void> {
  await resumeModalExecution(executionId, taskId, decision, feedback, decidedBy);
}

/**
 * Resume validation via Modal serverless HITL endpoint
 */
async function resumeModalExecution(
  runId: string,
  checkpoint: string,
  decision: string,
  feedback: string,
  decidedBy?: string
): Promise<void> {
  const modalUrl = process.env.MODAL_HITL_APPROVE_URL;
  const modalToken = process.env.MODAL_AUTH_TOKEN;

  if (!modalUrl) {
    console.warn('[api/approvals] Modal HITL URL not configured');
    return;
  }

  try {
    console.log('[api/approvals] Resuming via Modal HITL:', { runId, checkpoint, decision });

    const response = await fetch(modalUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(modalToken && { 'Authorization': `Bearer ${modalToken}` }),
      },
      body: JSON.stringify({
        run_id: runId,
        checkpoint: checkpoint,
        decision: decision,
        feedback: feedback || undefined,
        decided_by: decidedBy || undefined,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[api/approvals] Modal HITL resume failed:', response.status, errorText);
    } else {
      const result = await response.json();
      console.log('[api/approvals] Modal execution resumed:', result);
    }
  } catch (error) {
    console.error('[api/approvals] Modal HITL resume error:', error);
  }
}
