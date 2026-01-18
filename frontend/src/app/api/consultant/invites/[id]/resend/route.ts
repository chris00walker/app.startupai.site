/**
 * Consultant Invite Resend Route
 *
 * POST /api/consultant/invites/[id]/resend - Resend an invite with new token
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { randomBytes } from 'crypto';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Generate a secure random invite token
 */
function generateInviteToken(): string {
  return randomBytes(24).toString('base64url'); // 32 chars, URL-safe
}

/**
 * POST /api/consultant/invites/[id]/resend
 * Resend an invite with a new token and extended expiry
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: inviteId } = await context.params;

    // Authenticate
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get admin client for database operations
    let adminClient;
    try {
      adminClient = createAdminClient();
    } catch {
      adminClient = supabase;
    }

    // Find the invite and verify ownership
    const { data: invite, error: fetchError } = await adminClient
      .from('consultant_clients')
      .select('id, consultant_id, status, invite_email, client_name')
      .eq('id', inviteId)
      .single();

    if (fetchError || !invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    // Verify ownership
    if (invite.consultant_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to resend this invite' },
        { status: 403 }
      );
    }

    // Only allow resending pending invites
    if (invite.status !== 'invited') {
      return NextResponse.json(
        { error: 'Only pending invites can be resent' },
        { status: 400 }
      );
    }

    // Generate new token and extend expiry
    const newToken = generateInviteToken();
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 30); // 30 days from now

    // Update the invite with new token and expiry
    const { data: updated, error: updateError } = await adminClient
      .from('consultant_clients')
      .update({
        invite_token: newToken,
        invite_expires_at: newExpiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', inviteId)
      .select()
      .single();

    if (updateError) {
      console.error('[ConsultantInvites] Resend update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to resend invite', details: updateError.message },
        { status: 500 }
      );
    }

    // TODO: Send invite email via Resend or Supabase
    // For now, we'll just return the new invite link
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/signup?invite=${newToken}`;

    console.log('[ConsultantInvites] Resent invite:', {
      inviteId,
      email: invite.invite_email,
      consultantId: user.id,
      newExpiresAt: newExpiresAt.toISOString(),
    });

    return NextResponse.json({
      success: true,
      invite: {
        id: updated.id,
        email: invite.invite_email,
        name: invite.client_name,
        inviteToken: newToken,
        inviteUrl,
        expiresAt: newExpiresAt.toISOString(),
        status: 'invited',
      },
      message: 'Invite resent successfully',
    });
  } catch (error: any) {
    console.error('[ConsultantInvites] Resend error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
