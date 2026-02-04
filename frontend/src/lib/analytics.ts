/**
 * Analytics Helper Utilities for PostHog
 * 
 * Provides type-safe event tracking for product platform analytics.
 * Use these helpers instead of calling posthog directly for consistency.
 */

import posthog from 'posthog-js'

// Product Platform Events
export type ProductEvent =
  | 'page_view'
  | 'project_created'
  | 'project_updated'
  | 'project_deleted'
  | 'hypothesis_added'
  | 'evidence_uploaded'
  | 'experiment_planned'
  | 'report_generated'
  | 'report_exported'
  | 'canvas_completed'
  | 'canvas_bmc_updated'
  | 'canvas_vpc_updated'
  | 'canvas_tbi_updated'
  | 'dashboard_viewed'
  | 'dashboard_tab_switched'
  | 'analytics_viewed'
  | 'workflow_started'
  | 'ai_analysis_requested'
  | 'export_generated'
  | 'gate_alert_created'
  | 'gate_alert_dismissed'
  | 'gate_evaluation_requested'
  | 'signup_started'
  | 'signup_completed'
  | 'signup_initiated_oauth'
  | 'signup_failed'
  | 'button_clicked'
  | 'user_login'
  | 'user_logout'
  | 'onboarding_session_started'
  | 'onboarding_stage_advanced'
  | 'onboarding_message_sent'
  | 'onboarding_exited_early'
  | 'onboarding_completed'
  | 'crewai_analysis_started'
  | 'crewai_analysis_completed'
  | 'crewai_analysis_failed'
  // Marketplace events (per marketplace-analytics.md spec)
  | 'marketplace.consultant_directory.viewed'
  | 'marketplace.consultant_directory.filtered'
  | 'marketplace.consultant_profile.viewed'
  | 'marketplace.connection.requested_by_founder'
  | 'marketplace.founder_directory.viewed'
  | 'marketplace.founder_directory.filtered'
  | 'marketplace.founder_profile.viewed'
  | 'marketplace.connection.requested_by_consultant'
  | 'marketplace.connection.accepted'
  | 'marketplace.connection.declined'
  | 'marketplace.connection.expired'
  | 'marketplace.rfq.created'
  | 'marketplace.rfq.viewed'
  | 'marketplace.rfq.response_sent'
  | 'marketplace.rfq.response_accepted'
  | 'marketplace.rfq.response_declined'
  | 'marketplace.rfq.cancelled'
  | 'marketplace.rfq.filled'
  | 'marketplace.verification.granted'
  | 'marketplace.verification.grace_started'
  | 'marketplace.verification.revoked'
  | 'marketplace.opt_in.consultant_enabled'
  | 'marketplace.opt_in.consultant_disabled'
  | 'marketplace.opt_in.founder_enabled'
  | 'marketplace.opt_in.founder_disabled'

interface EventProperties {
  [key: string]: string | number | boolean | undefined
}

/**
 * Track a product event
 */
export const trackEvent = (
  eventName: ProductEvent,
  properties?: EventProperties
) => {
  if (typeof window !== 'undefined') {
    posthog.capture(eventName, {
      ...properties,
      timestamp: new Date().toISOString(),
    })
  }
}

/**
 * Identify a user after authentication
 */
export const identifyUser = (
  userId: string,
  properties?: {
    email?: string
    name?: string
    role?: string
    plan?: string
    [key: string]: string | undefined
  }
) => {
  if (typeof window !== 'undefined') {
    posthog.identify(userId, properties)
  }
}

/**
 * Structured analytics helpers for common product actions
 */
