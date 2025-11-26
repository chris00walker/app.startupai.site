/**
 * CrewAI Approval Webhook Receiver
 *
 * POST /api/approvals/webhook
 *
 * Receives HITL (Human-in-the-Loop) approval requests from CrewAI AMP
 * when a task requires human approval before proceeding.
 *
 * Authentication: Bearer token (CREW_CONTRACT_BEARER)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient as createAdminClient } from '@/lib/supabase/admin';

// Schema for approval request from CrewAI
const approvalWebhookSchema = z.object({
  // CrewAI execution context
  execution_id: z.string(),
  task_id: z.string(),
  kickoff_id: z.string().optional(),

  // User context
  user_id: z.string().uuid(),
  project_id: z.string().uuid().optional(),

  // Approval details
  approval_type: z.enum([
    'segment_pivot',
    'value_pivot',
    'feature_downgrade',
    'strategic_pivot',
    'spend_increase',
    'campaign_launch',
    'customer_contact',
    'gate_progression',
    'data_sharing',
  ]),
  owner_role: z.enum(['compass', 'ledger', 'pulse', 'guardian', 'forge']),

  // Content
  title: z.string(),
  description: z.string(),
  task_output: z.record(z.string(), z.any()).default({}),
  evidence_summary: z.record(z.string(), z.any()).optional(),
  options: z.array(z.object({
    id: z.string(),
    label: z.string(),
    description: z.string().optional(),
  })).optional(),

  // Auto-approve flag
  auto_approvable: z.boolean().default(false),
});

type ApprovalWebhookPayload = z.infer<typeof approvalWebhookSchema>;

/**
 * Validate bearer token from CrewAI
 */
function validateBearerToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.slice(7);
  const expectedToken = process.env.CREW_CONTRACT_BEARER;

  if (!expectedToken) {
    console.error('[api/approvals/webhook] CREW_CONTRACT_BEARER not configured');
    return false;
  }

  return token === expectedToken;
}

export async function POST(request: NextRequest) {
  // Validate bearer token
  if (!validateBearerToken(request)) {
    console.error('[api/approvals/webhook] Invalid or missing bearer token');
    return NextResponse.json(
      { error: 'Unauthorized - Invalid bearer token' },
      { status: 401 }
    );
  }

  let payload: ApprovalWebhookPayload;

  // Parse and validate request body
  try {
    const body = await request.json();
    const validation = approvalWebhookSchema.safeParse(body);

    if (!validation.success) {
      console.error('[api/approvals/webhook] Validation failed:', validation.error.flatten());
      return NextResponse.json(
        { error: 'Invalid payload', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    payload = validation.data;
  } catch (parseError) {
    console.error('[api/approvals/webhook] Failed to parse request body:', parseError);
    return NextResponse.json(
      { error: 'Malformed JSON body' },
      { status: 400 }
    );
  }

  console.log('[api/approvals/webhook] Received approval request:', {
    execution_id: payload.execution_id,
    task_id: payload.task_id,
    approval_type: payload.approval_type,
    user_id: payload.user_id,
  });

  try {
    const admin = createAdminClient();

    // Check if user exists
    const { data: userProfile, error: userError } = await admin
      .from('user_profiles')
      .select('id, role')
      .eq('id', payload.user_id)
      .single();

    if (userError || !userProfile) {
      console.error('[api/approvals/webhook] User not found:', payload.user_id);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check for existing pending approval with same execution_id and task_id
    const { data: existing } = await admin
      .from('approval_requests')
      .select('id, status')
      .eq('execution_id', payload.execution_id)
      .eq('task_id', payload.task_id)
      .single();

    if (existing) {
      console.log('[api/approvals/webhook] Approval request already exists:', existing.id);
      return NextResponse.json({
        success: true,
        approval_id: existing.id,
        status: existing.status,
        message: 'Approval request already exists',
      });
    }

    // Check user's auto-approve preferences
    const { data: preferences } = await admin
      .from('approval_preferences')
      .select('*')
      .eq('user_id', payload.user_id)
      .single();

    let shouldAutoApprove = false;
    let autoApproveReason: string | null = null;

    if (preferences) {
      // Check if this type is in auto-approve list
      if (preferences.auto_approve_types?.includes(payload.approval_type)) {
        shouldAutoApprove = true;
        autoApproveReason = `User preference: auto-approve ${payload.approval_type}`;
      }
      // Check if it's auto-approvable and user has low-risk auto-approve enabled
      else if (payload.auto_approvable && preferences.auto_approve_low_risk) {
        shouldAutoApprove = true;
        autoApproveReason = 'User preference: auto-approve low-risk decisions';
      }
    }

    // Create the approval request
    const approvalData = {
      execution_id: payload.execution_id,
      task_id: payload.task_id,
      kickoff_id: payload.kickoff_id || null,
      user_id: payload.user_id,
      project_id: payload.project_id || null,
      approval_type: payload.approval_type,
      owner_role: payload.owner_role,
      title: payload.title,
      description: payload.description,
      task_output: payload.task_output,
      evidence_summary: payload.evidence_summary || {},
      options: payload.options || [],
      auto_approvable: payload.auto_approvable,
      auto_approve_reason: autoApproveReason,
      status: shouldAutoApprove ? 'approved' : 'pending',
      decided_at: shouldAutoApprove ? new Date().toISOString() : null,
      decision: shouldAutoApprove ? (payload.options?.[0]?.id || 'auto_approved') : null,
      human_feedback: shouldAutoApprove ? 'Auto-approved based on user preferences' : null,
    };

    const { data: approval, error: insertError } = await admin
      .from('approval_requests')
      .insert(approvalData)
      .select()
      .single();

    if (insertError) {
      console.error('[api/approvals/webhook] Failed to create approval request:', insertError);
      return NextResponse.json(
        { error: 'Failed to create approval request', details: insertError.message },
        { status: 500 }
      );
    }

    // Create history entry
    await admin
      .from('approval_history')
      .insert({
        approval_request_id: approval.id,
        action: shouldAutoApprove ? 'auto_approved' : 'created',
        actor_type: 'system',
        details: {
          source: 'crewai_webhook',
          auto_approved: shouldAutoApprove,
          reason: autoApproveReason,
        },
      });

    console.log('[api/approvals/webhook] Approval request created:', approval.id);

    // If auto-approved, call CrewAI /resume endpoint
    if (shouldAutoApprove) {
      await resumeCrewAIExecution(
        payload.execution_id,
        payload.task_id,
        payload.options?.[0]?.id || 'approved',
        'Auto-approved based on user preferences'
      );
    }

    return NextResponse.json({
      success: true,
      approval_id: approval.id,
      status: approval.status,
      auto_approved: shouldAutoApprove,
      message: shouldAutoApprove
        ? 'Approval auto-approved and flow resumed'
        : 'Approval request created, awaiting user decision',
    });

  } catch (error) {
    console.error('[api/approvals/webhook] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
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
    console.warn('[api/approvals/webhook] CrewAI URL/Token not configured, skipping resume');
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
      console.error('[api/approvals/webhook] CrewAI resume failed:', response.status);
    } else {
      console.log('[api/approvals/webhook] CrewAI execution resumed');
    }
  } catch (error) {
    console.error('[api/approvals/webhook] CrewAI resume error:', error);
  }
}
