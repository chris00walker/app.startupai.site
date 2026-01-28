/**
 * Tests for unified CrewAI webhook endpoint
 *
 * Tests cover:
 * - Authentication (bearer token validation)
 * - Payload validation (Zod schema)
 * - Flow type routing
 *
 * Note: Full persistence tests require integration testing with Supabase.
 * These unit tests focus on the API contract layer.
 * @story US-F06, US-F08, US-F09, US-H01
*/

import { NextRequest, NextResponse } from 'next/server';

// Mock NextResponse.json
jest.mock('next/server', () => {
  const originalModule = jest.requireActual('next/server');
  return {
    ...originalModule,
    NextResponse: {
      json: (body: unknown, init?: ResponseInit) => {
        return new Response(JSON.stringify(body), {
          ...init,
          headers: {
            'content-type': 'application/json',
            ...init?.headers,
          },
        });
      },
    },
  };
});

// Mock Supabase admin client with comprehensive mock
const mockInsertSelect = jest.fn().mockReturnValue({
  single: jest.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null }),
});
const mockInsert = jest.fn().mockReturnValue({
  select: mockInsertSelect,
});
const mockUpsertSelect = jest.fn().mockReturnValue({
  single: jest.fn().mockResolvedValue({ data: { id: 'test-state-id' }, error: null }),
});
const mockUpsert = jest.fn().mockReturnValue({
  select: mockUpsertSelect,
});
const mockUpdate = jest.fn().mockReturnValue({
  eq: jest.fn().mockResolvedValue({ error: null }),
});
const mockSelectEqSingle = jest.fn();
const mockSelectEqLimit = jest.fn().mockReturnValue({
  single: jest.fn().mockResolvedValue({ data: null, error: null }),
});
const mockSelectEq = jest.fn().mockReturnValue({
  single: mockSelectEqSingle,
  limit: mockSelectEqLimit,
});
const mockSelect = jest.fn().mockReturnValue({
  eq: mockSelectEq,
});

const mockFrom = jest.fn().mockImplementation((table: string) => {
  return {
    select: mockSelect,
    insert: mockInsert,
    upsert: mockUpsert,
    update: mockUpdate,
  };
});

jest.mock('@/lib/supabase/admin', () => ({
  createClient: jest.fn(() => ({
    from: mockFrom,
  })),
}));

// Import after mocks
import { POST } from '@/app/api/crewai/webhook/route';

// =============================================================================
// TEST HELPERS
// =============================================================================

// Valid UUID v4 format (version 4 indicated by the 4 in third group)
const TEST_PROJECT_ID = '12345678-1234-4234-8234-123456789012';
const TEST_USER_ID = '12345678-1234-4234-8234-123456789012';
const VALID_TOKEN = 'test-webhook-token';

function createMockRequest(payload: any, token?: string): NextRequest {
  const headers = new Headers({
    'Content-Type': 'application/json',
  });
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return {
    url: 'http://localhost:3000/api/crewai/webhook',
    headers,
    json: async () => payload,
  } as unknown as NextRequest;
}

function createFounderValidationPayload(overrides: Partial<any> = {}) {
  return {
    flow_type: 'founder_validation',
    project_id: TEST_PROJECT_ID,
    user_id: TEST_USER_ID,
    run_id: 'run-test-001',
    validation_report: {
      id: 'rpt-test-001',
      business_idea: 'AI-powered logistics platform',
      validation_outcome: 'PROCEED',
      evidence_summary: 'Strong validation signals',
      pivot_recommendation: null,
      next_steps: ['Build MVP', 'Find customers'],
    },
    value_proposition_canvas: {},
    evidence: {
      desirability: {
        problem_resonance: 0.75,
        conversion_rate: 0.12,
        commitment_depth: 'skin_in_game',
        zombie_ratio: 0.15,
        impressions: 1000,
        clicks: 150,
        signups: 12,
        spend_usd: 100.0,
        experiments: [],
      },
      feasibility: {
        core_features_feasible: { feature1: 'fully_feasible' },
        downgrade_required: false,
      },
      viability: {
        cac: 100.0,
        ltv: 1200.0,
        ltv_cac_ratio: 12.0,
        gross_margin: 0.70,
      },
    },
    qa_report: {
      status: 'passed',
      issues: [],
      recommendations: [],
    },
    completed_at: new Date().toISOString(),
    ...overrides,
  };
}

