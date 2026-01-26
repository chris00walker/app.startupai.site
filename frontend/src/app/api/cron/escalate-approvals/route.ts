/**
 * Escalate Approvals Cron Endpoint
 *
 * POST: Called by pg_cron hourly to check for stale approvals
 *       and send escalation emails to configured contacts.
 *
 * Security: Protected by CRON_SECRET header validation
 *
 * @story US-AA03
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail, isEmailConfigured } from '@/lib/email/send';
import {
  generateEscalationEmail,
  generateEscalationEmailText,
} from '@/lib/email/templates/escalation';

// Threshold for escalation (24 hours in milliseconds)
const ESCALATION_THRESHOLD_HOURS = 24;
const ESCALATION_THRESHOLD_MS = ESCALATION_THRESHOLD_HOURS * 60 * 60 * 1000;

/**
 * Validate cron secret from header or query param
 */
function validateCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;

  // If no secret configured, allow in development
  if (!cronSecret) {
    return process.env.NODE_ENV === 'development';
  }

  // Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // Check query param (for pg_net HTTP calls)
  const secret = request.nextUrl.searchParams.get('secret');
  return secret === cronSecret;
}

/**
 * Get base URL for links in emails
 */
function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://app.startupai.site';
}

export async function POST(request: NextRequest) {
  // Validate cron secret
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if email is configured
  if (!isEmailConfigured()) {
    console.log('[cron/escalate-approvals] Email not configured, skipping');
    return NextResponse.json({
      success: true,
      skipped: true,
      reason: 'Email not configured',
    });
  }

  try {
    // Use service role client for cross-user queries
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Calculate threshold timestamp
    const thresholdDate = new Date(Date.now() - ESCALATION_THRESHOLD_MS).toISOString();

    // Find stale pending approvals that haven't been escalated yet
    const { data: staleApprovals, error: fetchError } = await supabase
      .from('approval_requests')
      .select(`
        id,
        title,
        approval_type,
        user_id,
        project_id,
        created_at,
        last_escalated_at,
        projects (
          id,
          name
        )
      `)
      .eq('status', 'pending')
      .lt('created_at', thresholdDate)
      .is('last_escalated_at', null)
      .limit(50); // Process in batches

    if (fetchError) {
      console.error('[cron/escalate-approvals] Error fetching approvals:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch stale approvals' },
        { status: 500 }
      );
    }

    if (!staleApprovals || staleApprovals.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        message: 'No stale approvals found',
      });
    }

    console.log(`[cron/escalate-approvals] Found ${staleApprovals.length} stale approvals`);

    // Group approvals by user ID to batch email lookups
    const userIds = [...new Set(staleApprovals.map((a) => a.user_id))];

    // Fetch escalation preferences for all users at once
    const { data: preferences } = await supabase
      .from('approval_preferences')
      .select('user_id, escalation_email')
      .in('user_id', userIds)
      .not('escalation_email', 'is', null);

    // Create user -> escalation email map
    const escalationMap = new Map<string, string>();
    preferences?.forEach((p) => {
      if (p.escalation_email) {
        escalationMap.set(p.user_id, p.escalation_email);
      }
    });

    // Fetch user names for personalization
    const { data: userProfiles } = await supabase
      .from('user_profiles')
      .select('id, name, email')
      .in('id', userIds);

    const userNameMap = new Map<string, { name: string; email: string }>();
    userProfiles?.forEach((u) => {
      userNameMap.set(u.id, { name: u.name || 'User', email: u.email });
    });

    const baseUrl = getBaseUrl();
    let sentCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    // Process each stale approval
    for (const approval of staleApprovals) {
      const escalationEmail = escalationMap.get(approval.user_id);

      if (!escalationEmail) {
        skippedCount++;
        continue; // User doesn't have escalation email configured
      }

      const userInfo = userNameMap.get(approval.user_id);
      // Projects is a joined relation - Supabase returns single object for FK relations
      const projectData = approval.projects as unknown as { id: string; name: string } | null;
      const projectName = projectData?.name || 'Unknown Project';

      // Calculate how long it's been pending
      const createdAt = new Date(approval.created_at);
      const pendingHours = Math.round((Date.now() - createdAt.getTime()) / (1000 * 60 * 60));

      // Generate email content
      const emailData = {
        recipientName: userInfo?.name || 'User',
        approvalTitle: approval.title || 'Approval Request',
        approvalType: approval.approval_type || 'unknown',
        projectName,
        pendingHours,
        approvalUrl: `${baseUrl}/approvals/${approval.id}`,
        dashboardUrl: `${baseUrl}/dashboard`,
      };

      const html = generateEscalationEmail(emailData);
      const text = generateEscalationEmailText(emailData);

      // Send email
      const result = await sendEmail(
        escalationEmail,
        `Urgent: Approval needed - ${approval.title}`,
        html,
        { text }
      );

      if (result.success) {
        // Mark as escalated
        await supabase
          .from('approval_requests')
          .update({
            last_escalated_at: new Date().toISOString(),
            escalation_level: 1,
          })
          .eq('id', approval.id);

        sentCount++;
      } else {
        errors.push(`Approval ${approval.id}: ${result.error}`);
      }
    }

    console.log(
      `[cron/escalate-approvals] Processed: sent=${sentCount}, skipped=${skippedCount}, errors=${errors.length}`
    );

    return NextResponse.json({
      success: true,
      processed: staleApprovals.length,
      sent: sentCount,
      skipped: skippedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('[cron/escalate-approvals] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Also support GET for manual testing
export async function GET(request: NextRequest) {
  return POST(request);
}
