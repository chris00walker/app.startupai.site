/**
 * Canonical HITL checkpoint contract for approval routing and UI rendering.
 *
 * Keeps backend checkpoint mapping and frontend rendering rules in one place.
 */

import type { ApprovalType, OwnerRole } from '@/types/crewai';

export type ApprovalRenderVariant = 'founders_brief_panel' | 'generic';

export interface HitlCheckpointContract {
  approvalType: ApprovalType;
  ownerRole: OwnerRole;
  renderVariant: ApprovalRenderVariant;
}

const CHECKPOINT_CONTRACT = {
  approve_brief: {
    approvalType: 'gate_progression',
    ownerRole: 'compass',
    renderVariant: 'founders_brief_panel',
  },
  approve_founders_brief: {
    approvalType: 'gate_progression',
    ownerRole: 'compass',
    renderVariant: 'founders_brief_panel',
  },
  approve_vpc_completion: {
    approvalType: 'gate_progression',
    ownerRole: 'compass',
    renderVariant: 'generic',
  },
  approve_experiment_plan: {
    approvalType: 'gate_progression',
    ownerRole: 'pulse',
    renderVariant: 'generic',
  },
  approve_pricing_test: {
    approvalType: 'gate_progression',
    ownerRole: 'ledger',
    renderVariant: 'generic',
  },
  approve_campaign_launch: {
    approvalType: 'campaign_launch',
    ownerRole: 'pulse',
    renderVariant: 'generic',
  },
  approve_spend_increase: {
    approvalType: 'spend_increase',
    ownerRole: 'ledger',
    renderVariant: 'generic',
  },
  approve_desirability_gate: {
    approvalType: 'gate_progression',
    ownerRole: 'compass',
    renderVariant: 'generic',
  },
  approve_feasibility_gate: {
    approvalType: 'gate_progression',
    ownerRole: 'forge',
    renderVariant: 'generic',
  },
  approve_viability_gate: {
    approvalType: 'gate_progression',
    ownerRole: 'ledger',
    renderVariant: 'generic',
  },
  approve_pivot: {
    approvalType: 'segment_pivot',
    ownerRole: 'compass',
    renderVariant: 'generic',
  },
  approve_proceed: {
    approvalType: 'gate_progression',
    ownerRole: 'compass',
    renderVariant: 'generic',
  },
  request_human_decision: {
    approvalType: 'gate_progression',
    ownerRole: 'compass',
    renderVariant: 'generic',
  },
} satisfies Record<string, HitlCheckpointContract>;

export const HITL_CHECKPOINT_CONTRACT = CHECKPOINT_CONTRACT;

export type HitlCheckpointId = keyof typeof CHECKPOINT_CONTRACT;

export const HITL_CHECKPOINT_IDS = Object.freeze(
  Object.keys(CHECKPOINT_CONTRACT) as HitlCheckpointId[]
);

export function isHitlCheckpointId(checkpoint: string): checkpoint is HitlCheckpointId {
  return checkpoint in HITL_CHECKPOINT_CONTRACT;
}

export function getHitlCheckpointContract(checkpoint: string): HitlCheckpointContract | undefined {
  if (!isHitlCheckpointId(checkpoint)) {
    return undefined;
  }
  return HITL_CHECKPOINT_CONTRACT[checkpoint];
}

export function getApprovalRenderVariant(taskId: string): ApprovalRenderVariant {
  return getHitlCheckpointContract(taskId)?.renderVariant ?? 'generic';
}

export function isFoundersBriefCheckpoint(taskId: string): boolean {
  return getApprovalRenderVariant(taskId) === 'founders_brief_panel';
}
