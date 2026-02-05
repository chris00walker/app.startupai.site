/**
 * Verification Token Lookup
 *
 * Token lookup, hash comparison, and response sanitization
 * for public verification endpoint.
 *
 * @story US-NL01
 * @see docs/specs/narrative-layer-spec.md :3060-3116
 */

import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { computeNarrativeHash } from './hash';
import type { VerificationResponse, PitchNarrativeContent } from './types';

/**
 * Look up a verification token and return verification response.
 * Uses admin client to bypass RLS (public endpoint).
 *
 * Response excludes fit_score_at_export per spec :3114.
 */
export async function verifyToken(
  verificationToken: string
): Promise<VerificationResponse> {
  const supabase = createAdminClient();

  // Look up the export by verification token
  const { data: exportRecord, error } = await supabase
    .from('narrative_exports')
    .select(`
      id,
      generation_hash,
      venture_name_at_export,
      validation_stage_at_export,
      exported_at,
      evidence_package_id,
      narrative_id
    `)
    .eq('verification_token', verificationToken)
    .single();

  if (error || !exportRecord) {
    return { status: 'not_found' };
  }

  // Fetch the current narrative to compare hashes
  const { data: narrative } = await supabase
    .from('pitch_narratives')
    .select('narrative_data, is_edited, alignment_status, created_at')
    .eq('id', exportRecord.narrative_id)
    .single();

  if (!narrative) {
    return { status: 'not_found' };
  }

  // Compute current hash of the narrative
  const currentHash = computeNarrativeHash(
    narrative.narrative_data as PitchNarrativeContent
  );

  // Compare generation_hash (at export time) with current hash
  const currentHashMatches = exportRecord.generation_hash === currentHash;

  // Get evidence package ID for the access URL
  const evidenceId = exportRecord.evidence_package_id
    ? String(exportRecord.evidence_package_id).substring(0, 12)
    : undefined;

  return {
    status: currentHashMatches ? 'verified' : 'outdated',
    exported_at: exportRecord.exported_at,
    venture_name: exportRecord.venture_name_at_export,
    evidence_id: evidenceId,
    generation_hash: exportRecord.generation_hash,
    current_hash: currentHash,
    current_hash_matches: currentHashMatches,
    evidence_generated_at: narrative.created_at,
    validation_stage_at_export: exportRecord.validation_stage_at_export,
    is_edited: narrative.is_edited as boolean,
    alignment_status: narrative.alignment_status as string,
    request_access_url: exportRecord.evidence_package_id
      ? `/evidence-package/${exportRecord.evidence_package_id}`
      : undefined,
  };
}
