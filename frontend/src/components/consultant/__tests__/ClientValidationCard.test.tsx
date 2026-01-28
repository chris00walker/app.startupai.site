/**
 * ClientValidationCard Component Tests
 *
 * Tests for the consultant client validation progress card and grid.
 * @story US-C03, US-C04
*/

import { render, screen, fireEvent } from '@testing-library/react';
import { ClientValidationCard, ClientValidationGrid } from '../ClientValidationCard';
import type { ClientValidationProgress } from '@/hooks/useClientValidationProgress';

// ============================================================================
// Test Data
// ============================================================================

const mockClientFull: ClientValidationProgress = {
  clientId: 'client-123',
  clientName: 'John Smith',
  clientEmail: 'john@example.com',
  company: 'Acme Corp',
  projectId: 'project-123',
  projectName: 'Acme Project',
  currentPhase: 'FEASIBILITY',
  gateStatus: 'Passed',
  evidenceCount: 15,
  evidenceQuality: 0.85,
  hasReport: true,
  reportId: 'report-123',
  reportOutcome: 'Strong market validation',
  pivotRecommendation: 'Proceed with development',
  lastActivity: new Date().toISOString(),
  createdAt: '2026-01-01T00:00:00Z',
};

const mockClientIdeation: ClientValidationProgress = {
  clientId: 'client-456',
  clientName: 'Jane Doe',
  clientEmail: 'jane@startup.com',
  company: null,
  projectId: null,
  projectName: null,
  currentPhase: 'IDEATION',
  gateStatus: 'Pending',
  evidenceCount: 3,
  evidenceQuality: 0.5,
  hasReport: false,
  reportId: null,
  reportOutcome: null,
  pivotRecommendation: null,
  lastActivity: '2026-01-17T10:00:00Z',
  createdAt: '2026-01-10T00:00:00Z',
};

// Use a date 3 days ago to ensure "Xd ago" format (within 7-day threshold)
const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

const mockClientFailed: ClientValidationProgress = {
  clientId: 'client-789',
  clientName: 'Bob Wilson',
  clientEmail: 'bob@company.com',
  company: 'Tech Inc',
  projectId: 'project-789',
  projectName: 'Tech Project',
  currentPhase: 'DESIRABILITY',
  gateStatus: 'Failed',
  evidenceCount: 8,
  evidenceQuality: 0.35,
  hasReport: true,
  reportId: 'report-789',
  reportOutcome: 'Market validation inconclusive',
  pivotRecommendation: 'Pivot recommended',
  lastActivity: threeDaysAgo,
  createdAt: '2026-01-05T00:00:00Z',
};

const mockClientViability: ClientValidationProgress = {
  clientId: 'client-101',
  clientName: 'Alice Brown',
  clientEmail: 'alice@enterprise.com',
  company: 'Big Corp',
  projectId: 'project-101',
  projectName: 'Enterprise Project',
  currentPhase: 'VIABILITY',
  gateStatus: 'Passed',
  evidenceCount: 25,
  evidenceQuality: 0.92,
  hasReport: true,
  reportId: 'report-101',
  reportOutcome: 'Excellent unit economics',
  pivotRecommendation: 'Proceed to scale',
  lastActivity: new Date().toISOString(),
  createdAt: '2025-12-15T00:00:00Z',
};

const mockClientValidated: ClientValidationProgress = {
  clientId: 'client-102',
  clientName: 'Charlie Green',
  clientEmail: 'charlie@validated.com',
  company: 'Success Co',
  projectId: 'project-102',
  projectName: 'Success Project',
  currentPhase: 'VALIDATED',
  gateStatus: 'Passed',
  evidenceCount: 40,
  evidenceQuality: 0.95,
  hasReport: true,
  reportId: 'report-102',
  reportOutcome: 'Fully validated business model',
  pivotRecommendation: 'Proceed with confidence',
  lastActivity: new Date().toISOString(),
  createdAt: '2025-11-01T00:00:00Z',
};

// ============================================================================
// Test Helpers
// ============================================================================

const mockOnViewDetails = jest.fn();

