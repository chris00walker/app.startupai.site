/**
 * ApprovalDetailModal Integration Tests
 *
 * Tests that FoundersBriefPanel is conditionally rendered for brief approval checkpoints.
 * Also tests: decision parameter (Fix 5b), rejection flow (Fix 6), toast (Fix 7),
 * original input display (Fix 8).
 *
 * @story US-AH01, US-H01, US-H04, US-H05
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ApprovalDetailModal } from '@/components/approvals/ApprovalDetailModal';
import type { ApprovalRequest } from '@/types/crewai';
import { HITL_CHECKPOINT_CONTRACT } from '@/lib/approvals/checkpoint-contract';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/approvals',
}));

const mockToastSuccess = jest.fn();
jest.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

const mockTrackEvent = jest.fn();

jest.mock('@/lib/analytics/index', () => ({
  trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
}));

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
  beforeEach(() => {
    mockTrackEvent.mockClear();
    mockToastSuccess.mockClear();
  });

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

  it('renders explicit warning and telemetry for unknown checkpoints', async () => {
    const approval = mockApprovalRequest({ task_id: 'unknown_checkpoint' });

    render(
      <ApprovalDetailModal
        approval={approval}
        open={true}
        onOpenChange={() => {}}
        onApprove={noop}
        onReject={noop}
      />
    );

    expect(screen.getByTestId('unsupported-checkpoint-warning')).toBeInTheDocument();
    expect(screen.queryByTestId('founders-brief-panel')).not.toBeInTheDocument();

    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenCalledWith(
        'approval_checkpoint_unsupported',
        expect.objectContaining({
          approvalId: approval.id,
          taskId: 'unknown_checkpoint',
        })
      );
    });
  });
});

// =============================================================================
// Fix 5b: decision parameter passed through onReject
// =============================================================================

describe('ApprovalDetailModal - decision parameter', () => {
  beforeEach(() => {
    mockTrackEvent.mockClear();
    mockToastSuccess.mockClear();
  });

  it('passes decision="rejected" to onReject by default', async () => {
    const mockReject = jest.fn().mockResolvedValue(true);
    const approval = mockApprovalRequest({ task_id: 'approve_brief' });

    render(
      <ApprovalDetailModal
        approval={approval}
        open={true}
        onOpenChange={() => {}}
        onApprove={noop}
        onReject={mockReject}
      />
    );

    // Type feedback (required for brief rejection)
    const textarea = screen.getByPlaceholderText(/add any notes/i);
    await userEvent.type(textarea, 'Needs revision');

    // Click reject
    const rejectBtn = screen.getByRole('button', { name: /reject/i });
    await userEvent.click(rejectBtn);

    await waitFor(() => {
      expect(mockReject).toHaveBeenCalledWith('approval-001', 'Needs revision', 'rejected');
    });
  });
});

// =============================================================================
// Fix 6: Brief rejection flow — feedback required, button disabled/enabled
// Fix 7: Toast on success/failure
// =============================================================================

describe('ApprovalDetailModal - brief rejection flow', () => {
  beforeEach(() => {
    mockTrackEvent.mockClear();
    mockToastSuccess.mockClear();
  });

  it('disables Reject button for brief checkpoints when feedback is empty', () => {
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

    const rejectBtn = screen.getByRole('button', { name: /reject/i });
    expect(rejectBtn).toBeDisabled();
  });

  it('enables Reject button for brief checkpoints when feedback has content', async () => {
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

    const textarea = screen.getByPlaceholderText(/add any notes/i);
    await userEvent.type(textarea, 'Some feedback');

    const rejectBtn = screen.getByRole('button', { name: /reject/i });
    expect(rejectBtn).not.toBeDisabled();
  });

  it('does NOT disable Reject button for non-brief checkpoints when feedback is empty', () => {
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

    const rejectBtn = screen.getByRole('button', { name: /reject/i });
    expect(rejectBtn).not.toBeDisabled();
  });

  it('shows feedback label with "required for rejection" for brief checkpoints', () => {
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

    expect(screen.getByText(/required for rejection/i)).toBeInTheDocument();
  });

  it('calls toast.success after successful rejection', async () => {
    const mockReject = jest.fn().mockResolvedValue(true);
    const approval = mockApprovalRequest({ task_id: 'approve_brief' });

    render(
      <ApprovalDetailModal
        approval={approval}
        open={true}
        onOpenChange={() => {}}
        onApprove={noop}
        onReject={mockReject}
      />
    );

    const textarea = screen.getByPlaceholderText(/add any notes/i);
    await userEvent.type(textarea, 'Needs changes');

    const rejectBtn = screen.getByRole('button', { name: /reject/i });
    await userEvent.click(rejectBtn);

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith('Brief rejected — feedback submitted');
    });
  });

  it('calls toast.success after successful approval', async () => {
    const mockApprove = jest.fn().mockResolvedValue(true);
    // Use an approval without options so the Approve button is not disabled
    const approval = mockApprovalRequest({ task_id: 'approve_brief', options: [] });

    render(
      <ApprovalDetailModal
        approval={approval}
        open={true}
        onOpenChange={() => {}}
        onApprove={mockApprove}
        onReject={noop}
      />
    );

    const approveBtn = screen.getByRole('button', { name: /approve/i });
    await userEvent.click(approveBtn);

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith('Brief approved — validation will resume');
    });
  });

  it('keeps inline error (not toast) when rejection fails', async () => {
    const mockReject = jest.fn().mockResolvedValue(false);
    const approval = mockApprovalRequest({ task_id: 'approve_brief' });

    render(
      <ApprovalDetailModal
        approval={approval}
        open={true}
        onOpenChange={() => {}}
        onApprove={noop}
        onReject={mockReject}
      />
    );

    const textarea = screen.getByPlaceholderText(/add any notes/i);
    await userEvent.type(textarea, 'Bad brief');

    const rejectBtn = screen.getByRole('button', { name: /reject/i });
    await userEvent.click(rejectBtn);

    await waitFor(() => {
      expect(screen.getByText(/failed to reject/i)).toBeInTheDocument();
      expect(mockToastSuccess).not.toHaveBeenCalled();
    });
  });
});

// =============================================================================
// Fix 8: Original input display
// =============================================================================

describe('ApprovalDetailModal - original input display', () => {
  beforeEach(() => {
    mockTrackEvent.mockClear();
    mockToastSuccess.mockClear();
  });

  it('renders "Your original input" box when task_output.entrepreneur_input is present', () => {
    const approval = mockApprovalRequest({
      task_id: 'approve_brief',
      task_output: {
        founders_brief: { the_idea: { one_liner: 'Test idea' } },
        entrepreneur_input: 'Dog walking subscription service',
        hints: { industry: 'pet care', geography: 'US' },
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

    expect(screen.getByText('Your original input:')).toBeInTheDocument();
    expect(screen.getByText('Dog walking subscription service')).toBeInTheDocument();
    expect(screen.getByText(/pet care/i)).toBeInTheDocument();
  });

  it('does not render "Your original input" box when entrepreneur_input is absent', () => {
    const approval = mockApprovalRequest({
      task_id: 'approve_brief',
      task_output: {
        founders_brief: { the_idea: { one_liner: 'Test idea' } },
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

    expect(screen.queryByText('Your original input:')).not.toBeInTheDocument();
  });
});
