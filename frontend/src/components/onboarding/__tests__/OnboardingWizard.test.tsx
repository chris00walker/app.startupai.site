/**
 * Test-Driven Development for Onboarding System
 * Tests the complete user journey from authentication to conversation start
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OnboardingWizard } from '../OnboardingWizard';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock Sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock fetch for API calls with proper typing
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

describe('OnboardingWizard - TDD Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('1. API Endpoint Integration', () => {
    it('should successfully initialize onboarding session', async () => {
      // Arrange: Mock successful API response
      const mockResponse = new Response(JSON.stringify({
        success: true,
        sessionId: 'test-session-123',
        stageInfo: {
          currentStage: 1,
          totalStages: 7,
          stageName: 'Welcome & Introduction'
        },
        agentIntroduction: 'Hello! I\'m your AI strategic consultant.',
        firstQuestion: 'What brings you here today?',
        conversationContext: {
          agentPersonality: {
            name: 'Alex',
            role: 'Strategic Business Consultant',
            expertise: 'startup strategy'
          }
        }
      }), { status: 200, statusText: 'OK' });
      
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Act: Render component with valid props
      render(
        <OnboardingWizard
          userId="test-user-123"
          planType="trial"
          userEmail="test@example.com"
        />
      );

      // Assert: Should show loading state initially
      expect(screen.getByText(/starting your ai consultation\.\.\./i)).toBeInTheDocument();

      // Wait for API call to complete
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/onboarding/start/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: 'test-user-123',
            planType: 'trial',
            userContext: {
              referralSource: 'direct',
              previousExperience: 'first_time',
              timeAvailable: 30,
            },
          }),
        });
      });

      // Should show the conversation interface
      await waitFor(() => {
        expect(screen.getByText(/hello! i'm your ai strategic consultant/i)).toBeInTheDocument();
      });
    });

    it('should handle API errors gracefully', async () => {
      // Arrange: Mock API error
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Act: Render component
      render(
        <OnboardingWizard
          userId="test-user-123"
          planType="trial"
          userEmail="test@example.com"
        />
      );

      // Assert: Should show error state
      await waitFor(() => {
        expect(screen.getByText(/unable to start onboarding/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/try again/i)).toBeInTheDocument();
      expect(screen.getByText(/go to dashboard/i)).toBeInTheDocument();
    });
  });

  describe('2. User Journey Flow', () => {
    it('should complete the full onboarding conversation flow', async () => {
      // Arrange: Mock successful initialization
      const initResponse = new Response(JSON.stringify({
        success: true,
        sessionId: 'test-session-123',
        stageInfo: { currentStage: 1, totalStages: 7 },
        agentIntroduction: 'Welcome to onboarding!',
        firstQuestion: 'Tell me about your business idea.',
        conversationContext: {
          agentPersonality: { name: 'Alex', role: 'Consultant' }
        }
      }), { status: 200 });

      const messageResponse = new Response(JSON.stringify({
        success: true,
        messageId: 'msg-123',
        agentResponse: 'That sounds interesting! Tell me more.',
        stageProgress: { currentStage: 1, overallProgress: 15 }
      }), { status: 200 });

      mockFetch
        .mockResolvedValueOnce(initResponse)
        .mockResolvedValueOnce(messageResponse);

      // Act: Render and interact
      render(
        <OnboardingWizard
          userId="test-user-123"
          planType="trial"
          userEmail="test@example.com"
        />
      );

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByText(/welcome to onboarding/i)).toBeInTheDocument();
      });

      // Simulate user typing and sending message
      const textarea = screen.getByPlaceholderText(/type your response/i);
      const sendButton = screen.getByLabelText(/send message/i);

      fireEvent.change(textarea, { target: { value: 'I want to build a SaaS platform' } });
      fireEvent.click(sendButton);

      // Assert: Message should be sent
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/onboarding/message/', expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('I want to build a SaaS platform')
        }));
      });
    });
  });

  describe('3. Error Recovery', () => {
    it('should show error state and retry button on failures', async () => {
      // Arrange: Mock API failure
      mockFetch.mockRejectedValueOnce(new Error('Network failure'));

      // Act: Render component
      render(
        <OnboardingWizard
          userId="test-user-123"
          planType="trial"
          userEmail="test@example.com"
        />
      );

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText(/unable to start onboarding/i)).toBeInTheDocument();
      }, { timeout: 3000 });

      // Should show error message and retry button (use getAllByText to handle multiple instances)
      expect(screen.getAllByText(/network failure/i)[0]).toBeInTheDocument();
      expect(screen.getByText(/try again/i)).toBeInTheDocument();
      expect(screen.getByText(/go to dashboard/i)).toBeInTheDocument();
    });
  });
});

// Integration test for the actual production issue
describe('Production Issue Reproduction', () => {
  it('should handle the exact user flow from the screenshot', async () => {
    // This test reproduces the exact scenario from the user's screenshot
    const mockUserId = 'user-from-auth-flow';
    const mockPlanType = 'trial';
    
    // Mock the failing API call that's happening in production
    mockFetch.mockRejectedValueOnce(
      new Error('Failed to start onboarding session')
    );

    render(
      <OnboardingWizard
        userId={mockUserId}
        planType={mockPlanType}
        userEmail="user@example.com"
      />
    );

    // Should show the exact error message from the screenshot
    await waitFor(() => {
      expect(screen.getByText(/unable to start onboarding/i)).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Should show the error message and buttons (use getAllByText to handle multiple instances)
    expect(screen.getAllByText(/failed to start onboarding session/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/try again/i)).toBeInTheDocument();
    expect(screen.getByText(/go to dashboard/i)).toBeInTheDocument();
  });
});
