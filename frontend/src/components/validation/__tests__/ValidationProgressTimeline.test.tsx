/**
 * ValidationProgressTimeline Component Tests
 *
 * @story US-E04
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ValidationProgressTimeline } from '../ValidationProgressTimeline';
import { useValidationProgress } from '@/hooks/useValidationProgress';

jest.mock('@/hooks/useValidationProgress', () => ({
  useValidationProgress: jest.fn(),
}));

const mockUseValidationProgress = useValidationProgress as jest.Mock;
const mockRefetch = jest.fn();
const mockNow = jest.fn();

const baseRun = {
  id: 'run-local-1',
  run_id: 'run-123',
  project_id: 'project-123',
  user_id: 'user-123',
  status: 'running',
  current_phase: 1,
  started_at: '2026-01-22T00:00:00Z',
};

function setMockState(runOverrides: Partial<typeof baseRun>) {
  mockUseValidationProgress.mockReturnValue({
    run: { ...baseRun, ...runOverrides },
    progress: [],
    status: 'running',
    currentPhase: 1,
    isLoading: false,
    error: null,
    refetch: mockRefetch,
  });
}

describe('ValidationProgressTimeline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRefetch.mockResolvedValue(undefined);
    global.fetch = jest.fn() as unknown as typeof fetch;
    mockNow.mockReturnValue(new Date('2026-01-22T00:00:00Z').getTime());
    jest.spyOn(Date, 'now').mockImplementation(() => mockNow());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows a warning when Phase 1 exceeds 20 minutes', () => {
    mockNow.mockReturnValue(new Date('2026-01-22T00:29:00Z').getTime());

    setMockState({ started_at: '2026-01-22T00:00:00Z' });

    render(<ValidationProgressTimeline runId="run-123" variant="inline" />);

    expect(screen.getByText('Taking longer than expected')).toBeInTheDocument();
    expect(screen.queryByText('Extended processing time')).not.toBeInTheDocument();
  });

  it('shows escalation UI when Phase 1 exceeds 30 minutes', () => {
    mockNow.mockReturnValue(new Date('2026-01-22T00:45:00Z').getTime());

    setMockState({ started_at: '2026-01-22T00:00:00Z' });

    render(<ValidationProgressTimeline runId="run-123" variant="inline" />);

    expect(screen.getByText('Extended processing time')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel and retry' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Contact Support' })).toBeInTheDocument();
  });

  it('retries the run when user clicks cancel and retry', async () => {
    mockNow.mockReturnValue(new Date('2026-01-22T00:45:00Z').getTime());

    setMockState({ started_at: '2026-01-22T00:00:00Z' });

    const onRunRestarted = jest.fn();
    (global.fetch as jest.Mock).mockResolvedValue(
      new Response(JSON.stringify({ run_id: 'run-456' }), {
        status: 202,
        headers: { 'content-type': 'application/json' },
      })
    );

    render(
      <ValidationProgressTimeline
        runId="run-123"
        variant="inline"
        onRunRestarted={onRunRestarted}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancel and retry' }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/crewai/retry', expect.any(Object));
    });

    await waitFor(() => {
      expect(onRunRestarted).toHaveBeenCalledWith('run-456');
    });
  });
});
