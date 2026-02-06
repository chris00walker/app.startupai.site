/**
 * Narrative API (by ID)
 *
 * GET /api/narrative/:id - Get narrative by ID (read-only fetch without regeneration)
 *
 * Plan addition: Not in spec (spec uses POST /generate with cache).
 * Needed for dashboard fetch without triggering regeneration checks.
 *
 * @story US-NL01
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkNarrativeLayerEnabled, narrativeError } from '@/lib/narrative/errors';
import type { PitchNarrative } from '@/lib/narrative/types';

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

  const { data: narrative, error: fetchError } = await supabase
    .from('pitch_narratives')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !narrative) {
    return narrativeError('NOT_FOUND', 'Narrative not found');
  }

  if (narrative.user_id !== user.id) {
    return narrativeError('FORBIDDEN', 'Not authorized to access this narrative');
  }

  // Fetch staleness from project
  const { data: project } = await supabase
    .from('projects')
    .select('narrative_is_stale, narrative_stale_severity, narrative_stale_reason')
    .eq('id', narrative.project_id)
    .single();

  const pitchNarrative: PitchNarrative = {
    id: narrative.id,
    project_id: narrative.project_id,
    generated_at: narrative.created_at,
    last_updated: narrative.updated_at !== narrative.created_at ? narrative.updated_at : undefined,
    content: narrative.narrative_data,
  };

  return NextResponse.json({
    // Full DB-backed shape used by edit/history APIs.
    id: narrative.id,
    narrative_data: narrative.narrative_data,
    baseline_narrative: narrative.baseline_narrative,
    source_evidence_hash: narrative.source_evidence_hash,
    generation_version: narrative.generation_version,
    created_at: narrative.created_at,
    updated_at: narrative.updated_at,

    // Assembled API shape used by narrative views.
    pitch_narrative: pitchNarrative,
    is_edited: narrative.is_edited,
    alignment_status: narrative.alignment_status,
    alignment_issues: narrative.alignment_issues,
    is_published: narrative.is_published,
    staleness: project ? {
      is_stale: project.narrative_is_stale,
      severity: project.narrative_stale_severity,
      reason: project.narrative_stale_reason,
    } : null,
  });
}
