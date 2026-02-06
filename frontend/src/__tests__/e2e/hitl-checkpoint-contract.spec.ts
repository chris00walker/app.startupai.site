import { test, expect } from '@playwright/test';
import {
  HITL_CHECKPOINT_CONTRACT,
  HITL_CHECKPOINT_IDS,
} from '../../lib/approvals/checkpoint-contract';

test.describe('HITL checkpoint contract coverage', () => {
  test('checkpoint contract defines at least one checkpoint', async () => {
    expect(HITL_CHECKPOINT_IDS.length).toBeGreaterThan(0);
  });

  for (const checkpoint of HITL_CHECKPOINT_IDS) {
    test(`checkpoint "${checkpoint}" is represented in the E2E contract layer`, async () => {
      const contract = HITL_CHECKPOINT_CONTRACT[checkpoint];
      expect(contract).toBeDefined();
      expect(contract.approvalType).toBeTruthy();
      expect(contract.ownerRole).toBeTruthy();
      expect(['founders_brief_panel', 'generic']).toContain(contract.renderVariant);
    });
  }
});
