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

  // Use SECURITY DEFINER function that handles all validation and creation
  // This enforces client_id masking at the DB level
  const { data: result, error } = await supabase.rpc('create_connection_request', {
    p_founder_id: founderId,
    p_relationship_type: relationshipType,
    p_message: message || null,
  });

  if (error) {
    console.error('[consultant/connections] RPC error:', error);
    return NextResponse.json(
      { error: 'Failed to create connection request' },
      { status: 500 }
    );
  }

  // Handle function-level errors
  if (result?.error) {
    const statusMap: Record<string, number> = {
      unverified: 403,
      cooldown_active: 429,
      already_exists: 409,
    };
    const status = statusMap[result.error] || 400;

    return NextResponse.json(
      {
        error: result.error,
        message: result.message,
        ...(result.cooldown_ends_at && { cooldownEndsAt: result.cooldown_ends_at }),
        ...(result.days_remaining && { daysRemaining: result.days_remaining }),
      },
      { status }
    );
  }

  return NextResponse.json(
    {
      connectionId: result.connection_id,
      status: result.status,
      createdAt: result.created_at,
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

  // Use SECURITY DEFINER function with built-in client_id masking
  // This enforces PII protection at the DB level for consultant-initiated pending requests
  const { data: connections, error } = await supabase.rpc('get_my_connections', {
    p_status: status || null,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    console.error('[consultant/connections] RPC error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connections' },
      { status: 500 }
    );
  }

  // Get total count from first row (all rows have same total_count)
  const total = connections?.[0]?.total_count ?? 0;

  // Get founder profiles for connections where client_id is visible
  const visibleClientIds = (connections || [])
    .filter((c: any) => c.client_id)
    .map((c: any) => c.client_id);

  let founderProfiles: Record<string, any> = {};
  if (visibleClientIds.length > 0) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, company')
      .in('id', visibleClientIds);

    if (profiles) {
      founderProfiles = Object.fromEntries(profiles.map((p) => [p.id, p]));
    }
  }

  // Transform response
  const transformedConnections = (connections || []).map((c: any) => {
    const founderProfile = c.client_id ? founderProfiles[c.client_id] : null;

    return {
      id: c.id,
      // client_id is already masked by the RPC function for consultant-initiated pending requests
      founderId: c.client_id,
      founderName: founderProfile?.full_name || null,
      founderEmail: founderProfile?.email || null,
      founderCompany: founderProfile?.company || null,
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
    total: Number(total),
    limit,
    offset,
  });
}

export const dynamic = 'force-dynamic';
