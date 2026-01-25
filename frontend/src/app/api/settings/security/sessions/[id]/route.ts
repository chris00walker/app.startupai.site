/**
 * Individual Session Management API Route
 *
 * DELETE: Revoke a specific session by ID
 *
 * Uses custom user_sessions table to track revoked sessions.
 * The session token becomes invalid and future requests will fail validation.
 *
 * @story US-AS05
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logSessionRevocation } from '@/lib/security/audit-log';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: sessionId } = await params;

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the session belongs to this user and get its status
    const { data: session, error: fetchError } = await supabase
      .from('user_sessions')
      .select('id, is_current, revoked_at')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Prevent revoking current session
    if (session.is_current) {
      return NextResponse.json(
        { error: 'Cannot revoke current session. Use logout instead.' },
        { status: 400 }
      );
    }

    // Check if already revoked
    if (session.revoked_at) {
      return NextResponse.json(
        { error: 'Session already revoked' },
        { status: 400 }
      );
    }

    // Mark session as revoked
    const { error: updateError } = await supabase
      .from('user_sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', sessionId);

    if (updateError) {
      console.error('[api/settings/security/sessions/[id]] Error revoking session:', updateError);
      return NextResponse.json(
        { error: 'Failed to revoke session' },
        { status: 500 }
      );
    }

    // Log the revocation
    logSessionRevocation(user.id, sessionId);

    return NextResponse.json({
      success: true,
      message: 'Session revoked successfully',
    });

  } catch (error) {
    console.error('[api/settings/security/sessions/[id]] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
