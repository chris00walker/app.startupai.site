/**
 * Founder Connections API
 *
 * POST: Request connection to a consultant (founder)
 * GET: List founder's connections and pending requests
 *
 * @story US-FM03, US-FM04
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { parsePagination } from '@/lib/api/validation';
import { trackMarketplaceServerEvent } from '@/lib/analytics/server';

const connectionRequestSchema = z.object({
  consultantId: z.string().uuid(),
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

  const { consultantId, relationshipType, message } = validation.data;

  // TASK-024: Verify the consultant is verified (founders can only request verified consultants)
  const { data: consultantProfile } = await supabase
    .from('consultant_profiles')
    .select('verification_status')
    .eq('id', consultantId)
    .single();

  if (!consultantProfile) {
    return NextResponse.json(
      { error: 'consultant_not_found', message: 'Consultant not found.' },
      { status: 404 }
    );
  }

  if (!['verified', 'grace'].includes(consultantProfile.verification_status || '')) {
    return NextResponse.json(
      {
        error: 'consultant_not_verified',
        message: 'This consultant is not currently available for new connections.',
      },
      { status: 403 }
    );
  }

  // Check cooldown (30-day period after declined connection)
  const { data: cooldown } = await supabase.rpc('check_connection_cooldown', {
    p_consultant_id: consultantId,
    p_founder_id: user.id,
  });

  if (cooldown?.cooldown_active) {
    return NextResponse.json(
      {
        error: 'cooldown_active',
        message: `You can reconnect with this consultant in ${cooldown.days_remaining} days.`,
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
    .eq('consultant_id', consultantId)
    .eq('client_id', user.id)
    .in('connection_status', ['requested', 'active'])
    .single();

  if (existing) {
    if (existing.connection_status === 'active') {
      return NextResponse.json(
        { error: 'already_connected', message: "You're already connected with this consultant." },
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
      consultant_id: consultantId,
      client_id: user.id,
      relationship_type: relationshipType,
      status: 'requested',
      connection_status: 'requested',
      initiated_by: 'founder',
      request_message: message,
    })
    .select('id, connection_status, created_at')
    .single();

  if (error) {
    console.error('[founder/connections] Insert error:', error);
    return NextResponse.json(
      { error: 'Failed to create connection request' },
      { status: 500 }
    );
  }

  // Server-side analytics tracking
  trackMarketplaceServerEvent.connectionRequestedByFounder(
    user.id,
    consultantId,
    relationshipType,
    !!message
  );

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
      consultant_id,
      relationship_type,
      connection_status,
      initiated_by,
      request_message,
      accepted_at,
      declined_at,
      created_at,
      consultant_profiles!consultant_clients_consultant_id_fkey(
        company_name,
        verification_status,
        user_profiles(
          full_name,
          email
        )
      )
    `,
      { count: 'exact' }
    )
    .eq('client_id', user.id);

  if (status) {
    query = query.eq('connection_status', status);
  }

  query = query.order('created_at', { ascending: false });
  query = query.range(offset, offset + limit - 1);

  const { data: connections, count, error } = await query;

  if (error) {
    console.error('[founder/connections] Query error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connections' },
      { status: 500 }
    );
  }

  // Transform connections
  const transformedConnections = (connections || []).map((c) => {
    const consultantProfile = Array.isArray(c.consultant_profiles)
      ? c.consultant_profiles[0]
      : c.consultant_profiles;
    const userProfile = consultantProfile?.user_profiles;
    const resolvedUserProfile = Array.isArray(userProfile)
      ? userProfile[0]
      : userProfile;

    const isActive = c.connection_status === 'active';

    return {
      id: c.id,
      consultantId: c.consultant_id,
      consultantName: resolvedUserProfile?.full_name || 'Unknown',
      // PII protection: hide email until connection is active (A-010)
      consultantEmail: isActive ? resolvedUserProfile?.email : null,
      consultantOrganization: consultantProfile?.company_name,
      verificationBadge: consultantProfile?.verification_status,
      relationshipType: c.relationship_type,
      status: c.connection_status,
      initiatedBy: c.initiated_by,
      message: c.request_message,
      acceptedAt: c.accepted_at,
      declinedAt: c.declined_at,
      createdAt: c.created_at,
    };
  });

  // Count pending requests from consultants
  const pendingCount = transformedConnections.filter(
    (c) => c.status === 'requested' && c.initiatedBy === 'consultant'
  ).length;

  return NextResponse.json({
    connections: transformedConnections,
    pendingRequestCount: pendingCount,
    total: count || 0,
    limit,
    offset,
  });
}

export const dynamic = 'force-dynamic';
