/**
 * Narrative Generation Service
 *
 * Handles evidence gathering, prerequisite checks, CrewAI integration,
 * and narrative storage. Core business logic for POST /api/narrative/generate.
 *
 * CrewAI-to-PNC field mapping (per spec :73-84):
 * | PNC Slide       | CrewAI Source                    | DB Tables Queried                           |
 * |-----------------|--------------------------------|---------------------------------------------|
 * | Cover, Overview | Sage synthesis + founder input | projects, founder_profiles                  |
 * | Problem         | Pulse customer profile         | crewai_validation_states, VPC pains         |
 * | Solution        | VPC pain relievers + gain creators | value_proposition_canvas                  |
 * | Traction        | Validation Agent DO-evidence   | evidence (narrative_category), hypotheses   |
 * | Customer/Market | Pulse market sensing           | crewai_validation_states, evidence          |
 * | Opportunity     | Pulse market data              | crewai_validation_states (market data)      |
 * | Competition     | Competitor Analyst             | crewai_validation_states (competitor_map)   |
 * | Business Model  | Ledger viability               | crewai_validation_states (bmc), evidence    |
 * | Team            | Founder input (scaffolded)     | founder_profiles                            |
 * | Use of Funds    | 3-tier validation roadmap      | hypotheses, evidence (costed experiments)   |
 *
 * @story US-NL01
 * @see docs/specs/narrative-layer-spec.md :996-1097
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { PitchNarrativeContent, ValidationEvidence } from './types';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { computeIntegrityHash } from './hash';

/**
 * Prerequisite check result
 */
export interface PrerequisiteResult {
  passed: boolean;
  missing: string[];
  details: Record<string, { exists: boolean; message: string }>;
}

/**
 * Check minimum evidence gate prerequisites for narrative generation.
 * Per spec :996-1076, checks: project, hypothesis, customer profile, VPC.
 */
export async function checkPrerequisites(
  supabase: SupabaseClient,
  projectId: string,
  userId: string
): Promise<PrerequisiteResult> {
  const details: Record<string, { exists: boolean; message: string }> = {};
  const missing: string[] = [];

  // 1. Project exists with company_name (name) and industry (hints.industry or rawIdea)
  const { data: project } = await supabase
    .from('projects')
    .select('id, name, hints, raw_idea')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single();

  if (!project?.name) {
    missing.push('project');
    details.project = { exists: false, message: 'Project with company name required' };
  } else {
    details.project = { exists: true, message: 'Project found' };
  }

  // 2. At least one hypothesis
  const { count: hypothesesCount } = await supabase
    .from('hypotheses')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', projectId);

  if (!hypothesesCount || hypothesesCount === 0) {
    missing.push('hypothesis');
    details.hypothesis = { exists: false, message: 'At least one hypothesis required' };
  } else {
    details.hypothesis = { exists: true, message: `${hypothesesCount} hypotheses found` };
  }

  // 3. Customer profile exists in crewai_validation_states JSONB
  const { data: validationState } = await supabase
    .from('crewai_validation_states')
    .select('customer_profiles')
    .eq('project_id', projectId)
    .single();

  if (!validationState?.customer_profiles || Object.keys(validationState.customer_profiles).length === 0) {
    missing.push('customer_profile');
    details.customer_profile = { exists: false, message: 'Customer profile not yet generated' };
  } else {
    details.customer_profile = { exists: true, message: 'Customer profile found' };
  }

  // 4. VPC populated
  const { count: vpcCount } = await supabase
    .from('value_proposition_canvas')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', projectId);

  if (!vpcCount || vpcCount === 0) {
    missing.push('vpc');
    details.vpc = { exists: false, message: 'Value Proposition Canvas not yet populated' };
  } else {
    details.vpc = { exists: true, message: 'VPC found' };
  }

  return {
    passed: missing.length === 0,
    missing,
    details,
  };
}

/**
 * Gather all evidence data for a project to build the narrative.
 */
