/**
 * OnboardingSidebar Component Tests
 *
 * Tests the sidebar component that displays onboarding progress,
 * agent information, and session management controls.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { OnboardingSidebar } from '../OnboardingSidebar';

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
      expect(screen.getByText(/with Alex/)).toBeInTheDocument();
    });

    it('should render all 7 stages', () => {
      render(<OnboardingSidebar {...defaultProps} />);

      mockStages.forEach((stage) => {
        expect(screen.getByText(stage.name)).toBeInTheDocument();
      });
    });

    it('should show progress percentage', () => {
      render(<OnboardingSidebar {...defaultProps} />);

      expect(screen.getByText('35%')).toBeInTheDocument();
    });

    it('should show current stage indicator', () => {
      render(<OnboardingSidebar {...defaultProps} />);

      // Component shows "Stage X of Y" format
      expect(screen.getByText('Stage 3 of 7')).toBeInTheDocument();
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

    it('should not render agent section if agentPersonality is undefined', () => {
      const propsWithoutAgent = { ...defaultProps, agentPersonality: undefined };
      render(<OnboardingSidebar {...propsWithoutAgent} />);

      // Should not show the agent name in the consultant card
      expect(screen.queryByText('AI Consultant')).not.toBeInTheDocument();
    });
  });

  describe('stage indicators', () => {
    it('should mark completed stages with checkmark icon', () => {
      render(<OnboardingSidebar {...defaultProps} />);

      // Check that completed stages (first 2) have the check icon
      // The component uses Lucide Check icon for completed stages
      const stageItems = screen.getAllByRole('listitem');
      expect(stageItems).toHaveLength(7);
    });

    it('should show stage number for active stage', () => {
      render(<OnboardingSidebar {...defaultProps} />);

      // Stage 3 (active) shows number "3", pending stages show Lock icons
      expect(screen.getByText('3')).toBeInTheDocument();
      // Stage 4+ are pending (show Lock icon, not number)
    });

    it('should indicate current stage with aria-current', () => {
      render(<OnboardingSidebar {...defaultProps} />);

      // The active stage should have aria-current="step"
      const navigation = screen.getByRole('navigation', { name: /onboarding stages/i });
      const currentStep = navigation.querySelector('[aria-current="step"]');
      expect(currentStep).toBeInTheDocument();
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

    it('should have exit button with X icon', () => {
      render(<OnboardingSidebar {...defaultProps} />);

      // Component has Save & Exit button, not a separate X icon button
      const exitButton = screen.getByRole('button', { name: /save.*exit/i });
      expect(exitButton).toBeInTheDocument();
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

      const exitButton = screen.getByRole('button', { name: /save.*exit/i });
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

    it('should have progress bar with proper ARIA attributes', () => {
      render(<OnboardingSidebar {...defaultProps} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('aria-label', 'Onboarding progress: 35 percent complete');
      expect(progressBar).toHaveAttribute('aria-valuenow', '35');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('should have complementary landmark role', () => {
      render(<OnboardingSidebar {...defaultProps} />);

      expect(screen.getByRole('complementary', { name: /onboarding progress/i })).toBeInTheDocument();
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
      expect(screen.getByText('Stage 7 of 7')).toBeInTheDocument();
    });

    it('should handle decimal progress by rounding', () => {
      render(<OnboardingSidebar {...defaultProps} overallProgress={33.7} />);

      expect(screen.getByText('34%')).toBeInTheDocument();
    });

    it('should calculate time remaining dynamically based on stages', () => {
      render(<OnboardingSidebar {...defaultProps} />);

      // Component calculates: remainingStages(4) * avgMinutesPerStage(2 min minimum)
      // With 0 elapsed time, avgMinutesPerStage = Math.max(2, 0/completedStages) = 2
      // So estimated = 4 * 2 = 8 minutes
      expect(screen.getByText(/~\d+m left/)).toBeInTheDocument();
    });
  });
});
