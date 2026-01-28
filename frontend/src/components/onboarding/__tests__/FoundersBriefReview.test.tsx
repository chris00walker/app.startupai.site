/**
 * FoundersBriefReview Component Tests
 *
 * Tests for the HITL brief review component that displays the Founder's Brief
 * for approval during the approve_founders_brief checkpoint.
 * @story US-H01, US-F01
*/

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FoundersBriefReview, type EntrepreneurBrief } from '../FoundersBriefReview';

// ============================================================================
// Test Data
// ============================================================================

const mockBriefData: Partial<EntrepreneurBrief> = {
  id: 'brief-123',
  session_id: 'session-456',
  user_id: 'user-789',

  // Customer segments
  customer_segments: ['busy professionals', 'remote workers', 'freelancers'],
  primary_customer_segment: 'busy professionals',
  customer_segment_confidence: 85,

  // Problem definition
  problem_description: 'Professionals spend too much time on repetitive tasks',
  problem_pain_level: 8,
  problem_frequency: 'daily',
  problem_impact: { productivity: 'high', stress: 'medium' },
  problem_evidence: ['User interviews', 'Survey data', 'Industry reports'],

  // Solution concept
  solution_description: 'AI-powered task automation platform',
  solution_mechanism: 'Machine learning analyzes patterns and automates workflows',
  unique_value_proposition: 'Save 10 hours per week with intelligent automation',
  differentiation_factors: ['AI-first approach', 'No-code interface', 'Enterprise security'],
  solution_confidence: 75,

  // Competitive landscape
  competitors: ['Zapier', 'Make', 'n8n'],
  competitive_alternatives: ['Manual processes', 'Custom scripts'],
  switching_barriers: ['Learning curve', 'Existing integrations'],
  competitive_advantages: ['Superior AI', 'Better UX', 'Lower cost'],

  // Resources and constraints
  budget_range: '$50,000-$100,000',
  budget_constraints: { monthly_burn: 8000 },
  available_channels: ['Content marketing', 'Product Hunt', 'LinkedIn'],
  existing_assets: ['Technical expertise', 'Early beta users'],
  team_capabilities: ['Full-stack development', 'ML engineering'],
  time_constraints: { launch_target: '3 months' },

  // Business stage and goals
  business_stage: 'mvp',
  three_month_goals: ['Launch MVP', 'Acquire 100 users', 'Iterate on feedback'],
  six_month_goals: ['1000 users', 'Break-even revenue'],
  success_criteria: ['70% retention rate', 'NPS > 50'],
  key_metrics: ['DAU', 'Time saved per user', 'NPS'],

  // Quality metrics
  completeness_score: 85,
  clarity_score: 90,
  consistency_score: 88,
  overall_quality_score: 87,

  // AI analysis metadata
  ai_confidence_scores: { problem: 0.85, solution: 0.75, market: 0.8 },
  validation_flags: ['Problem-solution fit validated', 'Market size assumption'],
  recommended_next_steps: ['Conduct more user interviews', 'Build landing page'],

  created_at: '2026-01-18T10:00:00Z',
  updated_at: '2026-01-18T10:00:00Z',
};

const minimalBriefData: Partial<EntrepreneurBrief> = {
  id: 'brief-minimal',
  problem_description: 'A simple problem statement',
  solution_description: 'A simple solution',
};

// ============================================================================
// Test Helpers
// ============================================================================

const mockOnApprove = jest.fn().mockResolvedValue(undefined);
const mockOnRequestChanges = jest.fn().mockResolvedValue(undefined);

const defaultProps = {
  briefData: mockBriefData,
  approvalId: 'approval-123',
  runId: 'run-456',
  onApprove: mockOnApprove,
  onRequestChanges: mockOnRequestChanges,
  isApproving: false,
};

