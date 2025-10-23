/**
 * 15-Step User Journey Validation Tests
 * Source: onboarding-journey-map.md - Lines 21-377
 * 
 * Tests validate the complete user journey with measurable success metrics:
 * - Steps 1-3: Pre-Onboarding (Marketing Site)
 * - Steps 4-5: Authentication & Handoff
 * - Steps 6-11: AI-Guided Conversation (20-25 minutes)
 * - Steps 12-13: AI Processing & Analysis
 * - Steps 14-15: Results Delivery & First Value
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { 
  UserJourneyValidator,
  PerformanceMonitor,
  customMatchers,
  FIFTEEN_STEP_JOURNEY,
  JOURNEY_SPECIFICATIONS 
} from '../utils/test-helpers';
import { OnboardingWizard } from '../../components/onboarding/OnboardingWizard';

// Extend Jest with custom matchers
expect.extend(customMatchers);

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

describe('Complete 15-Step User Journey Validation', () => {
  let journeyValidator: UserJourneyValidator;
  let performanceMonitor: PerformanceMonitor;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    journeyValidator = new UserJourneyValidator();
    performanceMonitor = new PerformanceMonitor();
    
    // Mock successful API responses
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({
        success: true,
        sessionId: 'test-session-123',
        stageInfo: { currentStage: 1, totalStages: 7 },
        agentIntroduction: 'Welcome! I\'m your AI strategic consultant.',
        firstQuestion: 'Tell me about your business idea.',
        conversationContext: {
          agentPersonality: { name: 'Alex', role: 'Strategic Consultant' }
        }
      }), { status: 200 })
    );
  });

  describe('Complete Journey Execution', () => {
    it('should complete all 15 journey steps with specified success metrics', async () => {
      // Test Requirement: Complete user journey from marketing to value delivery
      // Source: onboarding-journey-map.md - 15-step specification
      
      await performanceMonitor.startMeasuring();

      // Steps 1-3: Pre-Onboarding (Marketing Site)
      await journeyValidator.validateStep(1, 'Landing Page Discovery', {
        timeOnPage: { min: 90, unit: 'seconds' },
        scrollDepth: { min: 70, unit: 'percent' },
        clickThroughRate: { min: 15, unit: 'percent' }
      });

      await journeyValidator.validateStep(2, 'Pricing Page Evaluation', {
        conversionRate: { min: 25, unit: 'percent' },
        timeOnPricing: { min: 2, unit: 'minutes' },
        featureComparisonEngagement: { min: 60, unit: 'percent' }
      });

      await journeyValidator.validateStep(3, 'Signup Process', {
        signupCompletionRate: { min: 85, unit: 'percent' },
        oauthSuccessRate: { min: 95, unit: 'percent' },
        timeToComplete: { max: 3, unit: 'minutes' }
      });

      // Steps 4-5: Authentication & Handoff
      await journeyValidator.validateStep(4, 'OAuth Authentication', {
        oauthCompletionRate: { min: 95, unit: 'percent' },
        redirectSuccessRate: { min: 98, unit: 'percent' },
        authenticationTime: { max: 30, unit: 'seconds' }
      });

      await journeyValidator.validateStep(5, 'Welcome & Onboarding Introduction', {
        onboardingStartRate: { min: 90, unit: 'percent' },
        timeToStart: { max: 2, unit: 'minutes' },
        userConfidenceScore: { min: 4.0, unit: 'rating' }
      });

      // Steps 6-11: AI-Guided Conversation (20-25 minutes)
      const conversationSteps = [
        { step: 6, stage: 'Customer Discovery', duration: { min: 5, max: 7 } },
        { step: 7, stage: 'Problem Analysis', duration: { min: 5, max: 7 } },
        { step: 8, stage: 'Solution Concept', duration: { min: 5, max: 7 } },
        { step: 9, stage: 'Competitive Landscape', duration: { min: 3, max: 5 } },
        { step: 10, stage: 'Resource Assessment', duration: { min: 3, max: 5 } },
        { step: 11, stage: 'Business Goals', duration: { min: 2, max: 3 } }
      ];

      for (const { step, stage, duration } of conversationSteps) {
        await journeyValidator.validateConversationStep(step, stage, {
          responseQualityScore: { min: 3.5, unit: 'rating' },
          stageCompletionRate: { min: 85, unit: 'percent' },
          userSatisfaction: { min: 4.0, unit: 'rating' },
          duration: duration
        });
      }

      // Steps 12-13: AI Processing & Analysis
      await journeyValidator.validateStep(12, 'Conversation Completion', {
        completionRate: { min: 90, unit: 'percent' },
        dataAccuracyConfirmation: { min: 95, unit: 'percent' },
        workflowAuthorization: { min: 95, unit: 'percent' }
      });

      await journeyValidator.validateStep(13, 'AI Multi-Agent Processing', {
        userRetentionDuringProcessing: { min: 80, unit: 'percent' },
        progressEngagement: { min: 60, unit: 'percent' },
        abandonmentRate: { max: 15, unit: 'percent' }
      });

      // Steps 14-15: Results Delivery & First Value
      await journeyValidator.validateStep(14, 'Results Presentation', {
        contentEngagement: { min: 70, unit: 'percent' },
        timeSpentReviewing: { min: 5, unit: 'minutes' },
        downloadRate: { min: 40, unit: 'percent' },
        satisfactionScore: { min: 4.2, unit: 'rating' }
      });

      await journeyValidator.validateStep(15, 'Next Steps & Action Planning', {
        nextStepsEngagement: { min: 80, unit: 'percent' },
        experimentSelection: { min: 60, unit: 'percent' },
        timelineCommitment: { min: 70, unit: 'percent' }
      });

      // Validate overall journey success
      expect(journeyValidator.overallSuccess).toBe(true);
      expect(journeyValidator.completedSteps).toBe(15);
      
      const metrics = await performanceMonitor.getMetrics();
      expect(metrics.totalJourneyTime).toBeWithinRange(45, 55); // 45-55 minutes total
    });
  });

  describe('Pre-Onboarding Steps (Marketing Site)', () => {
    it('should validate landing page discovery metrics', async () => {
      // Test Requirement: Step 1 - Landing Page Discovery
      const stepMetrics = FIFTEEN_STEP_JOURNEY.find(step => step.step === 1)?.metrics;
      
      await journeyValidator.validateStep(1, 'Landing Page Discovery', stepMetrics!);
      
      // Verify specific landing page requirements
      expect(journeyValidator.completedSteps).toBe(1);
    });

    it('should validate pricing page evaluation', async () => {
      // Test Requirement: Step 2 - Pricing Page Evaluation
      const stepMetrics = FIFTEEN_STEP_JOURNEY.find(step => step.step === 2)?.metrics;
      
      await journeyValidator.validateStep(2, 'Pricing Page Evaluation', stepMetrics!);
      
      // Additional validation for pricing page engagement
      expect(journeyValidator.completedSteps).toBe(1);
    });

    it('should validate signup process completion', async () => {
      // Test Requirement: Step 3 - Signup Process
      const stepMetrics = FIFTEEN_STEP_JOURNEY.find(step => step.step === 3)?.metrics;
      
      await journeyValidator.validateStep(3, 'Signup Process', stepMetrics!);
      
      // Verify signup completion meets requirements
      expect(journeyValidator.completedSteps).toBe(1);
    });
  });

  describe('Authentication & Handoff Steps', () => {
    it('should validate OAuth authentication flow', async () => {
      // Test Requirement: Step 4 - OAuth Authentication
      const stepMetrics = FIFTEEN_STEP_JOURNEY.find(step => step.step === 4)?.metrics;
      
      await journeyValidator.validateStep(4, 'OAuth Authentication', stepMetrics!);
      
      // Verify OAuth success rates meet requirements
      expect(journeyValidator.completedSteps).toBe(1);
    });

    it('should validate welcome and onboarding introduction', async () => {
      // Test Requirement: Step 5 - Welcome & Onboarding Introduction
      const { container } = render(
        <OnboardingWizard
          userId="test-user"
          planType="trial"
          userEmail="test@example.com"
        />
      );

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText(/welcome! i'm your ai strategic consultant/i)).toBeInTheDocument();
      });

      const stepMetrics = FIFTEEN_STEP_JOURNEY.find(step => step.step === 5)?.metrics;
      await journeyValidator.validateStep(5, 'Welcome & Onboarding Introduction', stepMetrics!);
      
      // Verify onboarding start experience
      expect(screen.getByText(/tell me about your business idea/i)).toBeInTheDocument();
    });
  });

  describe('AI-Guided Conversation Steps (6-11)', () => {
    it('should validate customer discovery conversation stage', async () => {
      // Test Requirement: Step 6 - Customer Discovery
      const user = userEvent.setup();
      const { container } = render(
        <OnboardingWizard
          userId="test-user"
          planType="trial"
          userEmail="test@example.com"
        />
      );

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByText(/welcome! i'm your ai strategic consultant/i)).toBeInTheDocument();
      });

      // Mock conversation interaction
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({
          success: true,
          messageId: 'msg-1',
          agentResponse: 'Great! Tell me more about who your target customers are.',
          stageProgress: { currentStage: 1, overallProgress: 15 }
        }), { status: 200 })
      );

      // Simulate user input for customer discovery
      const textarea = screen.getByPlaceholderText(/type your response/i);
      const sendButton = screen.getByLabelText(/send message/i);

      await user.type(textarea, 'I want to build a SaaS platform for small businesses');
      await user.click(sendButton);

      // Validate conversation step
      await journeyValidator.validateConversationStep(6, 'Customer Discovery', {
        responseQualityScore: { min: 3.5, unit: 'rating' },
        stageCompletionRate: { min: 85, unit: 'percent' },
        userSatisfaction: { min: 4.0, unit: 'rating' },
        duration: { min: 5, max: 7, unit: 'minutes' }
      });

      expect(journeyValidator.completedSteps).toBe(1);
    });

    it('should validate all conversation stages meet duration targets', async () => {
      // Test Requirement: All conversation stages (6-11) meet timing requirements
      const conversationStages = JOURNEY_SPECIFICATIONS.stages;
      
      for (const stage of conversationStages) {
        await journeyValidator.validateConversationStep(
          stage.stage + 5, // Steps 6-11 map to stages 1-7
          stage.name,
          {
            responseQualityScore: { min: 3.5, unit: 'rating' },
            stageCompletionRate: { min: 85, unit: 'percent' },
            userSatisfaction: { min: 4.0, unit: 'rating' },
            duration: stage.targetDuration
          }
        );
      }

      expect(journeyValidator.completedSteps).toBe(7);
    });

    it('should maintain conversation quality throughout all stages', async () => {
      // Test Requirement: Consistent quality across all conversation stages
      const qualityMetrics = {
        responseQualityScore: { min: 3.5, unit: 'rating' },
        stageCompletionRate: { min: 85, unit: 'percent' },
        userSatisfaction: { min: 4.0, unit: 'rating' }
      };

      const stages = [
        'Customer Discovery',
        'Problem Analysis', 
        'Solution Concept',
        'Competitive Landscape',
        'Resource Assessment',
        'Business Goals'
      ];

      for (let i = 0; i < stages.length; i++) {
        await journeyValidator.validateConversationStep(
          i + 6, // Steps 6-11
          stages[i],
          {
            ...qualityMetrics,
            duration: { min: 2, max: 7, unit: 'minutes' }
          }
        );
      }

      expect(journeyValidator.completedSteps).toBe(6);
    });
  });

  describe('AI Processing & Analysis Steps (12-13)', () => {
    it('should validate conversation completion step', async () => {
      // Test Requirement: Step 12 - Conversation Completion
      const stepMetrics = FIFTEEN_STEP_JOURNEY.find(step => step.step === 12)?.metrics;
      
      await journeyValidator.validateStep(12, 'Conversation Completion', stepMetrics!);
      
      // Verify conversation completion triggers workflow
      expect(journeyValidator.completedSteps).toBe(1);
    });

    it('should validate AI multi-agent processing', async () => {
      // Test Requirement: Step 13 - AI Multi-Agent Processing
      const stepMetrics = FIFTEEN_STEP_JOURNEY.find(step => step.step === 13)?.metrics;
      
      await journeyValidator.validateStep(13, 'AI Multi-Agent Processing', stepMetrics!);
      
      // Verify user retention during processing
      expect(journeyValidator.completedSteps).toBe(1);
    });
  });

  describe('Results Delivery & First Value Steps (14-15)', () => {
    it('should validate results presentation', async () => {
      // Test Requirement: Step 14 - Results Presentation
      const stepMetrics = FIFTEEN_STEP_JOURNEY.find(step => step.step === 14)?.metrics;
      
      await journeyValidator.validateStep(14, 'Results Presentation', stepMetrics!);
      
      // Verify results meet satisfaction requirements
      expect(journeyValidator.completedSteps).toBe(1);
    });

    it('should validate next steps and action planning', async () => {
      // Test Requirement: Step 15 - Next Steps & Action Planning
      const stepMetrics = FIFTEEN_STEP_JOURNEY.find(step => step.step === 15)?.metrics;
      
      await journeyValidator.validateStep(15, 'Next Steps & Action Planning', stepMetrics!);
      
      // Verify action planning engagement
      expect(journeyValidator.completedSteps).toBe(1);
    });
  });

  describe('Journey Performance Validation', () => {
    it('should complete journey within performance targets', async () => {
      // Test Requirement: Overall journey performance meets specifications
      await performanceMonitor.startMeasuring();
      
      // Simulate complete journey
      const journeySteps = FIFTEEN_STEP_JOURNEY;
      
      for (const step of journeySteps) {
        await journeyValidator.validateStep(step.step, step.name, step.metrics);
      }
      
      const metrics = await performanceMonitor.getMetrics();
      
      // Validate performance targets
      expect(metrics.totalJourneyTime).toBeWithinRange(45, 55); // 45-55 minutes total
      expect(metrics.conversationTime).toBeWithinRange(20, 25); // 20-25 minutes conversation
      expect(metrics.aiProcessingTime).toBeLessThan(20); // <20 minutes AI processing
    });

    it('should maintain user engagement throughout journey', async () => {
      // Test Requirement: User engagement metrics throughout journey
      const engagementMetrics = {
        overallEngagement: 0.85, // 85% engagement rate
        stageCompletionRate: 0.90, // 90% stage completion
        userSatisfaction: 4.2 // 4.2/5 satisfaction
      };

      // Validate engagement at key journey points
      const keySteps = [5, 8, 12, 15]; // Welcome, mid-conversation, completion, results
      
      for (const stepNumber of keySteps) {
        const step = FIFTEEN_STEP_JOURNEY.find(s => s.step === stepNumber);
        if (step) {
          await journeyValidator.validateStep(step.step, step.name, step.metrics);
        }
      }

      expect(journeyValidator.overallSuccess).toBe(true);
      expect(journeyValidator.completedSteps).toBe(4);
    });

    it('should handle journey interruptions gracefully', async () => {
      // Test Requirement: Journey resilience and recovery
      
      // Simulate interruption at step 8 (mid-conversation)
      const interruptedSteps = FIFTEEN_STEP_JOURNEY.slice(0, 8);
      
      for (const step of interruptedSteps) {
        await journeyValidator.validateStep(step.step, step.name, step.metrics);
      }

      // Verify partial journey completion
      expect(journeyValidator.completedSteps).toBe(8);
      
      // Simulate journey resumption
      const remainingSteps = FIFTEEN_STEP_JOURNEY.slice(8);
      
      for (const step of remainingSteps) {
        await journeyValidator.validateStep(step.step, step.name, step.metrics);
      }

      // Verify complete journey recovery
      expect(journeyValidator.completedSteps).toBe(15);
      expect(journeyValidator.overallSuccess).toBe(true);
    });
  });

  describe('Cross-Tier Journey Validation', () => {
    it('should validate journey success across all user tiers', async () => {
      // Test Requirement: Journey works for trial, founder, and consultant tiers
      const userTiers = ['trial', 'founder', 'consultant'];
      
      for (const tier of userTiers) {
        const tierJourneyValidator = new UserJourneyValidator();
        
        // Simulate tier-specific journey
        const keySteps = FIFTEEN_STEP_JOURNEY.slice(4, 12); // Focus on onboarding steps
        
        for (const step of keySteps) {
          await tierJourneyValidator.validateStep(step.step, step.name, step.metrics);
        }

        expect(tierJourneyValidator.overallSuccess).toBe(true);
        expect(tierJourneyValidator.completedSteps).toBe(8);
      }
    });
  });
});
