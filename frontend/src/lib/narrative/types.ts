/**
 * Narrative Layer Type Definitions
 *
 * TypeScript interfaces for the Pitch Narrative system.
 * PitchNarrativeContent = stored in pitch_narratives.narrative_data JSONB (hash input)
 * PitchNarrative = API response shape assembled from table columns + PitchNarrativeContent
 *
 * @story US-NL01
 * @see docs/specs/narrative-layer-spec.md :1253-1974
 */

// --- Core Response Types ---

/**
 * API response shape for pitch narratives.
 * Assembled from pitch_narratives table columns + narrative_data JSONB.
 */
export interface PitchNarrative {
  id: string;
  project_id: string;
  generated_at: string; // ISO timestamp — maps to pitch_narratives.created_at
  last_updated?: string; // ISO timestamp — maps to pitch_narratives.updated_at (if different)
  content: PitchNarrativeContent;
}

/**
 * JSON stored in pitch_narratives.narrative_data.
 * This is the hash input for generation_hash.
 */
export interface PitchNarrativeContent {
  version: string; // Schema version

  // Cover (title card — precedes the essential ten)
  cover: {
    venture_name: string;
    tagline: string; // ≤10 words
    logo_url?: string;
    hero_image_url?: string;
    document_type: 'Investor Briefing' | 'Investor Presentation' | 'Pitch Deck';
    presentation_date: string; // ISO date
    contact: {
      founder_name: string;
      email: string;
      linkedin_url?: string;
      website_url?: string;
    };
  };

  // Slide 1: Overview
  overview: {
    thesis: string; // 3-sentence narrative arc
    one_liner: string; // "We do X for Y by Z"
    industry: string;
    novel_insight: string;
    key_metrics: MetricSnapshot[];
    ask?: {
      amount: number;
      instrument: 'SAFE' | 'equity' | 'convertible_note';
      use_summary: string;
    };
  };

  // Slide 2: Opportunity
  opportunity: {
    tam: MarketSize;
    sam: MarketSize;
    som: MarketSize;
    growth_trajectory: string;
    why_now: string;
    market_tailwinds: string[];
    market_confusion?: string;
  };

  // Slide 3: Problem
  problem: {
    primary_pain: string;
    pain_narrative: string;
    affected_population: string;
    customer_story?: {
      name: string;
      context: string;
      struggle: string;
    };
    why_exists: string;
    status_quo: string;
    severity_score: number; // 0-1
    evidence_quotes: string[];
  };

  // Slide 4: Solution
  solution: {
    value_proposition: string;
    how_it_works: string;
    key_differentiator: string;
    use_cases: string[];
    demo_assets?: {
      type: 'video' | 'screenshot' | 'prototype' | 'illustration';
      url: string;
      caption?: string;
    }[];
    ip_defensibility?: string;
    fit_score: number; // 0-1
  };

  // Slide 5: Traction
  traction: {
    evidence_summary: string;
    growth_metrics: {
      metric_name: string;
      values: { date: string; value: number }[];
      trend: 'accelerating' | 'linear' | 'flat';
    }[];
    assumptions_validated: {
      assumption: string;
      evidence: string;
      confidence: number; // 0-1
    }[];
    sales_process?: {
      attract: string;
      educate: string;
      qualify: string;
      close: string;
      service: string;
    };
    do_direct: EvidenceItem[];
    do_indirect: EvidenceItem[];
    say_evidence: EvidenceItem[];
    interview_count: number;
    experiment_count: number;
    hitl_completion_rate: number;
    display_config: {
      evidence_order: ['do_direct', 'do_indirect', 'say_evidence'];
      show_weights: boolean;
      visual_emphasis: {
        do_direct: 'primary';
        do_indirect: 'secondary';
        say_evidence: 'tertiary';
      };
    };
  };

  // Slide 6: Customer
  customer: {
    segments: CustomerSegment[];
    persona_summary: string;
    demographics: {
      location: string;
      behaviors: string;
    };
    willingness_to_pay: string;
    market_size: number;
    target_percentage: number; // 0-1
    target_first: string;
    acquisition_channel: string;
    acquisition_cost?: number;
    paying_customers?: {
      count: number;
      revenue: number;
      example_story?: string;
    };
    behavioral_insights: string[];
    segment_prioritization: string;
  };

