# 🧪 Specification-Driven Test Plan
**Comprehensive Testing Strategy Based on Business Requirements**

**Status:** 🟢 **ACTIVE** - Replaces implementation-focused testing  
**Priority:** **P0 - LAUNCH BLOCKER VALIDATION**  
**Cross-Reference:** [`two-site-implementation-plan.md`](../../../startupai.site/docs/technical/two-site-implementation-plan.md) - Phase 4 & 5 validation requirements  

---

## 📋 Document Purpose

This test plan validates **business outcomes** and **user experience specifications** rather than just technical implementation. All tests are derived from the specification documents cross-referenced in the two-site-implementation-plan.md to ensure we deliver what marketing promises and users expect.

**Testing Philosophy:** Validate the **complete user journey** and **success metrics** defined in specifications, not just API responses and component rendering.

---

## 1. Specification Document Analysis

### 1.1 Primary Source Documents (from two-site-implementation-plan.md)

**Core Business Requirements:**
- [`onboarding-agent-integration.md`](../../features/onboarding-agent-integration.md) - Marketing promise vs reality gap resolution
- [`onboarding-journey-map.md`](../../user-experience/onboarding-journey-map.md) - 15-step user journey with success metrics
- [`ai-conversation-interface.md`](../../features/ai-conversation-interface.md) - Chat interface patterns and behaviors

**Technical Implementation Specs:**
- [`onboarding-api-endpoints.md`](../onboarding-api-endpoints.md) - API contracts and data flows
- [`frontend-components-specification.md`](../frontend-components-specification.md) - Component behavior and accessibility
- [`database-schema-updates.md`](../database-schema-updates.md) - Data persistence requirements

**Quality & Compliance:**
- [`accessibility-standards.md`](../../../startupai.site/docs/design/accessibility-standards.md) - WCAG 2.2 AA compliance
- [`crewai-frontend-integration.md`](../crewai-frontend-integration.md) - AI integration patterns

### 1.2 Extracted Testable Requirements

**Business Critical Requirements (from onboarding-agent-integration.md):**
1. ✅ **404 Resolution:** All users reach functional `/onboarding` page (not 404)
2. ✅ **Universal Access:** Free Trial, Founder, and Consultant tiers all get AI experience
3. ✅ **Marketing Promise Delivery:** Users receive "AI-powered strategic analysis"
4. ✅ **Conversation Completion:** 7-stage conversation flow functions end-to-end

**Success Metrics (from onboarding-journey-map.md):**
1. ✅ **Completion Rate:** >85% of users complete all 7 conversation stages
2. ✅ **Response Quality:** >3.5/5 average AI assessment of response clarity
3. ✅ **Time to Complete:** 20-25 minutes average conversation duration
4. ✅ **User Satisfaction:** >4.0/5 post-conversation satisfaction score
5. ✅ **Data Quality:** >80% clear customer segment identification
6. ✅ **Workflow Trigger:** >90% conversations successfully trigger analysis

**Accessibility Requirements (from accessibility-standards.md):**
1. ✅ **WCAG 2.2 AA Compliance:** All interaction modes accessible
2. ✅ **Screen Reader Support:** Conversation flow with proper ARIA labels
3. ✅ **Keyboard Navigation:** Complete functionality without mouse
4. ✅ **Motor Accessibility:** 44×44px minimum touch targets
5. ✅ **Cognitive Support:** Grade 8 reading level, progress saving

---

## 2. Test Suite Architecture

### 2.1 Test Categories by Specification Source

```typescript
// Test organization mirrors specification documents
src/
├── __tests__/
│   ├── business-requirements/     // From onboarding-agent-integration.md
│   │   ├── marketing-promise-delivery.test.tsx
│   │   ├── universal-access.test.tsx
│   │   └── 404-blocker-resolution.test.tsx
│   │
│   ├── user-journey/             // From onboarding-journey-map.md
│   │   ├── 15-step-journey.test.tsx
│   │   ├── success-metrics.test.tsx
│   │   └── conversation-patterns.test.tsx
│   │
│   ├── accessibility/            // From accessibility-standards.md
│   │   ├── wcag-compliance.test.tsx
│   │   ├── screen-reader.test.tsx
│   │   └── keyboard-navigation.test.tsx
│   │
│   ├── api-contracts/           // From onboarding-api-endpoints.md
│   │   ├── endpoint-validation.test.tsx
│   │   ├── data-flow.test.tsx
│   │   └── error-handling.test.tsx
│   │
│   └── integration/             // Cross-specification validation
│       ├── end-to-end-journey.test.tsx
│       ├── performance-metrics.test.tsx
│       └── cross-browser.test.tsx
```

