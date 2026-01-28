/**
 * StageReviewModal Component Tests
 *
 * Tests for the read-only stage conversation review modal.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { StageReviewModal } from '../StageReviewModal';

// ============================================================================
// Test Data
// ============================================================================

const mockMessages = [
  {
    role: 'assistant',
    content: 'Welcome! Let me help you explore your business idea.',
    timestamp: '2026-01-18T10:00:00Z',
  },
  {
    role: 'user',
    content: 'I want to build a meal planning app for busy families.',
    timestamp: '2026-01-18T10:01:00Z',
  },
  {
    role: 'assistant',
    content: 'That sounds interesting! Can you tell me more about the problem you are trying to solve?',
    timestamp: '2026-01-18T10:02:00Z',
  },
  {
    role: 'user',
    content: 'Parents spend too much time deciding what to cook each day.',
    timestamp: '2026-01-18T10:03:00Z',
  },
];

const emptyMessages: typeof mockMessages = [];

// ============================================================================
// Test Helpers
// ============================================================================

const mockOnClose = jest.fn();

const defaultProps = {
  isOpen: true,
  onClose: mockOnClose,
  stageNumber: 1,
  stageName: 'Welcome & Introduction',
  messages: mockMessages,
};

describe('StageReviewModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the modal when open', () => {
      render(<StageReviewModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(<StageReviewModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should display stage number in header', () => {
      render(<StageReviewModal {...defaultProps} />);

      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should display stage name in header', () => {
      render(<StageReviewModal {...defaultProps} />);

      expect(screen.getByText('Welcome & Introduction')).toBeInTheDocument();
    });

    it('should display description text', () => {
      render(<StageReviewModal {...defaultProps} />);

      expect(screen.getByText(/Review your conversation from this stage/)).toBeInTheDocument();
      expect(screen.getByText(/read-only/)).toBeInTheDocument();
    });
  });

  describe('Messages Display', () => {
    it('should display assistant messages', () => {
      render(<StageReviewModal {...defaultProps} />);

      expect(screen.getByText('Welcome! Let me help you explore your business idea.')).toBeInTheDocument();
    });

    it('should display user messages', () => {
      render(<StageReviewModal {...defaultProps} />);

      expect(screen.getByText('I want to build a meal planning app for busy families.')).toBeInTheDocument();
    });

    it('should display default agent name for assistant messages', () => {
      render(<StageReviewModal {...defaultProps} />);

      // Default agent name is "Alex"
      expect(screen.getAllByText('Alex').length).toBeGreaterThan(0);
    });

    it('should display custom agent name when provided', () => {
      render(<StageReviewModal {...defaultProps} agentName="Sarah" />);

      expect(screen.getAllByText('Sarah').length).toBeGreaterThan(0);
    });

    it('should display "You" label for user messages', () => {
      render(<StageReviewModal {...defaultProps} />);

      expect(screen.getAllByText('You').length).toBeGreaterThan(0);
    });

    it('should format timestamps correctly', () => {
      render(<StageReviewModal {...defaultProps} />);

      // Times should be formatted as HH:MM (e.g., "10:00", "10:01")
      // The exact format depends on locale, so we just check timestamps exist
      const timestampPattern = /\d{1,2}:\d{2}/;
      const allText = screen.getByRole('dialog').textContent || '';
      expect(timestampPattern.test(allText)).toBe(true);
    });

    it('should display all messages in order', () => {
      render(<StageReviewModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      const text = dialog.textContent || '';

      // Messages should appear in order
      const welcomeIndex = text.indexOf('Welcome');
      const mealPlanningIndex = text.indexOf('meal planning');
      const problemIndex = text.indexOf('problem you are trying');
      const parentsIndex = text.indexOf('Parents spend');

      expect(welcomeIndex).toBeLessThan(mealPlanningIndex);
      expect(mealPlanningIndex).toBeLessThan(problemIndex);
      expect(problemIndex).toBeLessThan(parentsIndex);
    });
  });

  describe('Empty State', () => {
    it('should display empty message when no messages', () => {
      render(<StageReviewModal {...defaultProps} messages={emptyMessages} />);

      expect(screen.getByText('No messages recorded for this stage.')).toBeInTheDocument();
    });
  });

  describe('Different Stages', () => {
    it('should display different stage numbers', () => {
      render(<StageReviewModal {...defaultProps} stageNumber={3} stageName="Problem Definition" />);

      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('Problem Definition')).toBeInTheDocument();
    });

    it('should display stage 7', () => {
      render(<StageReviewModal {...defaultProps} stageNumber={7} stageName="Goals & Next Steps" />);

      expect(screen.getByText('7')).toBeInTheDocument();
      expect(screen.getByText('Goals & Next Steps')).toBeInTheDocument();
    });
  });

  describe('Modal Behavior', () => {
    it('should call onClose when dialog is closed', () => {
      render(<StageReviewModal {...defaultProps} />);

      // Find the close button (X) in the dialog
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Message Styling', () => {
    it('should render user messages with distinct styling', () => {
      render(<StageReviewModal {...defaultProps} />);

      // User messages should have a background styling - find the container with the background class
      const userMessage = screen.getByText('I want to build a meal planning app for busy families.');
      // The background is on a parent element (div with bg-primary/10)
      const container = userMessage.closest('.bg-primary\\/10');
      expect(container).toBeInTheDocument();
    });

    it('should render assistant messages with border styling', () => {
      render(<StageReviewModal {...defaultProps} />);

      // Assistant messages have a left border
      const assistantMessage = screen.getByText('Welcome! Let me help you explore your business idea.');
      expect(assistantMessage).toHaveClass('border-l-2');
    });
  });

  describe('Accessibility', () => {
    it('should have proper dialog role', () => {
      render(<StageReviewModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have dialog title', () => {
      render(<StageReviewModal {...defaultProps} />);

      // The stage name should be in a heading
      expect(screen.getByText('Welcome & Introduction')).toBeInTheDocument();
    });

    it('should have dialog description', () => {
      render(<StageReviewModal {...defaultProps} />);

      expect(screen.getByText(/Review your conversation/)).toBeInTheDocument();
    });
  });

  describe('Long Messages', () => {
    it('should display long messages with whitespace preserved', () => {
      const longMessage = {
        role: 'assistant',
        content: 'First line of text.\n\nSecond paragraph with more details.\n\n- Bullet point 1\n- Bullet point 2',
        timestamp: '2026-01-18T10:00:00Z',
      };

      render(<StageReviewModal {...defaultProps} messages={[longMessage]} />);

      // Content should be preserved (whitespace-pre-wrap class)
      const messageContent = screen.getByText(/First line of text/);
      expect(messageContent).toHaveClass('whitespace-pre-wrap');
    });
  });

  describe('Multiple Messages', () => {
    it('should handle many messages', () => {
      const manyMessages = Array.from({ length: 20 }, (_, i) => ({
        role: i % 2 === 0 ? 'assistant' : 'user',
        content: `Message ${i + 1}`,
        timestamp: new Date(2026, 0, 18, 10, i).toISOString(),
      }));

      render(<StageReviewModal {...defaultProps} messages={manyMessages} />);

      // First and last messages should be visible (scroll area handles overflow)
      expect(screen.getByText('Message 1')).toBeInTheDocument();
      expect(screen.getByText('Message 20')).toBeInTheDocument();
    });
  });
});
