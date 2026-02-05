/**
 * Edit Service Unit Tests
 *
 * Tests edit application, history tracking, and merge helpers.
 *
 * @story US-NL01
 * @see docs/specs/narrative-layer-spec.md :4470-4511
 */

import {
  applyEdit,
  buildEditEntry,
  getFounderEditedSlides,
  getSlideEdits,
} from '@/lib/narrative/edit';
import type { PitchNarrativeContent, EditHistoryEntry } from '@/lib/narrative/types';

// Minimal fixture for testing edits
function createMinimalContent(): PitchNarrativeContent {
  return {
    version: '1.0',
    cover: {
      venture_name: 'TestVenture',
      tagline: 'Original tagline',
      document_type: 'Pitch Deck',
      presentation_date: '2026-02-05',
      contact: { founder_name: 'Jane Doe', email: 'jane@test.com' },
    },
    overview: {
      thesis: 'Original thesis.',
      one_liner: 'We do X for Y by Z.',
      industry: 'SaaS',
      novel_insight: 'Novel insight.',
      key_metrics: [],
    },
    opportunity: {
      tam: { value: 1000000, unit: 'USD', timeframe: 'annual', source: 'r', confidence: 'estimated' },
      sam: { value: 500000, unit: 'USD', timeframe: 'annual', source: 'r', confidence: 'estimated' },
      som: { value: 100000, unit: 'USD', timeframe: 'annual', source: 'r', confidence: 'estimated' },
      growth_trajectory: 'Growing',
      why_now: 'Market timing',
      market_tailwinds: [],
    },
    problem: { primary_pain: 'Pain', pain_narrative: 'Story', affected_population: '10K', why_exists: 'Why', status_quo: 'Status', severity_score: 0.7, evidence_quotes: [] },
    solution: { value_proposition: 'Solution', how_it_works: 'Works', key_differentiator: 'Diff', use_cases: [], fit_score: 0.6 },
    traction: {
      evidence_summary: 'Original summary.',
      growth_metrics: [], assumptions_validated: [],
      do_direct: [], do_indirect: [], say_evidence: [],
      interview_count: 0, experiment_count: 0, hitl_completion_rate: 0,
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
    metadata: { methodology: 'VPD', evidence_strength: 'SAY', overall_fit_score: 0.5, validation_stage: 'desirability', pivot_count: 0 },
  };
}

describe('applyEdit', () => {
  it('applies a top-level slide field edit', () => {
    const content = createMinimalContent();
    const { updated, oldValue } = applyEdit(content, 'traction.evidence_summary', 'Updated summary.');

    expect(oldValue).toBe('Original summary.');
    expect(updated.traction.evidence_summary).toBe('Updated summary.');
  });

  it('applies a nested field edit', () => {
    const content = createMinimalContent();
    const { updated, oldValue } = applyEdit(content, 'cover.contact.founder_name', 'John Smith');

    expect(oldValue).toBe('Jane Doe');
    expect(updated.cover.contact.founder_name).toBe('John Smith');
  });

  it('does not mutate the original content', () => {
    const content = createMinimalContent();
    applyEdit(content, 'overview.thesis', 'New thesis.');

    expect(content.overview.thesis).toBe('Original thesis.');
  });

  it('returns correct slide and fieldPath', () => {
    const content = createMinimalContent();
    const { slide, fieldPath } = applyEdit(content, 'overview.thesis', 'New thesis.');

    expect(slide).toBe('overview');
    expect(fieldPath).toBe('thesis');
  });

  it('handles deeply nested paths', () => {
    const content = createMinimalContent();
    const { slide, fieldPath } = applyEdit(content, 'cover.contact.email', 'new@test.com');

    expect(slide).toBe('cover');
    expect(fieldPath).toBe('contact.email');
  });
});

describe('buildEditEntry', () => {
  it('creates a well-formed entry with founder source', () => {
    const entry = buildEditEntry('traction', 'evidence_summary', 'old', 'new');

    expect(entry.slide).toBe('traction');
    expect(entry.field).toBe('evidence_summary');
    expect(entry.old_value).toBe('old');
    expect(entry.new_value).toBe('new');
    expect(entry.edit_source).toBe('founder');
    expect(entry.timestamp).toBeTruthy();
  });

  it('accepts regeneration as edit source', () => {
    const entry = buildEditEntry('overview', 'thesis', 'old', 'new', 'regeneration');
    expect(entry.edit_source).toBe('regeneration');
  });
});

describe('getFounderEditedSlides', () => {
  it('returns slides with founder edits', () => {
    const history: EditHistoryEntry[] = [
      { timestamp: '2026-01-01T00:00:00Z', slide: 'traction', field: 'evidence_summary', old_value: 'a', new_value: 'b', edit_source: 'founder' },
      { timestamp: '2026-01-01T00:01:00Z', slide: 'overview', field: 'thesis', old_value: 'c', new_value: 'd', edit_source: 'founder' },
      { timestamp: '2026-01-01T00:02:00Z', slide: 'problem', field: 'primary_pain', old_value: 'e', new_value: 'f', edit_source: 'regeneration' },
    ];

    const edited = getFounderEditedSlides(history);
    expect(edited.has('traction')).toBe(true);
    expect(edited.has('overview')).toBe(true);
    expect(edited.has('problem')).toBe(false); // regeneration, not founder
  });

  it('returns empty set for no edits', () => {
    const edited = getFounderEditedSlides([]);
    expect(edited.size).toBe(0);
  });

  it('deduplicates slides with multiple edits', () => {
    const history: EditHistoryEntry[] = [
      { timestamp: '2026-01-01T00:00:00Z', slide: 'traction', field: 'evidence_summary', old_value: 'a', new_value: 'b', edit_source: 'founder' },
      { timestamp: '2026-01-01T00:01:00Z', slide: 'traction', field: 'interview_count', old_value: 5, new_value: 10, edit_source: 'founder' },
    ];

    const edited = getFounderEditedSlides(history);
    expect(edited.size).toBe(1);
    expect(edited.has('traction')).toBe(true);
  });
});

describe('getSlideEdits', () => {
  it('returns latest founder edits for a slide', () => {
    const history: EditHistoryEntry[] = [
      { timestamp: '2026-01-01T00:00:00Z', slide: 'traction', field: 'evidence_summary', old_value: 'a', new_value: 'b', edit_source: 'founder' },
      { timestamp: '2026-01-01T00:01:00Z', slide: 'traction', field: 'evidence_summary', old_value: 'b', new_value: 'c', edit_source: 'founder' },
    ];

    const edits = getSlideEdits(history, 'traction');
    expect(edits.get('evidence_summary')).toBe('c');
  });

  it('filters out regeneration edits', () => {
    const history: EditHistoryEntry[] = [
      { timestamp: '2026-01-01T00:00:00Z', slide: 'traction', field: 'evidence_summary', old_value: 'a', new_value: 'b', edit_source: 'founder' },
      { timestamp: '2026-01-01T00:01:00Z', slide: 'traction', field: 'interview_count', old_value: 5, new_value: 10, edit_source: 'regeneration' },
    ];

    const edits = getSlideEdits(history, 'traction');
    expect(edits.has('evidence_summary')).toBe(true);
    expect(edits.has('interview_count')).toBe(false);
  });

  it('returns empty map for unedited slide', () => {
    const history: EditHistoryEntry[] = [
      { timestamp: '2026-01-01T00:00:00Z', slide: 'traction', field: 'evidence_summary', old_value: 'a', new_value: 'b', edit_source: 'founder' },
    ];

    const edits = getSlideEdits(history, 'overview');
    expect(edits.size).toBe(0);
  });

  it('tracks multiple fields independently', () => {
    const history: EditHistoryEntry[] = [
      { timestamp: '2026-01-01T00:00:00Z', slide: 'overview', field: 'thesis', old_value: 'a', new_value: 'b', edit_source: 'founder' },
      { timestamp: '2026-01-01T00:01:00Z', slide: 'overview', field: 'one_liner', old_value: 'c', new_value: 'd', edit_source: 'founder' },
    ];

    const edits = getSlideEdits(history, 'overview');
    expect(edits.get('thesis')).toBe('b');
    expect(edits.get('one_liner')).toBe('d');
  });
});
