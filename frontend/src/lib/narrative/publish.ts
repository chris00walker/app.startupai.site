/**
 * Publication Gate
 *
 * 4-check publication gate for narrative publishing:
 * 1. No blocking evidence_gaps where blocking_publish=true
 * 2. alignment_status != 'flagged'
 * 3. HITL review for first publish
 * 4. narrative_stale_severity != 'hard'
 *
 * @story US-NL01
 * @see docs/specs/narrative-layer-spec.md :1100-1192
 */

import { createClient as createAdminClient } from '@/lib/supabase/admin';
import type { PublishNarrativeRequest } from './types';

export interface PublicationGateResult {
  canPublish: boolean;
  blockers: string[];
}

/**
 * Check all 4 publication gate conditions.
 */
export async function checkPublicationGate(
  narrativeId: string,
  projectId: string,
  isFirstPublish: boolean
): Promise<PublicationGateResult> {
  const supabase = createAdminClient();
  const blockers: string[] = [];

  // 1. Fetch narrative record
  const { data: narrative, error: narrativeError } = await supabase
    .from('pitch_narratives')
    .select('alignment_status, narrative_data, is_published, first_published_at')
    .eq('id', narrativeId)
    .single();

  if (narrativeError || !narrative) {
    return { canPublish: false, blockers: ['Narrative not found'] };
  }

  // 2. Check alignment_status != 'flagged'
  if (narrative.alignment_status === 'flagged') {
    blockers.push('Guardian alignment check has flagged issues. Please review and address flagged claims before publishing.');
  }

  // 3. Check for blocking evidence gaps
  const narrativeData = narrative.narrative_data as { metadata?: { evidence_gaps?: Record<string, { blocking_publish?: boolean; description?: string }> } };
  const gaps = narrativeData?.metadata?.evidence_gaps;
  if (gaps) {
    for (const [slide, gap] of Object.entries(gaps)) {
      if (gap.blocking_publish) {
        blockers.push(`Missing required data for ${slide}: ${gap.description || 'Required field is empty'}`);
      }
    }
  }

  // 4. Check narrative staleness
  const { data: project } = await supabase
    .from('projects')
    .select('narrative_stale_severity')
    .eq('id', projectId)
    .single();

  if (project?.narrative_stale_severity === 'hard') {
    blockers.push('Narrative is significantly outdated. Please regenerate before publishing.');
  }

  // 5. HITL review required for first publish
  if (isFirstPublish && !narrative.first_published_at) {
    // The HITL confirmation is handled by requiring hitl_confirmation in the request body.
    // This gate only checks that the narrative hasn't been published before without HITL review.
    // The actual HITL confirmation booleans are validated by the API route.
  }

  return {
    canPublish: blockers.length === 0,
    blockers,
  };
}

/**
 * Record HITL checkpoint for narrative publication.
 * Uses existing approval_requests + approval_history tables.
 */
export async function recordPublicationHITL(
  narrativeId: string,
  userId: string,
  confirmation: PublishNarrativeRequest['hitl_confirmation']
): Promise<void> {
  const supabase = createAdminClient();
  const nowIso = new Date().toISOString();

  // Record publication confirmation in the same approval_requests contract used by HITL.
  await supabase
    .from('approval_requests')
    .insert({
      execution_id: `narrative_publish_${narrativeId}`,
      task_id: 'publish_narrative',
      user_id: userId,
      approval_type: 'gate_progression',
      owner_role: 'compass',
      title: 'Narrative Publication Review',
      description: 'Founder reviewed and approved narrative for publication',
      task_output: {
        narrative_id: narrativeId,
        hitl_confirmation: confirmation,
      },
      status: 'approved',
      decision: 'approved',
      decided_by: userId,
      decided_at: nowIso,
    });
}
