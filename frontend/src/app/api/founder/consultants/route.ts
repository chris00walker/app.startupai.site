/**
 * Consultant Directory API
 *
 * GET: Browse verified consultants (authenticated founders)
 *
 * Query parameters:
 * - relationship_type: Filter by relationship type
 * - industry: Filter by industry expertise
 * - limit: Results per page (default: 20, max: 50)
 * - offset: Pagination offset
 *
 * @story US-FM01, US-FM02
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parsePagination } from '@/lib/api/validation';
import { trackMarketplaceServerEvent } from '@/lib/analytics/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse query parameters with NaN-safe pagination (TASK-013)
  const searchParams = request.nextUrl.searchParams;
  const relationshipType = searchParams.get('relationship_type');
  const industry = searchParams.get('industry');
  const { limit, offset } = parsePagination(searchParams);

  // Query verified consultants who have opted into the directory
  let query = supabase
    .from('consultant_profiles')
    .select(
      `
      id,
      company_name,
      industries,
      services,
      default_relationship_type,
      verification_status,
      user_profiles!inner(
        full_name,
        bio
      )
    `,
      { count: 'exact' }
    )
    .in('verification_status', ['verified', 'grace'])
    .eq('directory_opt_in', true);

  // Apply filters
  if (relationshipType) {
    query = query.eq('default_relationship_type', relationshipType);
  }
  if (industry) {
    query = query.contains('industries', [industry]);
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data: consultants, count, error } = await query;

  if (error) {
    console.error('[founder/consultants] Query error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch consultants' },
      { status: 500 }
    );
  }

  // Get connection counts for each consultant using RPC to bypass RLS (TASK-010)
  const consultantIds = (consultants || []).map((c) => c.id);
  const countMap = new Map<string, number>();

  // Fetch counts in parallel for all consultants
  await Promise.all(
    consultantIds.map(async (id) => {
      const { data: count } = await supabase.rpc('get_consultant_connection_count', {
        consultant_uuid: id,
      });
      if (count !== null) {
        countMap.set(id, count);
      }
    })
  );

  // Transform to match API spec
  const transformedConsultants = (consultants || []).map((c) => {
    const userProfile = Array.isArray(c.user_profiles)
      ? c.user_profiles[0]
      : c.user_profiles;

    // Combine industries and services for expertise areas
    const expertiseAreas = [
      ...(c.industries || []),
      ...(c.services || []),
    ];

    // Truncate bio for summary
    const bioSummary = userProfile?.bio
      ? userProfile.bio.substring(0, 200) + (userProfile.bio.length > 200 ? '...' : '')
      : '';

    return {
      id: c.id,
      name: userProfile?.full_name || 'Unknown',
      organization: c.company_name || '',
      expertiseAreas: expertiseAreas.slice(0, 10), // Limit to 10 areas
      bioSummary,
      verificationBadge: c.verification_status,
      relationshipTypesOffered: c.default_relationship_type,
      connectionCount: countMap.get(c.id) || 0,
    };
  });

  // Server-side analytics tracking (non-blocking)
  trackMarketplaceServerEvent.consultantDirectoryViewed(user.id, count || 0);

  return NextResponse.json({
    consultants: transformedConsultants,
    total: count || 0,
    limit,
    offset,
  });
}

export const dynamic = 'force-dynamic';