  // Slide 7: Competition
  competition: {
    landscape_summary: string;
    primary_competitors: {
      name: string;
      how_they_compete: string;
      strengths: string[];
      weaknesses: string[];
    }[];
    secondary_competitors: {
      name: string;
      how_they_compete: string;
    }[];
    potential_threats?: string[];
    positioning_map?: {
      x_axis: string;
      y_axis: string;
      your_position: { x: number; y: number };
      competitor_positions: { name: string; x: number; y: number }[];
    };
    differentiators: string[];
    unfair_advantage: string;
    incumbent_defense: string;
  };

  // Slide 8: Business Model
  business_model: {
    revenue_model: string;
    cac: number;
    ltv: number;
    ltv_cac_ratio: number;
    unit_economics: {
      cost_per_unit: number;
      revenue_per_unit: number;
      margin_per_unit: number;
      breakdown: { category: string; amount: number }[];
    };
    pricing_strategy: string;
    market_context: string;
    // Optional founder-supplied (excluded from evidence integrity hash)
    monthly_costs?: {
      total: number;
      breakdown: { category: string; amount: number }[];
    };
    burn_rate?: number;
    gross_profit?: number;
    ebitda?: number;
    net_income?: number;
    cash_flow?: number;
    revenue_projections?: {
      period: string;
      amount: number;
    }[];
    path_to_profitability?: string;
  };

  // Slide 9: Team
  team: {
    members: {
      name: string;
      current_role: string;
      bio: string; // ≤75 words
      prior_experience: string[];
      accomplishments: string[];
      education?: string;
      domain_expertise: string;
      linkedin_url?: string;
    }[];
    advisors?: {
      name: string;
      title: string;
      relevance: string;
    }[];
    investors?: {
      name: string;
      firm?: string;
    }[];
    hiring_gaps?: string[];
    team_culture?: string;
    coachability_score: number; // From HITL checkpoint data
  };

  // Slide 10: Use of Funds
  use_of_funds: {
    ask_amount: number;
    ask_type: 'SAFE' | 'equity' | 'convertible_note' | 'other';
    allocations: {
      category: string;
      amount: number;
      percentage: number;
      validation_experiment?: string;
    }[];
    milestones: {
      description: string;
      target_date: string;
      success_criteria: string;
    }[];
    timeline_weeks: number;
    other_participants?: {
      name: string;
      amount?: number;
      confirmed: boolean;
    }[];
  };

  metadata: NarrativeMetadata;
}

// --- Supporting Types ---

export interface NarrativeMetadata {
  methodology: 'VPD';
  evidence_strength: 'SAY' | 'DO-indirect' | 'DO-direct';
  overall_fit_score: number;
  validation_stage: string;
  pivot_count: number;
  latest_pivot?: {
    original_hypothesis: string;
    invalidation_evidence: string;
    new_direction: string;
    pivot_date: string;
  };
  evidence_gaps?: {
    [slide: string]: {
      gap_type: 'missing' | 'weak' | 'stale';
      description: string;
      recommended_action: string;
      blocking_publish: boolean;
    };
  };
}

export interface EvidenceItem {
  type: 'DO-direct' | 'DO-indirect' | 'SAY';
  description: string;
  metric_value?: string;
  source: string;
  weight: number;
}

export interface MetricSnapshot {
  label: string;
  value: string;
  evidence_type: 'DO-direct' | 'DO-indirect' | 'SAY';
}

export interface MarketSize {
  value: number;
  unit: 'USD' | 'users' | 'transactions';
  timeframe: 'annual' | 'monthly';
  source: string;
  confidence: 'estimated' | 'researched' | 'verified';
  normalized_usd_annual?: number;
}

export interface CustomerSegment {
  name: string;
  description: string;
  size_estimate: number;
  priority: 'primary' | 'secondary' | 'tertiary';
  jobs_to_be_done: string[];
  key_pains: string[];
}

export interface Competitor {
  name: string;
  category: 'direct' | 'indirect' | 'substitute';
  strengths: string[];
  weaknesses: string[];
  market_position: string;
  differentiation: string;
}

export interface FounderProfileData {
  name: string;
  role: string;
  professional_summary: string; // 500 char max
  domain_expertise: string[];
  linkedin_url?: string;
  company_website?: string;
  previous_ventures?: {
    name: string;
    role: string;
    outcome: string;
    year: number;
  }[];
  years_experience?: number;
}