export const analytics = {
  project: {
    created: (projectId: string, projectName: string) => 
      trackEvent('project_created', { projectId, projectName }),
    updated: (projectId: string, changes: string) => 
      trackEvent('project_updated', { projectId, changes }),
    deleted: (projectId: string) => 
      trackEvent('project_deleted', { projectId }),
  },
  
  hypothesis: {
    added: (projectId: string, hypothesisType: string) => 
      trackEvent('hypothesis_added', { projectId, hypothesisType }),
  },
  
  evidence: {
    uploaded: (projectId: string, evidenceCount: number) => 
      trackEvent('evidence_uploaded', { projectId, evidenceCount }),
  },
  
  experiment: {
    planned: (projectId: string, experimentType: string) => 
      trackEvent('experiment_planned', { projectId, experimentType }),
  },
  
  canvas: {
    completed: (canvasType: string) => 
      trackEvent('canvas_completed', { canvasType }),
    bmcUpdated: (section: string) => 
      trackEvent('canvas_bmc_updated', { section }),
    vpcUpdated: (section: string) => 
      trackEvent('canvas_vpc_updated', { section }),
    tbiUpdated: (section: string) => 
      trackEvent('canvas_tbi_updated', { section }),
  },
  
  ai: {
    analysisRequested: (analysisType: string, projectId: string) => 
      trackEvent('ai_analysis_requested', { analysisType, projectId }),
    reportGenerated: (reportType: string, projectId: string) => 
      trackEvent('report_generated', { reportType, projectId }),
  },
  
  navigation: {
    dashboardViewed: () => 
      trackEvent('dashboard_viewed'),
    analyticsViewed: (projectId?: string) => 
      trackEvent('analytics_viewed', { projectId }),
  },

  auth: {
    signupStarted: (method: string, plan: string) =>
      trackEvent('signup_started', { method, plan }),
    signupCompleted: (method: string, plan: string, userId?: string) =>
      trackEvent('signup_completed', { method, plan, userId }),
    signupInitiatedOAuth: (method: string, plan: string) =>
      trackEvent('signup_initiated_oauth', { method, plan }),
    signupFailed: (method: string, plan: string, reason?: string) =>
      trackEvent('signup_failed', { method, plan, reason }),
  },
  
  workflow: {
    started: (workflowType: string, projectId: string) => 
      trackEvent('workflow_started', { workflowType, projectId }),
  },
  
  export: {
    generated: (exportType: string, projectId: string) => 
      trackEvent('export_generated', { exportType, projectId }),
  },
}

/**
 * Reset user identity (on logout)
 */
export const resetUser = () => {
  if (typeof window !== 'undefined') {
    posthog.reset()
  }
}

// Alias for compatibility with analytics/index.ts
export const resetAnalytics = resetUser

/**
 * Track page view
 */
export const trackPageView = (pageName?: string, properties?: EventProperties) => {
  if (typeof window !== 'undefined') {
    posthog.capture('$pageview', {
      ...properties,
      page: pageName || window.location.pathname,
      timestamp: new Date().toISOString(),
    })
  }
}

/**
 * Track authentication events
 */
export const trackAuthEvent = {
  login: (method: string) =>
    trackEvent('user_login', { method, category: 'authentication' }),
  logout: () =>
    trackEvent('user_logout', { category: 'authentication' }),
  signupStarted: (method: string) =>
    trackEvent('signup_started', { method, category: 'authentication' }),
  signupCompleted: (method: string) =>
    trackEvent('signup_completed', { method, category: 'authentication' }),
}

/**
 * Track onboarding funnel events
 */
export const trackOnboardingEvent = {
  sessionStarted: (sessionId: string, stage: number, planType?: string) =>
    trackEvent('onboarding_session_started', {
      session_id: sessionId,
      stage,
      plan_type: planType,
      category: 'onboarding',
    }),
  stageAdvanced: (sessionId: string, fromStage: number, toStage: number) =>
    trackEvent('onboarding_stage_advanced', {
      session_id: sessionId,
      from_stage: fromStage,
      to_stage: toStage,
      category: 'onboarding',
    }),
  messageSent: (sessionId: string, stage: number, messageLength: number) =>
    trackEvent('onboarding_message_sent', {
      session_id: sessionId,
      stage,
      message_length: messageLength,
      category: 'onboarding',
    }),
  exitedEarly: (sessionId: string, stageReached: number, progressPercent: number) =>
    trackEvent('onboarding_exited_early', {
      session_id: sessionId,
      stage_reached: stageReached,
      progress_percent: progressPercent,
      category: 'onboarding',
    }),
  completed: (sessionId: string, totalTimeMinutes: number, workflowTriggered: boolean) =>
    trackEvent('onboarding_completed', {
      session_id: sessionId,
      total_time_minutes: totalTimeMinutes,
      workflow_triggered: workflowTriggered,
      category: 'onboarding',
    }),
}

