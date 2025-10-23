/**
 * Marketing Promise Delivery Validation Tests
 * Source: onboarding-agent-integration.md - Lines 14-18
 * 
 * Tests that validate the product delivers exactly what marketing promises:
 * - Resolves 404 blocker for all user tiers
 * - Delivers AI-powered strategic analysis
 * - Provides guided idea validation for all users
 */

import { render, screen, waitFor } from '@testing-library/react';
import { 
  APIResponseBuilder, 
  UserSimulator, 
  customMatchers,
  MARKETING_PROMISES,
  USER_TIER_SPECIFICATIONS 
} from '../utils/test-helpers';

// Extend Jest with custom matchers
expect.extend(customMatchers);

// Mock fetch for API calls
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

describe('Marketing Promise vs Reality Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('404 Blocker Resolution', () => {
    it('should resolve the 404 blocker for all user tiers', async () => {
      // Test Requirement: Users reach functional /onboarding page (not 404)
      // Source: onboarding-agent-integration.md - Critical launch blocker
      
      const userTiers = Object.keys(USER_TIER_SPECIFICATIONS);
      
      for (const tier of userTiers) {
        // Act: Simulate user navigation after authentication
        const response = await UserSimulator.authenticateAndNavigate(tier);
        
        // Assert: No 404 error - users reach functional onboarding page
        expect(response.url).toBe('/onboarding');
        expect(response.status).toBe(200);
        expect(response.content).toContain('AI-Guided Strategy Session');
        
        // Verify tier-specific access is granted
        expect(response.status).not.toBe(404);
      }
    });

    it('should provide functional onboarding experience for each tier', async () => {
      // Test Requirement: All tiers get working onboarding (not broken experience)
      
      const tierTests = [
        { tier: 'trial', expectedSessions: 3 },
        { tier: 'founder', expectedSessions: 10 },
        { tier: 'consultant', expectedSessions: 50 }
      ];

      for (const { tier, expectedSessions } of tierTests) {
        const session = await UserSimulator.startOnboardingSession(tier);
        
        // Assert: Functional session created with proper limits
        expect(session.sessionId).toBeDefined();
        expect(session.planLimits.sessions).toBe(expectedSessions);
        expect(session.conversationStages).toHaveLength(7);
        expect(session.features.aiGuidance).toBe(true);
      }
    });
  });

  describe('AI-Powered Strategic Analysis Delivery', () => {
    it('should deliver AI-powered strategic analysis as promised', async () => {
      // Test Requirement: Marketing promise "AI-powered strategic analysis" is delivered
      // Source: Marketing site promises vs actual deliverables
      
      // Arrange: Start onboarding session
      const session = await UserSimulator.startOnboardingSession('trial');
      
      // Act: Complete full conversation to trigger analysis
      const completion = await UserSimulator.completeFullConversation(session);
      
      // Assert: All promised deliverables are provided
      const expectedDeliverables = MARKETING_PROMISES.aiPoweredAnalysis.deliverables;
      
      for (const deliverable of expectedDeliverables) {
        expect(completion.deliverables).toHaveProperty(deliverable);
        expect(completion.deliverables[deliverable]).toBeDefined();
        expect(completion.deliverables[deliverable]).not.toBe('');
      }

      // Verify specific deliverable structure matches marketing promises
      expect(completion.deliverables).toEqual(
        expect.objectContaining({
          executiveSummary: expect.any(String),
          customerProfile: expect.any(Object),
          competitivePositioning: expect.any(Object),
          valuePropositionCanvas: expect.any(Object),
          validationRoadmap: expect.any(Array),
          businessModelCanvas: expect.any(Object)
        })
      );
    });

    it('should provide strategic analysis with measurable quality', async () => {
      // Test Requirement: Analysis quality meets business standards
      
      const session = await UserSimulator.startOnboardingSession('founder');
      const completion = await UserSimulator.completeFullConversation(session);
      
      // Assert: Quality metrics meet specifications
      expect(completion.metrics.qualityScore).toMeetSuccessMetric(3.5); // >3.5/5
      expect(completion.metrics.conversationDuration).toBeWithinRange(20, 25); // 20-25 minutes
      expect(completion.metrics.completionRate).toMeetSuccessMetric(0.85); // >85%
    });

    it('should deliver analysis within promised timeframes', async () => {
      // Test Requirement: AI processing completes within marketing promises
      
      const startTime = Date.now();
      const session = await UserSimulator.startOnboardingSession('consultant');
      const completion = await UserSimulator.completeFullConversation(session);
      const totalTime = (Date.now() - startTime) / (1000 * 60); // Convert to minutes
      
      // Assert: Processing time meets marketing promises
      expect(totalTime).toBeLessThanOrEqual(30); // Complete experience under 30 minutes
      expect(completion.metrics.conversationDuration).toBeWithinRange(20, 25); // Conversation: 20-25 minutes
    });
  });

  describe('Universal Access Across All User Tiers', () => {
    it('should provide guided idea validation for all users', async () => {
      // Test Requirement: All tiers get AI-guided experience (not just trial)
      // Source: onboarding-agent-integration.md - Universal access requirement
      
      const allTiers = MARKETING_PROMISES.universalAccess;
      
      for (const tier of allTiers) {
        // Act: Start session for each tier
        const session = await UserSimulator.startOnboardingSession(tier);
        
        // Assert: All tiers receive AI guidance
        expect(session.agentPersonality).toBeDefined();
        expect(session.conversationStages).toHaveLength(7);
        expect(session.features.aiGuidance).toBe(true);
        expect(session.features.strategicAnalysis).toBe(true);
        
        // Verify tier-specific limits are applied correctly
        const expectedLimits = USER_TIER_SPECIFICATIONS[tier as keyof typeof USER_TIER_SPECIFICATIONS];
        expect(session.planLimits).toEqual(expectedLimits);
      }
    });

    it('should provide appropriate experience level for each tier', async () => {
      // Test Requirement: Different tiers get appropriate feature access
      
      const tierExpectations = {
        trial: { 
          sessions: 3, 
          messages: 100, 
          workflows: 3,
          features: ['basic_analysis', 'conversation_guidance']
        },
        founder: { 
          sessions: 10, 
          messages: 200, 
          workflows: 20,
          features: ['advanced_analysis', 'priority_support', 'conversation_guidance']
        },
        consultant: { 
          sessions: 50, 
          messages: 500, 
          workflows: 100,
          features: ['enterprise_analysis', 'white_label', 'priority_support', 'conversation_guidance']
        }
      };

      for (const [tier, expectations] of Object.entries(tierExpectations)) {
        const session = await UserSimulator.startOnboardingSession(tier);
        
        // Assert: Limits match tier expectations
        expect(session.planLimits.sessions).toBe(expectations.sessions);
        expect(session.planLimits.messages).toBe(expectations.messages);
        expect(session.planLimits.workflows).toBe(expectations.workflows);
        
        // Assert: Core AI features available to all tiers
        expect(session.features.aiGuidance).toBe(true);
        expect(session.features.strategicAnalysis).toBe(true);
      }
    });
  });

  describe('Marketing Promise Integrity', () => {
    it('should match marketing site claims with actual functionality', async () => {
      // Test Requirement: Product functionality matches marketing claims exactly
      
      const marketingClaims = {
        'AI-powered strategic analysis': true,
        'Multi-agent AI system': true,
        'Guided idea validation': true,
        'No more 404 errors': true,
        'Works for all subscription tiers': true
      };

      // Verify each marketing claim is delivered
      for (const [claim, expected] of Object.entries(marketingClaims)) {
        switch (claim) {
          case 'AI-powered strategic analysis':
            const session = await UserSimulator.startOnboardingSession('trial');
            const analysis = await UserSimulator.completeFullConversation(session);
            expect(analysis.deliverables.executiveSummary).toBeDefined();
            break;
            
          case 'Multi-agent AI system':
            // Verify multi-agent processing is available
            const multiAgentSession = await UserSimulator.startOnboardingSession('founder');
            expect(multiAgentSession.features.strategicAnalysis).toBe(true);
            break;
            
          case 'Guided idea validation':
            const guidedSession = await UserSimulator.startOnboardingSession('consultant');
            expect(guidedSession.conversationStages.length).toBeGreaterThan(0);
            break;
            
          case 'No more 404 errors':
            const response = await UserSimulator.authenticateAndNavigate('trial');
            expect(response.status).not.toBe(404);
            break;
            
          case 'Works for all subscription tiers':
            for (const tier of ['trial', 'founder', 'consultant']) {
              const tierSession = await UserSimulator.startOnboardingSession(tier);
              expect(tierSession.features.aiGuidance).toBe(true);
            }
            break;
        }
      }
    });

    it('should deliver value within first user session', async () => {
      // Test Requirement: Users get immediate value (first session success)
      
      const session = await UserSimulator.startOnboardingSession('trial');
      const completion = await UserSimulator.completeFullConversation(session);
      
      // Assert: Immediate value delivered in first session
      expect(completion.deliverables.executiveSummary).toBeDefined();
      expect(completion.deliverables.customerProfile).toBeDefined();
      expect(completion.deliverables.validationRoadmap).toBeDefined();
      
      // Assert: Value quality meets user expectations
      expect(completion.metrics.qualityScore).toMeetSuccessMetric(4.0); // >4.0/5 satisfaction
    });
  });

  describe('Launch Blocker Resolution Validation', () => {
    it('should resolve all identified launch blockers', async () => {
      // Test Requirement: All P0 launch blockers from two-site-implementation-plan.md resolved
      
      const launchBlockers = [
        'BLOCKER 4: Onboarding 404 Error - Complete User Journey Failure',
        'Universal access across all user tiers',
        'Marketing promise delivery validation',
        'AI-powered analysis functionality'
      ];

      // Verify each blocker is resolved
      for (const blocker of launchBlockers) {
        switch (true) {
          case blocker.includes('404 Error'):
            const response = await UserSimulator.authenticateAndNavigate('trial');
            expect(response.status).toBe(200);
            expect(response.url).toBe('/onboarding');
            break;
            
          case blocker.includes('Universal access'):
            for (const tier of ['trial', 'founder', 'consultant']) {
              const session = await UserSimulator.startOnboardingSession(tier);
              expect(session.features.aiGuidance).toBe(true);
            }
            break;
            
          case blocker.includes('Marketing promise'):
            const session = await UserSimulator.startOnboardingSession('trial');
            const completion = await UserSimulator.completeFullConversation(session);
            expect(completion.deliverables.executiveSummary).toBeDefined();
            break;
            
          case blocker.includes('AI-powered analysis'):
            const aiSession = await UserSimulator.startOnboardingSession('founder');
            const aiCompletion = await UserSimulator.completeFullConversation(aiSession);
            expect(aiCompletion.deliverables.businessModelCanvas).toBeDefined();
            break;
        }
      }
    });
  });
});