// =============================================================================
// TESTS
// =============================================================================

describe('POST /api/crewai/webhook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MODAL_AUTH_TOKEN = VALID_TOKEN;

    // Default: project exists and user matches
    mockSelectEqSingle.mockResolvedValue({
      data: {
        id: TEST_PROJECT_ID,
        user_id: TEST_USER_ID,
        evidence_count: 0,
      },
      error: null,
    });
  });

  afterEach(() => {
    delete process.env.MODAL_AUTH_TOKEN;
  });

  // ===========================================================================
  // AUTHENTICATION TESTS
  // ===========================================================================

  describe('Authentication', () => {
    it('should return 401 if no authorization header', async () => {
      const payload = createFounderValidationPayload();
      const req = createMockRequest(payload); // No token

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Unauthorized');
    });

    it('should return 401 if bearer token is invalid', async () => {
      const payload = createFounderValidationPayload();
      const req = createMockRequest(payload, 'wrong-token');

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Unauthorized');
    });

    it('should accept valid bearer token and process request', async () => {
      const payload = createFounderValidationPayload();
      const req = createMockRequest(payload, VALID_TOKEN);

      const response = await POST(req);

      // Should proceed past auth (may still fail on persistence, but that's OK)
      expect(response.status).not.toBe(401);
    });
  });

  // ===========================================================================
  // PAYLOAD VALIDATION TESTS
  // ===========================================================================

  describe('Payload Validation', () => {
    it('should return 400 if flow_type is missing', async () => {
      const payload = createFounderValidationPayload();
      const { flow_type, ...payloadWithoutFlowType } = payload;
      const req = createMockRequest(payloadWithoutFlowType, VALID_TOKEN);

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing flow_type');
    });

    it('should return 400 for unknown flow_type', async () => {
      const payload = createFounderValidationPayload({ flow_type: 'unknown_flow' });
      const req = createMockRequest(payload, VALID_TOKEN);

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Unknown flow_type');
    });

    it('should return 400 if project_id is not a valid UUID', async () => {
      const payload = createFounderValidationPayload({ project_id: 'not-a-uuid' });
      const req = createMockRequest(payload, VALID_TOKEN);

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
    });

    it('should return 400 if user_id is not a valid UUID', async () => {
      const payload = createFounderValidationPayload({ user_id: 'not-a-uuid' });
      const req = createMockRequest(payload, VALID_TOKEN);

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
    });

    it('should return 400 if validation_report is missing', async () => {
      const payload = createFounderValidationPayload();
      const { validation_report, ...payloadWithoutReport } = payload;
      const req = createMockRequest(payloadWithoutReport, VALID_TOKEN);

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
    });
  });

  // ===========================================================================
  // PROJECT VERIFICATION TESTS
  // ===========================================================================

  describe('Project Verification', () => {
    it('should return 404 if project not found', async () => {
      mockSelectEqSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      const payload = createFounderValidationPayload();
      const req = createMockRequest(payload, VALID_TOKEN);

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Project not found');
    });

    it('should return 403 if user_id does not match project owner', async () => {
      mockSelectEqSingle.mockResolvedValueOnce({
        data: {
          id: TEST_PROJECT_ID,
          user_id: '99999999-9999-9999-9999-999999999999', // Different user
          evidence_count: 0,
        },
        error: null,
      });

      const payload = createFounderValidationPayload();
      const req = createMockRequest(payload, VALID_TOKEN);

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('User ID does not match');
    });
  });

  // ===========================================================================
  // SUCCESS PATH TESTS
  // ===========================================================================

  describe('Successful Processing', () => {
    it('should return 200 with report_id on success', async () => {
      const payload = createFounderValidationPayload();
      const req = createMockRequest(payload, VALID_TOKEN);

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.flow_type).toBe('founder_validation');
      expect(data.report_id).toBeDefined();
    });

    it('should call reports table insert', async () => {
      const payload = createFounderValidationPayload();
      const req = createMockRequest(payload, VALID_TOKEN);

      await POST(req);

      expect(mockFrom).toHaveBeenCalledWith('reports');
    });

    it('should call evidence table insert', async () => {
      const payload = createFounderValidationPayload();
      const req = createMockRequest(payload, VALID_TOKEN);

      await POST(req);

      expect(mockFrom).toHaveBeenCalledWith('evidence');
    });

    it('should call crewai_validation_states upsert', async () => {
      const payload = createFounderValidationPayload();
      const req = createMockRequest(payload, VALID_TOKEN);

      await POST(req);

      expect(mockFrom).toHaveBeenCalledWith('crewai_validation_states');
    });
  });

  // ===========================================================================
  // EVIDENCE DATA TESTS
  // ===========================================================================

  describe('Evidence Data Handling', () => {
    it('should handle payload with all evidence phases', async () => {
      const payload = createFounderValidationPayload();
      const req = createMockRequest(payload, VALID_TOKEN);

      const response = await POST(req);

      expect(response.status).toBe(200);
    });

    it('should handle payload with missing desirability evidence', async () => {
      const payload = createFounderValidationPayload({
        evidence: {
          desirability: null,
          feasibility: { core_features_feasible: {} },
          viability: { cac: 100, ltv: 300, ltv_cac_ratio: 3 },
        },
      });
      const req = createMockRequest(payload, VALID_TOKEN);

      const response = await POST(req);

      expect(response.status).toBe(200);
    });

    it('should handle payload with all null evidence phases', async () => {
      const payload = createFounderValidationPayload({
        evidence: {
          desirability: null,
          feasibility: null,
          viability: null,
        },
      });
      const req = createMockRequest(payload, VALID_TOKEN);

      const response = await POST(req);

      expect(response.status).toBe(200);
    });
  });
});

