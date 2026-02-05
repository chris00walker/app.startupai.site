/**
 * PitchNarrative Schema Fixtures Validation
 *
 * Validates all required fields exist on PitchNarrativeContent
 * and related types per spec :5303-5309.
 *
 * @story US-NL01
 */

import type {
  PitchNarrativeContent,
  PitchNarrative,
  EvidencePackage,
  ValidationEvidence,
  EvidenceIntegrity,
  MetricSnapshot,
  EvidenceItem,
  MarketSize,
  CustomerSegment,
  EditHistoryEntry,
  AlignmentIssue,
  SlideKey,
  VersionListResponse,
  VersionDiffResponse,
  ExportNarrativeResponse,
  VerificationResponse,
} from '@/lib/narrative/types';

// --- Complete fixture that exercises all required fields ---

function createCompletePitchNarrativeContent(): PitchNarrativeContent {
  return {
    version: '1.0',
    cover: {
      venture_name: 'TestVenture Inc.',
      tagline: 'Validate faster, fail smarter',
      logo_url: 'https://example.com/logo.png',
      hero_image_url: 'https://example.com/hero.png',
      document_type: 'Investor Briefing',
      presentation_date: '2026-02-05',
      contact: {
        founder_name: 'Jane Doe',
        email: 'jane@testventure.com',
        linkedin_url: 'https://linkedin.com/in/janedoe',
        website_url: 'https://testventure.com',
      },
    },
    overview: {
      thesis: 'We help early-stage founders validate faster.',
      one_liner: 'We do validation for founders by automating evidence collection.',
      industry: 'SaaS / Developer Tools',
      novel_insight: 'Most founders fail not from bad ideas, but from slow learning.',
      key_metrics: [
        { label: 'MRR', value: '$12K', evidence_type: 'DO-direct' },
        { label: 'Founders onboarded', value: '47', evidence_type: 'DO-indirect' },
      ],
      ask: {
        amount: 500000,
        instrument: 'SAFE',
        use_summary: 'Product development and go-to-market',
      },
    },
    opportunity: {
      tam: { value: 50000000000, unit: 'USD', timeframe: 'annual', source: 'Gartner 2025', confidence: 'researched' },
      sam: { value: 5000000000, unit: 'USD', timeframe: 'annual', source: 'Internal analysis', confidence: 'estimated' },
      som: { value: 100000000, unit: 'USD', timeframe: 'annual', source: 'Bottom-up calc', confidence: 'estimated' },
      growth_trajectory: '28% CAGR in startup tooling market',
      why_now: 'AI-native validation tools are now possible at consumer price points.',
      market_tailwinds: ['AI adoption', 'Remote-first startups', 'Evidence-based investing'],
      market_confusion: 'Incumbents focus on pitch decks, not validation.',
    },
    problem: {
      primary_pain: 'Founders spend 6+ months on ideas without validating core assumptions.',
      pain_narrative: 'The typical founder journey involves months of building before any customer contact.',
      affected_population: '600,000 new startups per year in the US alone',
      customer_story: {
        name: 'Sarah, first-time founder',
        context: 'Built an MVP for 4 months',
        struggle: 'Launched to zero signups because the problem was wrong',
      },
      why_exists: 'No accessible validation methodology for non-academics.',
      status_quo: 'Manual customer interviews and gut feeling.',
      severity_score: 0.82,
      evidence_quotes: [
        'I wish I had tested my assumptions before building.',
        'Nobody told me about validation until I had already failed.',
      ],
    },
    solution: {
      value_proposition: 'AI-guided validation that maps to the Strategyzer methodology.',
      how_it_works: 'Founders answer questions, AI runs experiments, evidence accumulates.',
      key_differentiator: 'Evidence-based Fit Score backed by behavioral data.',
      use_cases: ['Pre-seed validation', 'Pivot decisions', 'Investor reporting'],
      demo_assets: [
        { type: 'screenshot', url: 'https://example.com/demo.png', caption: 'Dashboard view' },
      ],
      ip_defensibility: 'Proprietary VPD methodology + training data',
      fit_score: 0.72,
    },
    traction: {
      evidence_summary: 'Growing evidence of product-market interest.',
      growth_metrics: [
        {
          metric_name: 'Weekly active founders',
          values: [
            { date: '2026-01-01', value: 10 },
            { date: '2026-01-15', value: 25 },
            { date: '2026-02-01', value: 47 },
          ],
          trend: 'accelerating',
        },
      ],
      assumptions_validated: [
        {
          assumption: 'Founders will use AI for validation.',
          evidence: '80% of trial users completed onboarding.',
          confidence: 0.85,
        },
      ],
      sales_process: {
        attract: 'Content marketing + founder communities',
        educate: 'Free tier with onboarding AI',
        qualify: 'Hypothesis count > 3',
        close: 'Self-serve upgrade',
        service: 'AI-guided validation sprints',
      },
      do_direct: [
        { type: 'DO-direct', description: '12 paying customers', metric_value: '$12K MRR', source: 'Stripe', weight: 1.0 },
      ],
      do_indirect: [
        { type: 'DO-indirect', description: '47 founders completed onboarding', source: 'Analytics', weight: 0.8 },
      ],
      say_evidence: [
        { type: 'SAY', description: '90% interview respondents said they need this.', source: 'User interviews', weight: 0.3 },
      ],
      interview_count: 23,
      experiment_count: 5,
      hitl_completion_rate: 0.87,
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
      segments: [
        {
          name: 'First-time founders',
          description: 'Pre-seed founders with technical background.',
          size_estimate: 200000,
          priority: 'primary',
          jobs_to_be_done: ['Validate idea', 'Find first customers'],
          key_pains: ['No methodology', 'Time pressure'],
        },
      ],
      persona_summary: 'Technical founder, 25-35, building B2B SaaS.',
      demographics: { location: 'US/EU', behaviors: 'Active on Twitter, reads HN' },
      willingness_to_pay: '$49-99/mo',
      market_size: 200000,
      target_percentage: 0.05,
      target_first: 'YC alumni network',
      acquisition_channel: 'Content marketing + community',
      acquisition_cost: 42,
      paying_customers: {
        count: 12,
        revenue: 12000,
        example_story: 'One founder validated and pivoted within 2 weeks.',
      },
      behavioral_insights: ['Price-sensitive', 'Time-constrained', 'Prefers self-service'],
      segment_prioritization: 'First-time founders first, then serial entrepreneurs.',
    },
    competition: {
      landscape_summary: 'Fragmented market with no dominant validation tool.',
      primary_competitors: [
        {
          name: 'Lean Canvas Tools',
          how_they_compete: 'Canvas-only, no validation methodology.',
          strengths: ['Brand recognition', 'Free tier'],
          weaknesses: ['No evidence tracking', 'Static canvases'],
        },
      ],
      secondary_competitors: [
        { name: 'Spreadsheets', how_they_compete: 'Generic tracking' },
      ],
      potential_threats: ['Big consulting firms building tools'],
      positioning_map: {
        x_axis: 'Methodology rigor',
        y_axis: 'Automation level',
        your_position: { x: 0.8, y: 0.9 },
        competitor_positions: [{ name: 'Lean Canvas', x: 0.3, y: 0.2 }],
      },
      differentiators: ['AI-guided', 'Evidence-based scoring', 'Behavioral data'],
      unfair_advantage: 'Proprietary VPD methodology and training data.',
      incumbent_defense: 'Network effects from founder community.',
    },
    business_model: {
      revenue_model: 'SaaS subscription with tiered pricing.',
      cac: 42,
      ltv: 1200,
      ltv_cac_ratio: 28.6,
      unit_economics: {
        cost_per_unit: 8,
        revenue_per_unit: 79,
        margin_per_unit: 71,
        breakdown: [
          { category: 'AI inference', amount: 3 },
          { category: 'Hosting', amount: 2 },
          { category: 'Support', amount: 3 },
        ],
      },
      pricing_strategy: 'Freemium with upgrade to Pro ($79/mo) and Capital ($199/mo).',
      market_context: 'Adjacent tools charge $50-200/mo for less functionality.',
    },
    team: {
      members: [
        {
          name: 'Jane Doe',
          current_role: 'CEO & Co-founder',
          bio: 'Ex-Google PM, 2x founder, Stanford CS.',
          prior_experience: ['Google PM', 'YC W21 founder'],
          accomplishments: ['Grew startup to $1M ARR', 'Published validation methodology'],
          education: 'Stanford CS',
          domain_expertise: 'Product validation & startup methodology',
          linkedin_url: 'https://linkedin.com/in/janedoe',
        },
      ],
      advisors: [
        { name: 'Alex Osterwalder', title: 'Creator of Business Model Canvas', relevance: 'Methodology advisor' },
      ],
      hiring_gaps: ['Senior ML engineer'],
      team_culture: 'Evidence-first, move fast, learn faster.',
      coachability_score: 0.9,
    },
    use_of_funds: {
      ask_amount: 500000,
      ask_type: 'SAFE',
      allocations: [
        { category: 'Product Development', amount: 250000, percentage: 50, validation_experiment: 'Build MVP features validated by top 3 hypotheses' },
        { category: 'Go-to-Market', amount: 150000, percentage: 30 },
        { category: 'Operations', amount: 100000, percentage: 20 },
      ],
      milestones: [
        { description: '100 paying customers', target_date: '2026-06-01', success_criteria: '$8K MRR' },
        { description: 'Series Seed ready', target_date: '2026-12-01', success_criteria: '$50K MRR' },
      ],
      timeline_weeks: 52,
      other_participants: [
        { name: 'Angel Investor A', amount: 50000, confirmed: true },
      ],
    },
    metadata: {
      methodology: 'VPD',
      evidence_strength: 'DO-direct',
      overall_fit_score: 0.72,
      validation_stage: 'feasibility',
      pivot_count: 1,
      latest_pivot: {
        original_hypothesis: 'B2C market for validation',
        invalidation_evidence: '0 paying consumers after 30-day test',
        new_direction: 'B2B SaaS for founders',
        pivot_date: '2025-11-15',
      },
      evidence_gaps: {
        use_of_funds: {
          gap_type: 'weak',
          description: 'Allocation percentages not fully validated',
          recommended_action: 'Run unit economics experiment',
          blocking_publish: false,
        },
      },
    },
  };
}

