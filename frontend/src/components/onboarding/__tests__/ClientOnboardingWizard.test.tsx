/**
 * ClientOnboardingWizard Component Tests
 *
 * Tests for the client onboarding wrapper that enables consultants
 * to onboard clients through Alex.
 */

import { render, screen } from '@testing-library/react';
import { ClientOnboardingWizard } from '../ClientOnboardingWizard';

// Mock FounderOnboardingWizard to verify props are passed correctly
const mockFounderOnboardingWizard = jest.fn((props: Record<string, unknown>) => (
  <div data-testid="founder-wizard">FounderOnboardingWizard Mock</div>
));

jest.mock('../FounderOnboardingWizard', () => ({
  FounderOnboardingWizard: (props: Record<string, unknown>) => mockFounderOnboardingWizard(props),
}));

// ============================================================================
// Tests
// ============================================================================

describe('ClientOnboardingWizard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render FounderOnboardingWizard', () => {
      render(
        <ClientOnboardingWizard
          userId="user-123"
          userEmail="test@example.com"
        />
      );

      expect(screen.getByTestId('founder-wizard')).toBeInTheDocument();
    });
  });

  describe('Props Passing', () => {
    it('should pass userId to FounderOnboardingWizard', () => {
      render(
        <ClientOnboardingWizard
          userId="user-123"
          userEmail="test@example.com"
        />
      );

      expect(mockFounderOnboardingWizard).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
        })
      );
    });

    it('should pass userEmail to FounderOnboardingWizard', () => {
      render(
        <ClientOnboardingWizard
          userId="user-123"
          userEmail="consultant@example.com"
        />
      );

      expect(mockFounderOnboardingWizard).toHaveBeenCalledWith(
        expect.objectContaining({
          userEmail: 'consultant@example.com',
        })
      );
    });

    it('should set mode to "client"', () => {
      render(
        <ClientOnboardingWizard
          userId="user-123"
          userEmail="test@example.com"
        />
      );

      expect(mockFounderOnboardingWizard).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'client',
        })
      );
    });

    it('should set planType to "founder"', () => {
      render(
        <ClientOnboardingWizard
          userId="user-123"
          userEmail="test@example.com"
        />
      );

      expect(mockFounderOnboardingWizard).toHaveBeenCalledWith(
        expect.objectContaining({
          planType: 'founder',
        })
      );
    });

    it('should pass clientProjectId when provided', () => {
      render(
        <ClientOnboardingWizard
          userId="user-123"
          userEmail="test@example.com"
          clientProjectId="project-456"
        />
      );

      expect(mockFounderOnboardingWizard).toHaveBeenCalledWith(
        expect.objectContaining({
          clientProjectId: 'project-456',
        })
      );
    });

    it('should not include clientProjectId when not provided', () => {
      render(
        <ClientOnboardingWizard
          userId="user-123"
          userEmail="test@example.com"
        />
      );

      expect(mockFounderOnboardingWizard).toHaveBeenCalledWith(
        expect.objectContaining({
          clientProjectId: undefined,
        })
      );
    });
  });

  describe('All Props Combined', () => {
    it('should pass all props correctly', () => {
      render(
        <ClientOnboardingWizard
          userId="user-456"
          userEmail="consultant@company.com"
          clientProjectId="project-789"
        />
      );

      expect(mockFounderOnboardingWizard).toHaveBeenCalledWith({
        userId: 'user-456',
        userEmail: 'consultant@company.com',
        planType: 'founder',
        mode: 'client',
        clientProjectId: 'project-789',
      });
    });
  });

  describe('Mode Differentiation', () => {
    it('should always use client mode (not founder mode)', () => {
      render(
        <ClientOnboardingWizard
          userId="user-123"
          userEmail="test@example.com"
        />
      );

      // Verify mode is 'client' not 'founder'
      expect(mockFounderOnboardingWizard).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'client',
        })
      );

      // Verify it wasn't called with founder mode
      expect(mockFounderOnboardingWizard).not.toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'founder',
        })
      );
    });
  });
});
