/**
 * Evidence Package API (by ID)
 *
 * GET /api/evidence-package/:id - Get evidence package with dual-format assembly
 *
 * @story US-NL01
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkNarrativeLayerEnabled, narrativeError } from '@/lib/narrative/errors';
import type { PitchNarrative, EvidencePackage, ValidationEvidence, PitchNarrativeContent } from '@/lib/narrative/types';

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

  // Fetch package (RLS handles founder + consultant access)
  const { data: pkg, error: fetchError } = await supabase
    .from('evidence_packages')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !pkg) {
    return narrativeError('NOT_FOUND', 'Evidence package not found');
  }

  // Fetch linked pitch narrative if available
  let pitchNarrative: PitchNarrative | null = null;
  if (pkg.pitch_narrative_id) {
    const { data: narrative } = await supabase
      .from('pitch_narratives')
      .select('id, project_id, narrative_data, created_at, updated_at')
      .eq('id', pkg.pitch_narrative_id)
      .single();

    if (narrative) {
      pitchNarrative = {
        id: narrative.id,
        project_id: narrative.project_id,
        generated_at: narrative.created_at,
        last_updated: narrative.updated_at !== narrative.created_at ? narrative.updated_at : undefined,
        content: narrative.narrative_data as PitchNarrativeContent,
      };
    }
  }

  // Compute access section (shared_with from evidence_package_access)
  const { data: accessRecords } = await supabase
    .from('evidence_package_access')
    .select('portfolio_holder_id')
    .eq('evidence_package_id', id);

  const sharedWith = (accessRecords ?? []).map((a) => a.portfolio_holder_id);

  const evidenceData = pkg.evidence_data as ValidationEvidence;

  const response: EvidencePackage = {
    version: '1.0',
    generated_at: pkg.created_at,
    project_id: pkg.project_id,
    founder_id: pkg.founder_id,
    pitch_narrative: pitchNarrative ?? {
      id: '',
      project_id: pkg.project_id,
      generated_at: pkg.created_at,
      content: {} as PitchNarrativeContent,
    },
    validation_evidence: evidenceData,
    integrity: {
      evidence_hash: pkg.integrity_hash,
      methodology_version: '1.0',
      agent_versions: [],
      last_hitl_checkpoint: pkg.created_at,
      fit_score_algorithm: '1.0',
    },
    access: {
      shared_with: sharedWith,
      founder_consent: pkg.founder_consent,
      opt_in_timestamp: pkg.consent_timestamp ?? pkg.created_at,
    },
  };

  return NextResponse.json(response);
}
