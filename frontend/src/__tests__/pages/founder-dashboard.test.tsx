/**
 * Founder Dashboard Button Routing Tests
 *
 * Tests that the "Create Your First Project" and "New Project" buttons
 * route correctly to Alex's onboarding instead of the quick wizard.
 */

import { render, screen, waitFor } from '@testing-library/react';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    query: {},
  }),
}));

// Mock Next.js Link component to capture href
jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => {
    return <a href={href} data-testid="next-link" {...props}>{children}</a>;
  };
});

// Mock hooks
const mockUseProjects = jest.fn();
const mockUseAuth = jest.fn();
const mockUseGateEvaluation = jest.fn();
const mockUseGateAlerts = jest.fn();
const mockUseRecentActivity = jest.fn();
const mockUseRecommendedActions = jest.fn();

jest.mock('@/hooks/useProjects', () => ({
  useProjects: () => mockUseProjects(),
}));

jest.mock('@/lib/auth/hooks', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('@/hooks/useGateEvaluation', () => ({
  useGateEvaluation: () => mockUseGateEvaluation(),
}));

jest.mock('@/hooks/useGateAlerts', () => ({
  useGateAlerts: () => mockUseGateAlerts(),
}));

jest.mock('@/hooks/useRecentActivity', () => ({
  useRecentActivity: () => mockUseRecentActivity(),
}));

jest.mock('@/hooks/useRecommendedActions', () => ({
  useRecommendedActions: () => mockUseRecommendedActions(),
}));

// Mock analytics
jest.mock('@/lib/analytics', () => ({
  trackPageView: jest.fn(),
  trackEvent: jest.fn(),
}));

// Mock DashboardLayout
jest.mock('@/components/layout/DashboardLayout', () => ({
  DashboardLayout: ({ children }: any) => <div data-testid="dashboard-layout">{children}</div>,
}));

// Mock other components that aren't relevant to this test
jest.mock('@/components/fit/FitDashboard', () => ({
  FitDashboard: () => <div data-testid="fit-dashboard" />,
}));

jest.mock('@/components/gates/GateDashboard', () => ({
  GateDashboard: () => <div data-testid="gate-dashboard" />,
}));

jest.mock('@/components/validation/ValidationResultsSummary', () => ({
  ValidationResultsSummary: () => <div data-testid="validation-summary" />,
}));

jest.mock('@/components/gates/GateStatusBadge', () => ({
  GateStatusBadge: () => <div data-testid="gate-badge" />,
}));

jest.mock('@/components/gates/GateReadinessIndicator', () => ({
  GateReadinessIndicator: () => <div data-testid="gate-readiness" />,
}));

jest.mock('@/components/fit/EvidenceLedger', () => ({
  EvidenceLedger: () => <div data-testid="evidence-ledger" />,
}));

jest.mock('@/components/founder/StageSelector', () => ({
  StageSelector: () => <div data-testid="stage-selector" />,
}));

jest.mock('@/components/onboarding/ProjectCreationWizard', () => ({
  ProjectCreationWizard: () => <div data-testid="project-wizard" />,
}));

jest.mock('@/components/assistant/DashboardAIAssistant', () => ({
  DashboardAIAssistant: () => <div data-testid="ai-assistant" />,
}));

jest.mock('@/components/vpc', () => ({
  VPCSummaryCard: () => <div data-testid="vpc-summary" />,
}));

jest.mock('@/components/signals', () => ({
  InnovationPhysicsPanel: () => <div data-testid="innovation-panel" />,
}));

jest.mock('@/components/strategyzer', () => ({
  AssumptionMap: () => <div data-testid="assumption-map" />,
  ExperimentCardsGrid: () => <div data-testid="experiment-cards" />,
  CanvasesGallery: () => <div data-testid="canvases-gallery" />,
}));

// Import the component after all mocks
import FounderDashboard from '@/pages/founder-dashboard';

describe('FounderDashboard Button Routing', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock fetch for /api/onboarding/status - return no active session
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ success: false }),
    });

    // Default mock returns
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123', email: 'test@example.com' },
    });

    mockUseGateEvaluation.mockReturnValue({
      result: null,
      isLoading: false,
    });

    mockUseGateAlerts.mockReturnValue({
      alerts: [],
    });

    mockUseRecentActivity.mockReturnValue({
      activities: [],
      isLoading: false,
    });

    mockUseRecommendedActions.mockReturnValue({
      actions: [],
      isLoading: false,
    });
  });

  describe('empty state (no projects)', () => {
    beforeEach(() => {
      mockUseProjects.mockReturnValue({
        projects: [],
        isLoading: false,
        error: null,
      });
    });

    it('should render "Start with Alex" as primary CTA', async () => {
      render(<FounderDashboard />);

      await waitFor(() => {
        expect(screen.queryByTestId('dashboard-loading')).not.toBeInTheDocument();
      });

      const primaryButton = screen.getByRole('button', { name: /start with alex/i });
      expect(primaryButton).toBeInTheDocument();
    });

    it('should link primary CTA to /onboarding/founder', async () => {
      render(<FounderDashboard />);

      await waitFor(() => {
        expect(screen.queryByTestId('dashboard-loading')).not.toBeInTheDocument();
      });

      const primaryLink = screen.getByRole('link', { name: /start with alex/i });
      expect(primaryLink).toHaveAttribute('href', '/onboarding/founder');
    });

    it('should render "Quick Create" as secondary option', async () => {
      render(<FounderDashboard />);

      await waitFor(() => {
        expect(screen.queryByTestId('dashboard-loading')).not.toBeInTheDocument();
      });

      const secondaryButton = screen.getByRole('button', { name: /quick create/i });
      expect(secondaryButton).toBeInTheDocument();
    });

    it('should link secondary option to /projects/new', async () => {
      render(<FounderDashboard />);

      await waitFor(() => {
        expect(screen.queryByTestId('dashboard-loading')).not.toBeInTheDocument();
      });

      const quickCreateLink = screen.getByRole('link', { name: /quick create/i });
      expect(quickCreateLink).toHaveAttribute('href', '/projects/new');
    });

    it('should show MessageSquare icon for Alex button', async () => {
      render(<FounderDashboard />);

      await waitFor(() => {
        expect(screen.queryByTestId('dashboard-loading')).not.toBeInTheDocument();
      });

      // The button should contain the MessageSquare icon
      const primaryButton = screen.getByRole('button', { name: /start with alex/i });
      expect(primaryButton.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('dashboard with existing projects', () => {
    beforeEach(() => {
      mockUseProjects.mockReturnValue({
        projects: [
          {
            id: 'project-123',
            name: 'My Startup',
            stage: 'FEASIBILITY',
            gateStatus: 'Pending',
          },
        ],
        isLoading: false,
        error: null,
      });
    });

    it('should render "New Project" button', async () => {
      render(<FounderDashboard />);

      await waitFor(() => {
        expect(screen.queryByTestId('dashboard-loading')).not.toBeInTheDocument();
      });

      const newProjectButton = screen.getByRole('button', { name: /new project/i });
      expect(newProjectButton).toBeInTheDocument();
    });

    it('should link "New Project" to /onboarding/founder', async () => {
      render(<FounderDashboard />);

      await waitFor(() => {
        expect(screen.queryByTestId('dashboard-loading')).not.toBeInTheDocument();
      });

      const newProjectLink = screen.getByRole('link', { name: /new project/i });
      expect(newProjectLink).toHaveAttribute('href', '/onboarding/founder');
    });

    it('should NOT link "New Project" to /projects/new (old behavior)', async () => {
      render(<FounderDashboard />);

      await waitFor(() => {
        expect(screen.queryByTestId('dashboard-loading')).not.toBeInTheDocument();
      });

      const newProjectLink = screen.getByRole('link', { name: /new project/i });
      expect(newProjectLink).not.toHaveAttribute('href', '/projects/new');
    });
  });

  describe('loading state', () => {
    it('should show loading indicator when projects are loading', () => {
      mockUseProjects.mockReturnValue({
        projects: [],
        isLoading: true,
        error: null,
      });

      render(<FounderDashboard />);

      expect(screen.getByTestId('dashboard-loading')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should show error message when projects fail to load', async () => {
      mockUseProjects.mockReturnValue({
        projects: [],
        isLoading: false,
        error: { message: 'Failed to load projects' },
      });

      render(<FounderDashboard />);

      await waitFor(() => {
        expect(screen.queryByTestId('dashboard-loading')).not.toBeInTheDocument();
      });

      expect(screen.getByText(/error loading projects/i)).toBeInTheDocument();
    });
  });
});
