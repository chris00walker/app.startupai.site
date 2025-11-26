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

// Schema for approval decision
const approvalDecisionSchema = z.object({
  action: z.enum(['approve', 'reject']),
  decision: z.string().optional(), // The chosen option ID
  feedback: z.string().optional(), // User's reasoning
});

/**
 * GET - Fetch approval request details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
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
  const supabase = await createClient();

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
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
    await resumeCrewAIExecution(
      approval.execution_id,
      approval.task_id,
      body.decision || 'approved',
      body.feedback || 'Approved by user'
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
 * Resume CrewAI execution after approval.
 */
async function resumeCrewAIExecution(
  executionId: string,
  taskId: string,
  decision: string,
  feedback: string
): Promise<void> {
  const crewaiUrl = process.env.CREWAI_API_URL;
  const crewaiToken = process.env.CREWAI_API_TOKEN;

  if (!crewaiUrl || !crewaiToken) {
    console.warn('[api/approvals] CrewAI URL/Token not configured, skipping resume');
    return;
  }

  try {
    const resumeUrl = `${crewaiUrl}/resume`;

    const response = await fetch(resumeUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${crewaiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        execution_id: executionId,
        task_id: taskId,
        human_feedback: feedback,
        is_approve: true,
        decision: decision,
      }),
    });

    if (!response.ok) {
      console.error('[api/approvals] CrewAI resume failed:', response.status);
    } else {
      console.log('[api/approvals] CrewAI execution resumed');
    }
  } catch (error) {
    console.error('[api/approvals] CrewAI resume error:', error);
  }
}
