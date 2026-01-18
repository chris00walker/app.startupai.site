/**
 * Consultant Invite Management Routes
 *
 * DELETE /api/consultant/invites/[id] - Revoke a pending invite
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * DELETE /api/consultant/invites/[id]
 * Revoke a pending invite (hard delete - no audit needed for unaccepted invites)
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
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
      .select('id, consultant_id, status, invite_email')
      .eq('id', inviteId)
      .single();

    if (fetchError || !invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    // Verify ownership
    if (invite.consultant_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to revoke this invite' },
        { status: 403 }
      );
    }

    // Only allow revoking pending invites
    if (invite.status !== 'invited') {
      return NextResponse.json(
        { error: 'Only pending invites can be revoked' },
        { status: 400 }
      );
    }

    // Hard delete the invite (no audit trail needed for unaccepted invites)
    const { error: deleteError } = await adminClient
      .from('consultant_clients')
      .delete()
      .eq('id', inviteId);

    if (deleteError) {
      console.error('[ConsultantInvites] Delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to revoke invite', details: deleteError.message },
        { status: 500 }
      );
    }

    console.log('[ConsultantInvites] Revoked invite:', {
      inviteId,
      email: invite.invite_email,
      consultantId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Invite revoked successfully',
    });
  } catch (error: any) {
    console.error('[ConsultantInvites] DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