// --- Tests ---

describe('PitchNarrativeContent fixture completeness', () => {
  const content = createCompletePitchNarrativeContent();

  it('has all 11 top-level sections', () => {
    expect(content.version).toBeDefined();
    expect(content.cover).toBeDefined();
    expect(content.overview).toBeDefined();
    expect(content.opportunity).toBeDefined();
    expect(content.problem).toBeDefined();
    expect(content.solution).toBeDefined();
    expect(content.traction).toBeDefined();
    expect(content.customer).toBeDefined();
    expect(content.competition).toBeDefined();
    expect(content.business_model).toBeDefined();
    expect(content.team).toBeDefined();
    expect(content.use_of_funds).toBeDefined();
    expect(content.metadata).toBeDefined();
  });

  it('overview has required fields: industry, novel_insight, one_liner', () => {
    expect(content.overview.industry).toBeTruthy();
    expect(content.overview.novel_insight).toBeTruthy();
    expect(content.overview.one_liner).toBeTruthy();
  });

  it('traction has growth_metrics array', () => {
    expect(Array.isArray(content.traction.growth_metrics)).toBe(true);
    expect(content.traction.growth_metrics.length).toBeGreaterThan(0);
    expect(content.traction.growth_metrics[0].metric_name).toBeTruthy();
    expect(content.traction.growth_metrics[0].trend).toBeTruthy();
  });

  it('traction has assumptions_validated array', () => {
    expect(Array.isArray(content.traction.assumptions_validated)).toBe(true);
    expect(content.traction.assumptions_validated.length).toBeGreaterThan(0);
  });

  it('traction has DO/SAY evidence arrays', () => {
    expect(Array.isArray(content.traction.do_direct)).toBe(true);
    expect(Array.isArray(content.traction.do_indirect)).toBe(true);
    expect(Array.isArray(content.traction.say_evidence)).toBe(true);
  });

  it('customer has persona_summary and segment_prioritization', () => {
    expect(content.customer.persona_summary).toBeTruthy();
    expect(content.customer.segment_prioritization).toBeTruthy();
  });

  it('customer has target_first field', () => {
    expect(content.customer.target_first).toBeTruthy();
  });

  it('team has members array with required fields', () => {
    expect(Array.isArray(content.team.members)).toBe(true);
    expect(content.team.members.length).toBeGreaterThan(0);
    const member = content.team.members[0];
    expect(member.name).toBeTruthy();
    expect(member.current_role).toBeTruthy();
    expect(member.bio).toBeTruthy();
    expect(member.domain_expertise).toBeTruthy();
  });

  it('business_model has unit_economics inline structure', () => {
    expect(content.business_model.unit_economics).toBeDefined();
    expect(content.business_model.unit_economics.cost_per_unit).toBeDefined();
    expect(content.business_model.unit_economics.revenue_per_unit).toBeDefined();
    expect(content.business_model.unit_economics.margin_per_unit).toBeDefined();
  });

  it('metadata has required fields', () => {
    expect(content.metadata.methodology).toBe('VPD');
    expect(content.metadata.overall_fit_score).toBeGreaterThan(0);
    expect(content.metadata.validation_stage).toBeTruthy();
  });

  it('cover has all contact fields', () => {
    expect(content.cover.contact.founder_name).toBeTruthy();
    expect(content.cover.contact.email).toBeTruthy();
  });

  it('use_of_funds has allocations with percentages', () => {
    const total = content.use_of_funds.allocations.reduce((s, a) => s + a.percentage, 0);
    expect(total).toBe(100);
  });
});

