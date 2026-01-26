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

// Ad Platform Infrastructure (US-AM, US-AC)
export * from './ad-platforms';
export * from './ad-budgets';
export * from './ad-campaigns';
export * from './ad-performance';

// Admin Dashboard Infrastructure (US-A01-A12)
export * from './admin-audit-log';
export * from './feature-flags';
export * from './admin-sessions';

// Business Import Infrastructure (US-BI01, US-BI02, US-BI03)
export * from './imports';
export * from './field-mappings';
export * from './sync-history';