### 2.2 Test Data Sources

**Specification-Driven Test Data:**
```typescript
// Test data extracted from journey map specifications
export const JOURNEY_SPECIFICATIONS = {
  stages: [
    { stage: 1, name: "Customer Discovery", targetDuration: "5-7 minutes" },
    { stage: 2, name: "Problem Analysis", targetDuration: "5-7 minutes" },
    { stage: 3, name: "Solution Concept", targetDuration: "5-7 minutes" },
    { stage: 4, name: "Competitive Landscape", targetDuration: "3-5 minutes" },
    { stage: 5, name: "Resource Assessment", targetDuration: "3-5 minutes" },
    { stage: 6, name: "Business Goals", targetDuration: "2-3 minutes" },
    { stage: 7, name: "Completion & Trigger", targetDuration: "1-2 minutes" }
  ],
  
  successMetrics: {
    completionRate: { target: 0.85, measurement: "percentage completing all stages" },
    responseQuality: { target: 3.5, measurement: "AI assessment score 1-5" },
    timeToComplete: { target: { min: 20, max: 25 }, measurement: "minutes" },
    userSatisfaction: { target: 4.0, measurement: "post-conversation survey 1-5" }
  },
  
  conversationPatterns: {
    acknowledgment: [
      "That's a great insight about...",
      "I can see you've thought deeply about...",
      "That's exactly the kind of detail that will help us..."
    ],
    clarification: [
      "Help me understand what you mean by...",
      "Can you give me a specific example of...",
      "When you say X, are you referring to..."
    ],
    transition: [
      "Now that we understand your customers, let's explore...",
      "Building on what you've shared about the problem...",
      "This connects well to what we discussed earlier about..."
    ]
  }
};
```

---

## 3. Business Requirements Test Suite

### 3.1 Marketing Promise Delivery Tests

**Source:** `onboarding-agent-integration.md` - Lines 14-18

```typescript
describe('Marketing Promise vs Reality Validation', () => {
  it('should resolve the 404 blocker for all user tiers', async () => {
    const userTiers = ['trial', 'sprint', 'founder', 'enterprise'];
    
    for (const tier of userTiers) {
      // Test: Users reach functional /onboarding page (not 404)
      const response = await authenticateAndNavigate(tier);
      expect(response.url).toBe('/onboarding');
      expect(response.status).toBe(200);
      expect(response.content).toContain('AI-Guided Strategy Session');
    }
  });

  it('should deliver AI-powered strategic analysis as promised', async () => {
    // Test: Marketing promise "AI-powered strategic analysis" is delivered
    const session = await startOnboardingSession('trial');
    const completion = await completeFullConversation(session);
    
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

  it('should provide guided idea validation for all users', async () => {
    // Test: All tiers get AI-guided experience (not just trial)
    const tiers = ['trial', 'founder', 'consultant'];
    
    for (const tier of tiers) {
      const session = await startOnboardingSession(tier);
      expect(session.agentPersonality).toBeDefined();
      expect(session.conversationStages).toHaveLength(7);
      expect(session.planLimits[tier]).toBeDefined();
    }
  });
});
```

### 3.2 Universal Access Tests

**Source:** `onboarding-agent-integration.md` - Lines 14, 17

```typescript
describe('Universal Access Across All User Tiers', () => {
  it('should provide appropriate experience for each tier', async () => {
    const tierExpectations = {
      trial: { sessions: 3, messages: 100, workflows: 3 },
      sprint: { sessions: 10, messages: 200, workflows: 20 },
      founder: { sessions: 10, messages: 200, workflows: 20 },
      enterprise: { sessions: 50, messages: 500, workflows: 100 }
    };

    for (const [tier, limits] of Object.entries(tierExpectations)) {
      const session = await startOnboardingSession(tier);
      expect(session.planLimits).toEqual(limits);
      expect(session.features.aiGuidance).toBe(true);
      expect(session.features.strategicAnalysis).toBe(true);
    }
  });
});
```

---

## 4. User Journey Validation Tests

### 4.1 15-Step Journey Tests

**Source:** `onboarding-journey-map.md` - Lines 21-377

