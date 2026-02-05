/**
 * Evidence Package Assembly
 *
 * Assembles evidence data from project evidence/hypotheses/VPC for packaging.
 * Computes integrity hash and manages package CRUD.
 *
 * @story US-NL01
 * @see docs/specs/narrative-layer-spec.md :2186-2215
 */

import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { computeIntegrityHash } from './hash';
import type {
  EvidencePackage,
  ValidationEvidence,
  EvidenceIntegrity,
  GateScores,
  HITLRecord,
} from './types';

/**
 * Assemble validation evidence from project data.
 * Gathers VPC, customer profile, competitor map, BMC, experiments, gate scores, HITL.
 */
export async function assembleValidationEvidence(
  projectId: string
): Promise<ValidationEvidence> {
  const supabase = createAdminClient();

  // Fetch VPC data
  const { data: vpcData } = await supabase
    .from('value_proposition_canvas')
    .select('*')
    .eq('project_id', projectId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  // Fetch CrewAI validation state (contains customer_profile, competitor_map, bmc, gate_scores)
  const { data: validationState } = await supabase
    .from('crewai_validation_states')
    .select('*')
    .eq('project_id', projectId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  // Fetch experiment results from evidence table
  const { data: experiments } = await supabase
    .from('evidence')
    .select('*')
    .eq('project_id', projectId)
    .eq('evidence_category', 'experiment')
    .order('created_at', { ascending: false });

  // Fetch HITL records from approval history
  const { data: approvalHistory } = await supabase
    .from('approval_requests')
    .select('*')
    .eq('entity_type', 'project')
    .eq('entity_id', projectId)
    .order('created_at', { ascending: false });

  // Build VPC
  const vpc = {
    customer_segment: vpcData?.customer_segment || '',
    customer_jobs: (vpcData?.customer_jobs as string[]) || [],
    pains: (vpcData?.pains as { description: string; severity: number }[]) || [],
    gains: (vpcData?.gains as { description: string; importance: number }[]) || [],
    pain_relievers: (vpcData?.pain_relievers as string[]) || [],
    gain_creators: (vpcData?.gain_creators as string[]) || [],
    products_services: (vpcData?.products_services as string[]) || [],
    fit_assessment: (vpcData?.fit_assessment as string) || '',
  };

  // Build customer profile from validation state
  const customerProfile = validationState?.customer_profiles || {
    segment_name: '',
    jobs_to_be_done: [],
    pains: [],
    gains: [],
    behavioral_insights: [],
  };

  // Build competitor map from validation state
  const competitorMap = validationState?.competitor_map || {
    competitors: [],
    positioning_statement: '',
    differentiation_axes: [],
  };

  // Build BMC from validation state
  const bmc = validationState?.bmc || {
    key_partners: [],
    key_activities: [],
    key_resources: [],
    value_propositions: [],
    customer_relationships: [],
    channels: [],
    customer_segments: [],
    cost_structure: [],
    revenue_streams: [],
  };

  // Build experiment results
  const experimentResults = (experiments || []).map(e => ({
    experiment_id: e.id,
    hypothesis_id: e.hypothesis_id || '',
    experiment_type: (e.evidence_type || 'interview') as 'landing_page' | 'concierge' | 'wizard_of_oz' | 'prototype' | 'interview' | 'survey',
    start_date: e.created_at || new Date().toISOString(),
    end_date: e.updated_at || new Date().toISOString(),
    sample_size: 1,
    success_criteria: '',
    actual_result: e.content || '',
    outcome: 'inconclusive' as const,
    learnings: [],
    evidence_category: (e.narrative_category || 'SAY') as 'DO-direct' | 'DO-indirect' | 'SAY',
  }));

  // Build gate scores from validation state
  const gateScores: GateScores = validationState?.gate_scores || {
    desirability: 0,
    feasibility: 0,
    viability: 0,
    overall_fit: 0,
    current_gate: 'desirability',
  };

  // Build HITL record
  const hitlRecord: HITLRecord = {
    checkpoints: (approvalHistory || []).map(a => ({
      checkpoint_id: a.id,
      checkpoint_type: a.checkpoint_type || 'general',
      triggered_at: a.created_at,
      responded_at: a.responded_at || undefined,
      response_summary: a.response_summary || undefined,
      approval_status: a.status as 'pending' | 'approved' | 'rejected' | 'revised',
    })),
    coachability_score: 0,
    total_checkpoints: (approvalHistory || []).length,
    completed_checkpoints: (approvalHistory || []).filter(a => a.status !== 'pending').length,
  };

  return {
    vpc,
    customer_profile: customerProfile,
    competitor_map: competitorMap,
    bmc,
    experiment_results: experimentResults,
    gate_scores: gateScores,
    hitl_record: hitlRecord,
  };
}

/**
 * Build integrity metadata section for evidence package.
 */
export async function buildIntegrityMetadata(
  projectId: string
): Promise<Omit<EvidenceIntegrity, 'evidence_hash'>> {
  const supabase = createAdminClient();

  // Get last HITL checkpoint
  const { data: lastCheckpoint } = await supabase
    .from('approval_requests')
    .select('created_at')
    .eq('entity_type', 'project')
    .eq('entity_id', projectId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return {
    methodology_version: 'VPD-1.0',
    agent_versions: [
      { agent_name: 'Report Compiler', version: '1.0', run_timestamp: new Date().toISOString() },
      { agent_name: 'Guardian', version: '1.0', run_timestamp: new Date().toISOString() },
    ],
    last_hitl_checkpoint: lastCheckpoint?.created_at || new Date().toISOString(),
    fit_score_algorithm: 'weighted-average-v1',
  };
}

/**
 * Create or update a primary evidence package for a project.
 * Called as side effect of narrative generation (step 8.7).
 */
export async function upsertPrimaryEvidencePackage(
  projectId: string,
  founderId: string,
  narrativeId: string
): Promise<{ packageId: string; integrityHash: string }> {
  const supabase = createAdminClient();

  // Assemble evidence
  const evidence = await assembleValidationEvidence(projectId);
  const integrity = await buildIntegrityMetadata(projectId);
  const integrityHash = computeIntegrityHash(evidence, integrity);

  // Check for existing primary package
  const { data: existing } = await supabase
    .from('evidence_packages')
    .select('id')
    .eq('project_id', projectId)
    .eq('is_primary', true)
    .single();

  if (existing) {
    // Update existing
    const { error } = await supabase
      .from('evidence_packages')
      .update({
        evidence_data: {
          validation_evidence: evidence,
          integrity: { ...integrity, evidence_hash: integrityHash },
        },
        integrity_hash: integrityHash,
        pitch_narrative_id: narrativeId,
      })
      .eq('id', existing.id);

    if (error) throw error;
    return { packageId: existing.id, integrityHash };
  }

  // Create new primary package
  const { data: newPkg, error } = await supabase
    .from('evidence_packages')
    .insert({
      project_id: projectId,
      founder_id: founderId,
      pitch_narrative_id: narrativeId,
      evidence_data: {
        validation_evidence: evidence,
        integrity: { ...integrity, evidence_hash: integrityHash },
      },
      integrity_hash: integrityHash,
      is_primary: true,
      is_public: false,
      founder_consent: false,
    })
    .select('id')
    .single();

  if (error) throw error;
  return { packageId: newPkg!.id, integrityHash };
}
