/**
 * ValidationProgressTimeline Component Tests
 *
 * Tests rendering of failed state (sanitized errors), paused state (HITL banner),
 * and deterministic progress percentages for known HITL checkpoints.
 *
 * @story US-E04
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ValidationProgressTimeline } from '@/components/validation/ValidationProgressTimeline';
import { useValidationProgress } from '@/hooks/useValidationProgress';
import type { UseValidationProgressResult } from '@/hooks/useValidationProgress';
import type { ValidationRun } from '@/types/validation-progress';

jest.mock('@/hooks/useValidationProgress', () => ({
  useValidationProgress: jest.fn(),
}));

const mockUseValidationProgress = useValidationProgress as jest.Mock;

function mockResult(overrides: Partial<UseValidationProgressResult>): UseValidationProgressResult {
  return {
    run: null,
    progress: [],
    status: 'idle',
    currentPhase: 0,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
    ...overrides,
  };
}

function mockRun(overrides: Partial<ValidationRun>): ValidationRun {
  return {
    id: 'db-id-1',
    run_id: 'run-test-1',
    project_id: 'project-001',
    user_id: 'user-001',
    status: 'running',
    current_phase: 1,
    started_at: '2026-01-18T10:00:00Z',
    ...overrides,
  };
}

describe('ValidationProgressTimeline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('failed state', () => {
    it('renders failed state with sanitized error message', () => {
      const run = mockRun({
        status: 'failed',
        error_message:
          '1 validation error for ValueMap\npain_relievers.2.effectiveness\n  Input should be a valid string [type=string_type]',
      });

      mockUseValidationProgress.mockReturnValue(
        mockResult({
          run,
          status: 'failed',
          currentPhase: 1,
        })
      );

      render(<ValidationProgressTimeline runId="run-test-1" />);

      // "Validation Failed" badge should be visible
      expect(screen.getByText('Validation Failed')).toBeInTheDocument();

      // Sanitized first line should be visible
      expect(
        screen.getByText('1 validation error for ValueMap')
      ).toBeInTheDocument();

      // Full stack trace should NOT be visible
      expect(
        screen.queryByText(/Input should be a valid string/)
      ).not.toBeInTheDocument();

      // "Start New Validation" retry button should be visible
      expect(
        screen.getByRole('button', { name: /start new validation/i })
      ).toBeInTheDocument();
    });
  });

  describe('paused state', () => {
    it('renders paused state with HITL banner', () => {
      const run = mockRun({
        status: 'paused',
        hitl_state: 'approve_brief',
        current_phase: 1,
      });

      mockUseValidationProgress.mockReturnValue(
        mockResult({
          run,
          status: 'paused',
          currentPhase: 1,
        })
      );

      render(<ValidationProgressTimeline runId="run-test-1" />);

      // "Action Required" badge
      expect(screen.getByText('Action Required')).toBeInTheDocument();

      // "Review & Approve" button
      expect(
        screen.getByRole('button', { name: /review & approve/i })
      ).toBeInTheDocument();
    });
  });

  describe('deterministic progress for paused states', () => {
    it('progress shows 23% at approve_brief pause', () => {
      const run = mockRun({
        status: 'paused',
        hitl_state: 'approve_brief',
        current_phase: 1,
      });

      mockUseValidationProgress.mockReturnValue(
        mockResult({
          run,
          status: 'paused',
          currentPhase: 1,
        })
      );

      render(<ValidationProgressTimeline runId="run-test-1" />);

      expect(screen.getByText('23%')).toBeInTheDocument();
    });

    it('progress shows 40% at approve_discovery_output pause', () => {
      const run = mockRun({
        status: 'paused',
        hitl_state: 'approve_discovery_output',
        current_phase: 1,
      });

      mockUseValidationProgress.mockReturnValue(
        mockResult({
          run,
          status: 'paused',
          currentPhase: 1,
        })
      );

      render(<ValidationProgressTimeline runId="run-test-1" />);

      expect(screen.getByText('40%')).toBeInTheDocument();
    });
  });
});
