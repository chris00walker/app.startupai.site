/**
 * Webhook Contract Validation Tests
 *
 * CONTRACT TESTS: Validate request/response contracts.
 *
 * This test imports schemas directly from the route's schema file,
 * ensuring tests stay in sync with production validation.
 *
 * Coverage:
 * - Required field validation (project_id, user_id, run_id)
 * - Type validation (UUIDs, strings, enums)
 * - Schema boundary validation
 *
 * Note: Full HTTP handler testing (auth, response codes) is covered by
 * src/__tests__/api/crewai/webhook/route.test.ts.
 */

// Import PRODUCTION schemas - no duplication, no drift
import {
  founderValidationSchema,
  progressUpdateSchema,
  hitlCheckpointSchema,
  consultantOnboardingSchema,
} from '@/app/api/crewai/webhook/schemas';
import { createTestId, createTestName } from '../../utils/db-test-utils';

// ============================================================================
// PAYLOAD BUILDERS
// ============================================================================

function buildValidFounderPayload() {
  return {
    flow_type: 'founder_validation' as const,
    project_id: createTestId(),
    user_id: createTestId(),
    run_id: createTestId(),
    session_id: `session-${createTestId()}`,
    validation_report: {
      id: createTestId(),
      business_idea: createTestName('Contract Test Idea'),
      validation_outcome: 'PROCEED',
      evidence_summary: 'Test summary',
      pivot_recommendation: null,
      next_steps: ['Step 1'],
    },
    value_proposition_canvas: {},
    evidence: {
      desirability: { problem_resonance: 0.8 },
      feasibility: { total_monthly_cost: 100 },
      viability: { ltv_cac_ratio: 5 },
    },
    qa_report: {
      status: 'passed',
      issues: [],
      recommendations: [],
    },
  };
}

function buildValidProgressPayload() {
  return {
    flow_type: 'progress_update' as const,
    run_id: createTestId(),
    status: 'running' as const,
    current_phase: 1,
    phase_name: 'Desirability',
    progress: {
      crew: 'Growth',
      task: 'Experiment',
      progress_pct: 50,
    },
  };
}

function buildValidHITLPayload() {
  return {
    flow_type: 'hitl_checkpoint' as const,
    run_id: createTestId(),
    project_id: createTestId(),
    user_id: createTestId(),
    checkpoint: 'approve_desirability_gate',
    title: 'Approve Desirability Gate',
    description: 'Review desirability evidence and approve gate passage',
    options: [
      { id: 'approve', label: 'Approve', description: 'Approve gate passage' },
      { id: 'reject', label: 'Reject', description: 'Reject and require more evidence' },
    ],
  };
}

function buildValidConsultantPayload() {
  return {
    flow_type: 'consultant_onboarding' as const,
    consultant_id: createTestId(),
    session_id: `session-${createTestId()}`,
    practice_analysis: {
      strengths: ['Strategy'],
      gaps: ['Marketing'],
      positioning: 'Premium',
      opportunities: ['AI'],
      client_profile: 'SMB',
    },
    recommendations: ['Expand AI services'],
    onboarding_tips: ['Use templates'],
    suggested_templates: ['pitch-deck'],
    suggested_workflows: ['client-onboarding'],
    white_label_suggestions: {},
  };
}

// ============================================================================
// SCHEMA VALIDATION TESTS
// ============================================================================

