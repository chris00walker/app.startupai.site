/**
 * Narrative Unpublish API
 *
 * POST /api/narrative/:id/unpublish - Unpublish narrative
 *
 * @story US-NL01
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkNarrativeLayerEnabled, narrativeError } from '@/lib/narrative/errors';

export async function POST(
  _request: NextRequest,
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

  const { data: narrative, error: fetchError } = await supabase
    .from('pitch_narratives')
    .select('id, user_id')
    .eq('id', id)
    .single();

  if (fetchError || !narrative) {
    return narrativeError('NOT_FOUND', 'Narrative not found');
  }

  if (narrative.user_id !== user.id) {
    return narrativeError('FORBIDDEN', 'Not authorized');
  }

  const { error: updateError } = await supabase
    .from('pitch_narratives')
    .update({ is_published: false })
    .eq('id', id);

  if (updateError) {
    console.error('Error unpublishing narrative:', updateError);
    return narrativeError('INTERNAL_ERROR', 'Failed to unpublish');
  }

  return NextResponse.json({
    narrative_id: id,
    is_published: false,
  });
}
