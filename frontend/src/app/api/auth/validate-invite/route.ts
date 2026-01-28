/**
 * Validate Invite Token Route
 *
 * @story US-C02
 *
 * GET /api/auth/validate-invite?token=XXX - Validate an invite token before signup
 * POST /api/auth/validate-invite - Link account after signup
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/auth/validate-invite?token=XXX
 * Validate an invite token and return consultant details (public - for signup page)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Get admin client (needed to read without auth)
    let adminClient;
    try {
      adminClient = createAdminClient();
    } catch {
      // Fall back to server client if admin not available
      adminClient = await createClient();
    }

    // Find the invite by token
    const { data: invite, error: fetchError } = await adminClient
      .from('consultant_clients')
      .select(
        `
        id,
        consultant_id,
        invite_email,
        invite_expires_at,
        client_name,
        status
      `
      )
      .eq('invite_token', token)
      .single();

    if (fetchError || !invite) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Invite not found or already used',
        },
        { status: 404 }
      );
    }

    // Check status
    if (invite.status !== 'invited') {
      return NextResponse.json(
        {
          valid: false,
          error: invite.status === 'active' ? 'This invite has already been accepted' : 'This invite is no longer valid',
        },
        { status: 400 }
      );
    }

    // Check if expired
    const expiresAt = new Date(invite.invite_expires_at);
    if (expiresAt < new Date()) {
      return NextResponse.json(
        {
          valid: false,
          error: 'This invite has expired',
        },
        { status: 400 }
      );
    }

    // Get consultant details
    const { data: consultant, error: consultantError } = await adminClient
      .from('user_profiles')
      .select('id, full_name, company')
      .eq('id', invite.consultant_id)
      .single();

    if (consultantError || !consultant) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Consultant not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      valid: true,
      email: invite.invite_email,
      clientName: invite.client_name,
      consultantId: consultant.id,
      consultantName: consultant.full_name,
      consultantCompany: consultant.company,
      expiresAt: invite.invite_expires_at,
    });
  } catch (error: any) {
    console.error('[ValidateInvite] GET error:', error);
    return NextResponse.json(
      { valid: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/validate-invite
 * Link a newly created account to a consultant via invite token
 * Body: { token: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate - user must be logged in
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Get admin client for database operations
    let adminClient;
    try {
      adminClient = createAdminClient();
    } catch {
      adminClient = supabase;
    }

    // Use the database function to link the account
    const { data: result, error: linkError } = await adminClient.rpc('link_client_via_invite', {
      p_invite_token: token,
      p_client_id: user.id,
    });

    if (linkError) {
      console.error('[ValidateInvite] Link error:', linkError);
      return NextResponse.json(
        { success: false, error: 'Failed to link account', details: linkError.message },
        { status: 500 }
      );
    }

    // Check result from the function
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    console.log('[ValidateInvite] Account linked successfully:', {
      clientId: user.id,
      consultantId: result.consultant_id,
      consultantName: result.consultant_name,
    });

    return NextResponse.json({
      success: true,
      consultantId: result.consultant_id,
      consultantName: result.consultant_name,
      message: 'Account linked to consultant successfully',
    });
  } catch (error: any) {
    console.error('[ValidateInvite] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
