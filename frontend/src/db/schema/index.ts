/**
 * Database Schema Index
 *
 * Exports all schema definitions and types for the StartupAI application.
 *
 * Schema Structure:
 * - user_profiles: User account information
 * - projects: User projects for strategy development
 * - evidence: Project evidence with vector embeddings
 * - reports: AI-generated reports and insights
 * - hypotheses: User hypotheses/assumptions for validation
 * - experiments: Experiment tracking
 * - usage_quota: Usage limits and quotas
 * - crewai_validation_states: CrewAI validation state persistence
 * - business_model_canvas: Editable Business Model Canvas data
 * - ad_platform_connections: Admin-managed ad platform integrations
 * - ad_budget_pools: Founder ad budget allocations
 * - ad_campaigns: Agent-created validation campaigns
 * - ad_performance_snapshots: Time-series ad performance data
 * - validation_runs: CrewAI validation run tracking
 * - validation_progress: Append-only progress events for validation runs
 * - founders_briefs: AI-compiled founder briefs for HITL approval
 * - hitl_requests: Human-in-the-Loop approval requests
 * - approval_requests: HITL checkpoint approval requests
 * - approval_history: Approval audit trail
 * - onboarding_sessions: Founder onboarding conversation state
 * - entrepreneur_briefs: Legacy onboarding output format
 * - landing_page_variants: A/B test landing pages
 * - consultant_profiles: Extended consultant user profiles
 * - consultant_onboarding_sessions: Consultant onboarding state
 * - clients (legacy): Original client management table
 * - archived_clients: Consultant-archived client relationships
 *
 * Tables in Production WITHOUT Drizzle Schemas (kept for future use):
 * - beta_applications: Marketing beta signup forms
 * - contact_submissions: Lead capture from marketing site
 * - validation_events: Event sourcing for validation state changes
 * - flow_executions: CrewAI flow execution tracking
 * - gate_policies: Future phase gate configuration
 * - approval_preferences: User approval preferences (future)
 */

export * from './users';
export * from './projects';
export * from './evidence';
export * from './reports';
export * from './hypotheses';
export * from './experiments';
export * from './usage-quota';
export * from './crewai-validation-states';
export * from './business-model-canvas';
export * from './value-proposition-canvas';
export * from './public-activity-log';
export * from './consultant-clients';
export * from './integrations';
export * from './notification-preferences';
export * from './user-preferences';
export * from './login-history';
export * from './mfa-recovery-codes';
export * from './user-sessions';
export * from './security-audit-log';

// Ad Platform Infrastructure (US-AM, US-AC, US-AP)
export * from './ad-platforms';
export * from './ad-budgets';
export * from './ad-campaigns';
export * from './ad-performance';
export * from './ad-metrics';
export * from './copy-banks';

// Admin Dashboard Infrastructure (US-A01-A12)
export * from './admin-audit-log';
export * from './feature-flags';
export * from './admin-sessions';

// Business Import Infrastructure (US-BI01, US-BI02, US-BI03)
export * from './imports';
export * from './field-mappings';
export * from './sync-history';

// Validation Progress Infrastructure (US-F08, US-F09, US-E04)
export * from './validation-runs';
export * from './validation-progress';

// HITL Approval Infrastructure (US-F01, US-F02)
export * from './founders-briefs';
export * from './hitl-requests';
export * from './approval-requests';
export * from './approval-history';

// Onboarding Infrastructure (US-FT01, US-F01)
export * from './onboarding-sessions';
export * from './entrepreneur-briefs';

// A/B Testing Infrastructure (US-AD01)
export * from './landing-page-variants';

// Consultant Infrastructure (US-CT01)
export * from './consultant-profiles';
export * from './consultant-onboarding-sessions';

// Legacy Tables (backwards compatibility)
export * from './legacy-clients';
