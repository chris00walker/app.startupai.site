/**
 * Guardian Alignment Check Unit Tests
 *
 * Tests claim-language mapping, evidence-language alignment,
 * and auto-correction behavior.
 *
 * @story US-NL01 (T2 test card)
 * @see docs/specs/narrative-layer-spec.md :3965-3997
 */

import {
  guardianCheckGeneration,
  guardianCheckEdit,
  guardianCheckRegeneration,
  applyGuardianCorrections,
} from '@/lib/narrative/guardian';
import type { PitchNarrativeContent } from '@/lib/narrative/types';

// Minimal fixture with configurable fit score
function createContentWithFitScore(fitScore: number): PitchNarrativeContent {
  return {
    version: '1.0',
    cover: {
      venture_name: 'TestVenture',
      tagline: 'Testing',
      document_type: 'Pitch Deck',
      presentation_date: '2026-02-05',
      contact: { founder_name: 'Jane', email: 'jane@test.com' },
    },
    overview: {
      thesis: 'A thesis.',
      one_liner: 'We do X.',
      industry: 'SaaS',
      novel_insight: 'Novel.',
      key_metrics: [],
    },
    opportunity: {
      tam: { value: 1000000, unit: 'USD', timeframe: 'annual', source: 'r', confidence: 'estimated' },
      sam: { value: 500000, unit: 'USD', timeframe: 'annual', source: 'r', confidence: 'estimated' },
      som: { value: 100000, unit: 'USD', timeframe: 'annual', source: 'r', confidence: 'estimated' },
      growth_trajectory: 'Growing',
      why_now: 'Timing',
      market_tailwinds: [],
    },
    problem: { primary_pain: 'Pain', pain_narrative: 'Story', affected_population: '10K', why_exists: 'Why', status_quo: 'Status', severity_score: 0.7, evidence_quotes: [] },
    solution: { value_proposition: 'Solution', how_it_works: 'Works', key_differentiator: 'Diff', use_cases: [], fit_score: fitScore },
    traction: {
      evidence_summary: 'Moderate traction data.',
      growth_metrics: [], assumptions_validated: [],
      do_direct: [], do_indirect: [], say_evidence: [],
      interview_count: 5, experiment_count: 2, hitl_completion_rate: 0.8,
      display_config: {
        evidence_order: ['do_direct', 'do_indirect', 'say_evidence'],
        show_weights: true,
        visual_emphasis: { do_direct: 'primary', do_indirect: 'secondary', say_evidence: 'tertiary' },
      },
    },
    customer: { segments: [], persona_summary: '', demographics: { location: '', behaviors: '' }, willingness_to_pay: '', market_size: 0, target_percentage: 0, target_first: '', acquisition_channel: '', behavioral_insights: [], segment_prioritization: '' },
    competition: { landscape_summary: '', primary_competitors: [], secondary_competitors: [], differentiators: [], unfair_advantage: '', incumbent_defense: '' },
    business_model: { revenue_model: '', cac: 0, ltv: 0, ltv_cac_ratio: 0, unit_economics: { cost_per_unit: 0, revenue_per_unit: 0, margin_per_unit: 0, breakdown: [] }, pricing_strategy: '', market_context: '' },
    team: { members: [], coachability_score: 0 },
    use_of_funds: { ask_amount: 0, ask_type: 'SAFE', allocations: [], milestones: [], timeline_weeks: 0 },
    metadata: {
      methodology: 'VPD',
      evidence_strength: 'SAY',
      overall_fit_score: fitScore,
      validation_stage: 'desirability',
      pivot_count: 0,
    },
  };
}

describe('guardianCheckGeneration', () => {
  it('returns verified when claims match evidence strength', () => {
    // Low fit score with appropriately modest language
    const content = createContentWithFitScore(0.3);
    content.traction.evidence_summary = 'Early signals suggest positive interest from initial interviews.';

    const result = guardianCheckGeneration(content);
    expect(result.status).toBe('verified');
    expect(result.issues).toHaveLength(0);
  });

  it('auto-corrects "strong demand" at low fit score', () => {
    const content = createContentWithFitScore(0.3);
    content.traction.evidence_summary = 'We see strong demand for our product.';

    const result = guardianCheckGeneration(content);
    expect(result.auto_corrections).toBeDefined();
    expect(result.auto_corrections!.length).toBeGreaterThan(0);

    const correction = result.auto_corrections!.find(c => c.field === 'traction.evidence_summary');
    expect(correction).toBeDefined();
    expect(correction!.new_value).not.toContain('strong demand');
  });

  it('auto-corrects "proven" at exploratory tier', () => {
    const content = createContentWithFitScore(0.15);
    content.overview.thesis = 'We have a proven solution for customer pain.';

    const result = guardianCheckGeneration(content);
    expect(result.auto_corrections).toBeDefined();
    expect(result.auto_corrections!.some(c => c.field === 'overview.thesis')).toBe(true);
  });

  it('allows "strong demand" at high fit score', () => {
    const content = createContentWithFitScore(0.85);
    content.traction.evidence_summary = 'We see strong demand for our product.';

    const result = guardianCheckGeneration(content);
    // Should NOT auto-correct since fit score is high enough
    const correctionForTraction = (result.auto_corrections || []).find(
      c => c.field === 'traction.evidence_summary'
    );
    expect(correctionForTraction).toBeUndefined();
  });

  it('flags "proven" when no DO-direct evidence exists', () => {
    const content = createContentWithFitScore(0.65);
    content.traction.evidence_summary = 'Our product has proven market demand.';
    content.traction.do_direct = []; // no DO-direct evidence

    const result = guardianCheckGeneration(content);
    // Should auto-correct "proven" in traction summary when no DO-direct
    const corrections = result.auto_corrections || [];
    const tractionCorrection = corrections.find(c => c.field === 'traction.evidence_summary');
    expect(tractionCorrection).toBeDefined();
  });

  it('allows "validated" at validated tier (0.50-0.75)', () => {
    const content = createContentWithFitScore(0.6);
    content.overview.thesis = 'Validated interest from our target market.';

    const result = guardianCheckGeneration(content);
    const correctionForThesis = (result.auto_corrections || []).find(
      c => c.field === 'overview.thesis'
    );
    expect(correctionForThesis).toBeUndefined();
  });
});

