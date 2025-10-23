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
  | 'canvas_completed'
  | 'canvas_bmc_updated'
  | 'canvas_vpc_updated'
  | 'canvas_tbi_updated'
  | 'dashboard_viewed'
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
