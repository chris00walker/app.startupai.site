/**
 * OnboardingSidebar Component Tests
 *
 * Tests the sidebar component that displays onboarding progress,
 * agent information, and session management controls.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { OnboardingSidebar } from '../OnboardingSidebar';

// Mock the UI components that use Radix primitives
jest.mock('@/components/ui/sidebar', () => ({
  Sidebar: ({ children, ...props }: any) => <aside data-testid="sidebar" {...props}>{children}</aside>,
  SidebarContent: ({ children, ...props }: any) => <div data-testid="sidebar-content" {...props}>{children}</div>,
  SidebarHeader: ({ children, ...props }: any) => <header data-testid="sidebar-header" {...props}>{children}</header>,
  SidebarFooter: ({ children, ...props }: any) => <footer data-testid="sidebar-footer" {...props}>{children}</footer>,
}));

jest.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: any) => <>{children}</>,
  Tooltip: ({ children }: any) => <>{children}</>,
  TooltipTrigger: ({ children, asChild }: any) => <>{children}</>,
  TooltipContent: ({ children }: any) => <div data-testid="tooltip">{children}</div>,
}));

// Sample test data
const mockStages = [
  { stage: 1, name: 'Welcome & Introduction', description: 'Getting to know you', isComplete: true, isActive: false },
  { stage: 2, name: 'Customer Discovery', description: 'Understanding your target customers', isComplete: true, isActive: false },
  { stage: 3, name: 'Problem Definition', description: 'Defining the core problem', isComplete: false, isActive: true },
  { stage: 4, name: 'Solution Validation', description: 'Exploring your proposed solution', isComplete: false, isActive: false },
  { stage: 5, name: 'Competitive Analysis', description: 'Understanding the competitive landscape', isComplete: false, isActive: false },
  { stage: 6, name: 'Resources & Constraints', description: 'Assessing your available resources', isComplete: false, isActive: false },
  { stage: 7, name: 'Goals & Next Steps', description: 'Setting strategic goals', isComplete: false, isActive: false },
];

const mockAgentPersonality = {
  name: 'Alex',
  role: 'Strategic Business Consultant',
  tone: 'friendly, encouraging, professionally direct',
  expertise: 'Lean Startup, Customer Development, Business Model Design',
};

describe('OnboardingSidebar', () => {
  const defaultProps = {
    stages: mockStages,
    currentStage: 3,
    overallProgress: 35,
    agentPersonality: mockAgentPersonality,
    onExit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render the sidebar with header', () => {
      render(<OnboardingSidebar {...defaultProps} />);

      expect(screen.getByText('AI Strategic Onboarding')).toBeInTheDocument();
      expect(screen.getByText('Personalized business consultation')).toBeInTheDocument();
    });

    it('should render all 7 stages', () => {
      render(<OnboardingSidebar {...defaultProps} />);

      mockStages.forEach((stage) => {
        // Use getAllByText since active stage name appears in both nav and footer
        const elements = screen.getAllByText(stage.name);
        expect(elements.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should show progress percentage', () => {
      render(<OnboardingSidebar {...defaultProps} />);

      expect(screen.getByText('35%')).toBeInTheDocument();
    });

    it('should show completed stages count', () => {
      render(<OnboardingSidebar {...defaultProps} />);

      // 2 of 7 stages complete
      expect(screen.getByText('2 of 7 stages complete')).toBeInTheDocument();
    });
  });

  describe('agent personality display', () => {
    it('should display agent name', () => {
      render(<OnboardingSidebar {...defaultProps} />);

      expect(screen.getByText('Alex')).toBeInTheDocument();
    });

    it('should display agent role', () => {
      render(<OnboardingSidebar {...defaultProps} />);

      expect(screen.getByText('Strategic Business Consultant')).toBeInTheDocument();
    });

    it('should display AI Consultant badge', () => {
      render(<OnboardingSidebar {...defaultProps} />);

      expect(screen.getByText('AI Consultant')).toBeInTheDocument();
    });

    it('should display agent expertise', () => {
      render(<OnboardingSidebar {...defaultProps} />);

      expect(screen.getByText(/Lean Startup/)).toBeInTheDocument();
    });

    it('should not render agent section if agentPersonality is undefined', () => {
      const propsWithoutAgent = { ...defaultProps, agentPersonality: undefined };
      render(<OnboardingSidebar {...propsWithoutAgent} />);

      expect(screen.queryByText('Alex')).not.toBeInTheDocument();
      expect(screen.queryByText('AI Consultant')).not.toBeInTheDocument();
    });
  });

  describe('stage indicators', () => {
    it('should mark completed stages with checkmark', () => {
      render(<OnboardingSidebar {...defaultProps} />);

      // Check that completed stages have the green checkmark (via aria-label)
      const completedLabels = screen.getAllByLabelText('Completed');
      expect(completedLabels).toHaveLength(2); // First 2 stages are complete
    });

    it('should show active badge for current stage', () => {
      render(<OnboardingSidebar {...defaultProps} />);

      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should indicate current stage number', () => {
      render(<OnboardingSidebar {...defaultProps} />);

      // Footer shows current stage
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  describe('exit button', () => {
    it('should render Save & Exit button', () => {
      render(<OnboardingSidebar {...defaultProps} />);

      expect(screen.getByRole('button', { name: /save.*exit/i })).toBeInTheDocument();
    });

    it('should call onExit when Save & Exit is clicked', () => {
      const mockOnExit = jest.fn();
      render(<OnboardingSidebar {...defaultProps} onExit={mockOnExit} />);

      const exitButton = screen.getByRole('button', { name: /save.*exit/i });
      fireEvent.click(exitButton);

      expect(mockOnExit).toHaveBeenCalledTimes(1);
    });
  });

  describe('start new conversation button', () => {
    it('should render Start New Conversation button when onStartNew is provided', () => {
      const mockOnStartNew = jest.fn();
      render(<OnboardingSidebar {...defaultProps} onStartNew={mockOnStartNew} />);

      expect(screen.getByRole('button', { name: /start.*new.*conversation/i })).toBeInTheDocument();
    });

    it('should NOT render Start New Conversation button when onStartNew is not provided', () => {
      render(<OnboardingSidebar {...defaultProps} />);

      expect(screen.queryByRole('button', { name: /start.*new.*conversation/i })).not.toBeInTheDocument();
    });

    it('should call onStartNew when Start New Conversation is clicked', () => {
      const mockOnStartNew = jest.fn();
      render(<OnboardingSidebar {...defaultProps} onStartNew={mockOnStartNew} />);

      const startNewButton = screen.getByRole('button', { name: /start.*new.*conversation/i });
      fireEvent.click(startNewButton);

      expect(mockOnStartNew).toHaveBeenCalledTimes(1);
    });
  });

  describe('resume indicator', () => {
    it('should show resume indicator when isResuming is true', () => {
      render(<OnboardingSidebar {...defaultProps} isResuming={true} />);

      expect(screen.getByText('Resuming previous conversation')).toBeInTheDocument();
    });

    it('should NOT show resume indicator when isResuming is false', () => {
      render(<OnboardingSidebar {...defaultProps} isResuming={false} />);

      expect(screen.queryByText('Resuming previous conversation')).not.toBeInTheDocument();
    });

    it('should NOT show resume indicator when isResuming is undefined', () => {
      render(<OnboardingSidebar {...defaultProps} />);

      expect(screen.queryByText('Resuming previous conversation')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have accessible exit button', () => {
      render(<OnboardingSidebar {...defaultProps} />);

      const exitButton = screen.getByRole('button', { name: /save progress and exit/i });
      expect(exitButton).toBeInTheDocument();
    });

    it('should have accessible start new button when provided', () => {
      render(<OnboardingSidebar {...defaultProps} onStartNew={jest.fn()} />);

      const startNewButton = screen.getByRole('button', { name: /start.*new.*conversation/i });
      expect(startNewButton).toBeInTheDocument();
    });

    it('should have navigation landmark for stages', () => {
      render(<OnboardingSidebar {...defaultProps} />);

      expect(screen.getByRole('navigation', { name: /onboarding stages/i })).toBeInTheDocument();
    });

    it('should have progress bar with aria-label', () => {
      render(<OnboardingSidebar {...defaultProps} />);

      expect(screen.getByLabelText(/overall progress.*35.*percent/i)).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle 0% progress', () => {
      render(<OnboardingSidebar {...defaultProps} overallProgress={0} />);

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should handle 100% progress', () => {
      const completedStages = mockStages.map(s => ({ ...s, isComplete: true, isActive: false }));
      render(
        <OnboardingSidebar
          {...defaultProps}
          stages={completedStages}
          currentStage={7}
          overallProgress={100}
        />
      );

      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('7 of 7 stages complete')).toBeInTheDocument();
    });

    it('should handle decimal progress by rounding', () => {
      render(<OnboardingSidebar {...defaultProps} overallProgress={33.7} />);

      expect(screen.getByText('34%')).toBeInTheDocument();
    });
  });
});
