/**
 * CrewAI Validation States Schema
 *
 * Stores the full StartupValidationState from CrewAI analysis runs.
 * This table persists Innovation Physics signals, evidence, VPC data,
 * and crew outputs for dashboard consumption.
 *
 * Maps to: src/startupai/flows/state_schemas.py in startupai-crew
 */

import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  numeric,
  boolean,
  jsonb,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { projects } from './projects';
import { userProfiles } from './users';

// Import types for JSONB column typing
import type {
  Phase,
  RiskAxis,
  ProblemFit,
  DesirabilitySignal,
  FeasibilitySignal,
  ViabilitySignal,
  PivotType,
  HumanApprovalStatus,
  QAStatus,
  BudgetStatus,
  BusinessModelType,
  DesirabilityEvidence,
  FeasibilityEvidence,
  ViabilityEvidence,
  CustomerProfile,
  ValueMap,
  CompetitorReport,
  Assumption,
  QAReport,
  DesirabilityExperimentRun,
  FeasibilityArtifact,
  ViabilityMetrics,
} from '@/types/crewai';

export const crewaiValidationStates = pgTable(
  'crewai_validation_states',
  {
  // Primary key
  id: uuid('id').defaultRandom().primaryKey().notNull(),

  // Foreign keys
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => userProfiles.id, { onDelete: 'cascade' }),

  // Session tracking
  sessionId: text('session_id'),
  kickoffId: text('kickoff_id'),
  iteration: integer('iteration').default(1).notNull(),

  // Phase & Risk Tracking
  validationPhase: text('validation_phase')
    .$type<Phase>()
    .default('ideation')
    .notNull(),
  currentRiskAxis: text('current_risk_axis')
    .$type<RiskAxis>()
    .default('desirability'),

  // Problem/Solution Fit
  problemFit: text('problem_fit')
    .$type<ProblemFit>()
    .default('unknown'),
  currentSegment: text('current_segment'),
  currentValueProp: text('current_value_prop'),
  vpcDocumentUrl: text('vpc_document_url'),
  bmcDocumentUrl: text('bmc_document_url'),

  // Innovation Physics Signals
  desirabilitySignal: text('desirability_signal')
    .$type<DesirabilitySignal>()
    .default('no_signal')
    .notNull(),
  feasibilitySignal: text('feasibility_signal')
    .$type<FeasibilitySignal>()
    .default('unknown')
    .notNull(),
  viabilitySignal: text('viability_signal')
    .$type<ViabilitySignal>()
    .default('unknown')
    .notNull(),

  // Pivot Tracking
  lastPivotType: text('last_pivot_type')
    .$type<PivotType>()
    .default('none'),
  pendingPivotType: text('pending_pivot_type')
    .$type<PivotType>()
    .default('none'),
  pivotRecommendation: text('pivot_recommendation')
    .$type<PivotType>(),

  // Human Approval Status
  humanApprovalStatus: text('human_approval_status')
    .$type<HumanApprovalStatus>()
    .default('not_required'),
  humanComment: text('human_comment'),
  humanInputRequired: boolean('human_input_required').default(false),
  humanInputReason: text('human_input_reason'),

  // Evidence Containers (JSONB for complex nested structures)
  desirabilityEvidence: jsonb('desirability_evidence').$type<DesirabilityEvidence>(),
  feasibilityEvidence: jsonb('feasibility_evidence').$type<FeasibilityEvidence>(),
  viabilityEvidence: jsonb('viability_evidence').$type<ViabilityEvidence>(),

  // VPC Data (JSONB for segment-keyed objects)
  customerProfiles: jsonb('customer_profiles').$type<Record<string, CustomerProfile>>(),
  valueMaps: jsonb('value_maps').$type<Record<string, ValueMap>>(),
  competitorReport: jsonb('competitor_report').$type<CompetitorReport>(),

  // Assumptions
  assumptions: jsonb('assumptions').$type<Assumption[]>(),

  // Desirability Artifacts
  desirabilityExperiments: jsonb('desirability_experiments').$type<DesirabilityExperimentRun[]>(),
  downgradeActive: boolean('downgrade_active').default(false),

  // Feasibility Artifact
  lastFeasibilityArtifact: jsonb('last_feasibility_artifact').$type<FeasibilityArtifact>(),

  // Viability Metrics
  lastViabilityMetrics: jsonb('last_viability_metrics').$type<ViabilityMetrics>(),

  // QA and Governance
  qaReports: jsonb('qa_reports').$type<QAReport[]>(),
  currentQaStatus: text('current_qa_status').$type<QAStatus>(),
  frameworkCompliance: boolean('framework_compliance').default(false),
  logicalConsistency: boolean('logical_consistency').default(false),
  completeness: boolean('completeness').default(false),

  // Service Crew Outputs
  businessIdea: text('business_idea'),
  entrepreneurInput: text('entrepreneur_input'),
  targetSegments: jsonb('target_segments').$type<string[]>(),
  problemStatement: text('problem_statement'),
  solutionDescription: text('solution_description'),
  revenueModel: text('revenue_model'),

  // Analysis Crew Outputs
  segmentFitScores: jsonb('segment_fit_scores').$type<Record<string, number>>(),
  analysisInsights: jsonb('analysis_insights').$type<string[]>(),

  // Growth Crew Outputs
  adImpressions: integer('ad_impressions').default(0),
  adClicks: integer('ad_clicks').default(0),
  adSignups: integer('ad_signups').default(0),
  adSpend: numeric('ad_spend', { precision: 12, scale: 2 }).$type<number>().default(0),

  // Build Crew Outputs
  apiCosts: jsonb('api_costs').$type<Record<string, number>>(),
  infraCosts: jsonb('infra_costs').$type<Record<string, number>>(),
  totalMonthlyCost: numeric('total_monthly_cost', { precision: 12, scale: 2 }).$type<number>().default(0),

  // Finance Crew Outputs
  cac: numeric('cac', { precision: 12, scale: 2 }).$type<number>().default(0),
  ltv: numeric('ltv', { precision: 12, scale: 2 }).$type<number>().default(0),
  ltvCacRatio: numeric('ltv_cac_ratio', { precision: 6, scale: 2 }).$type<number>().default(0),
  grossMargin: numeric('gross_margin', { precision: 5, scale: 4 }).$type<number>().default(0),
  tam: numeric('tam', { precision: 15, scale: 2 }).$type<number>().default(0),

  // Synthesis Crew Outputs
  synthesisConfidence: numeric('synthesis_confidence', { precision: 4, scale: 3 }).$type<number>().default(0),
  evidenceSummary: text('evidence_summary'),
  finalRecommendation: text('final_recommendation'),
  nextSteps: jsonb('next_steps').$type<string[]>(),

  // Budget Tracking
  dailySpendUsd: numeric('daily_spend_usd', { precision: 12, scale: 2 }).$type<number>().default(0),
  campaignSpendUsd: numeric('campaign_spend_usd', { precision: 12, scale: 2 }).$type<number>().default(0),
  budgetStatus: text('budget_status').$type<BudgetStatus>().default('ok'),
  budgetEscalationTriggered: boolean('budget_escalation_triggered').default(false),
  budgetKillTriggered: boolean('budget_kill_triggered').default(false),

  // Business Model
  businessModelType: text('business_model_type').$type<BusinessModelType>(),
  businessModelInferredFrom: text('business_model_inferred_from'),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    projectIdUnique: uniqueIndex('crewai_validation_states_project_id_unique').on(table.projectId),
  })
);

// Export inferred types
export type CrewAIValidationState = typeof crewaiValidationStates.$inferSelect;
export type NewCrewAIValidationState = typeof crewaiValidationStates.$inferInsert;
