/**
 * Founder Directory API
 *
 * GET: Browse founders in the directory (verified consultants only)
 *
 * Query parameters:
 * - industry: Filter by industry
 * - stage: Filter by stage
 * - problem_fit: Filter by fit status (partial_fit, strong_fit)
 * - limit: Results per page (default: 20, max: 50)
 * - offset: Pagination offset
 *
 * @story US-PH01, US-PH02
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

  // Check if user is a verified consultant
  const { data: isVerified } = await supabase.rpc('is_verified_consultant');

  if (!isVerified) {
    return NextResponse.json(
      {
        error: 'unverified',
        message:
          'Upgrade to Advisor ($199/mo) or Capital ($499/mo) to access the Founder Directory.',
      },
      { status: 403 }
    );
  }

  // Parse query parameters with NaN-safe pagination (TASK-013)
  const searchParams = request.nextUrl.searchParams;
  const industry = searchParams.get('industry');
  const stage = searchParams.get('stage');
  const problemFit = searchParams.get('problem_fit');
  const { limit, offset } = parsePagination(searchParams);

  // Use the founder_directory view which handles anonymization and VPD gating
  let query = supabase
    .from('founder_directory')
    .select('*', { count: 'exact' });

  // Apply filters
  if (industry) {
    query = query.eq('industry', industry);
  }
  if (stage) {
    query = query.eq('stage', stage);
  }
  if (problemFit) {
    query = query.eq('problem_fit', problemFit);
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  // Order by fit score (highest first), then by join date (newest first)
  query = query.order('fit_score', { ascending: false, nullsFirst: false });
  query = query.order('joined_at', { ascending: false });

  const { data: founders, count, error } = await query;

  if (error) {
    console.error('[consultant/founders] Query error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch founders' },
      { status: 500 }
    );
  }

  // Transform to match API spec
  const transformedFounders = (founders || []).map((f) => ({
    id: f.id,
    displayName: f.display_name,
    company: f.company,
    industry: f.industry,
    stage: f.stage,
    problemFit: f.problem_fit,
    evidenceBadges: {
      interviewsCompleted: f.interviews_completed || 0,
      experimentsPassed: f.experiments_passed || 0,
      fitScore: f.fit_score || 0,
    },
    joinedAt: f.joined_at,
  }));

  // Server-side analytics tracking (non-blocking)
  // Note: verification_status is always 'verified' or 'grace' at this point (passed check above)
  trackMarketplaceServerEvent.founderDirectoryViewed(user.id, count || 0, 'verified');

  return NextResponse.json({
    founders: transformedFounders,
    total: count || 0,
    limit,
    offset,
  });
}

export const dynamic = 'force-dynamic';
