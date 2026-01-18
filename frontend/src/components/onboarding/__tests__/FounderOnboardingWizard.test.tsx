/**
 * FounderOnboardingWizardV2 Component Tests
 *
 * Tests the main onboarding wizard component including session management,
 * conversation flow, and the "Start New Conversation" functionality.
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { FounderOnboardingWizard } from '../FounderOnboardingWizard';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: jest.fn().mockReturnValue(null),
  }),
}));

// Mock useOnboardingSession hook (Realtime subscription)
jest.mock('@/hooks/useOnboardingSession', () => ({
  useOnboardingSession: () => ({
    session: null,
    realtimeStatus: 'connected',
    refetch: jest.fn(),
  }),
}));

// Mock useOnboardingRecovery hook (localStorage fallback)
jest.mock('@/hooks/useOnboardingRecovery', () => ({
  useOnboardingRecovery: () => ({
    savePending: jest.fn(),
    clearPending: jest.fn(),
    hasPending: false,
    recoverPending: jest.fn(),
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
  trackCrewAIEvent: {
    started: jest.fn(),
    completed: jest.fn(),
    failed: jest.fn(),
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

jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value }: any) => <div data-testid="progress" data-value={value} />,
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

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
}));

// Mock OnboardingSidebar to capture props
const mockOnStartNew = jest.fn();
const mockOnExit = jest.fn();
let capturedSidebarProps: any = {};

jest.mock('../OnboardingSidebar', () => ({
  OnboardingSidebar: (props: any) => {
    capturedSidebarProps = props;
    return (
      <div data-testid="onboarding-sidebar">
        <span data-testid="sidebar-stage">{props.currentStage}</span>
        <span data-testid="sidebar-progress">{props.overallProgress}</span>
        <span data-testid="sidebar-resuming">{props.isResuming?.toString()}</span>
        {props.onStartNew && (
          <button onClick={props.onStartNew} data-testid="start-new-button">
            Start New Conversation
          </button>
        )}
        <button onClick={props.onExit} data-testid="exit-button">
          Exit
        </button>
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

// Helper to create mock API responses
function createMockStartResponse(options: {
  resuming?: boolean;
  conversationHistory?: any[];
  currentStage?: number;
} = {}) {
  return {
    success: true,
    sessionId: 'test-session-123',
    stageInfo: {
      currentStage: options.currentStage || 1,
      totalStages: 7,
      stageName: 'Welcome & Introduction',
    },
    overallProgress: options.resuming ? 30 : 0,
    stageProgress: 0,
    conversationContext: {
      agentPersonality: {
        name: 'Alex',
        role: 'Strategic Business Consultant',
      },
    },
    resuming: options.resuming || false,
    conversationHistory: options.conversationHistory || [],
    agentIntroduction: "Hi there! I'm Alex.",
    firstQuestion: 'What business idea are you most excited about?',
  };
}

describe('FounderOnboardingWizardV2', () => {
  const defaultProps = {
    userId: 'user-123',
    planType: 'founder' as const,
    userEmail: 'test@example.com',
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

      render(<FounderOnboardingWizard {...defaultProps} />);

      expect(screen.getByText(/loading onboarding|starting your ai consultation/i)).toBeInTheDocument();
    });

    it('should initialize session on mount', async () => {
      const mockResponse = createMockStartResponse();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      render(<FounderOnboardingWizard {...defaultProps} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/onboarding/start/',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('user-123'),
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

      render(<FounderOnboardingWizard {...defaultProps} />);

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Onboarding session started successfully!');
      });
    });

    it('should show error state when initialization fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: false, error: { message: 'Test error' } }),
      });

      render(<FounderOnboardingWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Unable to Start Onboarding')).toBeInTheDocument();
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });
    });
  });

  describe('resume behavior', () => {
    it('should set isResuming to true when resuming existing session', async () => {
      const mockResponse = createMockStartResponse({
        resuming: true,
        conversationHistory: [
          { role: 'assistant', content: 'Previous message', timestamp: '2024-01-01T00:00:00Z' },
          { role: 'user', content: 'User response', timestamp: '2024-01-01T00:01:00Z' },
        ],
        currentStage: 3,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      render(<FounderOnboardingWizard {...defaultProps} />);

      await waitFor(() => {
        expect(capturedSidebarProps.isResuming).toBe(true);
      });
    });

    it('should set isResuming to false for new session', async () => {
      const mockResponse = createMockStartResponse({ resuming: false });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      render(<FounderOnboardingWizard {...defaultProps} />);

      await waitFor(() => {
        expect(capturedSidebarProps.isResuming).toBe(false);
      });
    });

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

      render(<FounderOnboardingWizard {...defaultProps} />);

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Resuming your conversation with Alex...');
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

      render(<FounderOnboardingWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('message-count').textContent).toBe('3');
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

      render(<FounderOnboardingWizard {...defaultProps} />);

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

      render(<FounderOnboardingWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('start-new-button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('start-new-button'));

      await waitFor(() => {
        expect(screen.getByText('Start New Conversation?')).toBeInTheDocument();
      });
    });

    it('should show Continue Current and Start Fresh buttons in dialog', async () => {
      const mockResponse = createMockStartResponse();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      render(<FounderOnboardingWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('start-new-button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('start-new-button'));

      await waitFor(() => {
        expect(screen.getByText('Continue Current')).toBeInTheDocument();
        expect(screen.getByText('Start Fresh')).toBeInTheDocument();
      });
    });

    it('should call abandon API when confirming start new', async () => {
      const mockResponse = createMockStartResponse();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        })
        // Abandon API call
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
        // Second initialization call
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(createMockStartResponse()),
        });

      render(<FounderOnboardingWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('start-new-button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('start-new-button'));

      await waitFor(() => {
        expect(screen.getByText('Start Fresh')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('dialog-action'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/onboarding/abandon',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ sessionId: 'test-session-123' }),
          })
        );
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
          json: () => Promise.resolve({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(createMockStartResponse()),
        });

      render(<FounderOnboardingWizard {...defaultProps} />);

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
          (call: any) => call[0] === '/api/onboarding/start/'
        );
        expect(startCalls.length).toBe(2);
      });
    });

    it('should show success toast when starting fresh', async () => {
      const mockResponse = createMockStartResponse();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(createMockStartResponse()),
        });

      render(<FounderOnboardingWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('start-new-button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('start-new-button'));

      await waitFor(() => {
        expect(screen.getByText('Start Fresh')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('dialog-action'));

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Starting fresh conversation with Alex...');
      });
    });

    it('should reset isResuming to false after starting fresh', async () => {
      // Start with a resuming session
      const mockResponse = createMockStartResponse({
        resuming: true,
        conversationHistory: [{ role: 'assistant', content: 'Hello', timestamp: '2024-01-01' }],
      });

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(createMockStartResponse({ resuming: false })),
        });

      render(<FounderOnboardingWizard {...defaultProps} />);

      await waitFor(() => {
        expect(capturedSidebarProps.isResuming).toBe(true);
      });

      fireEvent.click(screen.getByTestId('start-new-button'));

      await waitFor(() => {
        expect(screen.getByText('Start Fresh')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('dialog-action'));

      await waitFor(() => {
        expect(capturedSidebarProps.isResuming).toBe(false);
      });
    });

    it('should NOT call abandon API when clicking Continue Current', async () => {
      const mockResponse = createMockStartResponse();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      render(<FounderOnboardingWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('start-new-button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('start-new-button'));

      await waitFor(() => {
        expect(screen.getByText('Start New Conversation?')).toBeInTheDocument();
      });

      // Click Continue Current (cancel)
      fireEvent.click(screen.getByTestId('dialog-cancel'));

      // Should NOT have called abandon API (only 1 call for initial start)
      await waitFor(() => {
        expect((global.fetch as jest.Mock).mock.calls.length).toBe(1);
      });
    });

    it('should handle abandon API failure gracefully', async () => {
      const mockResponse = createMockStartResponse();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        })
        // Abandon fails
        .mockRejectedValueOnce(new Error('Network error'))
        // But reinit should still proceed
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(createMockStartResponse()),
        });

      // Spy on console.warn to verify it was called
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      render(<FounderOnboardingWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('start-new-button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('start-new-button'));

      await waitFor(() => {
        expect(screen.getByText('Start Fresh')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('dialog-action'));

      // Should still reinitialize despite abandon failure
      await waitFor(() => {
        const startCalls = (global.fetch as jest.Mock).mock.calls.filter(
          (call: any) => call[0] === '/api/onboarding/start/'
        );
        expect(startCalls.length).toBe(2);
      });

      warnSpy.mockRestore();
    });
  });

  describe('exit behavior', () => {
    it('should show exit dialog when exit button is clicked', async () => {
      const mockResponse = createMockStartResponse();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      render(<FounderOnboardingWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('exit-button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('exit-button'));

      await waitFor(() => {
        expect(screen.getByText('Exit Onboarding?')).toBeInTheDocument();
      });
    });

    it('should redirect to founder-dashboard for founder plan type', async () => {
      const mockResponse = createMockStartResponse();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        })
        // Pause API call before redirect
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

      render(<FounderOnboardingWizard {...defaultProps} planType="founder" />);

      await waitFor(() => {
        expect(screen.getByTestId('exit-button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('exit-button'));

      await waitFor(() => {
        expect(screen.getByText('Exit Onboarding?')).toBeInTheDocument();
      });

      // Find and click Save & Exit (dialog-action)
      fireEvent.click(screen.getByTestId('dialog-action'));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/founder-dashboard');
      });
    });

    it('should redirect to /clients for sprint plan type', async () => {
      const mockResponse = createMockStartResponse();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        })
        // Pause API call before redirect
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

      render(<FounderOnboardingWizard {...defaultProps} planType="sprint" />);

      await waitFor(() => {
        expect(screen.getByTestId('exit-button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('exit-button'));

      await waitFor(() => {
        expect(screen.getByText('Exit Onboarding?')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('dialog-action'));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/clients');
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

      render(<FounderOnboardingWizard {...defaultProps} />);

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

      render(<FounderOnboardingWizard {...defaultProps} />);

      await waitFor(() => {
        expect(capturedSidebarProps.currentStage).toBe(4);
      });
    });

    it('should pass progress to sidebar', async () => {
      const mockResponse = createMockStartResponse({
        resuming: true,
        conversationHistory: [{ role: 'assistant', content: 'Hello', timestamp: '2024-01-01' }],
      });
      // Manually set overallProgress in the response
      mockResponse.overallProgress = 45;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      render(<FounderOnboardingWizard {...defaultProps} />);

      await waitFor(() => {
        expect(capturedSidebarProps.overallProgress).toBe(45);
      });
    });
  });

  describe('agent personality', () => {
    it('should pass agent personality to sidebar', async () => {
      const mockResponse = createMockStartResponse();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      render(<FounderOnboardingWizard {...defaultProps} />);

      await waitFor(() => {
        expect(capturedSidebarProps.agentPersonality).toEqual({
          name: 'Alex',
          role: 'Strategic Business Consultant',
        });
      });
    });
  });
});
