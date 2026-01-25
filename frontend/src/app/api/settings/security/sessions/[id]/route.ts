/**
 * Individual Session Management API Route
 *
 * DELETE: Revoke a specific session by ID
 *
 * @story US-AS05
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Get current session to prevent self-revocation
    const { data: sessionData } = await supabase.auth.getSession();
    const currentSessionId = sessionData.session?.access_token.slice(-8);

    if (sessionId === currentSessionId) {
      return NextResponse.json(
        { error: 'Cannot revoke current session. Use logout instead.' },
        { status: 400 }
      );
    }

    // Note: Supabase doesn't provide a direct API to revoke individual sessions
    // by session ID. In production, this would require:
    // 1. Using the Supabase Admin API to revoke specific refresh tokens
    // 2. Or maintaining a custom sessions table with revocation capability
    // For now, we return a message indicating this limitation.

    return NextResponse.json({
      success: false,
      message: 'Individual session revocation requires additional infrastructure. Use "Sign out all other devices" instead.',
    });

  } catch (error) {
    console.error('[api/settings/security/sessions/[id]] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
