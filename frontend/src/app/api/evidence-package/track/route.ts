/**
 * Evidence Package Engagement Tracking API
 *
 * POST /api/evidence-package/track - Track engagement events and view duration
 *
 * Accepts two action types:
 * - "engagement": Track tab_switch, slide_view, evidence_expand, pdf_download events
 * - "duration": Update view duration for an access record
 *
 * @story US-NL01
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkNarrativeLayerEnabled, narrativeError } from '@/lib/narrative/errors';
import { trackEngagementEvent, updateViewDuration } from '@/lib/narrative/access-tracking';

const engagementSchema = z.object({
  action: z.literal('engagement'),
  access_id: z.string().uuid(),
  event_type: z.enum(['tab_switch', 'slide_view', 'evidence_expand', 'pdf_download']),
  event_value: z.record(z.string(), z.unknown()).optional(),
});

const durationSchema = z.object({
  action: z.literal('duration'),
  access_id: z.string().uuid(),
  duration_seconds: z.number().int().min(0).max(86400),
});

const trackSchema = z.discriminatedUnion('action', [engagementSchema, durationSchema]);

export async function POST(request: NextRequest) {
  const featureCheck = checkNarrativeLayerEnabled();
  if (featureCheck) return featureCheck;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return narrativeError('UNAUTHORIZED', 'Authentication required');
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return narrativeError('VALIDATION_ERROR', 'Invalid JSON body');
  }

  const result = trackSchema.safeParse(body);
  if (!result.success) {
    return narrativeError('VALIDATION_ERROR', 'Invalid tracking request', {
      issues: result.error.issues,
    });
  }

  const data = result.data;

  if (data.action === 'engagement') {
    await trackEngagementEvent(data.access_id, data.event_type, data.event_value);
  } else {
    await updateViewDuration(data.access_id, data.duration_seconds);
  }

  return NextResponse.json({ success: true });
}