```typescript
describe('Complete 15-Step User Journey', () => {
  it('should complete all journey steps with specified success metrics', async () => {
    const journey = new UserJourneyValidator();
    
    // Steps 1-3: Pre-Onboarding (Marketing Site)
    await journey.validateStep(1, 'Landing Page Discovery', {
      timeOnPage: { min: 90, unit: 'seconds' },
      scrollDepth: { min: 70, unit: 'percent' },
      clickThroughRate: { min: 15, unit: 'percent' }
    });
    
    await journey.validateStep(2, 'Pricing Page Evaluation', {
      conversionRate: { min: 25, unit: 'percent' },
      timeOnPricing: { min: 2, unit: 'minutes' },
      featureComparisonEngagement: { min: 60, unit: 'percent' }
    });
    
    await journey.validateStep(3, 'Signup Process', {
      signupCompletionRate: { min: 85, unit: 'percent' },
      oauthSuccessRate: { min: 95, unit: 'percent' },
      timeToComplete: { max: 3, unit: 'minutes' }
    });
    
    // Steps 4-5: Authentication & Handoff
    await journey.validateStep(4, 'OAuth Authentication', {
      oauthCompletionRate: { min: 95, unit: 'percent' },
      redirectSuccessRate: { min: 98, unit: 'percent' },
      authenticationTime: { max: 30, unit: 'seconds' }
    });
    
    await journey.validateStep(5, 'Welcome & Onboarding Introduction', {
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
      await journey.validateConversationStep(step, stage, {
        responseQualityScore: { min: 3.5, unit: 'rating' },
        stageCompletionRate: { min: 85, unit: 'percent' },
        userSatisfaction: { min: 4.0, unit: 'rating' },
        duration: duration
      });
    }
    
    // Steps 12-13: AI Processing & Analysis
    await journey.validateStep(12, 'Conversation Completion', {
      completionRate: { min: 90, unit: 'percent' },
      dataAccuracyConfirmation: { min: 95, unit: 'percent' },
      workflowAuthorization: { min: 95, unit: 'percent' }
    });
    
    await journey.validateStep(13, 'AI Multi-Agent Processing', {
      userRetentionDuringProcessing: { min: 80, unit: 'percent' },
      progressEngagement: { min: 60, unit: 'percent' },
      abandonmentRate: { max: 15, unit: 'percent' }
    });
    
    // Steps 14-15: Results Delivery & First Value
    await journey.validateStep(14, 'Results Presentation', {
      contentEngagement: { min: 70, unit: 'percent' },
      timeSpentReviewing: { min: 5, unit: 'minutes' },
      downloadRate: { min: 40, unit: 'percent' },
      satisfactionScore: { min: 4.2, unit: 'rating' }
    });
    
    await journey.validateStep(15, 'Next Steps & Action Planning', {
      nextStepsEngagement: { min: 80, unit: 'percent' },
      experimentSelection: { min: 60, unit: 'percent' },
      timelineCommitment: { min: 70, unit: 'percent' }
    });
    
    // Validate overall journey success
    expect(journey.overallSuccess).toBe(true);
    expect(journey.totalDuration).toBeWithinRange(45, 55); // 45-55 minutes total
  });
});
```

### 4.2 Success Metrics Validation

**Source:** `onboarding-journey-map.md` - Lines 454-517

```typescript
describe('Success Metrics Validation', () => {
  it('should meet all conversation quality metrics', async () => {
    const metrics = await runConversationMetricsTest();
    
    // From specification: conversation_success_metrics
    expect(metrics.completionRate).toBeGreaterThan(0.85); // >85%
    expect(metrics.responseQuality).toBeGreaterThan(3.5); // >3.5/5
    expect(metrics.timeToComplete).toBeWithinRange(20, 25); // 20-25 minutes
    expect(metrics.userSatisfaction).toBeGreaterThan(4.0); // >4.0/5
  });

  it('should meet all data collection quality metrics', async () => {
    const dataMetrics = await runDataQualityTest();
    
    // From specification: data_quality_metrics
    expect(dataMetrics.customerSegmentClarity).toBeGreaterThan(0.80); // >80%
    expect(dataMetrics.problemDefinitionStrength).toBeGreaterThan(0.75); // >75%
    expect(dataMetrics.solutionDifferentiation).toBeGreaterThan(0.70); // >70%
    expect(dataMetrics.resourceAssessmentRealism).toBeGreaterThan(0.80); // >80%
  });

  it('should meet all workflow trigger success metrics', async () => {
    const workflowMetrics = await runWorkflowTriggerTest();
    
    // From specification: workflow_success_metrics
    expect(workflowMetrics.triggerRate).toBeGreaterThan(0.90); // >90%
    expect(workflowMetrics.analysisCompletion).toBeGreaterThan(0.95); // >95%
    expect(workflowMetrics.resultsQuality).toBeGreaterThan(4.0); // >4.0/5
    expect(workflowMetrics.timeToResults).toBeLessThan(20); // <20 minutes
  });
});
```

