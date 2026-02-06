/**
 * CrewAI Webhook Schemas
 *
 * Exported Zod schemas for validation of webhook payloads.
 * Used by both the route handler and contract tests.
 *
 * @story US-F06, US-F08, US-F09
 */

import { z } from 'zod';
import {
  HITL_CHECKPOINT_IDS,
  type HitlCheckpointId,
} from '@/lib/approvals/checkpoint-contract';

// =============================================================================
// SHARED TYPES
// =============================================================================

export type FlowType = 'founder_validation' | 'consultant_onboarding' | 'progress_update' | 'hitl_checkpoint' | 'narrative_synthesis';

// =============================================================================
// FOUNDER VALIDATION SCHEMAS
// =============================================================================

export const validationReportSchema = z.object({
  id: z.string(),
  business_idea: z.string(),
  validation_outcome: z.string().nullable(),
  evidence_summary: z.string().nullable(),
  pivot_recommendation: z.string().nullable(),
  next_steps: z.array(z.string()).default([]),
});

export const customerProfileSchema = z.object({
  jobs: z.array(z.any()).default([]),
  pains: z.array(z.any()).default([]),
  gains: z.array(z.any()).default([]),
}).passthrough();

export const valueMapSchema = z.object({
  products_services: z.array(z.string()).default([]),
  pain_relievers: z.array(z.any()).default([]),
  gain_creators: z.array(z.any()).default([]),
}).passthrough();

export const desirabilityEvidenceSchema = z.object({
  problem_resonance: z.number().optional(),
  conversion_rate: z.number().optional(),
  commitment_depth: z.string().optional(),
  zombie_ratio: z.number().optional(),
  traffic_quality: z.string().optional(),
  key_learnings: z.array(z.string()).default([]),
  tested_segments: z.array(z.string()).default([]),
  impressions: z.number().optional(),
  clicks: z.number().optional(),
  signups: z.number().optional(),
  spend_usd: z.number().optional(),
  experiments: z.array(z.any()).default([]),
}).passthrough().nullable();

export const feasibilityEvidenceSchema = z.object({
  core_features_feasible: z.record(z.string(), z.string()).default({}),
  downgrade_required: z.boolean().optional(),
  downgrade_impact: z.string().optional(),
  api_costs: z.number().optional(),
  infra_costs: z.number().optional(),
  total_monthly_cost: z.number().optional(),
}).passthrough().nullable();

export const viabilityEvidenceSchema = z.object({
  cac: z.number().optional(),
  ltv: z.number().optional(),
  ltv_cac_ratio: z.number().optional(),
  gross_margin: z.number().optional(),
  payback_months: z.number().optional(),
  break_even_customers: z.number().optional(),
  tam_usd: z.number().optional(),
  market_share_target: z.number().optional(),
  viability_assessment: z.string().optional(),
}).passthrough().nullable();

export const qaReportSchema = z.object({
  status: z.string().optional(),
  issues: z.array(z.any()).default([]),
  recommendations: z.array(z.any()).default([]),
  framework_compliance: z.number().optional(),
  logical_consistency: z.number().optional(),
  completeness: z.number().optional(),
}).passthrough().nullable();

export const founderValidationSchema = z.object({
  flow_type: z.literal('founder_validation'),
  project_id: z.string().uuid(),
  user_id: z.string().uuid(),
  run_id: z.string(),
  session_id: z.string().optional(),
  validation_report: validationReportSchema,
  value_proposition_canvas: z.record(z.string(), z.object({
    customer_profile: customerProfileSchema.nullable(),
    value_map: valueMapSchema.nullable(),
  })).default({}),
  evidence: z.object({
    desirability: desirabilityEvidenceSchema,
    feasibility: feasibilityEvidenceSchema,
    viability: viabilityEvidenceSchema,
  }),
  qa_report: qaReportSchema,
  completed_at: z.string().optional(),
  // Extended fields
  iteration: z.number().optional(),
  phase: z.string().optional(),
  current_risk_axis: z.string().optional(),
  problem_fit: z.string().optional(),
  current_segment: z.string().optional(),
  current_value_prop: z.string().optional(),
  desirability_signal: z.string().optional(),
  feasibility_signal: z.string().optional(),
  viability_signal: z.string().optional(),
  last_pivot_type: z.string().optional(),
  pending_pivot_type: z.string().optional(),
  pivot_recommendation: z.string().optional(),
  human_approval_status: z.string().optional(),
  human_comment: z.string().optional(),
  human_input_required: z.boolean().optional(),
  human_input_reason: z.string().optional(),
  assumptions: z.array(z.any()).optional(),
  desirability_experiments: z.array(z.any()).optional(),
  downgrade_active: z.boolean().optional(),
  last_feasibility_artifact: z.any().optional(),
  last_viability_metrics: z.any().optional(),
  competitor_report: z.any().optional(),
  target_segments: z.array(z.string()).optional(),
  problem_statement: z.string().optional(),
  solution_description: z.string().optional(),
  revenue_model: z.string().optional(),
  segment_fit_scores: z.record(z.string(), z.number()).optional(),
  analysis_insights: z.array(z.string()).optional(),
  business_model_type: z.string().optional(),
  budget_status: z.string().optional(),
});