export interface AgentVersion {
  agent_name: string;
  version: string;
  run_timestamp: string;
}

// --- Edit & Guardian Types ---

export interface AlignmentIssue {
  field: string; // Dot-notation path e.g. "traction.evidence_summary"
  issue: string;
  severity: 'warning' | 'error';
  suggested_language?: string;
  evidence_needed?: string;
}

export interface EditHistoryEntry {
  timestamp: string; // ISO timestamp
  slide: SlideKey;
  field: string; // Dot-notation path within slide
  old_value: unknown;
  new_value: unknown;
  alignment_result?: 'verified' | 'flagged';
  edit_source: 'founder' | 'regeneration';
}

export type SlideKey =
  | 'cover'
  | 'overview'
  | 'opportunity'
  | 'problem'
  | 'solution'
  | 'traction'
  | 'customer'
  | 'competition'
  | 'business_model'
  | 'team'
  | 'use_of_funds'
  | 'metadata';

// --- Evidence Package Types ---

/**
 * API response shape for evidence packages.
 * Assembled from evidence_packages table + JOINs.
 */
export interface EvidencePackage {
  version: string;
  generated_at: string;
  project_id: string;
  founder_id: string;
  pitch_narrative: PitchNarrative;
  validation_evidence: ValidationEvidence;
  integrity: EvidenceIntegrity;
  access: EvidenceAccess;
}

export interface ValidationEvidence {
  vpc: ValuePropositionCanvasData;
  customer_profile: CustomerProfile;
  competitor_map: CompetitorMap;
  bmc: BusinessModelCanvas;
  experiment_results: ExperimentResult[];
  gate_scores: GateScores;
  hitl_record: HITLRecord;
}

export interface EvidenceIntegrity {
  evidence_hash: string;
  methodology_version: string;
  agent_versions: AgentVersion[];
  last_hitl_checkpoint: string;
  fit_score_algorithm: string;
}

export interface EvidenceAccess {
  shared_with: string[];
  shared_at?: string | null;
  connection_type?: RelationshipType | null;
  founder_consent: boolean;
  opt_in_timestamp: string;
}

export type RelationshipType = 'advisory' | 'capital' | 'program' | 'service' | 'ecosystem';

export interface ValuePropositionCanvasData {
  customer_segment: string;
  customer_jobs: string[];
  pains: { description: string; severity: number }[];
  gains: { description: string; importance: number }[];
  pain_relievers: string[];
  gain_creators: string[];
  products_services: string[];
  fit_assessment: string;
}

export interface CustomerProfile {
  segment_name: string;
  jobs_to_be_done: { job: string; importance: number; frequency: string }[];
  pains: { pain: string; severity: number; current_solution: string }[];
  gains: { gain: string; relevance: number }[];
  demographics?: Record<string, string>;
  behavioral_insights: string[];
}

export interface CompetitorMap {
  competitors: {
    name: string;
    category: 'direct' | 'indirect' | 'substitute';
    strengths: string[];
    weaknesses: string[];
    market_share_estimate?: number;
  }[];
  positioning_statement: string;
  differentiation_axes: {
    axis: string;
    our_position: string;
    competitor_positions: Record<string, string>;
  }[];
}

export interface BusinessModelCanvas {
  key_partners: string[];
  key_activities: string[];
  key_resources: string[];
  value_propositions: string[];
  customer_relationships: string[];
  channels: string[];
  customer_segments: string[];
  cost_structure: { item: string; type: 'fixed' | 'variable'; amount?: number }[];
  revenue_streams: { stream: string; type: string; pricing_model: string }[];
}

export interface ExperimentResult {
  experiment_id: string;
  hypothesis_id: string;
  experiment_type: 'landing_page' | 'concierge' | 'wizard_of_oz' | 'prototype' | 'interview' | 'survey';
  start_date: string;
  end_date: string;
  sample_size: number;
  success_criteria: string;
  actual_result: string;
  outcome: 'validated' | 'invalidated' | 'inconclusive';
  learnings: string[];
  evidence_category: 'DO-direct' | 'DO-indirect' | 'SAY';
}

