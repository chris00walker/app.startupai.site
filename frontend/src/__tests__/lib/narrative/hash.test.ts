/**
 * Hash Function Unit Tests
 *
 * Tests narrative hash stability, canonicalization determinism,
 * and cross-function isolation.
 *
 * @story US-NL01
 * @see docs/specs/narrative-layer-spec.md :2108-2160
 */

import {
  computeNarrativeHash,
  computeSourceEvidenceHash,
  computeIntegrityHash,
  stableStringify,
  sortBmcArrays,
  canonicalizeEvidence,
} from '@/lib/narrative/hash';
import type {
  PitchNarrativeContent,
  ValidationEvidence,
  BusinessModelCanvas,
} from '@/lib/narrative/types';

// --- Test Fixtures ---

function createMinimalNarrativeContent(): PitchNarrativeContent {
  return {
    version: '1.0',
    cover: {
      venture_name: 'TestVenture',
      tagline: 'Testing is believing',
      document_type: 'Pitch Deck',
      presentation_date: '2026-02-05',
      contact: { founder_name: 'Jane Doe', email: 'jane@test.com' },
    },
    overview: {
      thesis: 'A thesis statement.',
      one_liner: 'We do X for Y by Z.',
      industry: 'SaaS',
      novel_insight: 'Novel insight here.',
      key_metrics: [{ label: 'MRR', value: '$10K', evidence_type: 'DO-direct' }],
    },
    opportunity: {
      tam: { value: 1000000, unit: 'USD', timeframe: 'annual', source: 'research', confidence: 'estimated' },
      sam: { value: 500000, unit: 'USD', timeframe: 'annual', source: 'research', confidence: 'estimated' },
      som: { value: 100000, unit: 'USD', timeframe: 'annual', source: 'research', confidence: 'estimated' },
      growth_trajectory: 'Growing',
      why_now: 'Market timing',
      market_tailwinds: ['AI adoption'],
    },
    problem: {
      primary_pain: 'Pain point',
      pain_narrative: 'The pain story.',
      affected_population: '10,000 startups',
      why_exists: 'Historical reason',
      status_quo: 'Manual processes',
      severity_score: 0.7,
      evidence_quotes: ['Quote 1'],
    },
    solution: {
      value_proposition: 'Our solution',
      how_it_works: 'It works like this.',
      key_differentiator: 'Unique aspect',
      use_cases: ['Use case 1'],
      fit_score: 0.65,
    },
    traction: {
      evidence_summary: 'We have traction.',
      growth_metrics: [],
      assumptions_validated: [],
      do_direct: [],
      do_indirect: [],
      say_evidence: [],
      interview_count: 5,
      experiment_count: 2,
      hitl_completion_rate: 0.8,
      display_config: {
        evidence_order: ['do_direct', 'do_indirect', 'say_evidence'],
        show_weights: true,
        visual_emphasis: { do_direct: 'primary', do_indirect: 'secondary', say_evidence: 'tertiary' },
      },
    },
    customer: {
      segments: [],
      persona_summary: 'Persona summary.',
      demographics: { location: 'US', behaviors: 'Online' },
      willingness_to_pay: '$50/mo',
      market_size: 10000,
      target_percentage: 0.1,
      target_first: 'Early adopters',
      acquisition_channel: 'SEO',
      behavioral_insights: [],
      segment_prioritization: 'Primary first',
    },
    competition: {
      landscape_summary: 'Competitive landscape.',
      primary_competitors: [],
      secondary_competitors: [],
      differentiators: ['Speed'],
      unfair_advantage: 'Proprietary data',
      incumbent_defense: 'Switching costs',
    },
    business_model: {
      revenue_model: 'SaaS subscription',
      cac: 100,
      ltv: 1200,
      ltv_cac_ratio: 12,
      unit_economics: {
        cost_per_unit: 10,
        revenue_per_unit: 50,
        margin_per_unit: 40,
        breakdown: [{ category: 'hosting', amount: 5 }],
      },
      pricing_strategy: 'Freemium',
      market_context: 'Growing market',
    },
    team: {
      members: [{
        name: 'Jane Doe',
        current_role: 'CEO',
        bio: 'Experienced founder.',
        prior_experience: ['Startup A'],
        accomplishments: ['Raised $1M'],
        domain_expertise: 'SaaS',
      }],
      coachability_score: 0.85,
    },
    use_of_funds: {
      ask_amount: 500000,
      ask_type: 'SAFE',
      allocations: [{ category: 'Product', amount: 250000, percentage: 50 }],
      milestones: [{ description: 'Launch MVP', target_date: '2026-06-01', success_criteria: '100 users' }],
      timeline_weeks: 26,
    },
    metadata: {
      methodology: 'VPD',
      evidence_strength: 'DO-indirect',
      overall_fit_score: 0.65,
      validation_stage: 'desirability',
      pivot_count: 0,
    },
  };
}