export type FounderValidationPayload = z.infer<typeof founderValidationSchema>;

// =============================================================================
// CONSULTANT ONBOARDING SCHEMAS
// =============================================================================

export const consultantOnboardingSchema = z.object({
  flow_type: z.literal('consultant_onboarding'),
  consultant_id: z.string().uuid(),
  session_id: z.string().optional(),
  practice_analysis: z.object({
    strengths: z.array(z.string()).default([]),
    gaps: z.array(z.string()).default([]),
    positioning: z.string().default(''),
    opportunities: z.array(z.string()).default([]),
    client_profile: z.string().default(''),
  }).passthrough(),
  recommendations: z.array(z.string()).default([]),
  onboarding_tips: z.array(z.string()).default([]),
  suggested_templates: z.array(z.string()).default([]),
  suggested_workflows: z.array(z.string()).default([]),
  white_label_suggestions: z.record(z.string(), z.any()).default({}),
  completed_at: z.string().optional(),
});

export type ConsultantOnboardingPayload = z.infer<typeof consultantOnboardingSchema>;

// =============================================================================
// PROGRESS UPDATE SCHEMAS
// =============================================================================

export const progressUpdateSchema = z.object({
  flow_type: z.literal('progress_update'),
  run_id: z.string(),
  project_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  status: z.enum(['pending', 'running', 'paused', 'completed', 'failed']),
  current_phase: z.number(),
  phase_name: z.string(),
  progress: z.object({
    crew: z.string().optional(),
    task: z.string().optional(),
    agent: z.string().optional(),
    progress_pct: z.number(),
  }).optional(),
  error: z.string().optional(),
  timestamp: z.string().optional(),
});

export type ProgressUpdatePayload = z.infer<typeof progressUpdateSchema>;

// =============================================================================
// HITL CHECKPOINT SCHEMAS
// =============================================================================

const HITL_CHECKPOINT_ENUM_VALUES = HITL_CHECKPOINT_IDS as [
  HitlCheckpointId,
  ...HitlCheckpointId[],
];

export const hitlCheckpointIdSchema = z.enum(HITL_CHECKPOINT_ENUM_VALUES);

export const hitlCheckpointSchema = z.object({
  flow_type: z.literal('hitl_checkpoint'),
  run_id: z.string(),
  project_id: z.string().uuid(),
  user_id: z.string().uuid(),
  checkpoint: hitlCheckpointIdSchema,
  title: z.string(),
  description: z.string(),
  options: z.array(z.object({
    id: z.string(),
    label: z.string(),
    description: z.string().optional(),
  })).min(1),
  recommended: z.string().optional(),
  context: z.record(z.string(), z.any()).optional(),
  expires_at: z.string().optional(),
  timestamp: z.string().optional(),
});

export type HITLCheckpointPayload = z.infer<typeof hitlCheckpointSchema>;

// =============================================================================
// NARRATIVE SYNTHESIS SCHEMAS
// =============================================================================

export const narrativeSynthesisSchema = z.object({
  flow_type: z.literal('narrative_synthesis'),
  project_id: z.string().uuid(),
  user_id: z.string().uuid(),
  run_id: z.string(),
  event_type: z.enum(['narrative_generated', 'narrative_failed']),
  pitch_narrative_content: z.record(z.string(), z.any()).nullable(),
  alignment_status: z.enum(['verified', 'flagged']).default('verified'),
  alignment_issues: z.array(z.object({
    slide: z.string(),
    field: z.string(),
    issue_type: z.string(),
    current_language: z.string().optional(),
    suggested_language: z.string().optional(),
    evidence_needed: z.string().optional(),
  })).default([]),
  evidence_gaps: z.record(z.string(), z.any()).default({}),
  evidence_sources_used: z.array(z.string()).default([]),
  error_message: z.string().optional(),
  timestamp: z.string().optional(),
});

export type NarrativeSynthesisPayload = z.infer<typeof narrativeSynthesisSchema>;
