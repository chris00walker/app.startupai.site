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
 * @story US-FM01-11, US-PH01-07
 */
export const trackMarketplaceEvent = {
  // Connection events
  connectionRequested: (initiatedBy: 'founder' | 'consultant', relationshipType: string) =>
    trackEvent('button_clicked', {
      event_type: 'marketplace.connection_requested',
      initiated_by: initiatedBy,
      relationship_type: relationshipType,
      category: 'marketplace',
    }),

  connectionAccepted: (initiatedBy: 'founder' | 'consultant', relationshipType: string) =>
    trackEvent('button_clicked', {
      event_type: 'marketplace.connection_accepted',
      initiated_by: initiatedBy,
      relationship_type: relationshipType,
      category: 'marketplace',
    }),

  connectionDeclined: (initiatedBy: 'founder' | 'consultant', relationshipType: string) =>
    trackEvent('button_clicked', {
      event_type: 'marketplace.connection_declined',
      initiated_by: initiatedBy,
      relationship_type: relationshipType,
      category: 'marketplace',
    }),

  // RFQ events
  rfqCreated: (relationshipType: string) =>
    trackEvent('button_clicked', {
      event_type: 'marketplace.rfq_created',
      relationship_type: relationshipType,
      category: 'marketplace',
    }),

  rfqResponseSubmitted: (rfqId: string) =>
    trackEvent('button_clicked', {
      event_type: 'marketplace.rfq_response_submitted',
      rfq_id: rfqId,
      category: 'marketplace',
    }),

  rfqResponseAccepted: (rfqId: string) =>
    trackEvent('button_clicked', {
      event_type: 'marketplace.rfq_response_accepted',
      rfq_id: rfqId,
      category: 'marketplace',
    }),

  // Directory events
  founderOptedIn: () =>
    trackEvent('button_clicked', {
      event_type: 'marketplace.founder_opted_in',
      category: 'marketplace',
    }),

  founderOptedOut: () =>
    trackEvent('button_clicked', {
      event_type: 'marketplace.founder_opted_out',
      category: 'marketplace',
    }),

  consultantVerified: () =>
    trackEvent('button_clicked', {
      event_type: 'marketplace.consultant_verified',
      category: 'marketplace',
    }),

  consultantDirectoryOptIn: (defaultRelationshipType: string) =>
    trackEvent('button_clicked', {
      event_type: 'marketplace.consultant_directory_opt_in',
      default_relationship_type: defaultRelationshipType,
      category: 'marketplace',
    }),

  // Directory browsing
  founderDirectoryViewed: (filterApplied: boolean) =>
    trackEvent('dashboard_viewed', {
      event_type: 'marketplace.founder_directory_viewed',
      filter_applied: filterApplied,
      category: 'marketplace',
    }),

  consultantDirectoryViewed: (filterApplied: boolean) =>
    trackEvent('dashboard_viewed', {
      event_type: 'marketplace.consultant_directory_viewed',
      filter_applied: filterApplied,
      category: 'marketplace',
    }),
}
