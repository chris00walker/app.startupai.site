/**
 * Approvals List API
 *
 * GET /api/approvals - List approval requests for current user
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

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
