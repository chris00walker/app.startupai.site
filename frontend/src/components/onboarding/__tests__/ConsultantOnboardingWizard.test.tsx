/**
 * ConsultantOnboardingWizard Component Tests
 *
 * Tests the consultant onboarding wizard component including session management,
 * conversation flow, stage review, and the "Start New Conversation" functionality.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConsultantOnboardingWizard } from '../ConsultantOnboardingWizard';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  },
}));

// Import after mock to get the mocked version
import { toast as mockToast } from 'sonner';

// Mock analytics
jest.mock('@/lib/analytics', () => ({
  trackOnboardingEvent: {
    sessionStarted: jest.fn(),
    stageAdvanced: jest.fn(),
    messageSent: jest.fn(),
    completed: jest.fn(),
    exitedEarly: jest.fn(),
  },
}));

// Mock UI components
jest.mock('@/components/ui/sidebar', () => ({
  SidebarProvider: ({ children }: any) => <div data-testid="sidebar-provider">{children}</div>,
  SidebarInset: ({ children }: any) => <div data-testid="sidebar-inset">{children}</div>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children, open }: any) => open ? <div data-testid="alert-dialog">{children}</div> : null,
  AlertDialogContent: ({ children }: any) => <div data-testid="alert-dialog-content">{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: any) => <h2>{children}</h2>,
  AlertDialogDescription: ({ children }: any) => <p>{children}</p>,
  AlertDialogFooter: ({ children }: any) => <div data-testid="alert-dialog-footer">{children}</div>,
  AlertDialogCancel: ({ children, onClick }: any) => <button onClick={onClick} data-testid="dialog-cancel">{children}</button>,
  AlertDialogAction: ({ children, onClick }: any) => <button onClick={onClick} data-testid="dialog-action">{children}</button>,
}));

// Mock OnboardingSidebar to capture props
let capturedSidebarProps: any = {};

jest.mock('../OnboardingSidebar', () => ({
  OnboardingSidebar: (props: any) => {
    capturedSidebarProps = props;
    return (
      <div data-testid="onboarding-sidebar">
        <span data-testid="sidebar-stage">{props.currentStage}</span>
        <span data-testid="sidebar-progress">{props.overallProgress}</span>
        {props.onStartNew && (
          <button onClick={props.onStartNew} data-testid="start-new-button">
            Start New Conversation
          </button>
        )}
        <button onClick={props.onExit} data-testid="exit-button">
          Exit
        </button>
        {props.onStageClick && (
          <button onClick={() => props.onStageClick(1)} data-testid="stage-review-button">
            Review Stage 1
          </button>
        )}
      </div>
    );
  },
}));

// Mock ConversationInterface
jest.mock('../ConversationInterface', () => ({
  ConversationInterface: ({ session, messages }: any) => (
    <div data-testid="conversation-interface">
      <span data-testid="session-id">{session?.sessionId}</span>
      <span data-testid="message-count">{messages?.length}</span>
    </div>
  ),
}));

// Mock StageReviewModal
jest.mock('../StageReviewModal', () => ({
  StageReviewModal: ({ isOpen, stageNumber, stageName, agentName, onClose }: any) =>
    isOpen ? (
      <div data-testid="stage-review-modal">
        <span data-testid="review-stage-number">{stageNumber}</span>
        <span data-testid="review-stage-name">{stageName}</span>
        <span data-testid="review-agent-name">{agentName}</span>
        <button onClick={onClose} data-testid="close-review-modal">Close</button>
      </div>
    ) : null,
}));

// Mock SummaryModal
jest.mock('../SummaryModal', () => ({
  SummaryModal: ({ isOpen, title, onApprove, onRevise }: any) =>
    isOpen ? (
      <div data-testid="summary-modal">
        <h2>{title}</h2>
        <button onClick={onApprove} data-testid="approve-button">Approve</button>
        <button onClick={onRevise} data-testid="revise-button">Revise</button>
      </div>
    ) : null,
}));

// Helper to create mock API responses
function createMockStartResponse(options: {
  resuming?: boolean;
  conversationHistory?: any[];
  currentStage?: number;
} = {}) {
  return {
    success: true,
    sessionId: 'test-consultant-session-123',
    stageInfo: {
      currentStage: options.currentStage || 1,
      totalStages: 7,
      stageName: 'Welcome & Practice Overview',
    },
    overallProgress: options.resuming ? 30 : 0,
    stageProgress: 0,
    conversationContext: {
      agentPersonality: {
        name: 'Maya',
        role: 'Consulting Practice Specialist',
        tone: 'Professional and collaborative',
        expertise: 'Consulting practice management, client workflows, white-label solutions',
      },
    },
    resuming: options.resuming || false,
    conversationHistory: options.conversationHistory || [],
    agentIntroduction: "Hi! I'm Maya, your Consulting Practice Specialist.",
    firstQuestion: 'What is the name of your consulting practice or firm?',
  };
}

describe('ConsultantOnboardingWizard', () => {
  const defaultProps = {
    userId: 'consultant-user-123',
    userEmail: 'consultant@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    capturedSidebarProps = {};
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('session initialization', () => {
    it('should show loading state while initializing', async () => {
      // Create a fetch that never resolves
      (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

      render(<ConsultantOnboardingWizard {...defaultProps} />);

      expect(screen.getByText(/setting up your workspace/i)).toBeInTheDocument();
    });

    it('should initialize session on mount', async () => {
      const mockResponse = createMockStartResponse();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      render(<ConsultantOnboardingWizard {...defaultProps} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/consultant/onboarding/start',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('consultant-user-123'),
          })
        );
      });
    });

    it('should show success toast when session starts', async () => {
      const mockResponse = createMockStartResponse();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      render(<ConsultantOnboardingWizard {...defaultProps} />);

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith("Welcome! Let's set up your consulting workspace.");
      });
    });

    it('should show error state when initialization fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: false, error: { message: 'Test error' } }),
      });

      render(<ConsultantOnboardingWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Unable to Start Onboarding')).toBeInTheDocument();
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });
    });
  });

  describe('Maya agent personality', () => {
    it('should pass Maya personality to sidebar', async () => {
      const mockResponse = createMockStartResponse();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      render(<ConsultantOnboardingWizard {...defaultProps} />);

      await waitFor(() => {
        expect(capturedSidebarProps.agentPersonality).toEqual(
          expect.objectContaining({
            name: 'Maya',
            role: 'Consulting Practice Specialist',
          })
        );
      });
    });
  });

  describe('resume behavior', () => {
    it('should show resume toast when resuming', async () => {
      const mockResponse = createMockStartResponse({
        resuming: true,
        conversationHistory: [
          { role: 'assistant', content: 'Hello', timestamp: '2024-01-01T00:00:00Z' },
        ],
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      render(<ConsultantOnboardingWizard {...defaultProps} />);

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Resuming your conversation with Maya...');
      });
    });

    it('should restore conversation history when resuming', async () => {
      const history = [
        { role: 'assistant', content: 'Hello', timestamp: '2024-01-01T00:00:00Z' },
        { role: 'user', content: 'Hi there', timestamp: '2024-01-01T00:01:00Z' },
        { role: 'assistant', content: 'Great to meet you!', timestamp: '2024-01-01T00:02:00Z' },
      ];

      const mockResponse = createMockStartResponse({
        resuming: true,
        conversationHistory: history,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      render(<ConsultantOnboardingWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('message-count').textContent).toBe('3');
      });
    });
  });

  describe('stage review functionality', () => {
    it('should pass onStageClick handler to sidebar', async () => {
      const mockResponse = createMockStartResponse();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      render(<ConsultantOnboardingWizard {...defaultProps} />);

      await waitFor(() => {
        expect(capturedSidebarProps.onStageClick).toBeDefined();
        expect(typeof capturedSidebarProps.onStageClick).toBe('function');
      });
    });

    it('should pass getStageTopics function to sidebar', async () => {
      const mockResponse = createMockStartResponse();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      render(<ConsultantOnboardingWizard {...defaultProps} />);

      await waitFor(() => {
        expect(capturedSidebarProps.getStageTopics).toBeDefined();
        expect(typeof capturedSidebarProps.getStageTopics).toBe('function');
      });
    });

    it('should show stage review modal when onStageClick is called', async () => {
      const mockResponse = createMockStartResponse();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      render(<ConsultantOnboardingWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('stage-review-button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('stage-review-button'));

      await waitFor(() => {
        expect(screen.getByTestId('stage-review-modal')).toBeInTheDocument();
        expect(screen.getByTestId('review-agent-name').textContent).toBe('Maya');
      });
    });

    it('should close stage review modal when close is clicked', async () => {
      const mockResponse = createMockStartResponse();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      render(<ConsultantOnboardingWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('stage-review-button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('stage-review-button'));

      await waitFor(() => {
        expect(screen.getByTestId('stage-review-modal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('close-review-modal'));

      await waitFor(() => {
        expect(screen.queryByTestId('stage-review-modal')).not.toBeInTheDocument();
      });
    });
  });

  describe('stage progress data', () => {
    it('should pass stageProgressData to sidebar', async () => {
      const mockResponse = createMockStartResponse();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      render(<ConsultantOnboardingWizard {...defaultProps} />);

      await waitFor(() => {
        expect(capturedSidebarProps.stageProgressData).toBeDefined();
        expect(capturedSidebarProps.stageProgressData).toHaveProperty('collectedTopics');
        expect(capturedSidebarProps.stageProgressData).toHaveProperty('stageProgress');
      });
    });
  });

  describe('start new conversation', () => {
    it('should pass onStartNew handler to sidebar', async () => {
      const mockResponse = createMockStartResponse();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      render(<ConsultantOnboardingWizard {...defaultProps} />);

      await waitFor(() => {
        expect(capturedSidebarProps.onStartNew).toBeDefined();
        expect(typeof capturedSidebarProps.onStartNew).toBe('function');
      });
    });

    it('should show confirmation dialog when start new is clicked', async () => {
      const mockResponse = createMockStartResponse();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      render(<ConsultantOnboardingWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('start-new-button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('start-new-button'));

      await waitFor(() => {
        expect(screen.getByText('Start New Conversation?')).toBeInTheDocument();
      });
    });

    it('should reinitialize session after confirming start new', async () => {
      const mockResponse = createMockStartResponse();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(createMockStartResponse()),
        });

      render(<ConsultantOnboardingWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('start-new-button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('start-new-button'));

      await waitFor(() => {
        expect(screen.getByText('Start Fresh')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('dialog-action'));

      await waitFor(() => {
        // Should have called start API twice (initial + reinit)
        const startCalls = (global.fetch as jest.Mock).mock.calls.filter(
          (call: any) => call[0] === '/api/consultant/onboarding/start'
        );
        expect(startCalls.length).toBe(2);
      });
    });
  });

  describe('exit behavior', () => {
    it('should show exit dialog when exit button is clicked', async () => {
      const mockResponse = createMockStartResponse();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      render(<ConsultantOnboardingWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('exit-button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('exit-button'));

      await waitFor(() => {
        expect(screen.getByText('Exit Onboarding?')).toBeInTheDocument();
      });
    });

    it('should redirect to consultant-dashboard on exit', async () => {
      const mockResponse = createMockStartResponse();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      render(<ConsultantOnboardingWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('exit-button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('exit-button'));

      await waitFor(() => {
        expect(screen.getByText('Exit Onboarding?')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('dialog-action'));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/consultant-dashboard');
      });
    });
  });

  describe('stage management', () => {
    it('should initialize with stage 1 for new session', async () => {
      const mockResponse = createMockStartResponse({ currentStage: 1 });
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      render(<ConsultantOnboardingWizard {...defaultProps} />);

      await waitFor(() => {
        expect(capturedSidebarProps.currentStage).toBe(1);
      });
    });

    it('should pass correct stage to sidebar when resuming', async () => {
      const mockResponse = createMockStartResponse({
        resuming: true,
        currentStage: 4,
        conversationHistory: [{ role: 'assistant', content: 'Hello', timestamp: '2024-01-01' }],
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      render(<ConsultantOnboardingWizard {...defaultProps} />);

      await waitFor(() => {
        expect(capturedSidebarProps.currentStage).toBe(4);
      });
    });
  });
});
