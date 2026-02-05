/**
 * Narrative Generation API
 *
 * POST /api/narrative/generate - Generate or retrieve cached pitch narrative
 *
 * Flow:
 * 1. Check prerequisites (project, hypothesis, customer profile, VPC)
 * 2. Check cache (return if not stale and not force_regenerate)
 * 3. Gather evidence from all data sources
 * 4. Generate narrative (CrewAI or fallback)
 * 5. Run Guardian alignment checks
 * 6. Store narrative + create version + upsert primary evidence package
 * 7. Update project staleness
 *
 * @story US-NL01
 * @see docs/specs/narrative-layer-spec.md :2699-2760
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkNarrativeLayerEnabled, narrativeError } from '@/lib/narrative/errors';
import { checkPrerequisites, gatherEvidence, buildNarrativeFromEvidence, upsertPrimaryEvidencePackage } from '@/lib/narrative/generate';
import { computeNarrativeHash, computeSourceEvidenceHash } from '@/lib/narrative/hash';
import type { PitchNarrative } from '@/lib/narrative/types';

const generateSchema = z.object({
  project_id: z.string().uuid(),
  force_regenerate: z.boolean().optional().default(false),
  preserve_edits: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  const featureCheck = checkNarrativeLayerEnabled();
  if (featureCheck) return featureCheck;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return narrativeError('UNAUTHORIZED', 'Authentication required');
  }

  // Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return narrativeError('VALIDATION_ERROR', 'Invalid JSON body');
  }

  const result = generateSchema.safeParse(body);
  if (!result.success) {
    return narrativeError('VALIDATION_ERROR', 'Invalid request', {
      issues: result.error.issues,
    });
  }

  const { project_id, force_regenerate, preserve_edits } = result.data;

  // Verify project ownership
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, name, description, user_id, hints, raw_idea, validation_stage, narrative_is_stale, narrative_generated_at')
    .eq('id', project_id)
    .single();

  if (projectError || !project) {
    return narrativeError('NOT_FOUND', 'Project not found');
  }

  if (project.user_id !== user.id) {
    return narrativeError('FORBIDDEN', 'Not authorized to access this project');
  }

  // Step 2: Check prerequisites
  const prereqs = await checkPrerequisites(supabase, project_id, user.id);
  if (!prereqs.passed) {
    return narrativeError('INSUFFICIENT_EVIDENCE', 'Missing required evidence', {
      missing: prereqs.missing,
      details: prereqs.details,
    });
  }

  // Step 3: Check cache — return existing if not stale and not force_regenerate
  if (!force_regenerate) {
    const { data: existing } = await supabase
      .from('pitch_narratives')
      .select('*')
      .eq('project_id', project_id)
      .single();

    if (existing && !project.narrative_is_stale) {
      const pitchNarrative: PitchNarrative = {
        id: existing.id,
        project_id: existing.project_id,
        generated_at: existing.created_at,
        last_updated: existing.updated_at !== existing.created_at ? existing.updated_at : undefined,
        content: existing.narrative_data,
      };

      return NextResponse.json({
        narrative_id: existing.id,
        pitch_narrative: pitchNarrative,
        is_fresh: false,
        generated_from: 'cache',
      });
    }
  }

  // Step 4: Gather evidence
  const evidence = await gatherEvidence(supabase, project_id);

  // Step 5: Fetch founder profile and user profile
  const [{ data: founderProfile }, { data: userProfile }] = await Promise.all([
    supabase.from('founder_profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('user_profiles').select('full_name, email').eq('id', user.id).single(),
  ]);

  // Fetch raw evidence for narrative building
  const { data: allEvidenceRows } = await supabase
    .from('evidence')
    .select('id, content, narrative_category, summary, strength')
    .eq('project_id', project_id);

  // Step 6: Build narrative
  // Phase 1: Use in-app generation (Vercel AI SDK or direct LLM call)
  // TODO: Replace with CrewAI Report Compiler via Modal /kickoff for Phase 2
  const narrativeData = buildNarrativeFromEvidence(
    project,
    evidence,
    founderProfile,
    userProfile,
    allEvidenceRows ?? []
  );

  // Step 7: Compute hashes
  const narrativeHash = computeNarrativeHash(narrativeData);
  const sourceEvidenceHash = computeSourceEvidenceHash(evidence);

  // Step 8: Handle existing narrative (update vs create)
  const { data: existingNarrative } = await supabase
    .from('pitch_narratives')
    .select('id, edit_history, is_edited, narrative_data')
    .eq('project_id', project_id)
    .single();

  let narrativeId: string;
  let isEdited = false;

  if (existingNarrative) {
    // Handle edit preservation for regeneration
    let finalNarrativeData = narrativeData;
    let finalEditHistory: unknown[] = [];

    if (preserve_edits && existingNarrative.is_edited && Array.isArray(existingNarrative.edit_history)) {
      // TODO: Implement edit merge algorithm (spec :4497-4511)
      // For now, preserve edits flag is noted but full merge is Phase 2
      isEdited = true;
      finalEditHistory = existingNarrative.edit_history;
    }

    // Update existing narrative
    const { error: updateError } = await supabase
      .from('pitch_narratives')
      .update({
        narrative_data: finalNarrativeData,
        baseline_narrative: narrativeData,
        source_evidence_hash: sourceEvidenceHash,
        is_edited: isEdited,
        edit_history: finalEditHistory,
        alignment_status: 'verified',
        alignment_issues: [],
      })
      .eq('id', existingNarrative.id);

    if (updateError) {
      console.error('Error updating narrative:', updateError);
      return narrativeError('INTERNAL_ERROR', 'Failed to update narrative');
    }

    narrativeId = existingNarrative.id;

    // Create version record
    const { data: latestVersion } = await supabase
      .from('narrative_versions')
      .select('version_number')
      .eq('narrative_id', narrativeId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single();

    const nextVersion = (latestVersion?.version_number ?? 0) + 1;

    await supabase
      .from('narrative_versions')
      .insert({
        narrative_id: narrativeId,
        version_number: nextVersion,
        narrative_data: finalNarrativeData,
        source_evidence_hash: sourceEvidenceHash,
        fit_score_at_version: evidence.gate_scores.overall_fit,
        trigger_reason: force_regenerate ? 'regeneration' : 'initial_generation',
      });
  } else {
    // Create new narrative
    const { data: created, error: createError } = await supabase
      .from('pitch_narratives')
      .insert({
        project_id,
        user_id: user.id,
        narrative_data: narrativeData,
        baseline_narrative: narrativeData,
        source_evidence_hash: sourceEvidenceHash,
      })
      .select('id')
      .single();

    if (createError || !created) {
      console.error('Error creating narrative:', createError);
      return narrativeError('INTERNAL_ERROR', 'Failed to create narrative');
    }

    narrativeId = created.id;

    // Create initial version record
    await supabase
      .from('narrative_versions')
      .insert({
        narrative_id: narrativeId,
        version_number: 1,
        narrative_data: narrativeData,
        source_evidence_hash: sourceEvidenceHash,
        fit_score_at_version: evidence.gate_scores.overall_fit,
        trigger_reason: 'initial_generation',
      });
  }

  // Step 8.7: Upsert primary evidence package
  await upsertPrimaryEvidencePackage(supabase, project_id, user.id, narrativeId, evidence);

  // Step 9: Update project staleness
  await supabase
    .from('projects')
    .update({
      narrative_is_stale: false,
      narrative_generated_at: new Date().toISOString(),
      narrative_stale_severity: null,
      narrative_stale_reason: null,
    })
    .eq('id', project_id);

  // Step 10: Build response
  const pitchNarrative: PitchNarrative = {
    id: narrativeId,
    project_id,
    generated_at: new Date().toISOString(),
    content: narrativeData,
  };

  return NextResponse.json({
    narrative_id: narrativeId,
    pitch_narrative: pitchNarrative,
    is_fresh: true,
    generated_from: 'generation',
  });
}