/**
 * Track CrewAI analysis events
 */
export const trackCrewAIEvent = {
  started: (projectId: string, analysisType: string) =>
    trackEvent('crewai_analysis_started', {
      project_id: projectId,
      analysis_type: analysisType,
      category: 'ai_workflow',
    }),
  completed: (projectId: string, duration: number, success: boolean) =>
    trackEvent('crewai_analysis_completed', {
      project_id: projectId,
      duration_seconds: duration,
      success,
      category: 'ai_workflow',
    }),
  failed: (projectId: string, error: string, duration: number) =>
    trackEvent('crewai_analysis_failed', {
      project_id: projectId,
      error,
      duration_seconds: duration,
      category: 'ai_workflow',
    }),
}

/**
 * Track marketplace events (TASK-034)
 * Event names follow marketplace-analytics.md spec
 * @story US-FM01-11, US-PH01-07
 */
export const trackMarketplaceEvent = {
  // Consultant Directory Events (Founders Browsing)
  consultantDirectoryViewed: (count: number) =>
    trackEvent('marketplace.consultant_directory.viewed', { count }),

  consultantDirectoryFiltered: (filters: { relationship_type?: string; industries?: string[]; services?: string[] }) =>
    trackEvent('marketplace.consultant_directory.filtered', {
      relationship_type: filters.relationship_type,
      industries: filters.industries?.join(','),
      services: filters.services?.join(','),
    }),

  consultantProfileViewed: (consultantId: string, relationshipType: string, isVerified: boolean) =>
    trackEvent('marketplace.consultant_profile.viewed', {
      consultant_id: consultantId,
      relationship_type: relationshipType,
      is_verified: isVerified,
    }),

  // Founder Directory Events (Consultants Browsing)
  founderDirectoryViewed: (count: number, verificationStatus: string) =>
    trackEvent('marketplace.founder_directory.viewed', {
      count,
      verification_status: verificationStatus,
    }),

  founderDirectoryFiltered: (filters: { problem_fit?: string; industry?: string; stage?: string }) =>
    trackEvent('marketplace.founder_directory.filtered', {
      problem_fit: filters.problem_fit,
      industry: filters.industry,
      stage: filters.stage,
    }),

  founderProfileViewed: (founderId: string, problemFit: string, hasEvidence: boolean) =>
    trackEvent('marketplace.founder_profile.viewed', {
      founder_id: founderId,
      problem_fit: problemFit,
      has_evidence: hasEvidence,
    }),

  // Connection Flow Events
  connectionRequestedByFounder: (consultantId: string, relationshipType: string, hasMessage: boolean) =>
    trackEvent('marketplace.connection.requested_by_founder', {
      consultant_id: consultantId,
      relationship_type: relationshipType,
      has_message: hasMessage,
    }),

  connectionRequestedByConsultant: (founderId: string, relationshipType: string, hasMessage: boolean) =>
    trackEvent('marketplace.connection.requested_by_consultant', {
      founder_id: founderId,
      relationship_type: relationshipType,
      has_message: hasMessage,
    }),

  connectionAccepted: (connectionId: string, relationshipType: string, initiatedBy: 'founder' | 'consultant', daysToAccept: number) =>
    trackEvent('marketplace.connection.accepted', {
      connection_id: connectionId,
      relationship_type: relationshipType,
      initiated_by: initiatedBy,
      days_to_accept: daysToAccept,
    }),

  connectionDeclined: (connectionId: string, relationshipType: string, initiatedBy: 'founder' | 'consultant', declineReason?: string) =>
    trackEvent('marketplace.connection.declined', {
      connection_id: connectionId,
      relationship_type: relationshipType,
      initiated_by: initiatedBy,
      decline_reason: declineReason,
    }),

  connectionExpired: (connectionId: string, initiatedBy: 'founder' | 'consultant', daysPending: number) =>
    trackEvent('marketplace.connection.expired', {
      connection_id: connectionId,
      initiated_by: initiatedBy,
      days_pending: daysPending,
    }),

  // RFQ Board Events
  rfqCreated: (rfqId: string, relationshipType: string, industries?: string[], timeline?: string, budgetRange?: string) =>
    trackEvent('marketplace.rfq.created', {
      rfq_id: rfqId,
      relationship_type: relationshipType,
      industries: industries?.join(','),
      timeline,
      budget_range: budgetRange,
    }),

  rfqViewed: (rfqId: string, viewerVerificationStatus: string) =>
    trackEvent('marketplace.rfq.viewed', {
      rfq_id: rfqId,
      viewer_verification_status: viewerVerificationStatus,
    }),

  rfqResponseSent: (rfqId: string, consultantId: string, messageLength: number) =>
    trackEvent('marketplace.rfq.response_sent', {
      rfq_id: rfqId,
      consultant_id: consultantId,
      message_length: messageLength,
    }),

  rfqResponseAccepted: (rfqId: string, responseId: string, daysToAccept: number) =>
    trackEvent('marketplace.rfq.response_accepted', {
      rfq_id: rfqId,
      response_id: responseId,
      days_to_accept: daysToAccept,
    }),

  rfqResponseDeclined: (rfqId: string, responseId: string, declineReason?: string) =>
    trackEvent('marketplace.rfq.response_declined', {
      rfq_id: rfqId,
      response_id: responseId,
      decline_reason: declineReason,
    }),

  rfqCancelled: (rfqId: string, responsesCount: number, reason?: string) =>
    trackEvent('marketplace.rfq.cancelled', {
      rfq_id: rfqId,
      responses_count: responsesCount,
      reason,
    }),

  rfqFilled: (rfqId: string, responsesCount: number, daysToFill: number) =>
    trackEvent('marketplace.rfq.filled', {
      rfq_id: rfqId,
      responses_count: responsesCount,
      days_to_fill: daysToFill,
    }),

  // Verification Events
  verificationGranted: (consultantId: string, planTier: string, source: string) =>
    trackEvent('marketplace.verification.granted', {
      consultant_id: consultantId,
      plan_tier: planTier,
      source,
    }),

  verificationGraceStarted: (consultantId: string, reason: string) =>
    trackEvent('marketplace.verification.grace_started', {
      consultant_id: consultantId,
      reason,
    }),

  verificationRevoked: (consultantId: string, reason: string, daysInGrace: number) =>
    trackEvent('marketplace.verification.revoked', {
      consultant_id: consultantId,
      reason,
      days_in_grace: daysInGrace,
    }),

  // Opt-in Events
  consultantOptInEnabled: (consultantId: string, defaultRelationshipType?: string) =>
    trackEvent('marketplace.opt_in.consultant_enabled', {
      consultant_id: consultantId,
      default_relationship_type: defaultRelationshipType,
    }),

  consultantOptInDisabled: (consultantId: string, daysOptedIn: number) =>
    trackEvent('marketplace.opt_in.consultant_disabled', {
      consultant_id: consultantId,
      days_opted_in: daysOptedIn,
    }),

  founderOptInEnabled: (founderId: string, problemFit: string) =>
    trackEvent('marketplace.opt_in.founder_enabled', {
      founder_id: founderId,
      problem_fit: problemFit,
    }),

  founderOptInDisabled: (founderId: string, daysOptedIn: number) =>
    trackEvent('marketplace.opt_in.founder_disabled', {
      founder_id: founderId,
      days_opted_in: daysOptedIn,
    }),
}
