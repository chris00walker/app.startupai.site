/**
 * ClientOnboardingWizard Component Tests (Quick Start - ADR-006)
 *
 * Tests for the client onboarding wrapper that enables consultants
 * to start validation projects for their clients.
 * @story US-C07
*/

import { render, screen } from '@testing-library/react';
import { ClientOnboardingWizard } from '../ClientOnboardingWizard';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock QuickStartForm
interface MockQuickStartFormProps {
  clientId?: string;
  onSuccess?: (projectId: string, runId: string) => void;
  onError?: (error: Error) => void;
}

const mockQuickStartForm = jest.fn((props: MockQuickStartFormProps) => (
  <div data-testid="quick-start-form">
    QuickStartForm Mock
    {props.clientId && <span data-testid="client-id">{props.clientId}</span>}
  </div>
));

jest.mock('../QuickStartForm', () => ({
  QuickStartForm: (props: MockQuickStartFormProps) => mockQuickStartForm(props),
}));

// ============================================================================
// Tests
// ============================================================================

describe('ClientOnboardingWizard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render QuickStartForm', () => {
      render(
        <ClientOnboardingWizard
          consultantId="consultant-123"
          clientId="client-456"
        />
      );

      expect(screen.getByTestId('quick-start-form')).toBeInTheDocument();
    });

    it('should display client name when provided', () => {
      render(
        <ClientOnboardingWizard
          consultantId="consultant-123"
          clientId="client-456"
          clientName="John Doe"
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should not display client name section when not provided', () => {
      render(
        <ClientOnboardingWizard
          consultantId="consultant-123"
          clientId="client-456"
        />
      );

      expect(screen.queryByText('Starting validation for')).not.toBeInTheDocument();
    });
  });

  describe('Props Passing', () => {
    it('should pass clientId to QuickStartForm', () => {
      render(
        <ClientOnboardingWizard
          consultantId="consultant-123"
          clientId="client-456"
        />
      );

      expect(mockQuickStartForm).toHaveBeenCalledWith(
        expect.objectContaining({
          clientId: 'client-456',
        })
      );
    });

    it('should pass onSuccess callback to QuickStartForm', () => {
      render(
        <ClientOnboardingWizard
          consultantId="consultant-123"
          clientId="client-456"
        />
      );

      expect(mockQuickStartForm).toHaveBeenCalledWith(
        expect.objectContaining({
          onSuccess: expect.any(Function),
        })
      );
    });
  });

  describe('Success Callback', () => {
    it('should redirect to client project view on success', () => {
      render(
        <ClientOnboardingWizard
          consultantId="consultant-123"
          clientId="client-456"
        />
      );

      // Get the onSuccess callback that was passed to QuickStartForm
      const onSuccessCallback = mockQuickStartForm.mock.calls[0][0].onSuccess as (projectId: string) => void;

      // Simulate successful project creation
      onSuccessCallback('project-789');

      // Verify redirect to consultant's client project view
      expect(mockPush).toHaveBeenCalledWith(
        '/consultant/clients/client-456/projects/project-789'
      );
    });
  });
});
