/**
 * Narrative Edit API
 *
 * PATCH /api/narrative/:id/edit - Apply edits to narrative with Guardian check
 *
 * Flow:
 * 1. Apply edits to narrative_data (preserve baseline_narrative)
 * 2. Set alignment_status = 'pending', append to edit_history
 * 3. Return immediate response with alignment_status: 'pending'
 * 4. (Background) Guardian alignment check updates status via Realtime
 *
 * @story US-NL01
 * @see docs/specs/narrative-layer-spec.md :4470-4511
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkNarrativeLayerEnabled, narrativeError } from '@/lib/narrative/errors';
import { applyEdit, buildEditEntry } from '@/lib/narrative/edit';
import { trackNarrativeFunnelEvent } from '@/lib/narrative/access-tracking';
import type { EditHistoryEntry, PitchNarrativeContent } from '@/lib/narrative/types';

const editSchema = z.object({
  edits: z.array(z.object({
    field: z.string().min(1),
    new_value: z.unknown(),
  })).min(1),
});

export async function PATCH(
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

  const result = editSchema.safeParse(body);
  if (!result.success) {
    return narrativeError('VALIDATION_ERROR', 'Invalid edit request', {
      issues: result.error.issues,
    });
  }

  // Fetch existing narrative
  const { data: narrative, error: fetchError } = await supabase
    .from('pitch_narratives')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !narrative) {
    return narrativeError('NOT_FOUND', 'Narrative not found');
  }

  if (narrative.user_id !== user.id) {
    return narrativeError('FORBIDDEN', 'Not authorized to edit this narrative');
  }

  // Apply edits sequentially
  let currentData = narrative.narrative_data as PitchNarrativeContent;
  const newEntries: EditHistoryEntry[] = [];

  for (const edit of result.data.edits) {
    const { updated, oldValue, slide, fieldPath } = applyEdit(currentData, edit.field, edit.new_value);
    currentData = updated;
    newEntries.push(buildEditEntry(slide, fieldPath || edit.field, oldValue, edit.new_value));
  }

  // Update narrative: set alignment_status to 'pending', append edit history
  const existingHistory = Array.isArray(narrative.edit_history)
    ? (narrative.edit_history as EditHistoryEntry[])
    : [];
  const updatedHistory = [...existingHistory, ...newEntries];

  const { error: updateError } = await supabase
    .from('pitch_narratives')
    .update({
      narrative_data: currentData,
      is_edited: true,
      edit_history: updatedHistory,
      alignment_status: 'pending',
    })
    .eq('id', id);

  if (updateError) {
    console.error('Error updating narrative edits:', updateError);
    return narrativeError('INTERNAL_ERROR', 'Failed to save edits');
  }

  // Fire-and-forget background Guardian alignment check.
  // The guardian-check endpoint updates alignment_status and alignment_issues
  // via admin client, which triggers the Realtime subscription in the UI.
  const editedFields = result.data.edits.map((e) => e.field);
  const guardianUrl = new URL(
    `/api/narrative/${id}/guardian-check`,
    request.nextUrl.origin
  );

  fetch(guardianUrl.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: request.headers.get('cookie') || '',
    },
    body: JSON.stringify({ edited_fields: editedFields }),
  }).catch((err) => {
    console.error('Failed to enqueue Guardian alignment check:', err);
  });

  // Track funnel event (fire-and-forget)
  trackNarrativeFunnelEvent(narrative.project_id, user.id, 'narrative_edited', {
    narrative_id: id,
    edited_fields: editedFields,
  }).catch(() => {});

  return NextResponse.json({
    narrative_id: id,
    is_edited: true,
    alignment_status: 'pending',
  });
}
