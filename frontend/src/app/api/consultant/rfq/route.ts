/**
 * Consultant RFQ Board API
 *
 * GET: Browse RFQs (verified consultants only)
 *
 * Query parameters:
 * - relationship_type: Filter by type
 * - industry: Filter by industry
 * - timeline: Filter by timeline
 * - budget_range: Filter by budget
 * - limit: Results per page (default: 20, max: 50)
 * - offset: Pagination offset
 *
 * @story US-PH05
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
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
        message:
          'Upgrade to Advisor ($199/mo) or Capital ($499/mo) to browse founder requests and respond to RFQs.',
      },
      { status: 403 }
    );
  }

  // Parse query parameters
  const searchParams = request.nextUrl.searchParams;
  const relationshipType = searchParams.get('relationship_type');
  const industry = searchParams.get('industry');
  const timeline = searchParams.get('timeline');
  const budgetRange = searchParams.get('budget_range');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
  const offset = parseInt(searchParams.get('offset') || '0');

  // Query open RFQs
  let query = supabase
    .from('consultant_requests')
    .select('*', { count: 'exact' })
    .eq('status', 'open')
    .gt('expires_at', new Date().toISOString());

  // Apply filters
  if (relationshipType) {
    query = query.eq('relationship_type', relationshipType);
  }
  if (industry) {
    query = query.contains('industries', [industry]);
  }
  if (timeline) {
    query = query.eq('timeline', timeline);
  }
  if (budgetRange) {
    query = query.eq('budget_range', budgetRange);
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);
  query = query.order('created_at', { ascending: false });

  const { data: rfqs, count, error } = await query;

  if (error) {
    console.error('[consultant/rfq] Query error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch RFQs' },
      { status: 500 }
    );
  }

  // Get response counts and check if user has responded
  const rfqIds = (rfqs || []).map((r) => r.id);
  const { data: responses } = await supabase
    .from('consultant_request_responses')
    .select('request_id, consultant_id')
    .in('request_id', rfqIds);

  const countMap = new Map<string, number>();
  const hasRespondedMap = new Map<string, boolean>();
  (responses || []).forEach((r) => {
    const current = countMap.get(r.request_id) || 0;
    countMap.set(r.request_id, current + 1);
    if (r.consultant_id === user.id) {
      hasRespondedMap.set(r.request_id, true);
    }
  });

  // Transform
  const transformedRfqs = (rfqs || []).map((r) => ({
    id: r.id,
    title: r.title,
    descriptionPreview:
      r.description.substring(0, 150) + (r.description.length > 150 ? '...' : ''),
    relationshipType: r.relationship_type,
    industries: r.industries,
    stagePreference: r.stage_preference,
    timeline: r.timeline,
    budgetRange: r.budget_range,
    responseCount: countMap.get(r.id) || 0,
    createdAt: r.created_at,
    expiresAt: r.expires_at,
    hasResponded: hasRespondedMap.get(r.id) || false,
  }));

  return NextResponse.json({
    rfqs: transformedRfqs,
    total: count || 0,
    limit,
    offset,
  });
}

export const dynamic = 'force-dynamic';
