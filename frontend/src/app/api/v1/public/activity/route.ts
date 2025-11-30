/**
 * Public Activity Feed API
 *
 * GET /api/v1/public/activity
 *
 * Returns anonymized, recent agent activities for marketing display.
 * No authentication required - data is intentionally public.
 *
 * Query params:
 *   - founder: Filter by founder_id (sage, forge, pulse, compass, guardian, ledger)
 *   - limit: Number of results (default: 20, max: 100)
 *   - offset: Pagination offset (default: 0)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/admin';

// Validation schema for query parameters
const querySchema = z.object({
  founder: z
    .enum(['sage', 'forge', 'pulse', 'compass', 'guardian', 'ledger'])
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

// Response type matching the API contract
interface PublicActivityResponse {
  id: string;
  founder_id: 'sage' | 'forge' | 'pulse' | 'compass' | 'guardian' | 'ledger';
  activity_type: 'analysis' | 'build' | 'validation' | 'research' | 'review';
  description: string;
  created_at: string;
}

// Cache control: 5 minutes
const CACHE_MAX_AGE = 300;

export async function GET(request: NextRequest) {
  try {
    // Parse and validate query params
    const { searchParams } = new URL(request.url);
    const parseResult = querySchema.safeParse({
      founder: searchParams.get('founder') || undefined,
      limit: searchParams.get('limit') || 20,
      offset: searchParams.get('offset') || 0,
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { founder, limit, offset } = parseResult.data;

    // Query database using admin client (no RLS needed for public data)
    const admin = createClient();
    let query = admin
      .from('public_activity_log')
      .select('id, founder_id, activity_type, description, created_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (founder) {
      query = query.eq('founder_id', founder);
    }

    const { data: activities, error } = await query;

    if (error) {
      console.error('[api/v1/public/activity] Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
    }

    // Return with CORS and caching headers
    return NextResponse.json(
      {
        success: true,
        data: (activities || []) as PublicActivityResponse[],
        pagination: {
          offset,
          limit,
          has_more: (activities?.length || 0) === limit,
        },
      },
      {
        headers: {
          'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, s-maxage=${CACHE_MAX_AGE}`,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
        },
      }
    );
  } catch (error) {
    console.error('[api/v1/public/activity] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