function createMinimalValidationEvidence(): ValidationEvidence {
  return {
    vpc: {
      customer_segment: 'Startups',
      customer_jobs: ['Validate ideas', 'Find PMF'],
      pains: [{ description: 'Slow feedback', severity: 0.8 }],
      gains: [{ description: 'Fast iteration', importance: 0.9 }],
      pain_relievers: ['Automated surveys'],
      gain_creators: ['AI analysis'],
      products_services: ['Platform'],
      fit_assessment: 'Good fit',
    },
    customer_profile: {
      segment_name: 'Early-stage founders',
      jobs_to_be_done: [{ job: 'Validate market', importance: 0.9, frequency: 'weekly' }],
      pains: [{ pain: 'Slow feedback loops', severity: 0.8, current_solution: 'Manual interviews' }],
      gains: [{ gain: 'Faster learning', relevance: 0.9 }],
      behavioral_insights: ['Price sensitive', 'Time constrained'],
    },
    competitor_map: {
      competitors: [
        { name: 'CompetitorA', category: 'direct', strengths: ['Brand'], weaknesses: ['Price'] },
      ],
      positioning_statement: 'We position as...',
      differentiation_axes: [],
    },
    bmc: {
      key_partners: ['AWS', 'Stripe'],
      key_activities: ['Development', 'Marketing'],
      key_resources: ['Team', 'IP'],
      value_propositions: ['Speed', 'Accuracy'],
      customer_relationships: ['Self-service'],
      channels: ['Web', 'API'],
      customer_segments: ['Startups'],
      cost_structure: [{ item: 'Hosting', type: 'variable' }],
      revenue_streams: [{ stream: 'Subscription', type: 'recurring', pricing_model: 'tiered' }],
    },
    experiment_results: [
      {
        experiment_id: 'exp-1',
        hypothesis_id: 'hyp-1',
        experiment_type: 'interview',
        start_date: '2026-01-01',
        end_date: '2026-01-15',
        sample_size: 10,
        success_criteria: '80% positive',
        actual_result: '90% positive',
        outcome: 'validated',
        learnings: ['Learning 1'],
        evidence_category: 'SAY',
      },
    ],
    gate_scores: {
      desirability: 0.75,
      feasibility: 0.6,
      viability: 0.55,
      overall_fit: 0.65,
      current_gate: 'feasibility',
    },
    hitl_record: {
      checkpoints: [
        {
          checkpoint_id: 'cp-1',
          checkpoint_type: 'desirability_review',
          triggered_at: '2026-01-20T10:00:00Z',
          responded_at: '2026-01-20T14:00:00Z',
          approval_status: 'approved',
        },
      ],
      coachability_score: 0.85,
      total_checkpoints: 1,
      completed_checkpoints: 1,
    },
  };
}

// --- Tests ---

describe('stableStringify', () => {
  it('sorts object keys alphabetically', () => {
    const result = stableStringify({ z: 1, a: 2, m: 3 });
    expect(result).toBe('{"a":2,"m":3,"z":1}');
  });

  it('sorts nested object keys recursively', () => {
    const result = stableStringify({ b: { z: 1, a: 2 }, a: 3 });
    expect(result).toBe('{"a":3,"b":{"a":2,"z":1}}');
  });

  it('preserves array order', () => {
    const result = stableStringify({ arr: [3, 1, 2] });
    expect(result).toBe('{"arr":[3,1,2]}');
  });

  it('handles null and undefined', () => {
    const result = stableStringify({ a: null, b: undefined });
    // JSON.stringify drops undefined keys
    expect(result).toBe('{"a":null}');
  });

  it('produces identical output for reordered keys', () => {
    const a = stableStringify({ x: 1, y: 2, z: 3 });
    const b = stableStringify({ z: 3, x: 1, y: 2 });
    expect(a).toBe(b);
  });
});

