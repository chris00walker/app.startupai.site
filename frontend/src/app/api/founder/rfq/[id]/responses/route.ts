/**
 * Founder RFQ Responses API
 *
 * GET: View responses to an RFQ (founder must own the RFQ)
 *
 * @story US-FM08
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateUuid } from '@/lib/api/validation';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const supabase = await createClient();
  const { id: rfqId } = await context.params;

  // Validate UUID parameter (TASK-007)
  const uuidError = validateUuid(rfqId, 'rfqId');
  if (uuidError) return uuidError;

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify founder owns the RFQ
  const { data: rfq, error: rfqError } = await supabase
    .from('consultant_requests')
    .select('id, title, status, founder_id')
    .eq('id', rfqId)
    .single();

  if (rfqError || !rfq) {
    return NextResponse.json(
      { error: 'not_found', message: 'RFQ not found' },
      { status: 404 }
    );
  }

  if (rfq.founder_id !== user.id) {
    return NextResponse.json(
      { error: 'forbidden', message: 'You can only view responses to your own RFQs' },
      { status: 403 }
    );
  }

  // Get responses with consultant info
  const { data: responses, error: responsesError } = await supabase
    .from('consultant_request_responses')
    .select(
      `
      id,
      consultant_id,
      message,
      status,
      responded_at,
      reviewed_at,
      user_profiles!consultant_request_responses_consultant_id_fkey(
        full_name
      ),
      consultant_profiles!consultant_request_responses_consultant_id_fkey(
        company_name,
        verification_status
      )
    `
    )
    .eq('request_id', rfqId)
    .order('responded_at', { ascending: false });

  if (responsesError) {
    console.error('[founder/rfq/responses] Query error:', responsesError);
    return NextResponse.json(
      { error: 'Failed to fetch responses' },
      { status: 500 }
    );
  }

  // Transform responses
  const transformedResponses = (responses || []).map((r) => {
    const userProfile = Array.isArray(r.user_profiles)
      ? r.user_profiles[0]
      : r.user_profiles;
    const consultantProfile = Array.isArray(r.consultant_profiles)
      ? r.consultant_profiles[0]
      : r.consultant_profiles;

    return {
      id: r.id,
      consultantId: r.consultant_id,
      consultantName: userProfile?.full_name || 'Unknown',
      consultantOrganization: consultantProfile?.company_name,
      verificationBadge: consultantProfile?.verification_status,
      message: r.message,
      status: r.status,
      respondedAt: r.responded_at,
    };
  });

  return NextResponse.json({
    rfq: {
      id: rfq.id,
      title: rfq.title,
      status: rfq.status,
    },
    responses: transformedResponses,
  });
}

export const dynamic = 'force-dynamic';