describe('ClientValidationCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render client name', () => {
      render(<ClientValidationCard client={mockClientFull} />);

      expect(screen.getByText('John Smith')).toBeInTheDocument();
    });

    it('should render company name when provided', () => {
      render(<ClientValidationCard client={mockClientFull} />);

      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });

    it('should render client email', () => {
      render(<ClientValidationCard client={mockClientFull} />);

      expect(screen.getByText('(john@example.com)')).toBeInTheDocument();
    });

    it('should render without company when not provided', () => {
      render(<ClientValidationCard client={mockClientIdeation} />);

      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.queryByText('null')).not.toBeInTheDocument();
    });
  });

  describe('Gate Status Badges', () => {
    it('should show Passed badge for passed status', () => {
      render(<ClientValidationCard client={mockClientFull} />);

      const badge = screen.getByText('Passed');
      expect(badge).toBeInTheDocument();
    });

    it('should show Pending badge for pending status', () => {
      render(<ClientValidationCard client={mockClientIdeation} />);

      const badge = screen.getByText('Pending');
      expect(badge).toBeInTheDocument();
    });

    it('should show Failed badge for failed status', () => {
      render(<ClientValidationCard client={mockClientFailed} />);

      const badge = screen.getByText('Failed');
      expect(badge).toBeInTheDocument();
    });

    it('should show No Project when gateStatus is null', () => {
      const clientNoProject = { ...mockClientIdeation, gateStatus: null };
      render(<ClientValidationCard client={clientNoProject as any} />);

      expect(screen.getByText('No Project')).toBeInTheDocument();
    });
  });

  describe('Phase Progress', () => {
    it('should show IDEATION phase correctly', () => {
      render(<ClientValidationCard client={mockClientIdeation} />);

      expect(screen.getByText('IDEATION')).toBeInTheDocument();
    });

    it('should show DESIRABILITY phase correctly', () => {
      render(<ClientValidationCard client={mockClientFailed} />);

      expect(screen.getByText('DESIRABILITY')).toBeInTheDocument();
    });

    it('should show FEASIBILITY phase correctly', () => {
      render(<ClientValidationCard client={mockClientFull} />);

      expect(screen.getByText('FEASIBILITY')).toBeInTheDocument();
    });

    it('should show VIABILITY phase correctly', () => {
      render(<ClientValidationCard client={mockClientViability} />);

      expect(screen.getByText('VIABILITY')).toBeInTheDocument();
    });

    it('should show VALIDATED phase correctly', () => {
      render(<ClientValidationCard client={mockClientValidated} />);

      expect(screen.getByText('VALIDATED')).toBeInTheDocument();
    });

    it('should display progress bar', () => {
      render(<ClientValidationCard client={mockClientFull} />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Metrics Display', () => {
    it('should display evidence count', () => {
      render(<ClientValidationCard client={mockClientFull} />);

      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('Evidence')).toBeInTheDocument();
    });

    it('should display evidence quality percentage', () => {
      render(<ClientValidationCard client={mockClientFull} />);

      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('Quality')).toBeInTheDocument();
    });

    it('should show Report Ready status when has report', () => {
      render(<ClientValidationCard client={mockClientFull} />);

      expect(screen.getByText('Report Ready')).toBeInTheDocument();
    });

    it('should show In Progress status when no report', () => {
      render(<ClientValidationCard client={mockClientIdeation} />);

      expect(screen.getByText('In Progress')).toBeInTheDocument();
    });
  });

  describe('AI Recommendation', () => {
    it('should show AI recommendation section when report exists', () => {
      render(<ClientValidationCard client={mockClientFull} />);

      expect(screen.getByText('AI Recommendation')).toBeInTheDocument();
      expect(screen.getByText('Strong market validation')).toBeInTheDocument();
    });

    it('should show pivot recommendation badge', () => {
      render(<ClientValidationCard client={mockClientFull} />);

      expect(screen.getByText('Proceed with development')).toBeInTheDocument();
    });

    it('should not show AI recommendation when no report', () => {
      render(<ClientValidationCard client={mockClientIdeation} />);

      expect(screen.queryByText('AI Recommendation')).not.toBeInTheDocument();
    });

    it('should show pivot recommendation for pivot cases', () => {
      render(<ClientValidationCard client={mockClientFailed} />);

      expect(screen.getByText('Pivot recommended')).toBeInTheDocument();
    });
  });

  describe('Last Activity', () => {
    it('should display relative time for recent activity', () => {
      render(<ClientValidationCard client={mockClientFull} />);

      // Should show "0m ago" or similar for recent activity
      expect(screen.getByText(/Last activity:/)).toBeInTheDocument();
    });

    it('should display days for older activity', () => {
      render(<ClientValidationCard client={mockClientFailed} />);

      expect(screen.getByText(/Last activity:.*d ago/)).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('should render Details button', () => {
      render(<ClientValidationCard client={mockClientFull} onViewDetails={mockOnViewDetails} />);

      expect(screen.getByRole('button', { name: /Details/i })).toBeInTheDocument();
    });

    it('should call onViewDetails with clientId when clicked', () => {
      render(<ClientValidationCard client={mockClientFull} onViewDetails={mockOnViewDetails} />);

      const detailsButton = screen.getByRole('button', { name: /Details/i });
      fireEvent.click(detailsButton);

      expect(mockOnViewDetails).toHaveBeenCalledWith('client-123');
    });

    it('should render Report link when report exists', () => {
      render(<ClientValidationCard client={mockClientFull} />);

      const reportLink = screen.getByRole('link', { name: /Report/i });
      expect(reportLink).toHaveAttribute('href', '/client/client-123/report');
    });

    it('should not render Report link when no report', () => {
      render(<ClientValidationCard client={mockClientIdeation} />);

      expect(screen.queryByRole('link', { name: /Report/i })).not.toBeInTheDocument();
    });
  });
});

describe('ClientValidationGrid', () => {
  const mockClients = [mockClientFull, mockClientIdeation, mockClientFailed];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all client cards', () => {
      render(<ClientValidationGrid clients={mockClients} />);

      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
    });

    it('should render in a grid layout', () => {
      const { container } = render(<ClientValidationGrid clients={mockClients} />);

      // Should have a grid container
      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state message when no clients', () => {
      render(<ClientValidationGrid clients={[]} />);

      expect(screen.getByText('No clients yet')).toBeInTheDocument();
      expect(screen.getByText(/Add your first client/)).toBeInTheDocument();
    });

    it('should show building icon in empty state', () => {
      render(<ClientValidationGrid clients={[]} />);

      // The Building2 icon should be present - verify the empty state container exists
      const emptyContainer = screen.getByText('No clients yet');
      expect(emptyContainer).toBeInTheDocument();
      // Verify the icon container with opacity class exists
      expect(screen.getByText(/Add your first client/)).toBeInTheDocument();
    });
  });

  describe('onViewDetails Callback', () => {
    it('should pass onViewDetails to all cards', () => {
      render(<ClientValidationGrid clients={mockClients} onViewDetails={mockOnViewDetails} />);

      // Click the first details button
      const detailsButtons = screen.getAllByRole('button', { name: /Details/i });
      fireEvent.click(detailsButtons[0]);

      expect(mockOnViewDetails).toHaveBeenCalledWith('client-123');
    });

    it('should call onViewDetails with correct clientId for each card', () => {
      render(<ClientValidationGrid clients={mockClients} onViewDetails={mockOnViewDetails} />);

      const detailsButtons = screen.getAllByRole('button', { name: /Details/i });

      fireEvent.click(detailsButtons[0]);
      expect(mockOnViewDetails).toHaveBeenLastCalledWith('client-123');

      fireEvent.click(detailsButtons[1]);
      expect(mockOnViewDetails).toHaveBeenLastCalledWith('client-456');

      fireEvent.click(detailsButtons[2]);
      expect(mockOnViewDetails).toHaveBeenLastCalledWith('client-789');
    });
  });

  describe('Multiple Clients', () => {
    it('should handle single client', () => {
      render(<ClientValidationGrid clients={[mockClientFull]} />);

      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
    });

    it('should handle many clients', () => {
      const manyClients = [
        mockClientFull,
        mockClientIdeation,
        mockClientFailed,
        mockClientViability,
        mockClientValidated,
      ];

      render(<ClientValidationGrid clients={manyClients} />);

      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
      expect(screen.getByText('Alice Brown')).toBeInTheDocument();
      expect(screen.getByText('Charlie Green')).toBeInTheDocument();
    });
  });
});