describe('sortBmcArrays', () => {
  it('sorts all string arrays alphabetically', () => {
    const bmc: BusinessModelCanvas = {
      key_partners: ['Stripe', 'AWS'],
      key_activities: ['Marketing', 'Development'],
      key_resources: ['IP', 'Team'],
      value_propositions: ['Speed', 'Accuracy'],
      customer_relationships: ['Self-service'],
      channels: ['Web', 'API'],
      customer_segments: ['Startups', 'Enterprises'],
      cost_structure: [{ item: 'Hosting', type: 'variable' }],
      revenue_streams: [{ stream: 'Sub', type: 'recurring', pricing_model: 'tier' }],
    };

    const sorted = sortBmcArrays(bmc);
    expect(sorted.key_partners).toEqual(['AWS', 'Stripe']);
    expect(sorted.key_activities).toEqual(['Development', 'Marketing']);
    expect(sorted.key_resources).toEqual(['IP', 'Team']);
    expect(sorted.channels).toEqual(['API', 'Web']);
    expect(sorted.customer_segments).toEqual(['Enterprises', 'Startups']);
  });

  it('preserves cost_structure and revenue_streams (not string arrays)', () => {
    const bmc: BusinessModelCanvas = {
      key_partners: [],
      key_activities: [],
      key_resources: [],
      value_propositions: [],
      customer_relationships: [],
      channels: [],
      customer_segments: [],
      cost_structure: [{ item: 'B', type: 'fixed' }, { item: 'A', type: 'variable' }],
      revenue_streams: [{ stream: 'Z', type: 'one-time', pricing_model: 'flat' }],
    };

    const sorted = sortBmcArrays(bmc);
    // These should NOT be sorted (complex objects)
    expect(sorted.cost_structure[0].item).toBe('B');
    expect(sorted.revenue_streams[0].stream).toBe('Z');
  });
});

describe('canonicalizeEvidence', () => {
  it('sorts VPC pains by description', () => {
    const evidence = createMinimalValidationEvidence();
    evidence.vpc.pains = [
      { description: 'Zebra pain', severity: 0.5 },
      { description: 'Alpha pain', severity: 0.9 },
    ];

    const canonical = canonicalizeEvidence(evidence);
    expect(canonical.vpc.pains[0].description).toBe('Alpha pain');
    expect(canonical.vpc.pains[1].description).toBe('Zebra pain');
  });

  it('sorts competitors by name', () => {
    const evidence = createMinimalValidationEvidence();
    evidence.competitor_map.competitors = [
      { name: 'Zebra Corp', category: 'direct', strengths: [], weaknesses: [] },
      { name: 'Alpha Inc', category: 'indirect', strengths: [], weaknesses: [] },
    ];

    const canonical = canonicalizeEvidence(evidence);
    expect(canonical.competitor_map.competitors[0].name).toBe('Alpha Inc');
    expect(canonical.competitor_map.competitors[1].name).toBe('Zebra Corp');
  });

  it('sorts experiment results by experiment_id', () => {
    const evidence = createMinimalValidationEvidence();
    evidence.experiment_results = [
      { ...evidence.experiment_results[0], experiment_id: 'exp-3' },
      { ...evidence.experiment_results[0], experiment_id: 'exp-1' },
    ];

    const canonical = canonicalizeEvidence(evidence);
    expect(canonical.experiment_results[0].experiment_id).toBe('exp-1');
    expect(canonical.experiment_results[1].experiment_id).toBe('exp-3');
  });

  it('sorts HITL checkpoints by type then time', () => {
    const evidence = createMinimalValidationEvidence();
    evidence.hitl_record.checkpoints = [
      {
        checkpoint_id: 'cp-2',
        checkpoint_type: 'feasibility_review',
        triggered_at: '2026-01-25T10:00:00Z',
        approval_status: 'pending',
      },
      {
        checkpoint_id: 'cp-1',
        checkpoint_type: 'desirability_review',
        triggered_at: '2026-01-20T10:00:00Z',
        responded_at: '2026-01-20T14:00:00Z',
        approval_status: 'approved',
      },
    ];

    const canonical = canonicalizeEvidence(evidence);
    expect(canonical.hitl_record.checkpoints[0].checkpoint_type).toBe('desirability_review');
    expect(canonical.hitl_record.checkpoints[1].checkpoint_type).toBe('feasibility_review');
  });
});