describe('FoundersBriefReview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the brief review header', () => {
      render(<FoundersBriefReview {...defaultProps} />);

      expect(screen.getByText("Your Founder's Brief")).toBeInTheDocument();
      expect(screen.getByText(/review this summary/i)).toBeInTheDocument();
    });

    it('should render all 6 sections', () => {
      render(<FoundersBriefReview {...defaultProps} />);

      expect(screen.getByText('THE IDEA')).toBeInTheDocument();
      expect(screen.getByText("THE PROBLEM YOU'RE SOLVING")).toBeInTheDocument();
      expect(screen.getByText("WHO YOU'RE BUILDING FOR")).toBeInTheDocument();
      expect(screen.getByText('YOUR PROPOSED SOLUTION')).toBeInTheDocument();
      expect(screen.getByText("KEY ASSUMPTIONS WE'LL TEST")).toBeInTheDocument();
      expect(screen.getByText('YOUR SUCCESS CRITERIA')).toBeInTheDocument();
    });

    it('should display unique value proposition', () => {
      render(<FoundersBriefReview {...defaultProps} />);

      expect(screen.getByText('Save 10 hours per week with intelligent automation')).toBeInTheDocument();
    });

    it('should display business stage badge', () => {
      render(<FoundersBriefReview {...defaultProps} />);

      expect(screen.getByText('mvp')).toBeInTheDocument();
    });

    it('should display problem description', () => {
      render(<FoundersBriefReview {...defaultProps} />);

      expect(screen.getByText('Professionals spend too much time on repetitive tasks')).toBeInTheDocument();
    });

    it('should display pain level badge', () => {
      render(<FoundersBriefReview {...defaultProps} />);

      expect(screen.getByText('8/10')).toBeInTheDocument();
    });

    it('should display problem evidence', () => {
      render(<FoundersBriefReview {...defaultProps} />);

      expect(screen.getByText('User interviews')).toBeInTheDocument();
      expect(screen.getByText('Survey data')).toBeInTheDocument();
    });

    it('should display primary customer segment', () => {
      render(<FoundersBriefReview {...defaultProps} />);

      // Primary segment appears both as highlight and in badges
      expect(screen.getAllByText('busy professionals').length).toBeGreaterThanOrEqual(1);
    });

    it('should display all customer segments as badges', () => {
      render(<FoundersBriefReview {...defaultProps} />);

      expect(screen.getByText('remote workers')).toBeInTheDocument();
      expect(screen.getByText('freelancers')).toBeInTheDocument();
    });

    it('should display solution description', () => {
      render(<FoundersBriefReview {...defaultProps} />);

      // Solution description appears in both THE IDEA and YOUR PROPOSED SOLUTION sections
      expect(screen.getAllByText('AI-powered task automation platform').length).toBeGreaterThanOrEqual(1);
    });

    it('should display differentiation factors', () => {
      render(<FoundersBriefReview {...defaultProps} />);

      expect(screen.getByText('AI-first approach')).toBeInTheDocument();
      expect(screen.getByText('No-code interface')).toBeInTheDocument();
    });

    it('should display competitive advantages', () => {
      render(<FoundersBriefReview {...defaultProps} />);

      expect(screen.getByText('Superior AI')).toBeInTheDocument();
      expect(screen.getByText('Better UX')).toBeInTheDocument();
    });

    it('should display success criteria', () => {
      render(<FoundersBriefReview {...defaultProps} />);

      expect(screen.getByText('70% retention rate')).toBeInTheDocument();
      expect(screen.getByText('NPS > 50')).toBeInTheDocument();
    });

    it('should display 3-month goals', () => {
      render(<FoundersBriefReview {...defaultProps} />);

      expect(screen.getByText('Launch MVP')).toBeInTheDocument();
      expect(screen.getByText('Acquire 100 users')).toBeInTheDocument();
    });

    it('should display key metrics', () => {
      render(<FoundersBriefReview {...defaultProps} />);

      expect(screen.getByText('DAU')).toBeInTheDocument();
      expect(screen.getByText('NPS')).toBeInTheDocument();
    });
  });

  describe('Minimal Data', () => {
    it('should render with minimal data', () => {
      render(<FoundersBriefReview {...defaultProps} briefData={minimalBriefData} />);

      expect(screen.getByText('A simple problem statement')).toBeInTheDocument();
      // Solution appears in both THE IDEA and YOUR PROPOSED SOLUTION sections
      expect(screen.getAllByText('A simple solution').length).toBeGreaterThanOrEqual(1);
    });

    it('should show fallback for missing success criteria', () => {
      render(<FoundersBriefReview {...defaultProps} briefData={minimalBriefData} />);

      expect(screen.getByText(/Success criteria will be defined/)).toBeInTheDocument();
    });

    it('should not render empty sections', () => {
      render(<FoundersBriefReview {...defaultProps} briefData={minimalBriefData} />);

      // Should not show customer segment confidence if no segment data
      expect(screen.queryByText('Confidence:')).not.toBeInTheDocument();
    });
  });

  describe('Key Assumptions', () => {
    it('should generate assumptions from validation flags', () => {
      render(<FoundersBriefReview {...defaultProps} />);

      expect(screen.getByText('Problem-solution fit validated')).toBeInTheDocument();
    });

    it('should generate assumption from problem description', () => {
      render(<FoundersBriefReview {...defaultProps} />);

      // Should contain truncated problem description
      expect(screen.getByText(/Customers experience/)).toBeInTheDocument();
    });

    it('should generate assumption from primary segment', () => {
      render(<FoundersBriefReview {...defaultProps} />);

      expect(screen.getByText(/will pay for this solution/)).toBeInTheDocument();
    });

    it('should generate assumptions from differentiation factors', () => {
      render(<FoundersBriefReview {...defaultProps} />);

      expect(screen.getByText(/is a real differentiator/)).toBeInTheDocument();
    });
  });

  describe('Confirmation Checkbox', () => {
    it('should render confirmation checkbox', () => {
      render(<FoundersBriefReview {...defaultProps} />);

      expect(screen.getByText('This captures my idea correctly')).toBeInTheDocument();
    });

    it('should disable approve button when not confirmed', () => {
      render(<FoundersBriefReview {...defaultProps} />);

      const approveButton = screen.getByRole('button', { name: /Approve & Continue/i });
      expect(approveButton).toBeDisabled();
    });

    it('should enable approve button when confirmed', () => {
      render(<FoundersBriefReview {...defaultProps} />);

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      const approveButton = screen.getByRole('button', { name: /Approve & Continue/i });
      expect(approveButton).not.toBeDisabled();
    });
  });

  describe('Approve Flow', () => {
    it('should call onApprove when clicking approve button', async () => {
      render(<FoundersBriefReview {...defaultProps} />);

      // Check the checkbox first
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      // Click approve
      const approveButton = screen.getByRole('button', { name: /Approve & Continue/i });
      fireEvent.click(approveButton);

      await waitFor(() => {
        expect(mockOnApprove).toHaveBeenCalledTimes(1);
      });
    });

    it('should show loading state during approval', () => {
      render(<FoundersBriefReview {...defaultProps} isApproving={true} />);

      expect(screen.getByText('Approving...')).toBeInTheDocument();
    });

    it('should disable buttons during approval', () => {
      render(<FoundersBriefReview {...defaultProps} isApproving={true} />);

      const approveButton = screen.getByRole('button', { name: /Approving/i });
      const changesButton = screen.getByRole('button', { name: /Request Changes/i });

      expect(approveButton).toBeDisabled();
      expect(changesButton).toBeDisabled();
    });
  });

  describe('Request Changes Flow', () => {
    it('should open feedback dialog when clicking Request Changes', () => {
      render(<FoundersBriefReview {...defaultProps} />);

      const changesButton = screen.getByRole('button', { name: /Request Changes/i });
      fireEvent.click(changesButton);

      // Dialog title "Request Changes" and the feedback textarea should appear
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Describe what was captured incorrectly/)).toBeInTheDocument();
    });

    it('should disable submit when feedback is empty', () => {
      render(<FoundersBriefReview {...defaultProps} />);

      const changesButton = screen.getByRole('button', { name: /Request Changes/i });
      fireEvent.click(changesButton);

      const submitButton = screen.getByRole('button', { name: /Submit Feedback/i });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit when feedback is provided', () => {
      render(<FoundersBriefReview {...defaultProps} />);

      const changesButton = screen.getByRole('button', { name: /Request Changes/i });
      fireEvent.click(changesButton);

      const textarea = screen.getByPlaceholderText(/Describe what was captured incorrectly/);
      fireEvent.change(textarea, { target: { value: 'Please fix the problem description' } });

      const submitButton = screen.getByRole('button', { name: /Submit Feedback/i });
      expect(submitButton).not.toBeDisabled();
    });

    it('should call onRequestChanges with feedback', async () => {
      render(<FoundersBriefReview {...defaultProps} />);

      const changesButton = screen.getByRole('button', { name: /Request Changes/i });
      fireEvent.click(changesButton);

      const textarea = screen.getByPlaceholderText(/Describe what was captured incorrectly/);
      fireEvent.change(textarea, { target: { value: 'Please fix the problem description' } });

      const submitButton = screen.getByRole('button', { name: /Submit Feedback/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnRequestChanges).toHaveBeenCalledWith('Please fix the problem description');
      });
    });

    it('should close dialog after submitting feedback', async () => {
      render(<FoundersBriefReview {...defaultProps} />);

      const changesButton = screen.getByRole('button', { name: /Request Changes/i });
      fireEvent.click(changesButton);

      const textarea = screen.getByPlaceholderText(/Describe what was captured incorrectly/);
      fireEvent.change(textarea, { target: { value: 'Please fix this' } });

      const submitButton = screen.getByRole('button', { name: /Submit Feedback/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/Describe what was captured incorrectly/)).not.toBeInTheDocument();
      });
    });

    it('should show loading state while submitting feedback', async () => {
      const slowRequestChanges = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(<FoundersBriefReview {...defaultProps} onRequestChanges={slowRequestChanges} />);

      const changesButton = screen.getByRole('button', { name: /Request Changes/i });
      fireEvent.click(changesButton);

      const textarea = screen.getByPlaceholderText(/Describe what was captured incorrectly/);
      fireEvent.change(textarea, { target: { value: 'Please fix this' } });

      const submitButton = screen.getByRole('button', { name: /Submit Feedback/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Submitting...')).toBeInTheDocument();
      });
    });

    it('should close dialog via cancel button', () => {
      render(<FoundersBriefReview {...defaultProps} />);

      const changesButton = screen.getByRole('button', { name: /Request Changes/i });
      fireEvent.click(changesButton);

      expect(screen.getByPlaceholderText(/Describe what was captured incorrectly/)).toBeInTheDocument();

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      expect(screen.queryByPlaceholderText(/Describe what was captured incorrectly/)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper checkbox labeling', () => {
      render(<FoundersBriefReview {...defaultProps} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
    });

    it('should have accessible buttons', () => {
      render(<FoundersBriefReview {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Approve & Continue/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Request Changes/i })).toBeInTheDocument();
    });
  });

  describe('HYPOTHESIS badges', () => {
    it('should display HYPOTHESIS badge for problem section', () => {
      render(<FoundersBriefReview {...defaultProps} />);

      const hypothesisBadges = screen.getAllByText('HYPOTHESIS');
      // Problem, Customer, Solution sections should have HYPOTHESIS badges
      expect(hypothesisBadges.length).toBeGreaterThanOrEqual(3);
    });
  });
});
