/**
 * Test-Driven Development for Onboarding System
 * Tests the complete user journey from authentication to conversation start
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
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

// Mock fetch for API calls
global.fetch = jest.fn();

describe('OnboardingWizard - TDD Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('1. API Endpoint Integration', () => {
    it('should successfully initialize onboarding session', async () => {
      // Arrange: Mock successful API response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
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
        })
      });

      // Act: Render component with valid props
      render(
        <OnboardingWizard
          userId="test-user-123"
          planType="trial"
          userEmail="test@example.com"
        />
      );

      // Assert: Should show loading state initially
      expect(screen.getByText(/starting your ai consultation/i)).toBeInTheDocument();

      // Wait for API call to complete
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/onboarding/start/', {
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
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

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
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            sessionId: 'test-session-123',
            stageInfo: { currentStage: 1, totalStages: 7 },
            agentIntroduction: 'Welcome to onboarding!',
            firstQuestion: 'Tell me about your business idea.',
            conversationContext: {
              agentPersonality: { name: 'Alex', role: 'Consultant' }
            }
          })
        })
        // Mock message sending
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            messageId: 'msg-123',
            agentResponse: 'That sounds interesting! Tell me more.',
            stageProgress: { currentStage: 1, overallProgress: 15 }
          })
        });

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
        expect(global.fetch).toHaveBeenCalledWith('/api/onboarding/message/', expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('I want to build a SaaS platform')
        }));
      });
    });
  });

  describe('3. Error Recovery', () => {
    it('should provide retry functionality on failures', async () => {
      // Arrange: Mock initial failure then success
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Initial failure'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            sessionId: 'test-session-123',
            stageInfo: { currentStage: 1, totalStages: 7 },
            agentIntroduction: 'Welcome!',
            conversationContext: { agentPersonality: { name: 'Alex' } }
          })
        });

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
      });

      // Click retry
      const retryButton = screen.getByText(/try again/i);
      fireEvent.click(retryButton);

      // Should retry and succeed
      await waitFor(() => {
        expect(screen.getByText(/welcome!/i)).toBeInTheDocument();
      });
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
    (global.fetch as jest.Mock).mockRejectedValueOnce(
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
      expect(screen.getByText(/unable to start conversation\. please try again in a moment\./i)).toBeInTheDocument();
    });

    // Should have the exact buttons from the screenshot
    expect(screen.getByText(/try again/i)).toBeInTheDocument();
    expect(screen.getByText(/go to dashboard/i)).toBeInTheDocument();
  });
});