export async function gatherEvidence(
  supabase: SupabaseClient,
  projectId: string
): Promise<ValidationEvidence> {
  // Fetch all data sources in parallel
  const [
    { data: evidenceRows },
    { data: hypotheses },
    { data: vpcRows },
    { data: validationState },
    { data: approvalHistory },
  ] = await Promise.all([
    supabase
      .from('evidence')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false }),
    supabase
      .from('hypotheses')
      .select('*')
      .eq('project_id', projectId),
    supabase
      .from('value_proposition_canvas')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1),
    supabase
      .from('crewai_validation_states')
      .select('*')
      .eq('project_id', projectId)
      .single(),
    supabase
      .from('approval_history')
      .select('*, approval_requests!inner(project_id)')
      .order('created_at', { ascending: false }),
  ]);

  const vpc = vpcRows?.[0];
  const evidence = evidenceRows ?? [];

  // Build VPC data
  const vpcData = {
    customer_segment: vpc?.segment_name ?? '',
    customer_jobs: (vpc?.jobs as { job?: string; description?: string }[] ?? []).map((j) => j.job ?? j.description ?? ''),
    pains: (vpc?.pains as { pain?: string; description?: string; severity?: number }[] ?? []).map((p) => ({
      description: p.pain ?? p.description ?? '',
      severity: p.severity ?? 0,
    })),
    gains: (vpc?.gains as { gain?: string; description?: string; importance?: number }[] ?? []).map((g) => ({
      description: g.gain ?? g.description ?? '',
      importance: g.importance ?? 0,
    })),
    pain_relievers: (vpc?.pain_relievers as { description?: string }[] ?? []).map((pr) =>
      typeof pr === 'string' ? pr : pr.description ?? ''
    ),
    gain_creators: (vpc?.gain_creators as { description?: string }[] ?? []).map((gc) =>
      typeof gc === 'string' ? gc : gc.description ?? ''
    ),
    products_services: (vpc?.products_and_services as { description?: string }[] ?? []).map((ps) =>
      typeof ps === 'string' ? ps : ps.description ?? ''
    ),
    fit_assessment: '',
  };

  // Build customer profile from crewai_validation_states
  const customerProfiles = validationState?.customer_profiles as Record<string, unknown> ?? {};
  const firstProfile = Object.values(customerProfiles)[0] as Record<string, unknown> | undefined;

  const customerProfile = {
    segment_name: (firstProfile?.segment_name as string) ?? '',
    jobs_to_be_done: ((firstProfile?.jobs_to_be_done as { job: string; importance: number; frequency: string }[]) ?? []),
    pains: ((firstProfile?.pains as { pain: string; severity: number; current_solution: string }[]) ?? []),
    gains: ((firstProfile?.gains as { gain: string; relevance: number }[]) ?? []),
    demographics: (firstProfile?.demographics as Record<string, string>) ?? {},
    behavioral_insights: ((firstProfile?.behavioral_insights as string[]) ?? []),
  };

  // Build competitor map from crewai_validation_states
  const competitorData = validationState?.competitor_map as Record<string, unknown> ?? {};
  const competitorMap = {
    competitors: ((competitorData.competitors as { name: string; category: 'direct' | 'indirect' | 'substitute'; strengths: string[]; weaknesses: string[]; market_share_estimate?: number }[]) ?? []),
    positioning_statement: (competitorData.positioning_statement as string) ?? '',
    differentiation_axes: ((competitorData.differentiation_axes as { axis: string; our_position: string; competitor_positions: Record<string, string> }[]) ?? []),
  };

  // Build BMC from crewai_validation_states
  const bmcData = validationState?.bmc as Record<string, unknown> ?? {};
  const bmc = {
    key_partners: (bmcData.key_partners as string[]) ?? [],
    key_activities: (bmcData.key_activities as string[]) ?? [],
    key_resources: (bmcData.key_resources as string[]) ?? [],
    value_propositions: (bmcData.value_propositions as string[]) ?? [],
    customer_relationships: (bmcData.customer_relationships as string[]) ?? [],
    channels: (bmcData.channels as string[]) ?? [],
    customer_segments: (bmcData.customer_segments as string[]) ?? [],
    cost_structure: (bmcData.cost_structure as { item: string; type: 'fixed' | 'variable'; amount?: number }[]) ?? [],
    revenue_streams: (bmcData.revenue_streams as { stream: string; type: string; pricing_model: string }[]) ?? [],
  };

  // Build experiment results from evidence
  const experimentResults = evidence
    .filter((e) => e.source_type === 'experiment' || e.evidence_category === 'Experiment')
    .map((e) => ({
      experiment_id: e.id,
      hypothesis_id: (e.linked_assumptions?.[0] ?? ''),
      experiment_type: 'interview' as const,
      start_date: e.created_at,
      end_date: e.updated_at ?? e.created_at,
      sample_size: 1,
      success_criteria: '',
      actual_result: e.summary ?? e.content,
      outcome: 'inconclusive' as const,
      learnings: [],
      evidence_category: (e.narrative_category ?? 'SAY') as 'DO-direct' | 'DO-indirect' | 'SAY',
    }));

  // Build gate scores
  const gateScores = {
    desirability: Number(validationState?.desirability_signal === 'strong' ? 0.8 : validationState?.desirability_signal === 'moderate' ? 0.5 : 0.2) || 0,
    feasibility: Number(validationState?.feasibility_signal === 'strong' ? 0.8 : validationState?.feasibility_signal === 'moderate' ? 0.5 : 0.2) || 0,
    viability: Number(validationState?.viability_signal === 'strong' ? 0.8 : validationState?.viability_signal === 'moderate' ? 0.5 : 0.2) || 0,
    overall_fit: 0,
    current_gate: (validationState?.current_risk_axis as 'desirability' | 'feasibility' | 'viability') ?? 'desirability',
    gate_passed_at: {},
  };
  gateScores.overall_fit = (gateScores.desirability + gateScores.feasibility + gateScores.viability) / 3;

  // Build HITL record from approval history
  const relevantApprovals = (approvalHistory ?? []).filter(
    (ah) => (ah.approval_requests as { project_id?: string } | null)?.project_id === projectId
  );
  const hitlRecord = {
    checkpoints: relevantApprovals.map((ah) => ({
      checkpoint_id: ah.id,
      checkpoint_type: ah.approval_action ?? 'unknown',
      triggered_at: ah.created_at,
      responded_at: ah.created_at,
      response_summary: undefined,
      approval_status: 'approved' as const,
    })),
    coachability_score: 0.5,
    total_checkpoints: relevantApprovals.length,
    completed_checkpoints: relevantApprovals.filter((a) => a.approval_action === 'approved').length,
  };

  return {
    vpc: vpcData,
    customer_profile: customerProfile,
    competitor_map: competitorMap,
    bmc,
    experiment_results: experimentResults,
    gate_scores: gateScores,
    hitl_record: hitlRecord,
  };
}

