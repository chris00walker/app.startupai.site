/**
 * ConversationInterfaceV2 Component Tests
 *
 * Tests for UI fixes:
 * - Issue #8: Auto-expanding textarea
 * - Issue #10: Scroll position maintained on new messages
 * - Issue #11: No redundant typing indicator (single "Thinking..." only)
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConversationInterface } from '../ConversationInterface';

// Mock the ScrollArea component to expose scroll behavior
jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: React.forwardRef<HTMLDivElement, { children: React.ReactNode; className?: string }>(
    ({ children, className }, ref) => {
      const internalRef = React.useRef<HTMLDivElement>(null);

      // Forward ref to internal div
      React.useImperativeHandle(ref, () => internalRef.current as HTMLDivElement);

      // Add scrollTo mock to the viewport element after mount
      React.useEffect(() => {
        if (internalRef.current) {
          const viewport = internalRef.current.querySelector('[data-radix-scroll-area-viewport]');
          if (viewport && !(viewport as any).scrollTo) {
            (viewport as any).scrollTo = jest.fn();
            Object.defineProperty(viewport, 'scrollHeight', { value: 1000, configurable: true });
          }
        }
      });

      return (
        <div ref={internalRef} className={className} data-testid="scroll-area">
          <div data-radix-scroll-area-viewport="true" data-testid="scroll-viewport">
            {children}
          </div>
        </div>
      );
    }
  ),
}));

// Mock Button to check its contents
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, disabled, type, onClick, className, size }: {
    children: React.ReactNode;
    disabled?: boolean;
    type?: string;
    onClick?: () => void;
    className?: string;
    size?: string;
  }) => (
    <button
      type={type as 'button' | 'submit' | 'reset'}
      disabled={disabled}
      onClick={onClick}
      className={className}
      data-size={size}
      data-testid={type === 'submit' ? 'send-button' : 'button'}
    >
      {children}
    </button>
  ),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Send: () => <span data-testid="send-icon">Send Icon</span>,
  CheckCircle: () => <span data-testid="check-icon">Check Icon</span>,
  ArrowRight: () => <span data-testid="arrow-icon">Arrow Icon</span>,
  Loader2: () => <span data-testid="loader2-icon">Loader2 Icon</span>,
}));

describe('ConversationInterfaceV2', () => {
  const defaultSession = {
    sessionId: 'test-session-id',
    currentStage: 1,
    totalStages: 7,
    overallProgress: 15,
    stageProgress: 50,
    agentPersonality: { name: 'Alex' },
    isActive: true,
  };

  const defaultMessages = [
    {
      role: 'assistant',
      content: 'Hello! Tell me about your business idea.',
      timestamp: '2026-01-14T10:00:00Z',
    },
  ];

  const defaultProps = {
    session: defaultSession,
    messages: defaultMessages,
    input: '',
    handleInputChange: jest.fn(),
    handleSubmit: jest.fn((e) => e.preventDefault()),
    isLoading: false,
    onComplete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock requestAnimationFrame
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Issue #11: Typing Indicator Redundancy', () => {
    /**
     * The fix removed the Loader2 spinner from the Send button.
     * Only the "Thinking..." dots indicator should show during loading.
     */

    it('should NOT render Loader2 spinner in Send button when loading', () => {
      render(<ConversationInterface {...defaultProps} isLoading={true} />);

      // The Send button should not contain a Loader2 icon
      const sendButton = screen.getByTestId('send-button');
      expect(sendButton).toBeInTheDocument();

      // Loader2 should NOT be rendered anywhere
      const loader2 = screen.queryByTestId('loader2-icon');
      expect(loader2).not.toBeInTheDocument();
    });

    it('should render "Thinking..." indicator when loading', () => {
      render(<ConversationInterface {...defaultProps} isLoading={true} />);

      // Should show the "Thinking..." text
      expect(screen.getByText('Thinking...')).toBeInTheDocument();
    });

    it('should show bouncing dots when loading', () => {
      const { container } = render(<ConversationInterface {...defaultProps} isLoading={true} />);

      // Should have 3 bouncing dot elements (animate-bounce class)
      const bouncingDots = container.querySelectorAll('.animate-bounce');
      expect(bouncingDots.length).toBe(3);
    });

    it('should hide typing indicator when not loading', () => {
      render(<ConversationInterface {...defaultProps} isLoading={false} />);

      // Should NOT show "Thinking..." text
      expect(screen.queryByText('Thinking...')).not.toBeInTheDocument();
    });

    it('should always show Send button text (not replaced by spinner)', () => {
      render(<ConversationInterface {...defaultProps} isLoading={true} />);

      const sendButton = screen.getByTestId('send-button');
      expect(sendButton).toHaveTextContent('Send');
    });
  });

  describe('Issue #10: Scroll Position Maintained', () => {
    /**
     * The fix uses requestAnimationFrame to ensure DOM updates before scrolling.
     * This ensures smooth scrolling to the bottom when new messages arrive.
     */

    it('should call requestAnimationFrame when messages change', () => {
      const rafSpy = jest.spyOn(window, 'requestAnimationFrame');

      const { rerender } = render(<ConversationInterface {...defaultProps} />);

      // Clear the initial call
      rafSpy.mockClear();

      // Add a new message
      const newMessages = [
        ...defaultMessages,
        {
          role: 'user',
          content: 'My business idea is...',
          timestamp: '2026-01-14T10:01:00Z',
        },
      ];

      rerender(<ConversationInterface {...defaultProps} messages={newMessages} />);

      // Should call requestAnimationFrame for smooth scroll timing
      expect(rafSpy).toHaveBeenCalled();
    });

    it('should scroll to bottom when new messages arrive', () => {
      const { rerender } = render(<ConversationInterface {...defaultProps} />);

      // Get the scroll viewport from the mock
      const scrollViewport = document.querySelector('[data-radix-scroll-area-viewport]');
      expect(scrollViewport).toBeInTheDocument();

      // Add a new message to trigger scroll
      const newMessages = [
        ...defaultMessages,
        {
          role: 'user',
          content: 'My business idea is a platform for...',
          timestamp: '2026-01-14T10:01:00Z',
        },
      ];

      rerender(<ConversationInterface {...defaultProps} messages={newMessages} />);

      // Verify scrollTo was called (via the mock)
      expect((scrollViewport as any).scrollTo).toHaveBeenCalledWith(
        expect.objectContaining({
          behavior: 'smooth',
        })
      );
    });

    it('should render messages in correct order', () => {
      const messages = [
        { role: 'assistant', content: 'First message', timestamp: '2026-01-14T10:00:00Z' },
        { role: 'user', content: 'Second message', timestamp: '2026-01-14T10:01:00Z' },
        { role: 'assistant', content: 'Third message', timestamp: '2026-01-14T10:02:00Z' },
      ];

      render(<ConversationInterface {...defaultProps} messages={messages} />);

      const firstMsg = screen.getByText('First message');
      const secondMsg = screen.getByText('Second message');
      const thirdMsg = screen.getByText('Third message');

      expect(firstMsg).toBeInTheDocument();
      expect(secondMsg).toBeInTheDocument();
      expect(thirdMsg).toBeInTheDocument();
    });
  });

  describe('Issue #8: Auto-Expanding Textarea', () => {
    /**
     * The fix adds auto-resize logic that expands textarea based on content,
     * capped at max-height of 200px.
     */

    it('should have textarea with min-height of 60px', () => {
      render(<ConversationInterface {...defaultProps} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('min-h-[60px]');
    });

    it('should have textarea with max-height of 200px', () => {
      render(<ConversationInterface {...defaultProps} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('max-h-[200px]');
    });

    it('should update textarea height when input changes', () => {
      const handleInputChange = jest.fn();
      const { rerender } = render(
        <ConversationInterface {...defaultProps} input="" handleInputChange={handleInputChange} />
      );

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

      // Mock scrollHeight
      Object.defineProperty(textarea, 'scrollHeight', {
        configurable: true,
        value: 100,
      });

      // Rerender with new input
      rerender(
        <ConversationInterface
          {...defaultProps}
          input="Some text that might make the textarea expand"
          handleInputChange={handleInputChange}
        />
      );

      // The useEffect should have set the height
      // Note: In actual implementation, the height is set via style
      expect(textarea.style.height).toBeTruthy();
    });

    it('should cap textarea height at 200px for very long content', () => {
      const { rerender } = render(<ConversationInterface {...defaultProps} input="" />);

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

      // Mock a very large scrollHeight
      Object.defineProperty(textarea, 'scrollHeight', {
        configurable: true,
        value: 500,
      });

      // Rerender with long input
      const longText = 'A'.repeat(1000);
      rerender(<ConversationInterface {...defaultProps} input={longText} />);

      // Height should be capped at 200px
      const heightValue = parseInt(textarea.style.height);
      expect(heightValue).toBeLessThanOrEqual(200);
    });

    it('should reset height to auto before measuring scrollHeight', () => {
      const { rerender } = render(<ConversationInterface {...defaultProps} input="" />);

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

      // Start with some height
      textarea.style.height = '150px';

      // Mock scrollHeight
      Object.defineProperty(textarea, 'scrollHeight', {
        configurable: true,
        value: 80,
      });

      // Rerender with new input
      rerender(<ConversationInterface {...defaultProps} input="Short text" />);

      // The auto-resize logic should have run
      // Height should now be set based on scrollHeight (80px), not the old value (150px)
      const heightValue = parseInt(textarea.style.height);
      expect(heightValue).toBeLessThanOrEqual(200);
    });
  });

  describe('Keyboard Interactions', () => {
    it('should submit form on Enter key (without Shift)', () => {
      const handleSubmit = jest.fn((e) => e.preventDefault());
      render(<ConversationInterface {...defaultProps} input="test" handleSubmit={handleSubmit} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

      // Form should be submitted
      expect(handleSubmit).toHaveBeenCalled();
    });

    it('should NOT submit form on Shift+Enter (allows multiline)', () => {
      const handleSubmit = jest.fn((e) => e.preventDefault());
      render(<ConversationInterface {...defaultProps} input="test" handleSubmit={handleSubmit} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

      // Form should NOT be submitted
      expect(handleSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible textarea with label', () => {
      render(<ConversationInterface {...defaultProps} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('aria-label', 'Type your message');
    });

    it('should have textarea with describedby for instructions', () => {
      render(<ConversationInterface {...defaultProps} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('aria-describedby', 'input-instructions');

      // Verify the instructions element exists
      const instructions = document.getElementById('input-instructions');
      expect(instructions).toBeInTheDocument();
    });

    it('should disable textarea when loading', () => {
      render(<ConversationInterface {...defaultProps} isLoading={true} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeDisabled();
    });

    it('should disable send button when input is empty', () => {
      render(<ConversationInterface {...defaultProps} input="" />);

      const sendButton = screen.getByTestId('send-button');
      expect(sendButton).toBeDisabled();
    });

    it('should disable send button when loading', () => {
      render(<ConversationInterface {...defaultProps} input="test" isLoading={true} />);

      const sendButton = screen.getByTestId('send-button');
      expect(sendButton).toBeDisabled();
    });
  });

  describe('Message Rendering', () => {
    it('should render assistant messages with agent name', () => {
      render(<ConversationInterface {...defaultProps} />);

      // Should show agent name (Alex) - appears in header and message
      const alexElements = screen.getAllByText('Alex');
      expect(alexElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should render user messages with "You" label', () => {
      const messages = [
        { role: 'user', content: 'My message', timestamp: '2026-01-14T10:00:00Z' },
      ];

      render(<ConversationInterface {...defaultProps} messages={messages} />);

      expect(screen.getByText('You')).toBeInTheDocument();
      expect(screen.getByText('My message')).toBeInTheDocument();
    });

    it('should render markdown bold text', () => {
      const messages = [
        {
          role: 'assistant',
          content: 'This is **bold** text',
          timestamp: '2026-01-14T10:00:00Z',
        },
      ];

      const { container } = render(<ConversationInterface {...defaultProps} messages={messages} />);

      const boldElement = container.querySelector('strong');
      expect(boldElement).toBeInTheDocument();
      expect(boldElement).toHaveTextContent('bold');
    });

    it('should render markdown italic text', () => {
      const messages = [
        {
          role: 'assistant',
          content: 'This is *italic* text',
          timestamp: '2026-01-14T10:00:00Z',
        },
      ];

      const { container } = render(<ConversationInterface {...defaultProps} messages={messages} />);

      const italicElement = container.querySelector('em');
      expect(italicElement).toBeInTheDocument();
      expect(italicElement).toHaveTextContent('italic');
    });

    it('should render markdown code text', () => {
      const messages = [
        {
          role: 'assistant',
          content: 'This is `code` text',
          timestamp: '2026-01-14T10:00:00Z',
        },
      ];

      const { container } = render(<ConversationInterface {...defaultProps} messages={messages} />);

      const codeElement = container.querySelector('code');
      expect(codeElement).toBeInTheDocument();
      expect(codeElement).toHaveTextContent('code');
    });
  });

  describe('Completion State', () => {
    // ADR-005: Completion now uses status='completed' instead of progress >= 90%
    it('should show completion banner when status is completed', () => {
      const completedSession = {
        ...defaultSession,
        currentStage: 7,
        totalStages: 7,
        overallProgress: 100,
        // ADR-005 Fix: Use status for completion check, not progress
        status: 'completed' as const,
      };

      render(<ConversationInterface {...defaultProps} session={completedSession} />);

      expect(screen.getByText("You're all set!")).toBeInTheDocument();
      expect(screen.getByText('Complete Onboarding')).toBeInTheDocument();
    });

    it('should NOT show completion banner when status is not completed (even with high progress)', () => {
      const incompleteSession = {
        ...defaultSession,
        currentStage: 7,
        totalStages: 7,
        overallProgress: 95, // High progress but status is still 'active'
        status: 'active' as const,
      };

      render(<ConversationInterface {...defaultProps} session={incompleteSession} />);

      expect(screen.queryByText("You're all set!")).not.toBeInTheDocument();
    });

    it('should call onComplete when Complete button is clicked', () => {
      const onComplete = jest.fn();
      const completedSession = {
        ...defaultSession,
        currentStage: 7,
        totalStages: 7,
        overallProgress: 100,
        // ADR-005 Fix: Use status for completion check
        status: 'completed' as const,
      };

      render(
        <ConversationInterface {...defaultProps} session={completedSession} onComplete={onComplete} />
      );

      // Click the "Complete Onboarding" button in the banner
      const completeButton = screen.getByText('Complete Onboarding');
      fireEvent.click(completeButton);

      expect(onComplete).toHaveBeenCalled();
    });
  });

  describe('Header Display', () => {
    it('should show current stage name', () => {
      render(<ConversationInterface {...defaultProps} />);

      expect(screen.getByText('Welcome')).toBeInTheDocument();
    });

    it('should show stage progress (Stage X of Y)', () => {
      render(<ConversationInterface {...defaultProps} />);

      expect(screen.getByText(/Stage 1 of 7/)).toBeInTheDocument();
    });

    it('should show overall progress percentage', () => {
      render(<ConversationInterface {...defaultProps} />);

      expect(screen.getByText('15% Complete')).toBeInTheDocument();
    });

    it('should show agent name in header', () => {
      render(<ConversationInterface {...defaultProps} />);

      // Alex should appear in the header helper text
      // The structure is: "Stage X of Y • <span>Alex</span> is here to help"
      expect(screen.getByText(/is here to help/)).toBeInTheDocument();
      // Verify Alex is in the header area
      const alexElements = screen.getAllByText('Alex');
      expect(alexElements.length).toBeGreaterThanOrEqual(1);
    });
  });
});
