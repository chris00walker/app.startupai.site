/**
 * Approvals List API
 *
 * GET /api/approvals - List approval requests for current user
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createBrowserClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  // Debug: Log auth state
  console.log('[api/approvals] Checking auth...');

  let user;
  let supabase;

  // Check for Authorization header (for API/testing access)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    console.log('[api/approvals] Using Authorization header');

    // Create a client with the provided token
    supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(token);
    if (tokenError) {
      console.log('[api/approvals] Token auth error:', tokenError.message);
    }
    user = tokenUser;
  } else {
    // Use cookie-based auth (normal browser flow)
    supabase = await createClient();
    const { data: { user: cookieUser }, error: authError } = await supabase.auth.getUser();

    console.log('[api/approvals] Cookie auth - User:', cookieUser?.id || 'null');
    console.log('[api/approvals] Cookie auth error:', authError?.message || 'none');
    user = cookieUser;
  }

  if (!user) {
    console.log('[api/approvals] Returning 401 - no user');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  console.log('[api/approvals] Authenticated user:', user.id);

  // Parse query params
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'pending';
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  // Build query
  let query = supabase
    .from('approval_requests')
    .select(`
      *,
      projects (
        id,
        name,
        stage
      )
    `, { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Filter by status
  if (status !== 'all') {
    query = query.eq('status', status);
  }

  const { data: approvals, error: fetchError, count } = await query;

  console.log('[api/approvals] Query result - count:', count, 'approvals:', approvals?.length || 0);

  if (fetchError) {
    console.error('[api/approvals] Fetch failed:', fetchError);
    return NextResponse.json(
      { error: 'Failed to fetch approvals' },
      { status: 500 }
    );
  }

  // Also check for approvals from clients (for consultants)
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  let clientApprovals: typeof approvals = [];
  let clientCount = 0;

  if (userProfile?.role === 'consultant') {
    // Get client IDs
    const { data: clients } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('consultant_id', user.id);

    if (clients && clients.length > 0) {
      const clientIds = clients.map(c => c.id);

      let clientQuery = supabase
        .from('approval_requests')
        .select(`
          *,
          projects (
            id,
            name,
            stage
          )
        `, { count: 'exact' })
        .in('user_id', clientIds)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status !== 'all') {
        clientQuery = clientQuery.eq('status', status);
      }

      const { data, count: cCount } = await clientQuery;
      clientApprovals = data || [];
      clientCount = cCount || 0;
    }
  }

  return NextResponse.json({
    approvals: approvals || [],
    client_approvals: clientApprovals,
    pagination: {
      total: (count || 0) + clientCount,
      own_count: count || 0,
      client_count: clientCount,
      limit,
      offset,
    },
  });
}
