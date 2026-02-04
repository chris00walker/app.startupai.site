/**
 * Founder RFQ API
 *
 * POST: Create a new RFQ (Request for Quote)
 * GET: List founder's RFQs
 *
 * @story US-FM07
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { trackMarketplaceServerEvent } from '@/lib/analytics/server';

const createRfqSchema = z.object({
  title: z.string().min(10).max(100),
  description: z.string().min(50).max(2000),
  relationshipType: z.enum(['advisory', 'capital', 'program', 'service', 'ecosystem']),
  industries: z.array(z.string()).optional(),
  stagePreference: z.enum(['seed', 'series_a', 'series_b', 'growth']).optional(),
  timeline: z.enum(['1_month', '3_months', '6_months', 'flexible']).optional(),
  budgetRange: z.enum(['equity_only', 'under_5k', '5k_25k', '25k_100k', 'over_100k']).optional(),
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

  const validation = createRfqSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: validation.error.issues },
      { status: 400 }
    );
  }

  const { title, description, relationshipType, industries, stagePreference, timeline, budgetRange } =
    validation.data;

  // Calculate expiration (30 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  // Create RFQ
  const { data: rfq, error } = await supabase
    .from('consultant_requests')
    .insert({
      founder_id: user.id,
      title,
      description,
      relationship_type: relationshipType,
      industries: industries || null,
      stage_preference: stagePreference || null,
      timeline: timeline || null,
      budget_range: budgetRange || null,
      status: 'open',
      expires_at: expiresAt.toISOString(),
    })
    .select('id, status, created_at, expires_at')
    .single();

  if (error) {
    console.error('[founder/rfq] Insert error:', error);
    return NextResponse.json(
      { error: 'Failed to create RFQ' },
      { status: 500 }
    );
  }

  // Server-side analytics tracking (non-blocking)
  trackMarketplaceServerEvent.rfqCreated(
    user.id,
    rfq.id,
    relationshipType,
    industries,
    timeline,
    budgetRange
  );

  return NextResponse.json(
    {
      rfqId: rfq.id,
      status: rfq.status,
      createdAt: rfq.created_at,
      expiresAt: rfq.expires_at,
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

  // Parse query parameters
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status');

  // Query RFQs (TASK-022: include description for list display)
  let query = supabase
    .from('consultant_requests')
    .select(
      `
      id,
      title,
      description,
      relationship_type,
      status,
      created_at,
      expires_at
    `
    )
    .eq('founder_id', user.id);

  if (status) {
    query = query.eq('status', status);
  }

  query = query.order('created_at', { ascending: false });

  const { data: rfqs, error } = await query;

  if (error) {
    console.error('[founder/rfq] Query error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch RFQs' },
      { status: 500 }
    );
  }

  // Get response counts using RPC to bypass RLS (TASK-011)
  const rfqIds = (rfqs || []).map((r) => r.id);
  const countMap = new Map<string, number>();
  const pendingMap = new Map<string, number>();

  if (rfqIds.length > 0) {
    // Get total response counts
    const { data: responseCounts } = await supabase.rpc('get_rfq_response_counts', {
      rfq_ids: rfqIds,
    });

    (responseCounts || []).forEach((r: { request_id: string; response_count: number }) => {
      countMap.set(r.request_id, r.response_count);
    });

    // TASK-022: Get pending response counts
    const { data: pendingCounts } = await supabase.rpc('get_rfq_pending_counts', {
      rfq_ids: rfqIds,
    });

    (pendingCounts || []).forEach((r: { request_id: string; pending_count: number }) => {
      pendingMap.set(r.request_id, r.pending_count);
    });
  }

  // Transform (TASK-022: include description and pendingResponses)
  const transformedRfqs = (rfqs || []).map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    relationshipType: r.relationship_type,
    status: r.status,
    responseCount: countMap.get(r.id) || 0,
    pendingResponses: pendingMap.get(r.id) || 0,
    createdAt: r.created_at,
    expiresAt: r.expires_at,
  }));

  return NextResponse.json({ rfqs: transformedRfqs });
}

export const dynamic = 'force-dynamic';
