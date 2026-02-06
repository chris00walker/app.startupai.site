/**
 * ApprovalDetailModal Integration Tests
 *
 * Tests that FoundersBriefPanel is conditionally rendered for brief approval checkpoints.
 * @story US-AH01, US-H01
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ApprovalDetailModal } from '@/components/approvals/ApprovalDetailModal';
import type { ApprovalRequest } from '@/types/crewai';
import { HITL_CHECKPOINT_CONTRACT } from '@/lib/approvals/checkpoint-contract';

function mockApprovalRequest(overrides: Partial<ApprovalRequest> = {}): ApprovalRequest {
  return {
    id: 'approval-001',
    execution_id: 'exec-001',
    task_id: 'approve_brief',
    kickoff_id: 'kickoff-001',
    user_id: 'user-001',
    project_id: 'project-001',
    approval_type: 'gate_progression',
    owner_role: 'guardian',
    title: 'Approve Founder\'s Brief',
    description: 'Review and approve the founder\'s brief before proceeding.',
    task_output: {
      founders_brief: {
        the_idea: {
          one_liner: 'Test marketplace idea',
          description: 'A test description',
        },
        problem_hypothesis: {
          problem_statement: 'Test problem statement',
        },
      },
    },
    evidence_summary: {},
    options: [
      {
        id: 'approve',
        label: 'Approve',
        description: 'Approve the brief',
        recommended: true,
      },
    ],
    status: 'pending',
    decision: null,
    human_feedback: null,
    decided_by: null,
    decided_at: null,
    auto_approvable: false,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    project: { id: 'project-001', name: 'Test Project' },
    ...overrides,
  };
}

const noop = async () => true;

describe('ApprovalDetailModal - brief integration', () => {
  it('renders FoundersBriefPanel when task_id is "approve_brief"', () => {
    const approval = mockApprovalRequest({ task_id: 'approve_brief' });

    render(
      <ApprovalDetailModal
        approval={approval}
        open={true}
        onOpenChange={() => {}}
        onApprove={noop}
        onReject={noop}
      />
    );

    expect(screen.getByTestId('founders-brief-panel')).toBeInTheDocument();
    expect(screen.getByText('Test marketplace idea')).toBeInTheDocument();
  });

  it('renders FoundersBriefPanel when task_id is "approve_founders_brief"', () => {
    const approval = mockApprovalRequest({ task_id: 'approve_founders_brief' });

    render(
      <ApprovalDetailModal
        approval={approval}
        open={true}
        onOpenChange={() => {}}
        onApprove={noop}
        onReject={noop}
      />
    );

    expect(screen.getByTestId('founders-brief-panel')).toBeInTheDocument();
  });

  it('does NOT render FoundersBriefPanel for other task_ids (e.g. "approve_vpc_completion")', () => {
    const approval = mockApprovalRequest({
      task_id: 'approve_vpc_completion',
      task_output: { some_data: 'value' },
    });

    render(
      <ApprovalDetailModal
        approval={approval}
        open={true}
        onOpenChange={() => {}}
        onApprove={noop}
        onReject={noop}
      />
    );

    expect(screen.queryByTestId('founders-brief-panel')).not.toBeInTheDocument();
  });

  it('does NOT render FoundersBriefPanel when task_output.founders_brief is missing', () => {
    const approval = mockApprovalRequest({
      task_id: 'approve_brief',
      task_output: { other_data: 'value' },
    });

    render(
      <ApprovalDetailModal
        approval={approval}
        open={true}
        onOpenChange={() => {}}
        onApprove={noop}
        onReject={noop}
      />
    );

    expect(screen.queryByTestId('founders-brief-panel')).not.toBeInTheDocument();
  });

  it('extracts brief data from approval.task_output.founders_brief', () => {
    const approval = mockApprovalRequest({
      task_id: 'approve_brief',
      task_output: {
        founders_brief: {
          the_idea: { one_liner: 'Extracted correctly' },
          problem_hypothesis: { problem_statement: 'Extracted problem' },
        },
      },
    });

    render(
      <ApprovalDetailModal
        approval={approval}
        open={true}
        onOpenChange={() => {}}
        onApprove={noop}
        onReject={noop}
      />
    );

    expect(screen.getByText('Extracted correctly')).toBeInTheDocument();
    expect(screen.getByText('Extracted problem')).toBeInTheDocument();
  });

  it('applies the expected render strategy for every known checkpoint', () => {
    for (const [checkpoint, contract] of Object.entries(HITL_CHECKPOINT_CONTRACT)) {
      const approval = mockApprovalRequest({ task_id: checkpoint });

      const { unmount } = render(
        <ApprovalDetailModal
          approval={approval}
          open={true}
          onOpenChange={() => {}}
          onApprove={noop}
          onReject={noop}
        />
      );

      if (contract.renderVariant === 'founders_brief_panel') {
        expect(screen.getByTestId('founders-brief-panel')).toBeInTheDocument();
      } else {
        expect(screen.queryByTestId('founders-brief-panel')).not.toBeInTheDocument();
      }

      unmount();
    }
  });
});