---

## 5. Accessibility Compliance Tests

### 5.1 WCAG 2.2 AA Compliance

**Source:** `accessibility-standards.md` + `onboarding-agent-integration.md` Lines 66-73

```typescript
describe('WCAG 2.2 AA Compliance', () => {
  it('should meet all WCAG 2.0 foundation requirements', async () => {
    const page = await loadOnboardingPage();
    
    // Perceivable
    expect(await page.getColorContrastRatio()).toBeGreaterThan(4.5);
    expect(await page.hasTextAlternatives()).toBe(true);
    expect(await page.hasProperHeadingStructure()).toBe(true);
    
    // Operable
    expect(await page.isKeyboardAccessible()).toBe(true);
    expect(await page.hasNoSeizureContent()).toBe(true);
    expect(await page.hasSkipLinks()).toBe(true);
    
    // Understandable
    expect(await page.getReadingLevel()).toBeLessThanOrEqual(8);
    expect(await page.hasConsistentNavigation()).toBe(true);
    expect(await page.hasErrorIdentification()).toBe(true);
    
    // Robust
    expect(await page.isValidHTML()).toBe(true);
    expect(await page.isCompatibleWithAssistiveTech()).toBe(true);
  });

  it('should meet WCAG 2.1 enhancements', async () => {
    const page = await loadOnboardingPage();
    
    // Reflow support (320px width)
    expect(await page.reflowsAt320px()).toBe(true);
    
    // Input purpose identification
    expect(await page.hasInputPurposeLabels()).toBe(true);
    
    // Consistent help
    expect(await page.hasConsistentHelpPlacement()).toBe(true);
  });

  it('should meet WCAG 2.2 latest standards', async () => {
    const page = await loadOnboardingPage();
    
    // Focus visibility (2px minimum outline)
    expect(await page.getFocusOutlineWidth()).toBeGreaterThanOrEqual(2);
    
    // Touch targets (24×24px minimum)
    const touchTargets = await page.getAllTouchTargets();
    touchTargets.forEach(target => {
      expect(target.width).toBeGreaterThanOrEqual(24);
      expect(target.height).toBeGreaterThanOrEqual(24);
    });
    
    // Accessible authentication
    expect(await page.hasAccessibleAuth()).toBe(true);
  });
});
```

### 5.2 Multi-Modal Accessibility

**Source:** `onboarding-agent-integration.md` Lines 85-91

```typescript
describe('Multi-Modal Accessibility', () => {
  it('should support screen readers throughout conversation', async () => {
    const screenReader = new ScreenReaderSimulator();
    
    // Test conversation flow with screen reader
    await screenReader.navigateToOnboarding();
    expect(await screenReader.findByRole('main')).toBeDefined();
    expect(await screenReader.findByRole('log')).toBeDefined(); // Conversation area
    
    // Test message announcements
    await screenReader.sendMessage('Test message');
    expect(await screenReader.waitForAnnouncement()).toContain('AI is typing');
    
    const aiResponse = await screenReader.waitForResponse();
    expect(aiResponse).toHaveAttribute('aria-live', 'polite');
  });

  it('should support voice input with text alternatives', async () => {
    const voiceInput = new VoiceInputSimulator();
    
    // Test voice input availability
    expect(await voiceInput.isSupported()).toBe(true);
    
    // Test voice input with fallback
    await voiceInput.startRecording();
    await voiceInput.speak('I want to build a SaaS platform');
    
    const transcript = await voiceInput.getTranscript();
    expect(transcript).toContain('SaaS platform');
    
    // Test keyboard alternative
    const keyboardFallback = await voiceInput.getKeyboardAlternative();
    expect(keyboardFallback).toBeDefined();
  });

  it('should support keyboard-only navigation', async () => {
    const keyboard = new KeyboardNavigator();
    
    // Test complete conversation flow with keyboard only
    await keyboard.navigateToOnboarding();
    await keyboard.tabToMessageInput();
    await keyboard.typeMessage('Test keyboard input');
    await keyboard.pressEnter();
    
    const response = await keyboard.waitForAIResponse();
    expect(response).toBeDefined();
    
    // Test all interactive elements are reachable
    const interactiveElements = await keyboard.getAllInteractiveElements();
    for (const element of interactiveElements) {
      expect(await keyboard.canReach(element)).toBe(true);
    }
  });
});
```

---

## 6. API Contract Validation Tests