/**
 * Build a placeholder PitchNarrativeContent from gathered evidence.
 * This is used when CrewAI is not available (Phase 1 fallback).
 */
export function buildNarrativeFromEvidence(
  project: { id: string; name: string; description?: string | null; hints?: { industry?: string } | null; raw_idea?: string | null; validation_stage?: string | null },
  evidence: ValidationEvidence,
  founderProfile: { professional_summary?: string | null; domain_expertise?: string[] | null; linkedin_url?: string | null; company_website?: string | null; previous_ventures?: unknown; years_experience?: number | null } | null,
  userProfile: { full_name?: string | null; email?: string | null } | null,
  allEvidence: { id: string; content: string; narrative_category?: string | null; summary?: string | null; strength?: string | null }[],
  pivotCount: number = 0
): PitchNarrativeContent {
  const founderName = userProfile?.full_name ?? 'Founder';
  const email = userProfile?.email ?? '';
  const industry = project.hints?.industry ?? 'technology';
  const ventureName = project.name;
  const rawIdea = project.raw_idea ?? project.description ?? '';

  // Classify evidence by narrative_category
  const doDirectEvidence = allEvidence.filter((e) => e.narrative_category === 'DO-direct');
  const doIndirectEvidence = allEvidence.filter((e) => e.narrative_category === 'DO-indirect');
  const sayEvidence = allEvidence.filter((e) => e.narrative_category === 'SAY' || !e.narrative_category);

  // Determine strongest evidence type
  const evidenceStrength: 'DO-direct' | 'DO-indirect' | 'SAY' =
    doDirectEvidence.length > 0 ? 'DO-direct' :
    doIndirectEvidence.length > 0 ? 'DO-indirect' : 'SAY';

  // Pivot count passed from caller (queried from hypotheses table)

  return {
    version: '1.0',

    cover: {
      venture_name: ventureName,
      tagline: rawIdea.length > 80 ? rawIdea.substring(0, 77) + '...' : rawIdea || `${ventureName} — transforming ${industry}`,
      document_type: 'Investor Briefing',
      presentation_date: new Date().toISOString().split('T')[0],
      contact: {
        founder_name: founderName,
        email,
        linkedin_url: founderProfile?.linkedin_url ?? undefined,
        website_url: founderProfile?.company_website ?? undefined,
      },
    },

    overview: {
      thesis: `${ventureName} addresses a critical gap in ${industry} by leveraging validated customer insights.`,
      one_liner: rawIdea || `We solve key problems for ${industry} customers`,
      industry,
      novel_insight: `Based on ${allEvidence.length} pieces of validation evidence, we have identified an underserved market opportunity.`,
      key_metrics: doDirectEvidence.slice(0, 3).map((e) => ({
        label: e.summary ?? 'Evidence',
        value: e.content.substring(0, 50),
        evidence_type: 'DO-direct' as const,
      })),
    },

    opportunity: {
      tam: { value: 0, unit: 'USD', timeframe: 'annual', source: 'To be validated', confidence: 'estimated' },
      sam: { value: 0, unit: 'USD', timeframe: 'annual', source: 'To be validated', confidence: 'estimated' },
      som: { value: 0, unit: 'USD', timeframe: 'annual', source: 'To be validated', confidence: 'estimated' },
      growth_trajectory: 'Market analysis pending further validation.',
      why_now: 'Based on current market conditions and validation evidence.',
      market_tailwinds: [],
    },

    problem: {
      primary_pain: evidence.vpc.pains[0]?.description ?? 'Key customer pain to be validated',
      pain_narrative: `Customers in ${industry} face significant challenges that current solutions fail to address adequately.`,
      affected_population: evidence.customer_profile.segment_name || 'Target customer segment',
      why_exists: 'Current solutions are insufficient or nonexistent.',
      status_quo: 'Customers currently cope with workarounds and suboptimal alternatives.',
      severity_score: evidence.gate_scores.desirability,
      evidence_quotes: sayEvidence.slice(0, 3).map((e) => e.content.substring(0, 200)),
    },

    solution: {
      value_proposition: evidence.vpc.fit_assessment || `${ventureName} provides a solution that directly addresses validated customer pains.`,
      how_it_works: rawIdea || 'Solution details to be refined.',
      key_differentiator: evidence.competitor_map.positioning_statement || 'Unique positioning based on validation insights.',
      use_cases: evidence.vpc.pain_relievers.slice(0, 3),
      fit_score: evidence.gate_scores.desirability,
    },

    traction: {
      evidence_summary: `${allEvidence.length} pieces of evidence collected: ${doDirectEvidence.length} DO-direct, ${doIndirectEvidence.length} DO-indirect, ${sayEvidence.length} SAY.`,
      growth_metrics: [],
      assumptions_validated: [],
      do_direct: doDirectEvidence.map((e) => ({
        type: 'DO-direct' as const,
        description: e.summary ?? e.content.substring(0, 100),
        source: 'Validation evidence',
        weight: 1.0,
      })),
      do_indirect: doIndirectEvidence.map((e) => ({
        type: 'DO-indirect' as const,
        description: e.summary ?? e.content.substring(0, 100),
        source: 'Validation evidence',
        weight: 0.8,
      })),
      say_evidence: sayEvidence.map((e) => ({
        type: 'SAY' as const,
        description: e.summary ?? e.content.substring(0, 100),
        source: 'Validation evidence',
        weight: 0.3,
      })),
      interview_count: sayEvidence.length,
      experiment_count: evidence.experiment_results.length,
      hitl_completion_rate: evidence.hitl_record.total_checkpoints > 0
        ? evidence.hitl_record.completed_checkpoints / evidence.hitl_record.total_checkpoints
        : 0,
      display_config: {
        evidence_order: ['do_direct', 'do_indirect', 'say_evidence'],
        show_weights: true,
        visual_emphasis: {
          do_direct: 'primary',
          do_indirect: 'secondary',
          say_evidence: 'tertiary',
        },
      },
    },

    customer: {
      segments: [{
        name: evidence.customer_profile.segment_name || 'Primary segment',
        description: '',
        size_estimate: 0,
        priority: 'primary',
        jobs_to_be_done: evidence.customer_profile.jobs_to_be_done.map((j) => j.job),
        key_pains: evidence.customer_profile.pains.map((p) => p.pain),
      }],
      persona_summary: evidence.customer_profile.segment_name || 'Customer persona to be refined.',
      demographics: {
        location: evidence.customer_profile.demographics?.location ?? '',
        behaviors: evidence.customer_profile.demographics?.behaviors ?? '',
      },
      willingness_to_pay: 'To be validated',
      market_size: 0,
      target_percentage: 0,
      target_first: evidence.customer_profile.segment_name || 'Primary segment',
      acquisition_channel: 'To be determined',
      behavioral_insights: evidence.customer_profile.behavioral_insights,
      segment_prioritization: 'Based on validation evidence priority.',
    },

    competition: {
      landscape_summary: evidence.competitor_map.positioning_statement || 'Competitive landscape analysis pending.',
      primary_competitors: evidence.competitor_map.competitors
        .filter((c) => c.category === 'direct')
        .map((c) => ({
          name: c.name,
          how_they_compete: '',
          strengths: c.strengths,
          weaknesses: c.weaknesses,
        })),
      secondary_competitors: evidence.competitor_map.competitors
        .filter((c) => c.category !== 'direct')
        .map((c) => ({
          name: c.name,
          how_they_compete: '',
        })),
      differentiators: evidence.competitor_map.differentiation_axes.map((d) => d.our_position),
      unfair_advantage: 'Based on validated evidence and founder expertise.',
      incumbent_defense: 'To be articulated based on further validation.',
    },

    business_model: {
      revenue_model: 'Revenue model to be validated.',
      cac: 0,
      ltv: 0,
      ltv_cac_ratio: 0,
      unit_economics: {
        cost_per_unit: 0,
        revenue_per_unit: 0,
        margin_per_unit: 0,
        breakdown: [],
      },
      pricing_strategy: 'Pricing strategy to be validated.',
      market_context: '',
    },

    team: {
      members: [{
        name: founderName,
        current_role: 'Founder',
        bio: founderProfile?.professional_summary ?? 'Founder bio to be completed.',
        prior_experience: [],
        accomplishments: [],
        domain_expertise: (founderProfile?.domain_expertise ?? []).join(', ') || industry,
        linkedin_url: founderProfile?.linkedin_url ?? undefined,
      }],
      coachability_score: evidence.hitl_record.coachability_score,
    },

    use_of_funds: {
      ask_amount: 0,
      ask_type: 'SAFE',
      allocations: [],
      milestones: [],
      timeline_weeks: 0,
    },

    metadata: {
      methodology: 'VPD',
      evidence_strength: evidenceStrength,
      overall_fit_score: evidence.gate_scores.overall_fit,
      validation_stage: project.validation_stage ?? 'DESIRABILITY',
      pivot_count: pivotCount,
    },
  };
}