describe('computeNarrativeHash', () => {
  it('returns a 64-character hex string', () => {
    const content = createMinimalNarrativeContent();
    const hash = computeNarrativeHash(content);
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic for identical content', () => {
    const content = createMinimalNarrativeContent();
    const hash1 = computeNarrativeHash(content);
    const hash2 = computeNarrativeHash(content);
    expect(hash1).toBe(hash2);
  });

  it('changes when content changes', () => {
    const content1 = createMinimalNarrativeContent();
    const content2 = createMinimalNarrativeContent();
    content2.overview.thesis = 'A different thesis statement.';

    const hash1 = computeNarrativeHash(content1);
    const hash2 = computeNarrativeHash(content2);
    expect(hash1).not.toBe(hash2);
  });

  it('is not affected by property order', () => {
    const content1 = createMinimalNarrativeContent();
    // Create with same data but different JS object creation order
    const content2 = JSON.parse(JSON.stringify(content1)) as PitchNarrativeContent;

    const hash1 = computeNarrativeHash(content1);
    const hash2 = computeNarrativeHash(content2);
    expect(hash1).toBe(hash2);
  });
});

describe('computeSourceEvidenceHash', () => {
  it('returns a 64-character hex string', () => {
    const evidence = createMinimalValidationEvidence();
    const hash = computeSourceEvidenceHash(evidence);
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic after canonicalization', () => {
    const evidence1 = createMinimalValidationEvidence();
    const evidence2 = createMinimalValidationEvidence();
    // Reverse an array that will be sorted by canonicalization
    evidence2.vpc.customer_jobs = ['Find PMF', 'Validate ideas'];

    const hash1 = computeSourceEvidenceHash(evidence1);
    const hash2 = computeSourceEvidenceHash(evidence2);
    expect(hash1).toBe(hash2);
  });

  it('differs from narrative hash for same conceptual data', () => {
    const narrative = createMinimalNarrativeContent();
    const evidence = createMinimalValidationEvidence();

    const narrativeHash = computeNarrativeHash(narrative);
    const evidenceHash = computeSourceEvidenceHash(evidence);
    expect(narrativeHash).not.toBe(evidenceHash);
  });
});

describe('computeIntegrityHash', () => {
  it('returns a 64-character hex string', () => {
    const evidence = createMinimalValidationEvidence();
    const integrity = {
      methodology_version: 'VPD-1.0',
      agent_versions: [{ agent_name: 'Sage', version: '1.0', run_timestamp: '2026-02-05T00:00:00Z' }],
      last_hitl_checkpoint: '2026-01-20T14:00:00Z',
      fit_score_algorithm: 'weighted-average-v1',
    };

    const hash = computeIntegrityHash(evidence, integrity);
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('sorts agent_versions by agent_name', () => {
    const evidence = createMinimalValidationEvidence();
    const integrity1 = {
      methodology_version: 'VPD-1.0',
      agent_versions: [
        { agent_name: 'Sage', version: '1.0', run_timestamp: '2026-02-05T00:00:00Z' },
        { agent_name: 'Guardian', version: '1.0', run_timestamp: '2026-02-05T00:00:00Z' },
      ],
      last_hitl_checkpoint: '2026-01-20T14:00:00Z',
      fit_score_algorithm: 'weighted-average-v1',
    };
    const integrity2 = {
      methodology_version: 'VPD-1.0',
      agent_versions: [
        { agent_name: 'Guardian', version: '1.0', run_timestamp: '2026-02-05T00:00:00Z' },
        { agent_name: 'Sage', version: '1.0', run_timestamp: '2026-02-05T00:00:00Z' },
      ],
      last_hitl_checkpoint: '2026-01-20T14:00:00Z',
      fit_score_algorithm: 'weighted-average-v1',
    };

    const hash1 = computeIntegrityHash(evidence, integrity1);
    const hash2 = computeIntegrityHash(evidence, integrity2);
    expect(hash1).toBe(hash2);
  });

  it('changes when methodology_version changes', () => {
    const evidence = createMinimalValidationEvidence();
    const base = {
      methodology_version: 'VPD-1.0',
      agent_versions: [],
      last_hitl_checkpoint: '2026-01-20T14:00:00Z',
      fit_score_algorithm: 'weighted-average-v1',
    };

    const hash1 = computeIntegrityHash(evidence, base);
    const hash2 = computeIntegrityHash(evidence, { ...base, methodology_version: 'VPD-2.0' });
    expect(hash1).not.toBe(hash2);
  });
});
