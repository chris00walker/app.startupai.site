/**
 * Ad Creative Approval API
 *
 * GET: Fetch campaign data for HITL approval review
 * POST: Record approval and activate campaign
 * PATCH: Update copy/image preferences before approval
 *
 * @story US-AP05
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';

// ============================================================================
// TYPES
// ============================================================================

interface CopyState {
  headlines: Record<string, boolean>;
  primaryTexts: Record<string, boolean>;
  ctas: Record<string, boolean>;
}

interface ApprovalContext {
  campaignId: string;
  copyState?: CopyState;
  feedback?: string;
}

// ============================================================================
// GET - Fetch campaign data for approval review
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get campaign ID from query
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');

    if (!campaignId) {
      return NextResponse.json(
        { error: 'campaignId is required' },
        { status: 400 }
      );
    }

    // Fetch campaign with related data
    const { data: campaign, error: campaignError } = await supabase
      .from('ad_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Verify user owns this campaign
    if (campaign.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch Copy Bank for this project
    const { data: copyBank, error: copyBankError } = await supabase
      .from('copy_banks')
      .select('headlines, primary_texts, ctas')
      .eq('project_id', campaign.project_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Determine platform review status from campaign status
    let platformStatus: {
      status: 'pending' | 'approved' | 'rejected' | 'error';
      lastChecked: string | null;
      issues?: Array<{ summary: string; details?: string }>;
    } = {
      status: 'pending',
      lastChecked: campaign.updated_at,
    };

    switch (campaign.status) {
      case 'paused':
        // Paused means Meta approved but waiting for Founder HITL approval
        platformStatus.status = 'approved';
        break;
      case 'rejected':
        platformStatus.status = 'rejected';
        if (campaign.status_reason) {
          platformStatus.issues = [
            { summary: campaign.status_reason, details: campaign.rejection_reason || undefined },
          ];
        }
        break;
      case 'error':
        platformStatus.status = 'error';
        if (campaign.status_reason) {
          platformStatus.issues = [{ summary: campaign.status_reason }];
        }
        break;
      case 'pending_deployment':
      case 'pending_review':
      case 'pending_approval':
        platformStatus.status = 'pending';
        break;
    }

    // Build previews array (would come from platform_ad_previews in real implementation)
    // For now, return empty previews that component will handle gracefully
    const previews: Array<{ format: string; previewUrl: string }> = [];

    // If we have platform ad ID, we could fetch real previews from Meta
    // This is a placeholder for the actual Meta preview URLs
    if (campaign.platform_ad_id) {
      // In production, this would call Meta API to get ad previews
      // For now, just indicate previews are available
      previews.push(
        { format: 'facebook_feed', previewUrl: '' },
        { format: 'instagram_feed', previewUrl: '' },
        { format: 'instagram_stories', previewUrl: '' },
        { format: 'facebook_reels', previewUrl: '' }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        campaign,
        copyBank: copyBank
          ? {
              headlines: copyBank.headlines,
              primaryTexts: copyBank.primary_texts,
              ctas: copyBank.ctas,
            }
          : null,
        platformStatus,
        previews,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/approvals/ad-creative:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Record approval and activate campaign
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = (await request.json()) as ApprovalContext;
    const { campaignId, copyState, feedback } = body;

    if (!campaignId) {
      return NextResponse.json(
        { error: 'campaignId is required' },
        { status: 400 }
      );
    }

    // Fetch campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('ad_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Verify user owns this campaign
    if (campaign.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check campaign is in valid state for approval
    const validStatuses = ['pending_approval', 'pending_deployment', 'paused'];
    if (!validStatuses.includes(campaign.status)) {
      return NextResponse.json(
        { error: `Cannot approve campaign in ${campaign.status} status` },
        { status: 400 }
      );
    }

    // Record HITL approval
    const approvalData = {
      approved_at: new Date().toISOString(),
      approved_by: user.id,
      status:
        campaign.status === 'paused'
          ? 'active' // Platform already approved, activate immediately
          : 'pending_deployment', // Wait for platform approval
      status_reason:
        campaign.status === 'paused'
          ? 'Approved and activated'
          : 'Founder approved, waiting for platform review',
      updated_at: new Date().toISOString(),
    };

    // Update campaign with approval
    const { error: updateError } = await adminSupabase
      .from('ad_campaigns')
      .update(approvalData)
      .eq('id', campaignId);

    if (updateError) {
      console.error('Failed to update campaign:', updateError);
      return NextResponse.json(
        { error: 'Failed to record approval' },
        { status: 500 }
      );
    }

    // Record in approval_requests table for audit trail
    const { error: approvalRecordError } = await adminSupabase
      .from('approval_requests')
      .insert({
        user_id: user.id,
        project_id: campaign.project_id,
        approval_type: 'ad_creative_review',
        title: `Ad Creative Approval: ${campaign.name}`,
        description: `Approved ad campaign for Meta deployment`,
        status: 'approved',
        decision: 'approved',
        decision_at: new Date().toISOString(),
        feedback: feedback || null,
        context: {
          campaign_id: campaignId,
          copy_state: copyState,
          platform: campaign.platform,
        },
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      });

    if (approvalRecordError) {
      console.warn('Failed to record approval request:', approvalRecordError);
      // Don't fail the request, this is just for audit
    }

    // If platform already approved (status was 'paused'), activate the campaign
    if (campaign.status === 'paused' && campaign.platform_ad_id) {
      try {
        // Call Meta API to activate
        const activateResponse = await fetch(
          `${request.nextUrl.origin}/api/ads/campaigns/meta/activate`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Cookie: request.headers.get('cookie') || '',
            },
            body: JSON.stringify({ campaignId }),
          }
        );

        if (!activateResponse.ok) {
          console.warn('Failed to activate campaign via Meta API');
          // Don't fail the approval, just log
        }
      } catch (activateError) {
        console.warn('Error activating campaign:', activateError);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        campaignId,
        status: approvalData.status,
        message:
          campaign.status === 'paused'
            ? 'Campaign approved and activated!'
            : 'Campaign approved. Will go live when Meta completes review.',
      },
    });
  } catch (error) {
    console.error('Error in POST /api/approvals/ad-creative:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Update copy/image preferences before approval
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { campaignId, copyState } = body;

    if (!campaignId) {
      return NextResponse.json(
        { error: 'campaignId is required' },
        { status: 400 }
      );
    }

    // Fetch campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('ad_campaigns')
      .select('id, user_id, creative_data')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Verify user owns this campaign
    if (campaign.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update creative_data with copy state preferences
    const updatedCreativeData = {
      ...(campaign.creative_data || {}),
      copyPreferences: copyState,
    };

    const { error: updateError } = await supabase
      .from('ad_campaigns')
      .update({
        creative_data: updatedCreativeData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignId);

    if (updateError) {
      console.error('Failed to update campaign:', updateError);
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { campaignId, copyState },
    });
  } catch (error) {
    console.error('Error in PATCH /api/approvals/ad-creative:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
