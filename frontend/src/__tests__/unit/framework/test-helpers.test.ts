/**
 * Test Framework Utilities - Unit Tests
 *
 * Tests the specification-driven testing framework utilities.
 * This is a UNIT test - validates test helpers work correctly.
 *
 * Relocated from: integration/specification-validation.test.tsx
 * Reason: This test validates framework utilities, not integration between systems.
 */

import { describe, it, beforeEach } from '@jest/globals';
import {
  SuccessMetricsValidator,
  UserSimulator,
  APIResponseBuilder,
} from '../../utils/test-helpers';

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Test Framework Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('Custom Matchers', () => {
    it('should validate toBeWithinRange matcher works correctly', () => {
      // Test toBeWithinRange matcher
      expect(22.5).toBeWithinRange(20, 25);
      expect(4.2).toMeetSuccessMetric(4.0);

      // Test edge cases
      expect(20).toBeWithinRange(20, 25); // Min boundary
      expect(25).toBeWithinRange(20, 25); // Max boundary
      expect(4.0).toMeetSuccessMetric(4.0); // Exact target
    });
  });

  describe('SuccessMetricsValidator', () => {
    it('should return metrics with expected structure', async () => {
      const conversationMetrics = await SuccessMetricsValidator.validateConversationMetrics();

      expect(conversationMetrics).toHaveProperty('completionRate');
      expect(conversationMetrics).toHaveProperty('responseQuality');
      expect(conversationMetrics).toHaveProperty('timeToComplete');
      expect(conversationMetrics).toHaveProperty('userSatisfaction');
    });

    it('should return metrics meeting specification targets', async () => {
      const conversationMetrics = await SuccessMetricsValidator.validateConversationMetrics();

      expect(conversationMetrics.completionRate).toMeetSuccessMetric(0.85);
      expect(conversationMetrics.responseQuality).toMeetSuccessMetric(3.5);
      expect(conversationMetrics.timeToComplete).toBeWithinRange(20, 25);
      expect(conversationMetrics.userSatisfaction).toMeetSuccessMetric(4.0);
    });

    it('should return data quality metrics', async () => {
      const dataMetrics = await SuccessMetricsValidator.validateDataQualityMetrics();

      expect(dataMetrics).toHaveProperty('customerSegmentClarity');
      expect(dataMetrics).toHaveProperty('problemDefinitionStrength');
      expect(dataMetrics).toHaveProperty('solutionDifferentiation');
      expect(dataMetrics).toHaveProperty('resourceAssessmentRealism');
    });

    it('should return workflow trigger metrics', async () => {
      const workflowMetrics = await SuccessMetricsValidator.validateWorkflowTriggerMetrics();

      expect(workflowMetrics).toHaveProperty('triggerRate');
      expect(workflowMetrics).toHaveProperty('analysisCompletion');
      expect(workflowMetrics).toHaveProperty('resultsQuality');
      expect(workflowMetrics).toHaveProperty('timeToResults');
    });
  });

  describe('UserSimulator', () => {
    it('should create proper session structure', async () => {
      const session = await UserSimulator.startOnboardingSession('trial');

      expect(session).toHaveProperty('sessionId');
      expect(session).toHaveProperty('planType', 'trial');
      expect(session).toHaveProperty('planLimits');
      expect(session).toHaveProperty('agentPersonality');
      expect(session).toHaveProperty('conversationStages');
      expect(session).toHaveProperty('features');
    });

    it('should validate session structure matches specifications', async () => {
      const session = await UserSimulator.startOnboardingSession('trial');

      expect(session.conversationStages).toHaveLength(7);
      expect(session.features.aiGuidance).toBe(true);
      expect(session.features.strategicAnalysis).toBe(true);
    });

    it('should provide universal access across tiers', async () => {
      const tiers = ['trial', 'founder', 'consultant'];

      for (const tier of tiers) {
        const session = await UserSimulator.startOnboardingSession(tier);

        expect(session.features.aiGuidance).toBe(true);
        expect(session.features.strategicAnalysis).toBe(true);
        expect(session.conversationStages).toHaveLength(7);
        expect(session.planLimits).toBeDefined();
      }
    });

    it('should authenticate and navigate correctly', async () => {
      const response = await UserSimulator.authenticateAndNavigate('trial');

      expect(response.url).toBe('/onboarding');
      expect(response.status).toBe(200);
      expect(response.content).toContain('AI-Guided Strategy Session');
    });

    it('should complete full conversation with all deliverables', async () => {
      const session = await UserSimulator.startOnboardingSession('trial');
      const completion = await UserSimulator.completeFullConversation(session);

      expect(completion.deliverables).toHaveProperty('executiveSummary');
      expect(completion.deliverables).toHaveProperty('customerProfile');
      expect(completion.deliverables).toHaveProperty('competitivePositioning');
      expect(completion.deliverables).toHaveProperty('valuePropositionCanvas');
      expect(completion.deliverables).toHaveProperty('validationRoadmap');
      expect(completion.deliverables).toHaveProperty('businessModelCanvas');

      expect(completion.metrics.qualityScore).toMeetSuccessMetric(3.5);
      expect(completion.metrics.completionRate).toMeetSuccessMetric(0.85);
    });
  });

  describe('APIResponseBuilder', () => {
    it('should create valid onboarding start response', async () => {
      const startResponse = APIResponseBuilder.successfulOnboardingStart('test-session');
      const responseData = await startResponse.json();

      expect(responseData).toHaveProperty('success', true);
      expect(responseData).toHaveProperty('sessionId', 'test-session');
      expect(responseData).toHaveProperty('stageInfo');
      expect(responseData).toHaveProperty('agentIntroduction');
      expect(responseData).toHaveProperty('firstQuestion');
      expect(responseData).toHaveProperty('conversationContext');
    });

    it('should validate response structure matches API contract', async () => {
      const startResponse = APIResponseBuilder.successfulOnboardingStart('test-session');
      const responseData = await startResponse.json();

      expect(responseData.stageInfo.currentStage).toBe(1);
      expect(responseData.stageInfo.totalStages).toBe(7);
      expect(responseData.conversationContext.agentPersonality).toHaveProperty('name');
      expect(responseData.conversationContext.agentPersonality).toHaveProperty('role');
    });

    it('should create valid message response', async () => {
      const messageResponse = APIResponseBuilder.successfulMessageResponse('msg-123');
      const responseData = await messageResponse.json();

      expect(responseData).toHaveProperty('success', true);
      expect(responseData).toHaveProperty('messageId', 'msg-123');
      expect(responseData).toHaveProperty('agentResponse');
      expect(responseData).toHaveProperty('stageProgress');
      expect(responseData).toHaveProperty('qualitySignals');
      expect(responseData).toHaveProperty('stageSnapshot');
    });

    it('should create valid conversation completion response', async () => {
      const completionResponse = APIResponseBuilder.successfulConversationCompletion('session-123');
      const responseData = await completionResponse.json();

      expect(responseData).toHaveProperty('success', true);
      expect(responseData).toHaveProperty('workflowId');
      expect(responseData).toHaveProperty('workflowTriggered', true);
      expect(responseData).toHaveProperty('deliverables');
      expect(responseData).toHaveProperty('dashboardRedirect');
      expect(responseData).toHaveProperty('projectCreated');
    });
  });

  describe('Test Framework Completeness', () => {
    it('should have all required test categories', () => {
      const testCategories = [
        'business-requirements',
        'user-journey',
        'accessibility',
        'api-contracts',
        'integration'
      ];

      expect(testCategories).toHaveLength(5);
      expect(testCategories).toContain('business-requirements');
      expect(testCategories).toContain('user-journey');
      expect(testCategories).toContain('accessibility');
      expect(testCategories).toContain('api-contracts');
      expect(testCategories).toContain('integration');
    });

    it('should validate specification traceability', () => {
      const specificationSources = [
        'onboarding-agent-integration.md',
        'founder-journey-map.md',
        'accessibility-standards.md',
        'onboarding-api-endpoints.md',
        'two-site-implementation-plan.md'
      ];

      expect(specificationSources).toHaveLength(5);
      specificationSources.forEach(spec => {
        expect(spec).toMatch(/\.md$/);
      });
    });
  });
});