/**
 * Create or update the primary evidence package for a project.
 * Called as side effect during generation (step 8.7).
 */
export async function upsertPrimaryEvidencePackage(
  projectId: string,
  userId: string,
  narrativeId: string,
  evidence: ValidationEvidence
): Promise<{ id: string; integrityHash: string } | null> {
  const adminClient = createAdminClient();

  // Defensive ownership check before service-role writes.
  const { data: ownerCheck, error: ownerError } = await adminClient
    .from('projects')
    .select('user_id')
    .eq('id', projectId)
    .single();

  if (ownerError || !ownerCheck || ownerCheck.user_id !== userId) {
    console.error('Project ownership check failed for evidence package upsert', ownerError);
    return null;
  }

  const integrityMeta = {
    methodology_version: '1.0',
    agent_versions: [],
    last_hitl_checkpoint: new Date().toISOString(),
    fit_score_algorithm: '1.0',
  };
  const integrityHash = computeIntegrityHash(evidence, integrityMeta);

  // Check if primary package exists
  const { data: existing } = await adminClient
    .from('evidence_packages')
    .select('id')
    .eq('project_id', projectId)
    .eq('is_primary', true)
    .single();

  if (existing) {
    // Update existing primary package
    const { data: updated, error } = await adminClient
      .from('evidence_packages')
      .update({
        pitch_narrative_id: narrativeId,
        evidence_data: evidence,
        integrity_hash: integrityHash,
      })
      .eq('id', existing.id)
      .select('id')
      .single();

    if (error) {
      console.error('Error updating primary evidence package:', error);
      return null;
    }
    return { id: updated.id, integrityHash };
  } else {
    // Create new primary package
    const { data: created, error } = await adminClient
      .from('evidence_packages')
      .insert({
        project_id: projectId,
        founder_id: userId,
        pitch_narrative_id: narrativeId,
        evidence_data: evidence,
        integrity_hash: integrityHash,
        is_primary: true,
        founder_consent: false,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating primary evidence package:', error);
      return null;
    }
    return { id: created.id, integrityHash };
  }
}
