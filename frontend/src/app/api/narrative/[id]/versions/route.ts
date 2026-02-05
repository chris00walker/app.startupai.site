/**
 * Narrative Versions API
 *
 * GET /api/narrative/:id/versions - List version history
 *
 * @story US-NL01
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkNarrativeLayerEnabled, narrativeError } from '@/lib/narrative/errors';

export async function GET(
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

  // Verify narrative ownership
  const { data: narrative } = await supabase
    .from('pitch_narratives')
    .select('id, user_id')
    .eq('id', id)
    .single();

  if (!narrative) {
    return narrativeError('NOT_FOUND', 'Narrative not found');
  }

  if (narrative.user_id !== user.id) {
    return narrativeError('FORBIDDEN', 'Not authorized');
  }

  // Fetch versions
  const { data: versions, error: fetchError } = await supabase
    .from('narrative_versions')
    .select('version_number, created_at, trigger_reason, fit_score_at_version, source_evidence_hash')
    .eq('narrative_id', id)
    .order('version_number', { ascending: false });

  if (fetchError) {
    console.error('Error fetching versions:', fetchError);
    return narrativeError('INTERNAL_ERROR', 'Failed to fetch versions');
  }

  const currentVersion = versions?.[0]?.version_number ?? 0;

  return NextResponse.json({
    current_version: currentVersion,
    versions: (versions ?? []).map((v) => ({
      version_number: v.version_number,
      created_at: v.created_at,
      trigger_reason: v.trigger_reason,
      fit_score_at_version: v.fit_score_at_version,
      source_evidence_hash: v.source_evidence_hash,
    })),
  });
}