export interface GateScores {
  desirability: number;
  feasibility: number;
  viability: number;
  overall_fit: number;
  current_gate: 'desirability' | 'feasibility' | 'viability' | 'complete';
  gate_passed_at?: Record<string, string>;
}

export interface HITLRecord {
  checkpoints: {
    checkpoint_id: string;
    checkpoint_type: string;
    triggered_at: string;
    responded_at?: string;
    response_summary?: string;
    approval_status: 'pending' | 'approved' | 'rejected' | 'revised';
  }[];
  coachability_score: number;
  total_checkpoints: number;
  completed_checkpoints: number;
}

// --- API Request/Response Types ---

export interface GenerateNarrativeRequest {
  project_id: string;
  force_regenerate?: boolean;
  preserve_edits?: boolean;
}

export interface GenerateNarrativeResponse {
  narrative_id: string;
  pitch_narrative: PitchNarrative;
  is_fresh: boolean;
  generated_from: string;
}

export interface EditNarrativeRequest {
  edits: {
    field: string; // Dot-notation path
    new_value: unknown;
  }[];
}

export interface EditNarrativeResponse {
  narrative_id: string;
  is_edited: boolean;
  alignment_status: 'verified' | 'flagged' | 'pending';
}

export interface PublishNarrativeRequest {
  hitl_confirmation: {
    reviewed_slides: boolean;
    verified_traction: boolean;
    added_context: boolean;
    confirmed_ask: boolean;
  };
}

export interface PublishNarrativeResponse {
  narrative_id: string;
  is_published: boolean;
  published_at: string;
  first_publish: boolean;
}

export interface UnpublishNarrativeResponse {
  narrative_id: string;
  is_published: boolean;
}

export interface ExportNarrativeRequest {
  format: 'pdf' | 'json';
  include_qr_code?: boolean;
  include_evidence?: boolean;
}

export interface ExportNarrativeResponse {
  success: boolean;
  export_id: string;
  verification_token: string;
  generation_hash: string;
  verification_url: string;
  download_url: string;
  expires_at: string;
  evidence_package_id?: string;
  summary_card_url?: string;
}

export interface ExportListItem {
  export_id: string;
  verification_token: string;
  export_format: string;
  exported_at: string;
  qr_code_included: boolean;
  download_url: string;
  download_expires_at: string;
}

export interface VerificationResponse {
  status: 'verified' | 'outdated' | 'not_found';
  exported_at?: string;
  venture_name?: string;
  evidence_id?: string; // First 12 chars of integrity_hash
  generation_hash?: string;
  current_hash?: string;
  current_hash_matches?: boolean;
  evidence_generated_at?: string;
  validation_stage_at_export?: string;
  is_edited?: boolean;
  alignment_status?: string;
  request_access_url?: string;
}

export interface CreateEvidencePackageRequest {
  project_id: string;
  is_public?: boolean;
  founder_consent: boolean;
}

export interface CreateEvidencePackageResponse {
  package_id: string;
  integrity_hash: string;
  includes: string[];
}

export interface EvidencePackageListResponse {
  packages: EvidencePackage[];
  total: number;
}

export interface VersionListResponse {
  current_version: number;
  versions: {
    version_number: number;
    created_at: string;
    trigger_reason: string | null;
    fit_score_at_version: number | null;
    source_evidence_hash: string;
  }[];
}

export interface VersionDiffResponse {
  version_a: number;
  version_b: number;
  diffs: {
    field: string;
    old_value: unknown;
    new_value: unknown;
  }[];
}

// --- Error Types ---

export type NarrativeErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'INSUFFICIENT_EVIDENCE'
  | 'NARRATIVE_STALE'
  | 'ALIGNMENT_FAILED'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'FORMAT_NOT_SUPPORTED'
  | 'EVIDENCE_PACKAGE_MISSING'
  | 'PUBLISH_BLOCKED';

export interface NarrativeErrorResponse {
  error: {
    code: NarrativeErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
}

export const NARRATIVE_ERROR_STATUS: Record<NarrativeErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  INSUFFICIENT_EVIDENCE: 400,
  NARRATIVE_STALE: 409,
  ALIGNMENT_FAILED: 422,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
  FORMAT_NOT_SUPPORTED: 422,
  EVIDENCE_PACKAGE_MISSING: 422,
  PUBLISH_BLOCKED: 400,
};
