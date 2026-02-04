/**
 * Analytics Tracking System
 * 
 * Privacy-focused analytics with support for multiple providers.
 * Complies with GDPR, WCAG accessibility requirements.
 * 
 * Features:
 * - Event tracking with metadata
 * - User identification
 * - Page view tracking
 * - Error tracking
 * - Performance monitoring
 * - Consent management
 */

import { User } from '@supabase/supabase-js';

// ============================================================================
// Types
// ============================================================================

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: Date;
}

export interface AnalyticsUser {
  id: string;
  email?: string;
  name?: string;
  role?: string;
  properties?: Record<string, any>;
}

export interface AnalyticsConfig {
  enabled: boolean;
  debug: boolean;
  providers: {
    posthog?: {
      apiKey: string;
      apiHost?: string;
    };
    custom?: {
      endpoint: string;
    };
  };
}

// ============================================================================
// Analytics Manager
// ============================================================================

class AnalyticsManager {
  private config: AnalyticsConfig;
  private userId: string | null = null;
  private consentGiven: boolean = false;
  private initialized: boolean = false;
  private eventQueue: AnalyticsEvent[] = [];
  
  constructor() {
    this.config = {
      enabled: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true',
      debug: process.env.NODE_ENV === 'development',
      providers: {
        posthog: process.env.NEXT_PUBLIC_POSTHOG_KEY
          ? {
              apiKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
              apiHost: process.env.NEXT_PUBLIC_POSTHOG_HOST,
            }
          : undefined,
        custom: process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT
          ? {
              endpoint: process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT,
            }
          : undefined,
      },
    };
  }
  
  /**
   * Initialize analytics with user consent
   */
  async init(consent: boolean = false): Promise<void> {
    if (this.initialized) return;
    
    this.consentGiven = consent;
    this.initialized = true;
    
    if (!this.config.enabled) {
      if (this.config.debug) {
        console.log('📊 Analytics: Disabled');
      }
      return;
    }
    
    // Initialize PostHog
    if (this.config.providers.posthog) {
      await this.initPostHog();
    }
    
    // Process queued events
    if (this.consentGiven && this.eventQueue.length > 0) {
      for (const event of this.eventQueue) {
        await this.track(event.name, event.properties);
      }
      this.eventQueue = [];
    }
    
    if (this.config.debug) {
      console.log('📊 Analytics: Initialized', {
        consent: this.consentGiven,
        providers: Object.keys(this.config.providers),
      });
    }
  }
  
  /**
   * Initialize PostHog provider
   */
  private async initPostHog(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    try {
      const { default: posthog } = await import('posthog-js');
      const config = this.config.providers.posthog!;
      
      posthog.init(config.apiKey, {
        api_host: config.apiHost || 'https://app.posthog.com',
        loaded: (ph) => {
          if (this.config.debug) {
            console.log('📊 PostHog loaded');
          }
        },
        autocapture: false, // Manual tracking only
        capture_pageview: false, // Manual page view tracking
        disable_session_recording: !this.consentGiven,
        persistence: this.consentGiven ? 'localStorage' : 'memory',
      });
    } catch (error) {
      console.error('Failed to initialize PostHog:', error);
    }
  }
  
  /**
   * Update user consent
   */
  setConsent(consent: boolean): void {
    this.consentGiven = consent;
    
    if (consent && this.eventQueue.length > 0) {
      // Process queued events
      for (const event of this.eventQueue) {
        this.track(event.name, event.properties);
      }
      this.eventQueue = [];
    }
    
    if (this.config.debug) {
      console.log('📊 Analytics consent updated:', consent);
    }
  }
  
  /**
   * Identify user
   */
  identify(user: AnalyticsUser): void {
    if (!this.config.enabled) return;
    
    this.userId = user.id;
    
    if (!this.consentGiven) {
      if (this.config.debug) {
        console.log('📊 Analytics: User identified (waiting for consent)', user.id);
      }
      return;
    }
    
    // PostHog
    if (this.config.providers.posthog && typeof window !== 'undefined') {
      import('posthog-js').then(({ default: posthog }) => {
        posthog.identify(user.id, {
          email: user.email,
          name: user.name,
          role: user.role,
          ...user.properties,
        });
      });
    }
    
    // Custom endpoint
    if (this.config.providers.custom) {
      this.sendToCustomEndpoint({
        type: 'identify',
        userId: user.id,
        properties: {
          email: user.email,
          name: user.name,
          role: user.role,
          ...user.properties,
        },
      });
    }
    
    if (this.config.debug) {
      console.log('📊 Analytics: User identified', user);
    }
  }
  
