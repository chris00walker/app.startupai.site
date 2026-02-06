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
import { computeSourceEvidenceHash } from '@/lib/narrative/hash';
import { trackNarrativeFunnelEvent } from '@/lib/narrative/access-tracking';
import { getFounderEditedSlides, getSlideEdits } from '@/lib/narrative/edit';
import {
  applyGuardianCorrections,
  guardianCheckGeneration,
  guardianCheckRegeneration,
} from '@/lib/narrative/guardian';
import type { PitchNarrative, PitchNarrativeContent, EditHistoryEntry, SlideKey } from '@/lib/narrative/types';

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
      .select('id, project_id, narrative_data, agent_run_id, created_at, updated_at')
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

      // Distinguish CrewAI-generated narratives from in-app ones
      const generatedFrom = existing.agent_run_id ? 'crewai_cache' : 'cache';

      return NextResponse.json({
        narrative_id: existing.id,
        pitch_narrative: pitchNarrative,
        is_fresh: false,
        generated_from: generatedFrom,
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

  // Fetch raw evidence and invalidated hypotheses count
  const [{ data: allEvidenceRows }, { count: pivotCount }] = await Promise.all([
    supabase
      .from('evidence')
      .select('id, content, narrative_category, summary, strength')
      .eq('project_id', project_id),
    supabase
      .from('hypotheses')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', project_id)
      .eq('status', 'invalidated'),
  ]);

  // Step 6: Build narrative
  // Phase 1: In-app evidence-to-narrative mapping
  // Phase 2+: CrewAI NarrativeSynthesisCrew delivers AI-quality narratives via webhook
  // (flow_type: 'narrative_synthesis' → stored by webhook handler → returned from cache above)
  const narrativeData = buildNarrativeFromEvidence(
    project,
    evidence,
    founderProfile,
    userProfile,
    allEvidenceRows ?? [],
    pivotCount ?? 0
  );

  // Step 7: Compute hashes
  const sourceEvidenceHash = computeSourceEvidenceHash(evidence);

  // Step 8: Handle existing narrative (update vs create)
  const { data: existingNarrative } = await supabase
    .from('pitch_narratives')
    .select('id, edit_history, is_edited, narrative_data')
    .eq('project_id', project_id)
    .single();

  let narrativeId: string;
  let isEdited = false;
  let finalNarrativeData: PitchNarrativeContent = narrativeData;
  let alignmentStatus: 'verified' | 'flagged' = 'verified';
  let alignmentIssues: unknown[] = [];

  if (existingNarrative) {
    // Handle edit preservation for regeneration
    let finalEditHistory: unknown[] = [];
    let founderEditsMerged = false;

    if (preserve_edits && existingNarrative.is_edited && Array.isArray(existingNarrative.edit_history)) {
      // Edit merge algorithm (spec :4497-4511)
      // Deep-merge founder edits onto new AI-generated content so manual
      // refinements survive regeneration.
      const editHistory = existingNarrative.edit_history as EditHistoryEntry[];
      const editedSlides = getFounderEditedSlides(editHistory);

      if (editedSlides.size > 0) {
        // Deep clone so we don't mutate the original narrativeData
        finalNarrativeData = JSON.parse(JSON.stringify(narrativeData)) as PitchNarrativeContent;

        for (const slideKey of editedSlides) {
          // Only merge if the slide exists in the new narrative
          if (!(slideKey in finalNarrativeData)) continue;

          const slideEdits = getSlideEdits(editHistory, slideKey);

          for (const [fieldPath, newValue] of slideEdits) {
            // fieldPath is the full dot-notation path stored in edit_history
            // (e.g. "traction.evidence_summary"). Navigate into the cloned
            // narrative and overwrite the AI value with the founder value.
            const parts = fieldPath.split('.');
            let current: Record<string, unknown> = finalNarrativeData as unknown as Record<string, unknown>;
            const parentPath = parts.slice(0, -1);
            const lastKey = parts[parts.length - 1];

            let pathValid = true;
            for (const key of parentPath) {
              if (current[key] === undefined || current[key] === null) {
                // Parent path doesn't exist in new content; skip this edit
                pathValid = false;
                break;
              }
              current = current[key] as Record<string, unknown>;
            }

            if (pathValid) {
              current[lastKey] = newValue;
            }
          }
        }

        // Preserve only founder edit_history entries
        finalEditHistory = editHistory.filter(
          (entry) => entry.edit_source === 'founder'
        );
        isEdited = true;
        founderEditsMerged = true;
      }
    }

    // Guardian re-validation for regeneration, auto-correction for generation.
    if (force_regenerate) {
      const check = guardianCheckRegeneration(finalNarrativeData);
      alignmentStatus = check.status;
      alignmentIssues = check.issues;
    } else {
      const check = guardianCheckGeneration(finalNarrativeData);
      if (check.auto_corrections?.length) {
        finalNarrativeData = applyGuardianCorrections(finalNarrativeData, check.auto_corrections);
      }
      alignmentStatus = check.status;
      alignmentIssues = check.issues;
    }

    // Update existing narrative
    const { error: updateError } = await supabase
      .from('pitch_narratives')
      .update({
        narrative_data: finalNarrativeData,
        baseline_narrative: founderEditsMerged ? narrativeData : finalNarrativeData,
        source_evidence_hash: sourceEvidenceHash,
        is_edited: isEdited,
        edit_history: finalEditHistory,
        alignment_status: alignmentStatus,
        alignment_issues: alignmentIssues,
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
    // Initial generation: run Guardian auto-correction before first insert.
    const check = guardianCheckGeneration(finalNarrativeData);
    if (check.auto_corrections?.length) {
      finalNarrativeData = applyGuardianCorrections(finalNarrativeData, check.auto_corrections);
    }
    alignmentStatus = check.status;
    alignmentIssues = check.issues;

    // Create new narrative
    const { data: created, error: createError } = await supabase
      .from('pitch_narratives')
      .insert({
        project_id,
        user_id: user.id,
        narrative_data: finalNarrativeData,
        baseline_narrative: finalNarrativeData,
        source_evidence_hash: sourceEvidenceHash,
        alignment_status: alignmentStatus,
        alignment_issues: alignmentIssues,
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
        narrative_data: finalNarrativeData,
        source_evidence_hash: sourceEvidenceHash,
        fit_score_at_version: evidence.gate_scores.overall_fit,
        trigger_reason: 'initial_generation',
      });
  }

  // Step 8.7: Upsert primary evidence package
  const packageResult = await upsertPrimaryEvidencePackage(project_id, user.id, narrativeId, evidence);
  if (!packageResult) {
    return narrativeError('INTERNAL_ERROR', 'Failed to create evidence package for narrative export');
  }

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

  // Track funnel event (fire-and-forget)
  trackNarrativeFunnelEvent(project_id, user.id, force_regenerate ? 'narrative_regenerated' : 'narrative_generated', {
    narrative_id: narrativeId,
    preserve_edits,
  }).catch(() => {});

  // Step 10: Build response
  const pitchNarrative: PitchNarrative = {
    id: narrativeId,
    project_id,
    generated_at: new Date().toISOString(),
    content: finalNarrativeData,
  };

  return NextResponse.json({
    narrative_id: narrativeId,
    pitch_narrative: pitchNarrative,
    is_fresh: true,
    generated_from: 'generation',
  });
}
