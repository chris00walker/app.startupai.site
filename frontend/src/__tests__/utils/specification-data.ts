/**
 * Specification-Driven Test Data
 * Extracted from business specification documents
 * Source: onboarding-journey-map.md, onboarding-agent-integration.md
 */

// Journey Specifications from onboarding-journey-map.md Lines 21-377
export const JOURNEY_SPECIFICATIONS = {
  stages: [
    { stage: 1, name: "Customer Discovery", targetDuration: { min: 5, max: 7 }, unit: "minutes" },
    { stage: 2, name: "Problem Analysis", targetDuration: { min: 5, max: 7 }, unit: "minutes" },
    { stage: 3, name: "Solution Concept", targetDuration: { min: 5, max: 7 }, unit: "minutes" },
    { stage: 4, name: "Competitive Landscape", targetDuration: { min: 3, max: 5 }, unit: "minutes" },
    { stage: 5, name: "Resource Assessment", targetDuration: { min: 3, max: 5 }, unit: "minutes" },
    { stage: 6, name: "Business Goals", targetDuration: { min: 2, max: 3 }, unit: "minutes" },
    { stage: 7, name: "Completion & Trigger", targetDuration: { min: 1, max: 2 }, unit: "minutes" }
  ],
  
  // Success Metrics from onboarding-journey-map.md Lines 454-517
  successMetrics: {
    conversationQuality: {
      completionRate: { target: 0.85, measurement: "percentage completing all stages" },
      responseQuality: { target: 3.5, measurement: "AI assessment score 1-5" },
      timeToComplete: { target: { min: 20, max: 25 }, measurement: "minutes" },
      userSatisfaction: { target: 4.0, measurement: "post-conversation survey 1-5" }
    },
    dataQuality: {
      customerSegmentClarity: { target: 0.80, measurement: "percentage with clear definition" },
      problemDefinitionStrength: { target: 0.75, measurement: "percentage with strong definition" },
      solutionDifferentiation: { target: 0.70, measurement: "percentage with clear differentiation" },
      resourceAssessmentRealism: { target: 0.80, measurement: "percentage with realistic assessment" }
    },
    workflowTrigger: {
      triggerRate: { target: 0.90, measurement: "percentage triggering analysis" },
      analysisCompletion: { target: 0.95, measurement: "percentage completing analysis" },
      resultsQuality: { target: 4.0, measurement: "user rating 1-5" },
      timeToResults: { target: 20, measurement: "minutes to complete analysis" }
    }
  },
  
  // Conversation Patterns from ai-conversation-interface.md
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

// User Tier Specifications from onboarding-agent-integration.md
export const USER_TIER_SPECIFICATIONS = {
  trial: { sessions: 3, messages: 100, workflows: 3 },
  founder: { sessions: 10, messages: 200, workflows: 20 },
  consultant: { sessions: 50, messages: 500, workflows: 100 }
};

// 15-Step User Journey from onboarding-journey-map.md
export const FIFTEEN_STEP_JOURNEY = [
  // Steps 1-3: Pre-Onboarding (Marketing Site)
  { 
    step: 1, 
    name: "Landing Page Discovery", 
    metrics: {
      timeOnPage: { min: 90, unit: "seconds" },
      scrollDepth: { min: 70, unit: "percent" },
      clickThroughRate: { min: 15, unit: "percent" }
    }
  },
  { 
    step: 2, 
    name: "Pricing Page Evaluation", 
    metrics: {
      conversionRate: { min: 25, unit: "percent" },
      timeOnPricing: { min: 2, unit: "minutes" },
      featureComparisonEngagement: { min: 60, unit: "percent" }
    }
  },
  { 
    step: 3, 
    name: "Signup Process", 
    metrics: {
      signupCompletionRate: { min: 85, unit: "percent" },
      oauthSuccessRate: { min: 95, unit: "percent" },
      timeToComplete: { max: 3, unit: "minutes" }
    }
  },
  
  // Steps 4-5: Authentication & Handoff
  { 
    step: 4, 
    name: "OAuth Authentication", 
    metrics: {
      oauthCompletionRate: { min: 95, unit: "percent" },
      redirectSuccessRate: { min: 98, unit: "percent" },
      authenticationTime: { max: 30, unit: "seconds" }
    }
  },
  { 
    step: 5, 
    name: "Welcome & Onboarding Introduction", 
    metrics: {
      onboardingStartRate: { min: 90, unit: "percent" },
      timeToStart: { max: 2, unit: "minutes" },
      userConfidenceScore: { min: 4.0, unit: "rating" }
    }
  },
  
  // Steps 6-11: AI-Guided Conversation (20-25 minutes)
  { 
    step: 6, 
    name: "Customer Discovery", 
    metrics: {
      responseQualityScore: { min: 3.5, unit: "rating" },
      stageCompletionRate: { min: 85, unit: "percent" },
      userSatisfaction: { min: 4.0, unit: "rating" },
      duration: { min: 5, max: 7, unit: "minutes" }
    }
  },
  { 
    step: 7, 
    name: "Problem Analysis", 
    metrics: {
      responseQualityScore: { min: 3.5, unit: "rating" },
      stageCompletionRate: { min: 85, unit: "percent" },
      userSatisfaction: { min: 4.0, unit: "rating" },
      duration: { min: 5, max: 7, unit: "minutes" }
    }
  },
  { 
    step: 8, 
    name: "Solution Concept", 
    metrics: {
      responseQualityScore: { min: 3.5, unit: "rating" },
      stageCompletionRate: { min: 85, unit: "percent" },
      userSatisfaction: { min: 4.0, unit: "rating" },
      duration: { min: 5, max: 7, unit: "minutes" }
    }
  },
  { 
    step: 9, 
    name: "Competitive Landscape", 
    metrics: {
      responseQualityScore: { min: 3.5, unit: "rating" },
      stageCompletionRate: { min: 85, unit: "percent" },
      userSatisfaction: { min: 4.0, unit: "rating" },
      duration: { min: 3, max: 5, unit: "minutes" }
    }
  },
  { 
    step: 10, 
    name: "Resource Assessment", 
    metrics: {
      responseQualityScore: { min: 3.5, unit: "rating" },
      stageCompletionRate: { min: 85, unit: "percent" },
      userSatisfaction: { min: 4.0, unit: "rating" },
      duration: { min: 3, max: 5, unit: "minutes" }
    }
  },
  { 
    step: 11, 
    name: "Business Goals", 
    metrics: {
      responseQualityScore: { min: 3.5, unit: "rating" },
      stageCompletionRate: { min: 85, unit: "percent" },
      userSatisfaction: { min: 4.0, unit: "rating" },
      duration: { min: 2, max: 3, unit: "minutes" }
    }
  },
  
  // Steps 12-13: AI Processing & Analysis
  { 
    step: 12, 
    name: "Conversation Completion", 
    metrics: {
      completionRate: { min: 90, unit: "percent" },
      dataAccuracyConfirmation: { min: 95, unit: "percent" },
      workflowAuthorization: { min: 95, unit: "percent" }
    }
  },
  { 
    step: 13, 
    name: "AI Multi-Agent Processing", 
    metrics: {
      userRetentionDuringProcessing: { min: 80, unit: "percent" },
      progressEngagement: { min: 60, unit: "percent" },
      abandonmentRate: { max: 15, unit: "percent" }
    }
  },
  
  // Steps 14-15: Results Delivery & First Value
  { 
    step: 14, 
    name: "Results Presentation", 
    metrics: {
      contentEngagement: { min: 70, unit: "percent" },
      timeSpentReviewing: { min: 5, unit: "minutes" },
      downloadRate: { min: 40, unit: "percent" },
      satisfactionScore: { min: 4.2, unit: "rating" }
    }
  },
  { 
    step: 15, 
    name: "Next Steps & Action Planning", 
    metrics: {
      nextStepsEngagement: { min: 80, unit: "percent" },
      experimentSelection: { min: 60, unit: "percent" },
      timelineCommitment: { min: 70, unit: "percent" }
    }
  }
];

// Performance Targets from specifications
export const PERFORMANCE_TARGETS = {
  pageLoadTime: { max: 3, unit: "seconds" },
  apiResponseTime: { max: 2, unit: "seconds" },
  aiProcessingTime: { max: 20, unit: "minutes" },
  totalJourneyTime: { min: 45, max: 55, unit: "minutes" },
  conversationTime: { min: 20, max: 25, unit: "minutes" }
};

// Accessibility Requirements from accessibility-standards.md
export const ACCESSIBILITY_REQUIREMENTS = {
  wcag20: {
    perceivable: {
      colorContrastRatio: { min: 4.5 },
      textAlternatives: true,
      properHeadingStructure: true
    },
    operable: {
      keyboardAccessible: true,
      noSeizureContent: true,
      skipLinks: true
    },
    understandable: {
      readingLevel: { max: 8 },
      consistentNavigation: true,
      errorIdentification: true
    },
    robust: {
      validHTML: true,
      assistiveTechCompatible: true
    }
  },
  wcag21: {
    reflow: { minWidth: 320 },
    inputPurpose: true,
    consistentHelp: true
  },
  wcag22: {
    focusOutlineWidth: { min: 2 },
    touchTargetSize: { min: 24 },
    accessibleAuth: true
  }
};

// Marketing Promises (from onboarding-agent-integration.md)
export const MARKETING_PROMISES = {
  aiPoweredAnalysis: {
    deliverables: [
      'executiveSummary',
      'customerProfile', 
      'competitivePositioning',
      'valuePropositionCanvas',
      'validationRoadmap',
      'businessModelCanvas'
    ]
  },
  universalAccess: ['trial', 'founder', 'consultant'],
  noMoreFourOhFour: true,
  guidedIdeaValidation: true
};