### 6.1 Endpoint Specification Compliance

**Source:** `onboarding-api-endpoints.md`

```typescript
describe('API Contract Validation', () => {
  it('should validate /api/onboarding/start endpoint contract', async () => {
    const request: StartOnboardingRequest = {
      userId: 'test-user-123',
      planType: 'trial',
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
    
    const data: StartOnboardingResponse = await response.json();
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
  });

  it('should validate conversation flow through all API endpoints', async () => {
    // Test complete API flow: start → message → complete
    const startResponse = await startOnboardingAPI('trial');
    expect(startResponse.success).toBe(true);

    const messageResponse = await sendMessageAPI(startResponse.sessionId, 'Test message');
    expect(messageResponse.success).toBe(true);
    expect(messageResponse.agentResponse).toBeDefined();

    const completeResponse = await completeOnboardingAPI(startResponse.sessionId);
    expect(completeResponse.success).toBe(true);
    expect(completeResponse.workflowTriggered).toBe(true);
  });
});
```

---

## 7. Integration & Performance Tests

### 7.1 End-to-End Journey Performance

```typescript
describe('Performance & Integration', () => {
  it('should complete full journey within performance targets', async () => {
    const performanceMonitor = new PerformanceMonitor();
    
    await performanceMonitor.startMeasuring();
    
    // Complete full user journey
    const journey = await runCompleteUserJourney();
    
    const metrics = await performanceMonitor.getMetrics();
    
    // Performance targets from specifications
    expect(metrics.totalJourneyTime).toBeWithinRange(45, 55); // minutes
    expect(metrics.conversationTime).toBeWithinRange(20, 25); // minutes
    expect(metrics.aiProcessingTime).toBeLessThan(20); // minutes
    expect(metrics.pageLoadTime).toBeLessThan(3); // seconds
    expect(metrics.apiResponseTime).toBeLessThan(2); // seconds
  });

  it('should handle concurrent users within limits', async () => {
    const concurrentUsers = 10;
    const promises = [];
    
    for (let i = 0; i < concurrentUsers; i++) {
      promises.push(runCompleteUserJourney(`user-${i}`));
    }
    
    const results = await Promise.all(promises);
    
    // All users should complete successfully
    results.forEach(result => {
      expect(result.success).toBe(true);
      expect(result.completionTime).toBeWithinRange(20, 30); // minutes
    });
  });
});
```

---

## 8. Test Execution Strategy

### 8.1 Test Pyramid

```
                    E2E Journey Tests (5%)
                   /                    \
              Integration Tests (15%)
             /                        \
        Unit Tests (80%)
```

**Unit Tests (80%):** Component behavior, API functions, utility functions  
**Integration Tests (15%):** API contracts, database interactions, component integration  
**E2E Tests (5%):** Complete user journeys, cross-browser compatibility, performance  

### 8.2 Continuous Validation

**Pre-Commit Hooks:**
- Run accessibility compliance tests
- Validate API contract compliance
- Check success metrics thresholds

**CI/CD Pipeline:**
- Full specification validation on every PR
- Performance regression testing
- Cross-browser compatibility checks

**Production Monitoring:**
- Real-time success metrics tracking
- User journey completion rates
- Accessibility compliance monitoring

---

## 9. Success Criteria

### 9.1 Launch Readiness Validation

**All tests must pass before launch:**

✅ **Business Requirements (100% pass rate required)**
- Marketing promise delivery validation
- Universal access across all tiers
- 404 blocker resolution

✅ **User Journey (Success metrics met)**
- >85% completion rate
- >3.5/5 response quality
- 20-25 minute duration
- >4.0/5 user satisfaction

✅ **Accessibility (WCAG 2.2 AA compliance)**
- Screen reader compatibility
- Keyboard navigation
- Motor accessibility support
- Cognitive accessibility features

✅ **Performance (Within specification targets)**
- <3 second page loads
- <2 second API responses
- <20 minute AI processing
- Concurrent user support

### 9.2 Ongoing Quality Assurance

**Monthly Reviews:**
- Success metrics trending analysis
- User feedback integration
- Accessibility compliance audits
- Performance optimization opportunities

**Quarterly Updates:**
- Specification alignment review
- Test coverage analysis
- New requirement integration
- Technology stack updates

---

**Cross-Reference Integration:** This test plan validates all requirements from [`two-site-implementation-plan.md`](../../../startupai.site/docs/technical/two-site-implementation-plan.md) Phase 4 & 5 launch blockers and success criteria.

**Next Action:** Implement specification-driven test suite replacing current implementation-focused tests.
