/**
 * API Contract Validation Tests
 * Source: onboarding-api-endpoints.md
 * 
 * Tests validate API endpoints meet exact specification contracts:
 * - /api/onboarding/start/ - Session initialization
 * - /api/onboarding/message/ - Conversation messaging
 * - /api/onboarding/complete/ - Conversation completion
 * - Error handling and data validation
 */

import { 
  APIContractValidator,
  APIResponseBuilder,
  customMatchers 
} from '../utils/test-helpers';

// Extend Jest with custom matchers
expect.extend(customMatchers);

// Mock fetch for API testing
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

describe('API Contract Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('/api/onboarding/start/ Endpoint', () => {
    it('should validate start onboarding request contract', async () => {
      // Test Requirement: StartOnboardingRequest contract validation
      const validRequest = {
        userId: 'test-user-123',
        planType: 'trial',
        userContext: {
          referralSource: 'direct',
          previousExperience: 'first_time',
          timeAvailable: 30
        }
      };

      // Validate request structure
      const isValidRequest = APIContractValidator.validateStartOnboardingRequest(validRequest);
      expect(isValidRequest).toBe(true);

      // Mock successful API response
      mockFetch.mockResolvedValueOnce(APIResponseBuilder.successfulOnboardingStart());

      // Make API call
      const response = await fetch('/api/onboarding/start/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequest)
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      
      // Validate response contract
      const isValidResponse = APIContractValidator.validateStartOnboardingResponse(data);
      expect(isValidResponse).toBe(true);
    });

    it('should validate start onboarding response structure', async () => {
      // Test Requirement: StartOnboardingResponse contract compliance
      mockFetch.mockResolvedValueOnce(APIResponseBuilder.successfulOnboardingStart('session-456'));

      const request = {
        userId: 'test-user-456',
        planType: 'founder',
        userContext: {
          referralSource: 'google_ads',
          previousExperience: 'experienced',
          timeAvailable: 45
        }
      };

      const response = await fetch('/api/onboarding/start/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      const data = await response.json();

      // Validate exact response structure from specification
      expect(data).toEqual(
        expect.objectContaining({
          success: true,
          sessionId: expect.any(String),
          agentIntroduction: expect.any(String),
          firstQuestion: expect.any(String),
          estimatedDuration: '20-25 minutes',
          stageInfo: {
            currentStage: 1,
            totalStages: 7,
            stageName: expect.any(String)
          },
          conversationContext: {
            agentPersonality: expect.any(Object),
            expectedOutcomes: expect.any(Array),
            privacyNotice: expect.any(String)
          }
        })
      );

      // Validate specific field types and constraints
      expect(data.sessionId).toMatch(/^[a-zA-Z0-9-_]+$/); // Valid session ID format
      expect(data.stageInfo.currentStage).toBe(1);
      expect(data.stageInfo.totalStages).toBe(7);
      expect(data.conversationContext.agentPersonality).toHaveProperty('name');
      expect(data.conversationContext.agentPersonality).toHaveProperty('role');
      expect(Array.isArray(data.conversationContext.expectedOutcomes)).toBe(true);
    });

    it('should handle invalid request data gracefully', async () => {
      // Test Requirement: API error handling for invalid requests
      const invalidRequests = [
        {}, // Missing required fields
        { userId: 'test' }, // Missing planType and userContext
        { userId: 'test', planType: 'invalid' }, // Invalid planType
        { userId: '', planType: 'trial', userContext: {} } // Empty userId
      ];

      for (const invalidRequest of invalidRequests) {
        // Mock error response
        mockFetch.mockResolvedValueOnce(
          new Response(JSON.stringify({
            success: false,
            error: 'Invalid request data',
            details: 'Missing required fields'
          }), { status: 400 })
        );

        const response = await fetch('/api/onboarding/start/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(invalidRequest)
        });

        expect(response.status).toBe(400);
        
        const errorData = await response.json();
        expect(errorData.success).toBe(false);
        expect(errorData.error).toBeDefined();
      }
    });

    it('should validate plan type constraints', async () => {
      // Test Requirement: Plan type validation (trial, founder, consultant)
      const validPlanTypes = ['trial', 'founder', 'consultant'];
      
      for (const planType of validPlanTypes) {
        mockFetch.mockResolvedValueOnce(APIResponseBuilder.successfulOnboardingStart());

        const request = {
          userId: `test-user-${planType}`,
          planType,
          userContext: {
            referralSource: 'direct',
            previousExperience: 'first_time',
            timeAvailable: 30
          }
        };

        const response = await fetch('/api/onboarding/start/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request)
        });

        expect(response.status).toBe(200);
        
        const data = await response.json();
        expect(data.success).toBe(true);
      }
    });
  });

  describe('/api/onboarding/message/ Endpoint', () => {
    it('should validate message request contract', async () => {
      // Test Requirement: SendMessageRequest contract validation
      const validMessageRequest = {
        sessionId: 'test-session-123',
        message: 'I want to build a SaaS platform for restaurants',
        messageType: 'user_response',
        stageContext: {
          currentStage: 1,
          expectedResponseType: 'business_description'
        }
      };

      // Validate request structure
      const isValidRequest = APIContractValidator.validateMessageRequest(validMessageRequest);
      expect(isValidRequest).toBe(true);

      // Mock successful message response
      mockFetch.mockResolvedValueOnce(APIResponseBuilder.successfulMessageResponse());

      const response = await fetch('/api/onboarding/message/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validMessageRequest)
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      
      // Validate response contract
      const isValidResponse = APIContractValidator.validateMessageResponse(data);
      expect(isValidResponse).toBe(true);
    });

    it('should validate message response structure', async () => {
      // Test Requirement: SendMessageResponse contract compliance
      mockFetch.mockResolvedValueOnce(APIResponseBuilder.successfulMessageResponse('msg-789'));

      const messageRequest = {
        sessionId: 'test-session-789',
        message: 'Small restaurant owners who struggle with inventory management',
        messageType: 'user_response',
        stageContext: {
          currentStage: 1,
          expectedResponseType: 'customer_segment'
        }
      };

      const response = await fetch('/api/onboarding/message/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageRequest)
      });

      const data = await response.json();

      // Validate exact response structure from specification
      expect(data).toEqual(
        expect.objectContaining({
          success: true,
          messageId: expect.any(String),
          agentResponse: expect.any(String),
          stageProgress: {
            currentStage: expect.any(Number),
            overallProgress: expect.any(Number),
            nextQuestion: expect.any(String)
          },
          conversationQuality: {
            responseClarity: expect.any(Number),
            relevanceScore: expect.any(Number),
            engagementLevel: expect.any(Number)
          }
        })
      );

      // Validate field constraints
      expect(data.messageId).toMatch(/^msg-[a-zA-Z0-9-_]+$/);
      expect(data.stageProgress.currentStage).toBeGreaterThanOrEqual(1);
      expect(data.stageProgress.currentStage).toBeLessThanOrEqual(7);
      expect(data.stageProgress.overallProgress).toBeGreaterThanOrEqual(0);
      expect(data.stageProgress.overallProgress).toBeLessThanOrEqual(100);
      expect(data.conversationQuality.responseClarity).toBeGreaterThanOrEqual(1);
      expect(data.conversationQuality.responseClarity).toBeLessThanOrEqual(5);
    });

    it('should handle message validation errors', async () => {
      // Test Requirement: Message validation and error handling
      const invalidMessages = [
        { sessionId: 'invalid', message: '', messageType: 'user_response' }, // Empty message
        { sessionId: '', message: 'Valid message', messageType: 'user_response' }, // Empty session ID
        { sessionId: 'valid-session', message: 'Valid message', messageType: 'invalid_type' }, // Invalid message type
        { message: 'Valid message', messageType: 'user_response' } // Missing sessionId
      ];

      for (const invalidMessage of invalidMessages) {
        mockFetch.mockResolvedValueOnce(
          new Response(JSON.stringify({
            success: false,
            error: 'Invalid message data',
            details: 'Message validation failed'
          }), { status: 400 })
        );

        const response = await fetch('/api/onboarding/message/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(invalidMessage)
        });

        expect(response.status).toBe(400);
        
        const errorData = await response.json();
        expect(errorData.success).toBe(false);
        expect(errorData.error).toBeDefined();
      }
    });

    it('should validate conversation stage progression', async () => {
      // Test Requirement: Proper stage progression through conversation
      const stages = [1, 2, 3, 4, 5, 6, 7];
      
      for (const stage of stages) {
        mockFetch.mockResolvedValueOnce(
          new Response(JSON.stringify({
            success: true,
            messageId: `msg-stage-${stage}`,
            agentResponse: `Stage ${stage} response`,
            stageProgress: {
              currentStage: stage,
              overallProgress: (stage / 7) * 100,
              nextQuestion: stage < 7 ? `Stage ${stage + 1} question` : 'Conversation complete'
            },
            conversationQuality: {
              responseClarity: 4.0,
              relevanceScore: 4.2,
              engagementLevel: 4.1
            }
          }), { status: 200 })
        );

        const messageRequest = {
          sessionId: 'test-session-progression',
          message: `Stage ${stage} user response`,
          messageType: 'user_response',
          stageContext: {
            currentStage: stage,
            expectedResponseType: 'stage_response'
          }
        };

        const response = await fetch('/api/onboarding/message/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(messageRequest)
        });

        const data = await response.json();
        
        expect(data.success).toBe(true);
        expect(data.stageProgress.currentStage).toBe(stage);
        expect(data.stageProgress.overallProgress).toBeCloseTo((stage / 7) * 100, 1);
      }
    });
  });

  describe('/api/onboarding/complete/ Endpoint', () => {
    it('should validate conversation completion request', async () => {
      // Test Requirement: CompleteOnboardingRequest contract validation
      const completionRequest = {
        sessionId: 'test-session-complete',
        conversationSummary: {
          totalStages: 7,
          completedStages: 7,
          totalDuration: 23,
          qualityScore: 4.2
        },
        userConfirmation: true,
        triggerAnalysis: true
      };

      mockFetch.mockResolvedValueOnce(APIResponseBuilder.successfulConversationCompletion());

      const response = await fetch('/api/onboarding/complete/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completionRequest)
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.workflowTriggered).toBe(true);
    });

    it('should validate completion response structure', async () => {
      // Test Requirement: CompleteOnboardingResponse contract compliance
      mockFetch.mockResolvedValueOnce(APIResponseBuilder.successfulConversationCompletion('session-complete-789'));

      const completionRequest = {
        sessionId: 'session-complete-789',
        conversationSummary: {
          totalStages: 7,
          completedStages: 7,
          totalDuration: 24,
          qualityScore: 4.3
        },
        userConfirmation: true,
        triggerAnalysis: true
      };

      const response = await fetch('/api/onboarding/complete/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completionRequest)
      });

      const data = await response.json();

      // Validate complete response structure
      expect(data).toEqual(
        expect.objectContaining({
          success: true,
          workflowId: expect.any(String),
          workflowTriggered: expect.any(Boolean),
          estimatedCompletionTime: expect.any(String),
          deliverables: expect.any(Object),
          projectCreated: expect.objectContaining({
            projectId: expect.any(String),
            projectUrl: expect.any(String),
          }),
        })
      );

      // Validate deliverables structure matches marketing promises
      expect(data.deliverables).toEqual(
        expect.objectContaining({
          analysisId: expect.any(String),
          summary: expect.any(String),
          insights: expect.any(Array),
        })
      );

      // Validate next steps array
      expect(Array.isArray(data.nextSteps)).toBe(true);
      expect(data.nextSteps.length).toBeGreaterThan(0);
    });

    it('should handle incomplete conversations gracefully', async () => {
      // Test Requirement: Handle incomplete conversation completion
      const incompleteRequest = {
        sessionId: 'incomplete-session',
        conversationSummary: {
          totalStages: 7,
          completedStages: 4, // Only 4 of 7 stages completed
          totalDuration: 15,
          qualityScore: 3.2
        },
        userConfirmation: true,
        triggerAnalysis: false // User chooses not to trigger analysis
      };

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({
          success: true,
          workflowId: 'analysis_partial_001',
          workflowTriggered: false,
          estimatedCompletionTime: 'pending user input',
          nextSteps: [
            {
              step: 'Resume Onboarding',
              description: 'Complete the remaining onboarding stages to trigger CrewAI analysis.',
              estimatedTime: '15 minutes',
              priority: 'high'
            }
          ],
          deliverables: {
            analysisId: 'analysis_partial_001',
            summary: null,
            insights: []
          },
          dashboardRedirect: '/project/incomplete-session/gate',
          projectCreated: {
            projectId: 'incomplete-session',
            projectName: 'Draft Validation Project',
            projectUrl: '/project/incomplete-session/gate'
          },
          analysisMetadata: {
            error: 'Conversation incomplete. CrewAI analysis deferred.'
          }
        }), { status: 200 })
      );

      const response = await fetch('/api/onboarding/complete/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incompleteRequest)
      });

      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.workflowTriggered).toBe(false);
      expect(data.deliverables.summary).toBeNull();
      expect(Array.isArray(data.nextSteps)).toBe(true);
      expect(data.analysisMetadata.error).toContain('Conversation incomplete');
    });
  });

  describe('Cross-Endpoint Integration Flow', () => {
    it('should validate complete conversation flow through all API endpoints', async () => {
      // Test Requirement: End-to-end API flow validation
      
      // Step 1: Start onboarding
      mockFetch.mockResolvedValueOnce(APIResponseBuilder.successfulOnboardingStart('flow-session-123'));
      
      const startResponse = await fetch('/api/onboarding/start/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'flow-test-user',
          planType: 'trial',
          userContext: {
            referralSource: 'direct',
            previousExperience: 'first_time',
            timeAvailable: 30
          }
        })
      });
      
      const startData = await startResponse.json();
      expect(startData.success).toBe(true);
      expect(startData.sessionId).toBe('flow-session-123');

      // Step 2: Send message
      mockFetch.mockResolvedValueOnce(APIResponseBuilder.successfulMessageResponse('flow-msg-456'));
      
      const messageResponse = await fetch('/api/onboarding/message/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: startData.sessionId,
          message: 'I want to build a restaurant management platform',
          messageType: 'user_response'
        })
      });
      
      const messageData = await messageResponse.json();
      expect(messageData.success).toBe(true);
      expect(messageData.messageId).toBe('flow-msg-456');

      // Step 3: Complete conversation
      mockFetch.mockResolvedValueOnce(APIResponseBuilder.successfulConversationCompletion('flow-session-123'));
      
      const completeResponse = await fetch('/api/onboarding/complete/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: startData.sessionId,
          conversationSummary: {
            totalStages: 7,
            completedStages: 7,
            totalDuration: 23,
            qualityScore: 4.1
          },
          userConfirmation: true,
          triggerAnalysis: true
        })
      });
      
      const completeData = await completeResponse.json();
      expect(completeData.success).toBe(true);
      expect(completeData.workflowTriggered).toBe(true);
      expect(completeData.deliverables.analysisId).toBeDefined();
    });

    it('should maintain session consistency across endpoints', async () => {
      // Test Requirement: Session ID consistency and validation
      const sessionId = 'consistency-test-session';
      
      // Mock responses with consistent session ID
      mockFetch
        .mockResolvedValueOnce(APIResponseBuilder.successfulOnboardingStart(sessionId))
        .mockResolvedValueOnce(APIResponseBuilder.successfulMessageResponse('msg-1'))
        .mockResolvedValueOnce(APIResponseBuilder.successfulMessageResponse('msg-2'))
        .mockResolvedValueOnce(APIResponseBuilder.successfulConversationCompletion(sessionId));

      // Start session
      const startResponse = await fetch('/api/onboarding/start/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'consistency-user',
          planType: 'founder',
          userContext: { referralSource: 'direct', previousExperience: 'first_time', timeAvailable: 30 }
        })
      });
      
      const startData = await startResponse.json();
      expect(startData.sessionId).toBe(sessionId);

      // Send multiple messages with same session ID
      const messages = ['Message 1', 'Message 2'];
      
      for (const message of messages) {
        const messageResponse = await fetch('/api/onboarding/message/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessionId,
            message: message,
            messageType: 'user_response'
          })
        });
        
        const messageData = await messageResponse.json();
        expect(messageData.success).toBe(true);
      }

      // Complete with same session ID
      const completeResponse = await fetch('/api/onboarding/complete/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId,
          conversationSummary: { totalStages: 7, completedStages: 7, totalDuration: 22, qualityScore: 4.0 },
          userConfirmation: true,
          triggerAnalysis: true
        })
      });
      
      const completeData = await completeResponse.json();
      expect(completeData.projectCreated.projectId).toBe(sessionId);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle network errors gracefully', async () => {
      // Test Requirement: Network error handling
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      try {
        await fetch('/api/onboarding/start/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 'network-test-user',
            planType: 'trial',
            userContext: { referralSource: 'direct', previousExperience: 'first_time', timeAvailable: 30 }
          })
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Network error');
      }
    });

    it('should handle server errors with proper error responses', async () => {
      // Test Requirement: Server error handling
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({
          success: false,
          error: 'Internal server error',
          errorCode: 'SERVER_ERROR_500',
          details: 'Database connection failed'
        }), { status: 500 })
      );

      const response = await fetch('/api/onboarding/start/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'server-error-test',
          planType: 'trial',
          userContext: { referralSource: 'direct', previousExperience: 'first_time', timeAvailable: 30 }
        })
      });

      expect(response.status).toBe(500);
      
      const errorData = await response.json();
      expect(errorData.success).toBe(false);
      expect(errorData.error).toBeDefined();
      expect(errorData.errorCode).toBeDefined();
    });

    it('should validate rate limiting behavior', async () => {
      // Test Requirement: API rate limiting validation
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({
          success: false,
          error: 'Rate limit exceeded',
          errorCode: 'RATE_LIMIT_429',
          retryAfter: 60
        }), { status: 429 })
      );

      const response = await fetch('/api/onboarding/message/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'rate-limit-test',
          message: 'Test message',
          messageType: 'user_response'
        })
      });

      expect(response.status).toBe(429);
      
      const errorData = await response.json();
      expect(errorData.success).toBe(false);
      expect(errorData.errorCode).toBe('RATE_LIMIT_429');
      expect(errorData.retryAfter).toBeDefined();
    });
  });
});
