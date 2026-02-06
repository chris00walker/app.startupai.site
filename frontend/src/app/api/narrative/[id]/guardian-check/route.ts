/**
 * Guardian Alignment Check API
 *
 * POST /api/narrative/:id/guardian-check - Run Guardian alignment check on edited narrative
 *
 * Called as a fire-and-forget background check after edits are saved.
 * Updates alignment_status and alignment_issues via admin client, which
 * triggers Supabase Realtime subscription in the NarrativeEditor component.
 *
 * @story US-NL01
 * @see docs/specs/narrative-layer-spec.md :3948-3997
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { checkNarrativeLayerEnabled, narrativeError } from '@/lib/narrative/errors';
import { guardianCheckEdit } from '@/lib/narrative/guardian';
import type { PitchNarrativeContent } from '@/lib/narrative/types';

const guardianCheckSchema = z.object({
  edited_fields: z.array(z.string().min(1)).min(1),
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

  const result = guardianCheckSchema.safeParse(body);
  if (!result.success) {
    return narrativeError('VALIDATION_ERROR', 'Invalid guardian check request', {
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
    return narrativeError('FORBIDDEN', 'Not authorized to check this narrative');
  }

  // Run Guardian alignment check on the edited fields
  const narrativeData = narrative.narrative_data as PitchNarrativeContent;
  const checkResult = guardianCheckEdit(narrativeData, result.data.edited_fields);

  // Update alignment_status and alignment_issues via admin client
  // to bypass RLS timing issues and ensure Realtime triggers reliably
  const adminClient = createAdminClient();
  const { error: updateError } = await adminClient
    .from('pitch_narratives')
    .update({
      alignment_status: checkResult.status,
      alignment_issues: checkResult.issues.length > 0 ? checkResult.issues : null,
    })
    .eq('id', id);

  if (updateError) {
    console.error('Error updating Guardian alignment status:', updateError);
    return narrativeError('INTERNAL_ERROR', 'Failed to update alignment status');
  }

  return NextResponse.json({
    narrative_id: id,
    alignment_status: checkResult.status,
    issues: checkResult.issues,
  });
}