describe('SlideKey type completeness', () => {
  it('includes all 11 slide keys plus metadata', () => {
    const keys: SlideKey[] = [
      'cover', 'overview', 'opportunity', 'problem', 'solution',
      'traction', 'customer', 'competition', 'business_model',
      'team', 'use_of_funds', 'metadata',
    ];
    expect(keys).toHaveLength(12);
  });
});

describe('Type interfaces compile correctly', () => {
  it('PitchNarrative wraps PitchNarrativeContent', () => {
    const narrative: PitchNarrative = {
      id: 'test-id',
      project_id: 'proj-id',
      generated_at: '2026-02-05T00:00:00Z',
      content: createCompletePitchNarrativeContent(),
    };
    expect(narrative.content.version).toBe('1.0');
  });

  it('EditHistoryEntry has all required fields', () => {
    const entry: EditHistoryEntry = {
      timestamp: '2026-02-05T00:00:00Z',
      slide: 'traction',
      field: 'evidence_summary',
      old_value: 'old',
      new_value: 'new',
      edit_source: 'founder',
    };
    expect(entry.edit_source).toBe('founder');
  });

  it('AlignmentIssue has severity and suggestion fields', () => {
    const issue: AlignmentIssue = {
      field: 'traction.evidence_summary',
      issue: 'Overstated claim',
      severity: 'warning',
      suggested_language: 'More modest claim',
      evidence_needed: 'Fit Score ≥75%',
    };
    expect(issue.severity).toBe('warning');
  });

  it('VersionListResponse has version array', () => {
    const response: VersionListResponse = {
      current_version: 3,
      versions: [
        {
          version_number: 3,
          created_at: '2026-02-05T00:00:00Z',
          trigger_reason: 'regeneration',
          fit_score_at_version: 0.72,
          source_evidence_hash: 'abc123',
        },
      ],
    };
    expect(response.versions).toHaveLength(1);
  });

  it('VerificationResponse covers all fields', () => {
    const response: VerificationResponse = {
      status: 'verified',
      exported_at: '2026-02-05T00:00:00Z',
      venture_name: 'TestVenture',
      evidence_id: 'abc123def456',
      generation_hash: 'hash1',
      current_hash: 'hash1',
      current_hash_matches: true,
      evidence_generated_at: '2026-02-05T00:00:00Z',
      validation_stage_at_export: 'feasibility',
      is_edited: false,
      alignment_status: 'verified',
      request_access_url: '/evidence-package/123',
    };
    expect(response.current_hash_matches).toBe(true);
  });
});
