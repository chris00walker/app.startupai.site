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