// =============================================================================
// CONSULTANT ONBOARDING TESTS
// =============================================================================

describe('POST /api/crewai/webhook - Consultant Onboarding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MODAL_AUTH_TOKEN = VALID_TOKEN;

    // Mock consultant profile lookup
    mockSelectEqSingle.mockResolvedValue({
      data: {
        id: TEST_PROJECT_ID,
        onboarding_completed: false,
      },
      error: null,
    });
  });

  afterEach(() => {
    delete process.env.MODAL_AUTH_TOKEN;
  });

  function createConsultantPayload(overrides: Partial<any> = {}) {
    return {
      flow_type: 'consultant_onboarding',
      consultant_id: TEST_PROJECT_ID,
      session_id: 'session-123',
      practice_analysis: {
        strengths: ['Strategy expertise'],
        gaps: ['Digital marketing'],
        positioning: 'Premium boutique',
        opportunities: ['SMB market'],
        client_profile: 'Mid-market companies',
      },
      recommendations: ['Focus on niche'],
      onboarding_tips: ['Complete profile'],
      suggested_templates: ['Strategy canvas'],
      suggested_workflows: ['Weekly review'],
      white_label_suggestions: {},
      completed_at: new Date().toISOString(),
      ...overrides,
    };
  }

  it('should accept valid consultant_onboarding payload', async () => {
    const payload = createConsultantPayload();
    const req = createMockRequest(payload, VALID_TOKEN);

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.flow_type).toBe('consultant_onboarding');
  });

  it('should return 404 if consultant profile not found', async () => {
    mockSelectEqSingle.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116', message: 'Not found' },
    });

    const payload = createConsultantPayload();
    const req = createMockRequest(payload, VALID_TOKEN);

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(404);
  });

  it('should call consultant_profiles update', async () => {
    const payload = createConsultantPayload();
    const req = createMockRequest(payload, VALID_TOKEN);

    await POST(req);

    expect(mockFrom).toHaveBeenCalledWith('consultant_profiles');
  });
});
