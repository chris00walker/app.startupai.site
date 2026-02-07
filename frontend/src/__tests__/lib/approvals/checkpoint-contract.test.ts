/**
 * Checkpoint Contract Tests
 *
 * Verifies that the HITL checkpoint contract correctly categorizes
 * implemented vs deferred checkpoints, and that all IDs have valid entries.
 *
 * @story US-AH01
 */

import {
  HITL_CHECKPOINT_CONTRACT,
  HITL_CHECKPOINT_IDS,
  type HitlCheckpointId,
  type ApprovalRenderVariant,
  getApprovalRenderVariant,
} from '@/lib/approvals/checkpoint-contract';

const IMPLEMENTED_CHECKPOINTS: HitlCheckpointId[] = [
  'approve_brief',
  'approve_founders_brief',
  'approve_discovery_output',
];

describe('checkpoint-contract', () => {
  describe('implemented checkpoints', () => {
    it('IMPLEMENTED_CHECKPOINTS have non-generic renderVariant', () => {
      for (const id of IMPLEMENTED_CHECKPOINTS) {
        const variant = getApprovalRenderVariant(id);
        expect(variant).not.toBe('generic');
      }
    });

    it('approve_brief uses founders_brief_panel', () => {
      expect(getApprovalRenderVariant('approve_brief')).toBe('founders_brief_panel');
    });

    it('approve_discovery_output uses discovery_output_panel', () => {
      expect(getApprovalRenderVariant('approve_discovery_output')).toBe('discovery_output_panel');
    });
  });

  describe('deferred checkpoints', () => {
    it('deferred checkpoints use generic renderVariant', () => {
      const deferred = HITL_CHECKPOINT_IDS.filter(
        (id) => !IMPLEMENTED_CHECKPOINTS.includes(id)
      );

      // Ensure we actually have deferred checkpoints to test
      expect(deferred.length).toBeGreaterThan(0);

      for (const id of deferred) {
        expect(getApprovalRenderVariant(id)).toBe('generic');
      }
    });
  });

  describe('contract coverage', () => {
    it('all checkpoint IDs have valid contract entries', () => {
      for (const id of HITL_CHECKPOINT_IDS) {
        const entry = HITL_CHECKPOINT_CONTRACT[id];
        expect(entry).toBeDefined();
        expect(entry.approvalType).toBeDefined();
        expect(entry.ownerRole).toBeDefined();
        expect(entry.renderVariant).toBeDefined();
      }
    });

    it('getApprovalRenderVariant returns generic for unknown checkpoint', () => {
      expect(getApprovalRenderVariant('unknown_checkpoint')).toBe('generic');
    });
  });
});
