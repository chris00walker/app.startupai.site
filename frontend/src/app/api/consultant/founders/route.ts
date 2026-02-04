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

  // Fetch verification status for analytics (verified/grace)
  const { data: profile, error: profileError } = await supabase
    .from('consultant_profiles')
    .select('verification_status')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.warn('[consultant/founders] Failed to fetch verification status:', profileError);
  }

  const verificationStatus = profile?.verification_status || 'verified';

  // Parse query parameters with NaN-safe pagination (TASK-013)
  const searchParams = request.nextUrl.searchParams;
  const industry = searchParams.get('industry');
  const stage = searchParams.get('stage');
  const problemFit = searchParams.get('problem_fit');
  const { limit, offset } = parsePagination(searchParams);

  // Use the founder_directory view which handles anonymization and VPD gating
  let query = supabase
    .from('founder_directory')
    .select('*');

  // Apply filters supported by the view
  if (industry) {
    query = query.eq('industry', industry);
  }
  if (problemFit) {
    query = query.eq('problem_fit', problemFit);
  }

  const { data: founders, error } = await query;

  if (error) {
    console.error('[consultant/founders] Query error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch founders' },
      { status: 500 }
    );
  }

  const deriveStage = (row: any) => {
    if (row.viability_signal && row.viability_signal !== 'unknown') return 'VIABILITY';
    if (row.feasibility_signal && row.feasibility_signal !== 'unknown') return 'FEASIBILITY';
    if (row.desirability_signal && row.desirability_signal !== 'no_signal') return 'DESIRABILITY';
    return 'DESIRABILITY';
  };

  const deriveFitScore = (fit: string | null | undefined) => {
    if (fit === 'strong_fit') return 85;
    if (fit === 'partial_fit') return 65;
    return 50;
  };

  const enrichedFounders = (founders || []).map((f: any) => ({
    id: f.id,
    displayName: f.display_name,
    company: f.project_name || 'Stealth startup',
    industry: f.industry,
    stage: deriveStage(f),
    problemFit: f.problem_fit,
    evidenceBadges: {
      interviewsCompleted: f.interviews_completed || 0,
      experimentsPassed: f.experiments_run || 0,
      fitScore: deriveFitScore(f.problem_fit),
    },
    joinedAt: f.project_created_at,
  }));

  // Apply optional stage filter and ordering in memory
  const filteredFounders = stage
    ? enrichedFounders.filter((f) => f.stage === stage)
    : enrichedFounders;

  const sortedFounders = filteredFounders.sort((a, b) => {
    const fitDiff = (b.evidenceBadges.fitScore || 0) - (a.evidenceBadges.fitScore || 0);
    if (fitDiff !== 0) return fitDiff;
    return new Date(b.joinedAt || 0).getTime() - new Date(a.joinedAt || 0).getTime();
  });

  const total = sortedFounders.length;
  const pagedFounders = sortedFounders.slice(offset, offset + limit);

  // Server-side analytics tracking (non-blocking)
  // Note: verification_status is always 'verified' or 'grace' at this point (passed check above)
  trackMarketplaceServerEvent.founderDirectoryViewed(user.id, total, verificationStatus);

  return NextResponse.json({
    founders: pagedFounders,
    total,
    limit,
    offset,
    viewerVerificationStatus: verificationStatus,
  });
}

export const dynamic = 'force-dynamic';