  /**
   * Track event
   */
  track(eventName: string, properties?: Record<string, any>): void {
    if (!this.config.enabled) return;
    
    const event: AnalyticsEvent = {
      name: eventName,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        userId: this.userId,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      },
      timestamp: new Date(),
    };
    
    // Queue event if no consent
    if (!this.consentGiven) {
      this.eventQueue.push(event);
      if (this.config.debug) {
        console.log('📊 Analytics: Event queued (waiting for consent)', event);
      }
      return;
    }
    
    // PostHog
    if (this.config.providers.posthog && typeof window !== 'undefined') {
      import('posthog-js').then(({ default: posthog }) => {
        posthog.capture(eventName, event.properties);
      });
    }
    
    // Custom endpoint
    if (this.config.providers.custom) {
      this.sendToCustomEndpoint({
        type: 'track',
        event: eventName,
        properties: event.properties,
      });
    }
    
    if (this.config.debug) {
      console.log('📊 Analytics: Event tracked', event);
    }
  }
  
  /**
   * Track page view
   */
  page(pageName?: string, properties?: Record<string, any>): void {
    if (!this.config.enabled || !this.consentGiven) return;
    
    const pageProperties = {
      ...properties,
      page: pageName || (typeof window !== 'undefined' ? window.location.pathname : undefined),
      title: typeof document !== 'undefined' ? document.title : undefined,
    };
    
    this.track('$pageview', pageProperties);
  }
  
  /**
   * Track error
   */
  error(error: Error | string, context?: Record<string, any>): void {
    if (!this.config.enabled) return;
    
    const errorProperties = {
      ...context,
      error: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    };
    
    this.track('error', errorProperties);
    
    if (this.config.debug) {
      console.error('📊 Analytics: Error tracked', errorProperties);
    }
  }
  
  /**
   * Track performance metric
   */
  performance(metric: string, value: number, properties?: Record<string, any>): void {
    if (!this.config.enabled || !this.consentGiven) return;
    
    this.track('performance', {
      ...properties,
      metric,
      value,
      unit: properties?.unit || 'ms',
    });
  }
  
  /**
   * Reset analytics (on logout)
   */
  reset(): void {
    this.userId = null;
    this.eventQueue = [];
    
    // PostHog
    if (this.config.providers.posthog && typeof window !== 'undefined') {
      import('posthog-js').then(({ default: posthog }) => {
        posthog.reset();
      });
    }
    
    if (this.config.debug) {
      console.log('📊 Analytics: Reset');
    }
  }
  
  /**
   * Send to custom analytics endpoint
   */
  private async sendToCustomEndpoint(data: any): Promise<void> {
    if (!this.config.providers.custom) return;
    
    try {
      await fetch(this.config.providers.custom.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    } catch (error) {
      if (this.config.debug) {
        console.error('Failed to send to custom analytics endpoint:', error);
      }
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

const analytics = new AnalyticsManager();

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Initialize analytics
 */
export const initAnalytics = (consent: boolean = false): Promise<void> => {
  return analytics.init(consent);
};

/**
 * Set user consent
 */
export const setAnalyticsConsent = (consent: boolean): void => {
  analytics.setConsent(consent);
};

/**
 * Identify user
 */
export const identifyUser = (user: User | AnalyticsUser): void => {
  if ('id' in user && 'email' in user) {
    // Supabase User
    const supabaseUser = user as User;
    analytics.identify({
      id: supabaseUser.id,
      email: supabaseUser.email,
      properties: {
        created_at: supabaseUser.created_at,
        app_metadata: supabaseUser.app_metadata,
      },
    });
  } else {
    // AnalyticsUser
    analytics.identify(user as AnalyticsUser);
  }
};

/**
 * Track event
 */
export const trackEvent = (eventName: string, properties?: Record<string, any>): void => {
  analytics.track(eventName, properties);
};

/**
 * Track page view
 */
export const trackPageView = (pageName?: string, properties?: Record<string, any>): void => {
  analytics.page(pageName, properties);
};

/**
 * Track error
 */
export const trackError = (error: Error | string, context?: Record<string, any>): void => {
  analytics.error(error, context);
};

/**
 * Track performance metric
 */
export const trackPerformance = (metric: string, value: number, properties?: Record<string, any>): void => {
  analytics.performance(metric, value, properties);
};

/**
 * Reset analytics on logout
 */
export const resetAnalytics = (): void => {
  analytics.reset();
};

// ============================================================================
// Predefined Event Trackers
// ============================================================================

/**
 * Track CrewAI analysis events
 */
export const trackCrewAIEvent = {
  started: (projectId: string, question: string) => {
    trackEvent('crewai_analysis_started', {
      project_id: projectId,
      question_length: question.length,
      category: 'ai_workflow',
    });
  },
  
  completed: (projectId: string, duration: number, success: boolean) => {
    trackEvent('crewai_analysis_completed', {
      project_id: projectId,
      duration_seconds: duration,
      success,
      category: 'ai_workflow',
    });
  },
  
  failed: (projectId: string, error: string, duration: number) => {
    trackEvent('crewai_analysis_failed', {
      project_id: projectId,
      error,
      duration_seconds: duration,
      category: 'ai_workflow',
    });
  },
};

/**
 * Track project CRUD events
 */
export const trackProjectEvent = {
  created: (projectId: string) => {
    trackEvent('project_created', {
      project_id: projectId,
      category: 'project_management',
    });
  },
  
  updated: (projectId: string, fields: string[]) => {
    trackEvent('project_updated', {
      project_id: projectId,
      fields_updated: fields,
      category: 'project_management',
    });
  },
  
  deleted: (projectId: string) => {
    trackEvent('project_deleted', {
      project_id: projectId,
      category: 'project_management',
    });
  },
  
  viewed: (projectId: string) => {
    trackEvent('project_viewed', {
      project_id: projectId,
      category: 'project_management',
    });
  },
};

/**
 * Track authentication events
 */
export const trackAuthEvent = {
  login: (method: string) => {
    trackEvent('user_login', {
      method, // 'email', 'google', 'github', etc.
      category: 'authentication',
    });
  },
  
  logout: () => {
    trackEvent('user_logout', {
      category: 'authentication',
    });
  },
  
  signupStarted: (method: string) => {
    trackEvent('signup_started', {
      method,
      category: 'authentication',
    });
  },
  
  signupCompleted: (method: string) => {
    trackEvent('signup_completed', {
      method,
      category: 'authentication',
    });
  },
};

/**
 * Track UI interactions
 */
export const trackUIEvent = {
  buttonClick: (buttonName: string, location: string) => {
    trackEvent('button_clicked', {
      button_name: buttonName,
      location,
      category: 'ui_interaction',
    });
  },
  
  formSubmit: (formName: string, success: boolean) => {
    trackEvent('form_submitted', {
      form_name: formName,
      success,
      category: 'ui_interaction',
    });
  },
  
  modalOpen: (modalName: string) => {
    trackEvent('modal_opened', {
      modal_name: modalName,
      category: 'ui_interaction',
    });
  },
  
  searchPerformed: (query: string, resultCount: number) => {
    trackEvent('search_performed', {
      query_length: query.length,
      result_count: resultCount,
      category: 'ui_interaction',
    });
  },
};

/**
 * Track onboarding funnel events
 */
export const trackOnboardingEvent = {
  sessionStarted: (sessionId: string, stage: number, planType?: string) => {
    trackEvent('onboarding_session_started', {
      session_id: sessionId,
      stage,
      plan_type: planType,
      category: 'onboarding',
    });
  },

  stageAdvanced: (sessionId: string, fromStage: number, toStage: number) => {
    trackEvent('onboarding_stage_advanced', {
      session_id: sessionId,
      from_stage: fromStage,
      to_stage: toStage,
      category: 'onboarding',
    });
  },

  messageSent: (sessionId: string, stage: number, messageLength: number) => {
    trackEvent('onboarding_message_sent', {
      session_id: sessionId,
      stage,
      message_length: messageLength,
      category: 'onboarding',
    });
  },

  exitedEarly: (sessionId: string, stageReached: number, progressPercent: number) => {
    trackEvent('onboarding_exited_early', {
      session_id: sessionId,
      stage_reached: stageReached,
      progress_percent: progressPercent,
      category: 'onboarding',
    });
  },

  completed: (sessionId: string, totalTimeMinutes: number, workflowTriggered: boolean) => {
    trackEvent('onboarding_completed', {
      session_id: sessionId,
      total_time_minutes: totalTimeMinutes,
      workflow_triggered: workflowTriggered,
      category: 'onboarding',
    });
  },
};

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
};

export default analytics;
