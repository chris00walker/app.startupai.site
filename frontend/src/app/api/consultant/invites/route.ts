/**
 * Consultant Invites API Routes
 *
 * POST /api/consultant/invites - Create a new client invite
 * GET /api/consultant/invites - List all invites and clients
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { randomBytes } from 'crypto';
import { z } from 'zod';

// Validation schema for creating an invite
const createInviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().optional(),
});

/**
 * Generate a secure random invite token
 */
function generateInviteToken(): string {
  return randomBytes(24).toString('base64url'); // 32 chars, URL-safe
}

/**
 * POST /api/consultant/invites
 * Create a new client invite
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a consultant
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, role, full_name, company')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (profile.role !== 'consultant' && profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only consultants can send invites' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = createInviteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { email, name } = validation.data;

    // Get admin client for database operations
    let adminClient;
    try {
      adminClient = createAdminClient();
    } catch {
      // Fall back to user client if admin not available
      adminClient = supabase;
    }

    // Check if there's already an active relationship or pending invite
    const { data: existing } = await adminClient
      .from('consultant_clients')
      .select('id, status')
      .eq('consultant_id', user.id)
      .eq('invite_email', email.toLowerCase())
      .in('status', ['invited', 'active'])
      .maybeSingle();

    if (existing) {
      const message =
        existing.status === 'active'
          ? 'This client is already linked to your account'
          : 'An invite has already been sent to this email';
      return NextResponse.json({ error: message }, { status: 409 });
    }

    // Check if email is already a client of another consultant
    const { data: existingClient } = await adminClient
      .from('consultant_clients')
      .select('id, consultant_id')
      .eq('invite_email', email.toLowerCase())
      .eq('status', 'active')
      .maybeSingle();

    if (existingClient) {
      return NextResponse.json(
        { error: 'This email is already linked to another consultant' },
        { status: 409 }
      );
    }

    // Generate invite token and expiry
    const inviteToken = generateInviteToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    // Create the invite record
    const { data: invite, error: insertError } = await adminClient
      .from('consultant_clients')
      .insert({
        consultant_id: user.id,
        invite_email: email.toLowerCase(),
        invite_token: inviteToken,
        invite_expires_at: expiresAt.toISOString(),
        client_name: name || null,
        status: 'invited',
      })
      .select()
      .single();

    if (insertError) {
      console.error('[ConsultantInvites] Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create invite', details: insertError.message },
        { status: 500 }
      );
    }

    // TODO: Send invite email via Resend or Supabase
    // For now, we'll just return the invite link
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/signup?invite=${inviteToken}`;

    console.log('[ConsultantInvites] Created invite:', {
      inviteId: invite.id,
      email: email.toLowerCase(),
      consultantId: user.id,
      expiresAt: expiresAt.toISOString(),
    });

    return NextResponse.json({
      success: true,
      invite: {
        id: invite.id,
        email: email.toLowerCase(),
        name: name || null,
        inviteToken,
        inviteUrl,
        expiresAt: expiresAt.toISOString(),
        status: 'invited',
      },
    });
  } catch (error: any) {
    console.error('[ConsultantInvites] POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/consultant/invites
 * List all invites and linked clients for the consultant
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a consultant
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'consultant' && profile.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Only consultants can view invites' },
        { status: 403 }
      );
    }

    // Fetch all consultant_clients records
    const { data: records, error: fetchError } = await supabase
      .from('consultant_clients')
      .select(
        `
        id,
        consultant_id,
        client_id,
        invite_email,
        invite_token,
        invite_expires_at,
        client_name,
        status,
        invited_at,
        linked_at,
        archived_at,
        archived_by
      `
      )
      .eq('consultant_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('[ConsultantInvites] Fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch invites', details: fetchError.message },
        { status: 500 }
      );
    }

    // Fetch client profiles for linked clients
    const clientIds = records
      .filter((r) => r.client_id && r.status === 'active')
      .map((r) => r.client_id);

    let clientProfiles: Record<string, any> = {};
    if (clientIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, full_name, company, email')
        .in('id', clientIds);

      if (profiles) {
        clientProfiles = Object.fromEntries(profiles.map((p) => [p.id, p]));
      }
    }

    // Separate into invites and clients
    const invites = records
      .filter((r) => r.status === 'invited')
      .map((r) => ({
        id: r.id,
        email: r.invite_email,
        name: r.client_name,
        inviteToken: r.invite_token,
        expiresAt: r.invite_expires_at,
        invitedAt: r.invited_at,
        isExpired: new Date(r.invite_expires_at) < new Date(),
      }));

    const clients = records
      .filter((r) => r.status === 'active')
      .map((r) => {
        const profile = r.client_id ? clientProfiles[r.client_id] : null;
        return {
          id: r.id,
          clientId: r.client_id,
          email: r.invite_email,
          name: profile?.full_name || r.client_name,
          company: profile?.company,
          linkedAt: r.linked_at,
        };
      });

    const archived = records
      .filter((r) => r.status === 'archived')
      .map((r) => {
        const profile = r.client_id ? clientProfiles[r.client_id] : null;
        return {
          id: r.id,
          clientId: r.client_id,
          email: r.invite_email,
          name: profile?.full_name || r.client_name,
          archivedAt: r.archived_at,
          archivedBy: r.archived_by,
        };
      });

    return NextResponse.json({
      success: true,
      invites,
      clients,
      archived,
      counts: {
        pending: invites.length,
        active: clients.length,
        archived: archived.length,
      },
    });
  } catch (error: any) {
    console.error('[ConsultantInvites] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
