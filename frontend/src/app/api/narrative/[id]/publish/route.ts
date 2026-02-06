/**
 * Narrative Publication API
 *
 * POST /api/narrative/:id/publish - Publish narrative with HITL confirmation
 *
 * Publication gate (4 checks):
 * 1. No blocking evidence_gaps where blocking_publish=true
 * 2. alignment_status != 'flagged'
 * 3. HITL review for first publish
 * 4. narrative_stale_severity != 'hard'
 *
 * @story US-NL01
 * @see docs/specs/narrative-layer-spec.md :1100-1192
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkNarrativeLayerEnabled, narrativeError } from '@/lib/narrative/errors';
import { trackNarrativeFunnelEvent } from '@/lib/narrative/access-tracking';
import type { PitchNarrativeContent } from '@/lib/narrative/types';

const publishSchema = z.object({
  hitl_confirmation: z.object({
    reviewed_slides: z.literal(true),
    verified_traction: z.literal(true),
    added_context: z.literal(true),
    confirmed_ask: z.literal(true),
  }),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const featureCheck = checkNarrativeLayerEnabled();
  if (featureCheck) return featureCheck;

  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return narrativeError('UNAUTHORIZED', 'Authentication required');
  }

  // Parse request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return narrativeError('VALIDATION_ERROR', 'Invalid JSON body');
  }

  const result = publishSchema.safeParse(body);
  if (!result.success) {
    return narrativeError('VALIDATION_ERROR', 'All HITL confirmation fields must be true', {
      issues: result.error.issues,
    });
  }

  // Fetch narrative
  const { data: narrative, error: fetchError } = await supabase
    .from('pitch_narratives')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !narrative) {
    return narrativeError('NOT_FOUND', 'Narrative not found');
  }

  if (narrative.user_id !== user.id) {
    return narrativeError('FORBIDDEN', 'Not authorized to publish this narrative');
  }

  // Publication gate check 1: No blocking evidence gaps
  const narrativeData = narrative.narrative_data as PitchNarrativeContent;
  const evidenceGaps = narrativeData.metadata?.evidence_gaps ?? {};
  const blockingGaps = Object.entries(evidenceGaps).filter(
    ([, gap]) => gap.blocking_publish
  );
  if (blockingGaps.length > 0) {
    return narrativeError('PUBLISH_BLOCKED', 'Blocking evidence gaps must be resolved', {
      blocking_gaps: blockingGaps.map(([slide, gap]) => ({
        slide,
        gap_type: gap.gap_type,
        description: gap.description,
        recommended_action: gap.recommended_action,
      })),
    });
  }

  // Publication gate check 2: alignment_status != 'flagged'
  if (narrative.alignment_status === 'flagged') {
    return narrativeError('PUBLISH_BLOCKED', 'Narrative has flagged alignment issues that must be resolved');
  }

  // Publication gate check 3: HITL review for first publish
  const isFirstPublish = !narrative.first_published_at;
  // HITL confirmation is required (enforced by schema above)

  // Publication gate check 4: Not hard stale
  const { data: project } = await supabase
    .from('projects')
    .select('narrative_stale_severity')
    .eq('id', narrative.project_id)
    .single();

  if (project?.narrative_stale_severity === 'hard') {
    return narrativeError('PUBLISH_BLOCKED', 'Narrative is outdated. Regenerate before publishing.');
  }

  // All gates passed — publish
  const now = new Date().toISOString();
  const updateData: Record<string, unknown> = {
    is_published: true,
    last_publish_review_at: now,
  };

  if (isFirstPublish) {
    updateData.first_published_at = now;
  }

  const { error: updateError } = await supabase
    .from('pitch_narratives')
    .update(updateData)
    .eq('id', id);

  if (updateError) {
    console.error('Error publishing narrative:', updateError);
    return narrativeError('INTERNAL_ERROR', 'Failed to publish narrative');
  }

  // Record HITL checkpoint via existing approval system
  await supabase
    .from('approval_requests')
    .insert({
      execution_id: `narrative_publish_${id}`,
      task_id: `publish_${id}`,
      user_id: user.id,
      project_id: narrative.project_id,
      approval_type: 'brief_review',
      owner_role: 'founder',
      title: 'Narrative Publication Review',
      description: 'Founder reviewed and approved narrative for publication',
      status: 'approved',
      decision: 'approved',
      decided_by: user.id,
      decided_at: now,
    });

  // Track funnel event (fire-and-forget)
  trackNarrativeFunnelEvent(narrative.project_id, user.id, 'narrative_published', {
    narrative_id: id,
    first_publish: isFirstPublish,
  }).catch(() => {});

  return NextResponse.json({
    narrative_id: id,
    is_published: true,
    published_at: now,
    first_publish: isFirstPublish,
  });
}
