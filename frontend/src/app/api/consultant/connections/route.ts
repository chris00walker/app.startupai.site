/**
 * Consultant Connections API
 *
 * POST: Request connection to a founder (verified consultant)
 * GET: List consultant's connections
 *
 * @story US-PH03, US-PH04
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { parsePagination } from '@/lib/api/validation';

const connectionRequestSchema = z.object({
  founderId: z.string().uuid(),
  relationshipType: z.enum(['advisory', 'capital', 'program', 'service', 'ecosystem']),
  message: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is a verified consultant
  const { data: isVerified } = await supabase.rpc('is_verified_consultant');

  if (!isVerified) {
    return NextResponse.json(
      {
        error: 'unverified',
        message: 'Upgrade to Advisor or Capital plan to request connections.',
      },
      { status: 403 }
    );
  }

  // Parse request body
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const validation = connectionRequestSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: validation.error.issues },
      { status: 400 }
    );
  }

  const { founderId, relationshipType, message } = validation.data;

  // Check cooldown
  const { data: cooldown } = await supabase.rpc('check_connection_cooldown', {
    p_consultant_id: user.id,
    p_founder_id: founderId,
  });

  if (cooldown?.cooldown_active) {
    return NextResponse.json(
      {
        error: 'cooldown_active',
        message: `You can reconnect with this founder in ${cooldown.days_remaining} days.`,
        cooldownEndsAt: cooldown.cooldown_ends_at,
        daysRemaining: cooldown.days_remaining,
      },
      { status: 429 }
    );
  }

  // Check if already connected or pending
  const { data: existing } = await supabase
    .from('consultant_clients')
    .select('id, connection_status')
    .eq('consultant_id', user.id)
    .eq('client_id', founderId)
    .in('connection_status', ['requested', 'active'])
    .single();

  if (existing) {
    if (existing.connection_status === 'active') {
      return NextResponse.json(
        { error: 'already_connected', message: "You're already connected with this founder." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'request_pending', message: 'A connection request is already pending.' },
      { status: 409 }
    );
  }

  // Create connection request
  // TASK-020: Must set BOTH status and connection_status for dual-field sync
  const { data: connection, error } = await supabase
    .from('consultant_clients')
    .insert({
      consultant_id: user.id,
      client_id: founderId,
      relationship_type: relationshipType,
      status: 'requested',
      connection_status: 'requested',
      initiated_by: 'consultant',
      request_message: message,
    })
    .select('id, connection_status, created_at')
    .single();

  if (error) {
    console.error('[consultant/connections] Insert error:', error);
    return NextResponse.json(
      { error: 'Failed to create connection request' },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      connectionId: connection.id,
      status: connection.connection_status,
      createdAt: connection.created_at,
    },
    { status: 201 }
  );
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse query parameters with pagination (TASK-014)
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status');
  const { limit, offset } = parsePagination(searchParams);

  // Query connections
  let query = supabase
    .from('consultant_clients')
    .select(
      `
      id,
      client_id,
      relationship_type,
      connection_status,
      initiated_by,
      request_message,
      accepted_at,
      declined_at,
      created_at,
      user_profiles!consultant_clients_client_id_fkey(
        full_name,
        email,
        company
      )
    `,
      { count: 'exact' }
    )
    .eq('consultant_id', user.id);

  if (status) {
    query = query.eq('connection_status', status);
  }

  query = query.order('created_at', { ascending: false });
  query = query.range(offset, offset + limit - 1);

  const { data: connections, count, error } = await query;

  if (error) {
    console.error('[consultant/connections] Query error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connections' },
      { status: 500 }
    );
  }

  // Transform - only show founder details for active connections
  const transformedConnections = (connections || []).map((c) => {
    const founderProfile = Array.isArray(c.user_profiles)
      ? c.user_profiles[0]
      : c.user_profiles;

    const isActive = c.connection_status === 'active';

    return {
      id: c.id,
      // PII protection: hide founder identity until connection is active
      founderId: isActive ? c.client_id : null,
      founderName: isActive ? founderProfile?.full_name : null,
      founderEmail: isActive ? founderProfile?.email : null,
      founderCompany: isActive ? founderProfile?.company : null,
      relationshipType: c.relationship_type,
      status: c.connection_status,
      initiatedBy: c.initiated_by,
      message: c.request_message,
      acceptedAt: c.accepted_at,
      declinedAt: c.declined_at,
      createdAt: c.created_at,
    };
  });

  return NextResponse.json({
    connections: transformedConnections,
    total: count || 0,
    limit,
    offset,
  });
}

export const dynamic = 'force-dynamic';