describe('Webhook Contract Validation (Shared Schemas)', () => {
  // =========================================================================
  // FOUNDER VALIDATION SCHEMA TESTS
  // =========================================================================

  describe('Founder Validation Required Fields', () => {
    it('should reject when project_id is missing', () => {
      const payload = buildValidFounderPayload();
      delete (payload as any).project_id;

      const result = founderValidationSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes('project_id'))).toBe(true);
      }
    });

    it('should reject when user_id is missing', () => {
      const payload = buildValidFounderPayload();
      delete (payload as any).user_id;

      const result = founderValidationSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should reject when run_id is missing', () => {
      const payload = buildValidFounderPayload();
      delete (payload as any).run_id;

      const result = founderValidationSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should reject when validation_report is missing', () => {
      const payload = buildValidFounderPayload();
      delete (payload as any).validation_report;

      const result = founderValidationSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should reject when evidence is missing', () => {
      const payload = buildValidFounderPayload();
      delete (payload as any).evidence;

      const result = founderValidationSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should accept valid payload', () => {
      const payload = buildValidFounderPayload();

      const result = founderValidationSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });
  });

  describe('Founder Validation Type Validation', () => {
    it('should reject when project_id is not a valid UUID', () => {
      const payload = buildValidFounderPayload();
      payload.project_id = 'not-a-uuid';

      const result = founderValidationSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should reject when user_id is not a valid UUID', () => {
      const payload = buildValidFounderPayload();
      payload.user_id = 'not-a-uuid';

      const result = founderValidationSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should reject when flow_type is wrong', () => {
      const payload = {
        ...buildValidFounderPayload(),
        flow_type: 'wrong_type',
      };

      const result = founderValidationSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  // =========================================================================
  // PROGRESS UPDATE SCHEMA TESTS
  // =========================================================================

  describe('Progress Update Validation', () => {
    it('should reject when run_id is missing', () => {
      const payload = buildValidProgressPayload();
      delete (payload as any).run_id;

      const result = progressUpdateSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should reject when status is invalid', () => {
      const payload = {
        ...buildValidProgressPayload(),
        status: 'invalid_status',
      };

      const result = progressUpdateSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should reject when current_phase is missing', () => {
      const payload = buildValidProgressPayload();
      delete (payload as any).current_phase;

      const result = progressUpdateSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should accept valid payload', () => {
      const payload = buildValidProgressPayload();

      const result = progressUpdateSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should accept all valid status values', () => {
      const statuses = ['pending', 'running', 'paused', 'completed', 'failed'] as const;

      for (const status of statuses) {
        const payload = { ...buildValidProgressPayload(), status };
        const result = progressUpdateSchema.safeParse(payload);
        expect(result.success).toBe(true);
      }
    });
  });

  // =========================================================================
  // HITL CHECKPOINT SCHEMA TESTS
  // =========================================================================

  describe('HITL Checkpoint Validation', () => {
    it('should reject when checkpoint is missing', () => {
      const payload = buildValidHITLPayload();
      delete (payload as any).checkpoint;

      const result = hitlCheckpointSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should reject when options is empty', () => {
      const payload = {
        ...buildValidHITLPayload(),
        options: [],
      };

      const result = hitlCheckpointSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should reject when project_id is not a valid UUID', () => {
      const payload = {
        ...buildValidHITLPayload(),
        project_id: 'not-a-uuid',
      };

      const result = hitlCheckpointSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should reject when title is missing', () => {
      const payload = buildValidHITLPayload();
      delete (payload as any).title;

      const result = hitlCheckpointSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should reject when description is missing', () => {
      const payload = buildValidHITLPayload();
      delete (payload as any).description;

      const result = hitlCheckpointSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should accept valid payload', () => {
      const payload = buildValidHITLPayload();

      const result = hitlCheckpointSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should accept payload with optional context', () => {
      const payload = {
        ...buildValidHITLPayload(),
        context: { key: 'value', nested: { data: 123 } },
        recommended: 'approve',
      };

      const result = hitlCheckpointSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });
  });

  // =========================================================================
  // CONSULTANT ONBOARDING SCHEMA TESTS
  // =========================================================================

  describe('Consultant Onboarding Validation', () => {
    it('should reject when consultant_id is missing', () => {
      const payload = buildValidConsultantPayload();
      delete (payload as any).consultant_id;

      const result = consultantOnboardingSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should reject when consultant_id is not a valid UUID', () => {
      const payload = {
        ...buildValidConsultantPayload(),
        consultant_id: 'not-a-uuid',
      };

      const result = consultantOnboardingSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should reject when practice_analysis is missing', () => {
      const payload = buildValidConsultantPayload();
      delete (payload as any).practice_analysis;

      const result = consultantOnboardingSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should accept valid payload', () => {
      const payload = buildValidConsultantPayload();

      const result = consultantOnboardingSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });
  });

  // =========================================================================
  // EDGE CASES
  // =========================================================================

  describe('Edge Cases', () => {
    it('should accept payload with optional fields missing', () => {
      const payload = {
        flow_type: 'founder_validation' as const,
        project_id: createTestId(),
        user_id: createTestId(),
        run_id: createTestId(),
        validation_report: {
          id: createTestId(),
          business_idea: 'Test idea',
          validation_outcome: null,
          evidence_summary: null,
          pivot_recommendation: null,
          next_steps: [],
        },
        evidence: {
          desirability: null,
          feasibility: null,
          viability: null,
        },
        qa_report: null,
      };

      const result = founderValidationSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should accept payload with extra fields (passthrough)', () => {
      const payload = {
        ...buildValidFounderPayload(),
        extra_field: 'should be ignored',
      };

      const result = founderValidationSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should accept progress payload with optional progress object missing', () => {
      const payload = {
        flow_type: 'progress_update' as const,
        run_id: createTestId(),
        status: 'pending' as const,
        current_phase: 0,
        phase_name: 'Initializing',
      };

      const result = progressUpdateSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should validate nested evidence structure', () => {
      const payload = {
        ...buildValidFounderPayload(),
        evidence: {
          desirability: {
            problem_resonance: 0.85,
            conversion_rate: 0.12,
            key_learnings: ['Learning 1', 'Learning 2'],
            experiments: [{ name: 'A/B Test', success: true }],
          },
          feasibility: {
            core_features_feasible: { feature1: 'POSSIBLE', feature2: 'CONSTRAINED' },
            total_monthly_cost: 500,
          },
          viability: {
            ltv_cac_ratio: 4.5,
            cac: 100,
            ltv: 450,
            gross_margin: 0.72,
          },
        },
      };

      const result = founderValidationSchema.safeParse(payload);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.evidence.desirability?.problem_resonance).toBe(0.85);
        expect(result.data.evidence.viability?.ltv_cac_ratio).toBe(4.5);
      }
    });
  });
});
