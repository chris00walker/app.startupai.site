/**
 * Approval Decision Mapping Tests
 *
 * Tests the segment_pivot_intent -> iterate + SEGMENT_PIVOT envelope
 * translation logic from the approval route handler.
 *
 * The mapping logic is replicated here as a pure function to enable
 * unit testing without the full API route infrastructure.
 *
 * @story US-AH01, US-H06
 */

/**
 * Replicate the exact mapping logic from
 * frontend/src/app/api/approvals/[id]/route.ts (lines 246-264)
 */
function mapDecisionForModal(
  taskId: string,
  action: string,
  decision: string | undefined,
  feedback: string | undefined,
): { modalDecision: string; modalFeedback: string } {
  const isApproved = action === 'approve';
  const isDiscoverySegmentPivotIntent =
    taskId === 'approve_discovery_output' &&
    action === 'approve' &&
    decision === 'segment_pivot_intent';

  const modalDecision = isDiscoverySegmentPivotIntent
    ? 'iterate'
    : isApproved
      ? (decision === 'approve' ? 'approved' :
         decision === 'reject' ? 'rejected' :
         decision || 'approved')
      : (decision || 'rejected');

  const modalFeedback = isDiscoverySegmentPivotIntent
    ? `SEGMENT_PIVOT|${JSON.stringify({
        target_segment: feedback?.trim() ?? '',
        rationale: feedback?.trim() ?? '',
      })}`
    : (feedback || (isApproved ? 'Approved by user' : 'Rejected by user'));

  return { modalDecision, modalFeedback };
}

describe('decision-mapping for Modal', () => {
  describe('segment_pivot_intent translation', () => {
    it('segment_pivot_intent maps to iterate with SEGMENT_PIVOT envelope', () => {
      const result = mapDecisionForModal(
        'approve_discovery_output',
        'approve',
        'segment_pivot_intent',
        'Pivot to enterprise customers',
      );

      expect(result.modalDecision).toBe('iterate');
      expect(result.modalFeedback).toMatch(/^SEGMENT_PIVOT\|/);
    });

    it('segment_pivot_intent includes target_segment in envelope', () => {
      const result = mapDecisionForModal(
        'approve_discovery_output',
        'approve',
        'segment_pivot_intent',
        'Pivot to enterprise customers',
      );

      const jsonPart = result.modalFeedback.split('SEGMENT_PIVOT|')[1];
      const parsed = JSON.parse(jsonPart);

      expect(parsed).toHaveProperty('target_segment', 'Pivot to enterprise customers');
      expect(parsed).toHaveProperty('rationale', 'Pivot to enterprise customers');
    });

    it('segment_pivot_intent handles empty feedback gracefully', () => {
      const result = mapDecisionForModal(
        'approve_discovery_output',
        'approve',
        'segment_pivot_intent',
        undefined,
      );

      expect(result.modalDecision).toBe('iterate');
      const jsonPart = result.modalFeedback.split('SEGMENT_PIVOT|')[1];
      const parsed = JSON.parse(jsonPart);

      expect(parsed.target_segment).toBe('');
      expect(parsed.rationale).toBe('');
    });
  });

  describe('standard decision pass-through', () => {
    it('approved decision passes through as approved', () => {
      const result = mapDecisionForModal(
        'approve_brief',
        'approve',
        'approve',
        'Looks good',
      );

      expect(result.modalDecision).toBe('approved');
      expect(result.modalFeedback).toBe('Looks good');
    });

    it('iterate decision passes through as iterate', () => {
      const result = mapDecisionForModal(
        'approve_brief',
        'approve',
        'iterate',
        'Needs minor adjustments',
      );

      expect(result.modalDecision).toBe('iterate');
      expect(result.modalFeedback).toBe('Needs minor adjustments');
    });

    it('rejection maps to rejected', () => {
      const result = mapDecisionForModal(
        'approve_brief',
        'reject',
        undefined,
        undefined,
      );

      expect(result.modalDecision).toBe('rejected');
      expect(result.modalFeedback).toBe('Rejected by user');
    });

    it('approval with no decision defaults to approved', () => {
      const result = mapDecisionForModal(
        'approve_brief',
        'approve',
        undefined,
        undefined,
      );

      expect(result.modalDecision).toBe('approved');
      expect(result.modalFeedback).toBe('Approved by user');
    });
  });

  describe('segment_pivot_intent from non-discovery checkpoint', () => {
    it('segment_pivot_intent from approve_brief is NOT translated', () => {
      const result = mapDecisionForModal(
        'approve_brief',
        'approve',
        'segment_pivot_intent',
        'Some feedback',
      );

      // Should pass through as-is, NOT become "iterate"
      expect(result.modalDecision).toBe('segment_pivot_intent');
      expect(result.modalFeedback).toBe('Some feedback');
      expect(result.modalFeedback).not.toMatch(/^SEGMENT_PIVOT\|/);
    });

    it('segment_pivot_intent with reject action is NOT translated', () => {
      const result = mapDecisionForModal(
        'approve_discovery_output',
        'reject',
        'segment_pivot_intent',
        'Pivot feedback',
      );

      // Rejection overrides the segment_pivot_intent logic
      expect(result.modalDecision).toBe('segment_pivot_intent');
      expect(result.modalFeedback).toBe('Pivot feedback');
      expect(result.modalFeedback).not.toMatch(/^SEGMENT_PIVOT\|/);
    });
  });
});