describe('guardianCheckEdit', () => {
  it('returns verified when edit uses appropriate language', () => {
    const content = createContentWithFitScore(0.3);
    content.traction.evidence_summary = 'Growing evidence of customer interest.';

    const result = guardianCheckEdit(content, ['traction.evidence_summary']);
    expect(result.status).toBe('verified');
    expect(result.issues).toHaveLength(0);
  });

  it('flags overstated edit without auto-correcting', () => {
    const content = createContentWithFitScore(0.2);
    content.traction.evidence_summary = 'Proven demand with significant traction.';

    const result = guardianCheckEdit(content, ['traction.evidence_summary']);
    expect(result.status).toBe('flagged');
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues[0].suggested_language).toBeTruthy();
    // Edit check does NOT auto-correct
    expect(result.auto_corrections).toBeUndefined();
  });

  it('only checks edited fields', () => {
    const content = createContentWithFitScore(0.2);
    // This field has prohibited language but isn't in the edited list
    content.traction.evidence_summary = 'Proven demand.';
    // This field is in the edited list and is fine
    content.overview.thesis = 'Exploring market interest.';

    const result = guardianCheckEdit(content, ['overview.thesis']);
    expect(result.status).toBe('verified');
  });

  it('provides evidence_needed in issues', () => {
    const content = createContentWithFitScore(0.1);
    content.overview.thesis = 'Our proven solution dominates the market.';

    const result = guardianCheckEdit(content, ['overview.thesis']);
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues[0].evidence_needed).toBeTruthy();
  });
});

describe('guardianCheckRegeneration', () => {
  it('checks all slides without auto-correcting', () => {
    const content = createContentWithFitScore(0.2);
    content.traction.evidence_summary = 'Strong demand validated by confirmed customers.';

    const result = guardianCheckRegeneration(content);
    expect(result.status).toBe('flagged');
    expect(result.issues.length).toBeGreaterThan(0);
    // Regeneration does NOT auto-correct
    expect(result.auto_corrections).toBeUndefined();
  });

  it('returns verified when all claims are appropriate', () => {
    const content = createContentWithFitScore(0.3);
    content.traction.evidence_summary = 'Early signals suggest initial interest.';
    content.overview.thesis = 'We are exploring a new approach.';

    const result = guardianCheckRegeneration(content);
    expect(result.status).toBe('verified');
  });
});

describe('applyGuardianCorrections', () => {
  it('applies corrections without mutating original', () => {
    const content = createContentWithFitScore(0.3);
    content.traction.evidence_summary = 'Strong demand for our product.';

    const corrections = [{
      field: 'traction.evidence_summary',
      old_value: 'Strong demand for our product.',
      new_value: 'Growing evidence of interest in our product.',
    }];

    const corrected = applyGuardianCorrections(content, corrections);
    expect(corrected.traction.evidence_summary).toBe('Growing evidence of interest in our product.');
    // Original unchanged
    expect(content.traction.evidence_summary).toBe('Strong demand for our product.');
  });

  it('handles multiple corrections', () => {
    const content = createContentWithFitScore(0.2);
    content.overview.thesis = 'Proven value.';
    content.traction.evidence_summary = 'Confirmed demand.';

    const corrections = [
      { field: 'overview.thesis', old_value: 'Proven value.', new_value: 'Exploring value.' },
      { field: 'traction.evidence_summary', old_value: 'Confirmed demand.', new_value: 'Initial signals.' },
    ];

    const corrected = applyGuardianCorrections(content, corrections);
    expect(corrected.overview.thesis).toBe('Exploring value.');
    expect(corrected.traction.evidence_summary).toBe('Initial signals.');
  });

  it('skips corrections where old_value does not match', () => {
    const content = createContentWithFitScore(0.3);
    content.traction.evidence_summary = 'Different text now.';

    const corrections = [{
      field: 'traction.evidence_summary',
      old_value: 'Original text that no longer matches.',
      new_value: 'Corrected text.',
    }];

    const corrected = applyGuardianCorrections(content, corrections);
    // Should NOT apply since old_value doesn't match
    expect(corrected.traction.evidence_summary).toBe('Different text now.');
  });
});
