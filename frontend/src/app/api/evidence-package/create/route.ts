/**
 * Evidence Package Create API
 *
 * POST /api/evidence-package/create - Create an evidence package
 *
 * @story US-NL01
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkNarrativeLayerEnabled, narrativeError } from '@/lib/narrative/errors';
import { gatherEvidence } from '@/lib/narrative/generate';
import { computeIntegrityHash } from '@/lib/narrative/hash';

const createPackageSchema = z.object({
  project_id: z.string().uuid(),
  is_public: z.boolean().optional().default(false),
  founder_consent: z.boolean(),
});

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

  const result = createPackageSchema.safeParse(body);
  if (!result.success) {
    return narrativeError('VALIDATION_ERROR', 'Invalid request', {
      issues: result.error.issues,
    });
  }

  const { project_id, is_public, founder_consent } = result.data;

  // Verify project ownership
  const { data: project } = await supabase
    .from('projects')
    .select('id, user_id')
    .eq('id', project_id)
    .single();

  if (!project || project.user_id !== user.id) {
    return narrativeError('FORBIDDEN', 'Not authorized');
  }

  // Gather evidence
  const evidence = await gatherEvidence(supabase, project_id);

  // Find linked narrative if one exists
  const { data: narrative } = await supabase
    .from('pitch_narratives')
    .select('id')
    .eq('project_id', project_id)
    .single();

  // Compute integrity hash
  const integrityMeta = {
    methodology_version: '1.0',
    agent_versions: [],
    last_hitl_checkpoint: new Date().toISOString(),
    fit_score_algorithm: '1.0',
  };
  const integrityHash = computeIntegrityHash(evidence, integrityMeta);

  // Create package
  const { data: created, error: createError } = await supabase
    .from('evidence_packages')
    .insert({
      project_id,
      founder_id: user.id,
      pitch_narrative_id: narrative?.id ?? null,
      evidence_data: evidence,
      integrity_hash: integrityHash,
      is_public,
      founder_consent,
      consent_timestamp: founder_consent ? new Date().toISOString() : null,
    })
    .select('id')
    .single();

  if (createError || !created) {
    console.error('Error creating evidence package:', createError);
    return narrativeError('INTERNAL_ERROR', 'Failed to create evidence package');
  }

  return NextResponse.json({
    package_id: created.id,
    integrity_hash: integrityHash,
    includes: ['vpc', 'customer_profile', 'competitor_map', 'bmc', 'experiment_results', 'gate_scores', 'hitl_record'],
  }, { status: 201 });
}
