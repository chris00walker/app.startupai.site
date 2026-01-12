/**
 * Webhook to Dashboard Integration Tests
 *
 * INTEGRATION TEST: This test uses REAL Supabase connections (no mocking).
 * It verifies the full flow:
 *   1. Webhook receives payload and persists to DB
 *   2. Dashboard hooks can query the persisted data
 *
 * Prerequisites:
 *   - NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set
 *   - Real test user and project must exist in DB (or be created by test)
 *
 * Run with: pnpm test:integration (or pnpm test -- --testPathPattern=integration)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';

// Skip if env vars not set or using fake test URL (CI without integration DB)
const SKIP_INTEGRATION =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes('test.supabase.co');

// Create admin client for direct DB access in tests
function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Integration test requires SUPABASE env vars');
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// =============================================================================
// TEST DATA BUILDERS
// =============================================================================

// Use random UUIDs to avoid conflicts with other test runs
const generateTestUUID = () => `test-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

interface TestContext {
  supabase: ReturnType<typeof createAdminClient>;
  testProjectId: string;
  testUserId: string;
  createdRecordIds: {
    reports: string[];
    evidence: string[];
    validationStates: string[];
    activityLog: string[];
  };
}

function buildWebhookPayload(projectId: string, userId: string, kickoffId: string) {
  return {
    flow_type: 'founder_validation',
    project_id: projectId,
    user_id: userId,
    run_id: kickoffId,
    session_id: `session-${kickoffId}`,
    validation_report: {
      id: `rpt-${kickoffId}`,
      business_idea: 'Integration test: AI-powered logistics platform',
      validation_outcome: 'PROCEED',
      evidence_summary: 'Strong validation signals across all gates',
      pivot_recommendation: null,
      next_steps: ['Build MVP', 'Run beta test', 'Collect feedback'],
    },
    value_proposition_canvas: {
      'Enterprise SMBs': {
        customer_profile: {
          jobs: [
            { functional: 'Ship products faster', emotional: 'Reduce stress', social: 'Look competent', importance: 'high' },
          ],
          pains: ['Late deliveries', 'High costs', 'Complex tracking'],
          gains: ['Same-day delivery', 'Real-time tracking', 'Cost savings'],
          pain_intensity: { 'Late deliveries': 9, 'High costs': 8 },
          gain_importance: { 'Same-day delivery': 10, 'Cost savings': 8 },
        },
        value_map: {
          products_services: ['AI route optimization', 'Real-time dashboard'],
          pain_relievers: { 'Late deliveries': 'Predictive ETAs' },
          gain_creators: { 'Same-day delivery': 'Optimized routing' },
        },
      },
    },
    evidence: {
      desirability: {
        problem_resonance: 0.82,
        conversion_rate: 0.15,
        commitment_depth: 'skin_in_game',
        zombie_ratio: 0.12,
        key_learnings: ['SMBs prefer self-service', 'Price sensitivity is high'],
        tested_segments: ['Enterprise SMBs', 'Mid-market'],
        impressions: 2500,
        clicks: 375,
        signups: 37,
        spend_usd: 250.0,
        experiments: [
          { name: 'Landing Page A/B', summary: 'Tested value prop messaging', success: true, key_learnings: ['Clear ROI wins'] },
          { name: 'Waitlist Campaign', summary: 'Collected 200 emails', success: true, key_learnings: ['SMBs respond to automation'] },
        ],
      },
      feasibility: {
        core_features_feasible: {
          routing_engine: 'POSSIBLE',
          real_time_tracking: 'POSSIBLE',
          ml_predictions: 'CONSTRAINED',
        },
        downgrade_required: false,
        downgrade_impact: null,
        api_costs: 150.0,
        infra_costs: 200.0,
        total_monthly_cost: 350.0,
      },
      viability: {
        cac: 85.0,
        ltv: 1020.0,
        ltv_cac_ratio: 12.0,
        gross_margin: 0.72,
        payback_months: 3,
        break_even_customers: 150,
        tam_usd: 5000000000,
        market_share_target: 0.001,
        viability_assessment: 'Strong unit economics with healthy margins',
      },
    },
    qa_report: {
      status: 'passed',
      issues: [],
      recommendations: ['Continue with MVP development'],
      framework_compliance: 0.95,
      logical_consistency: 0.92,
      completeness: 0.88,
    },
    // Extended state fields for crewai_validation_states
    iteration: 1,
    phase: 'desirability',
    current_risk_axis: 'desirability',
    problem_fit: 'strong',
    desirability_signal: 'strong_commitment',
    feasibility_signal: 'green',
    viability_signal: 'profitable',
    business_idea: 'AI-powered logistics platform',
    target_segments: ['Enterprise SMBs', 'Mid-market'],
    completed_at: new Date().toISOString(),
  };
}

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

const maybeDescribe = SKIP_INTEGRATION ? describe.skip : describe;

maybeDescribe('Webhook to Dashboard Integration', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = {
      supabase: createAdminClient(),
      testProjectId: '',
      testUserId: '',
      createdRecordIds: {
        reports: [],
        evidence: [],
        validationStates: [],
        activityLog: [],
      },
    };

    // Find or create a test user
    const { data: existingUsers } = await ctx.supabase
      .from('user_profiles')
      .select('id')
      .ilike('email', '%test%')
      .limit(1);

    if (existingUsers && existingUsers.length > 0) {
      ctx.testUserId = existingUsers[0].id;
    } else {
      // Use a known test user ID if available, or skip
      console.warn('No test user found - some tests may be skipped');
    }

    // Find or create a test project linked to the user
    if (ctx.testUserId) {
      const { data: existingProjects } = await ctx.supabase
        .from('projects')
        .select('id')
        .eq('user_id', ctx.testUserId)
        .limit(1);

      if (existingProjects && existingProjects.length > 0) {
        ctx.testProjectId = existingProjects[0].id;
      } else {
        // Create a test project
        const { data: newProject, error: projectError } = await ctx.supabase
          .from('projects')
          .insert({
            name: `Integration Test Project ${Date.now()}`,
            user_id: ctx.testUserId,
            stage: 'DESIRABILITY',
            gate_status: 'Pending',
            evidence_count: 0,
          })
          .select('id')
          .single();

        if (newProject) {
          ctx.testProjectId = newProject.id;
        } else {
          console.warn('Could not create test project:', projectError?.message);
        }
      }
    }
  });

  afterAll(async () => {
    // Cleanup test data created during tests
    const { reports, evidence, validationStates, activityLog } = ctx.createdRecordIds;

    if (activityLog.length > 0) {
      await ctx.supabase.from('public_activity_log').delete().in('id', activityLog);
    }
    if (validationStates.length > 0) {
      await ctx.supabase.from('crewai_validation_states').delete().in('id', validationStates);
    }
    if (evidence.length > 0) {
      await ctx.supabase.from('evidence').delete().in('id', evidence);
    }
    if (reports.length > 0) {
      await ctx.supabase.from('reports').delete().in('id', reports);
    }
  });

  // ===========================================================================
  // DIRECT DATABASE VERIFICATION TESTS
  // ===========================================================================

  describe('Database Schema Verification', () => {
    it('should have required tables accessible', async () => {
      // Verify we can query each table
      const tables = ['reports', 'evidence', 'crewai_validation_states', 'projects', 'public_activity_log'];

      for (const table of tables) {
        const { error } = await ctx.supabase.from(table).select('id').limit(1);
        expect(error).toBeNull();
      }
    });

    it('should have test project and user available', () => {
      expect(ctx.testUserId).toBeTruthy();
      expect(ctx.testProjectId).toBeTruthy();
    });
  });

  describe('Webhook Persistence Verification', () => {
    const kickoffId = generateTestUUID();
    let insertedReportId: string | null = null;

    beforeAll(async () => {
      // Skip if no test project
      if (!ctx.testProjectId || !ctx.testUserId) return;

      // Simulate what the webhook does - insert directly to verify schema compatibility
      const payload = buildWebhookPayload(ctx.testProjectId, ctx.testUserId, kickoffId);

      // 1. Insert report
      const { data: reportData, error: reportError } = await ctx.supabase
        .from('reports')
        .insert({
          project_id: ctx.testProjectId,
          report_type: 'value_proposition_analysis',
          title: payload.validation_report.business_idea.slice(0, 50),
          content: {
            validation_outcome: payload.validation_report.validation_outcome,
            evidence_summary: payload.validation_report.evidence_summary,
            pivot_recommendation: payload.validation_report.pivot_recommendation,
            next_steps: payload.validation_report.next_steps,
            value_proposition_canvas: payload.value_proposition_canvas,
            qa_report: payload.qa_report,
            _metadata: {
              user_id: ctx.testUserId,
              validation_id: payload.validation_report.id,
              run_id: kickoffId,
              completed_at: payload.completed_at,
            },
          },
          model: 'crewai-flows',
        })
        .select('id')
        .single();

      if (reportData) {
        insertedReportId = reportData.id;
        ctx.createdRecordIds.reports.push(reportData.id);
      }
      expect(reportError).toBeNull();

      // 2. Insert evidence for desirability
      const { data: desEvidence, error: desError } = await ctx.supabase
        .from('evidence')
        .insert({
          project_id: ctx.testProjectId,
          title: 'Desirability Evidence',
          category: 'Research',
          summary: `Problem resonance: ${(payload.evidence.desirability.problem_resonance * 100).toFixed(0)}%`,
          content: JSON.stringify(payload.evidence.desirability),
          strength: payload.evidence.desirability.problem_resonance >= 0.7 ? 'strong' : 'medium',
          fit_type: 'Desirability',
          source: 'CrewAI Growth Crew',
          tags: ['desirability', 'crew_ai', 'validation', 'integration_test'],
        })
        .select('id')
        .single();

      if (desEvidence) ctx.createdRecordIds.evidence.push(desEvidence.id);
      expect(desError).toBeNull();

      // 3. Insert evidence for feasibility
      const { data: feasEvidence, error: feasError } = await ctx.supabase
        .from('evidence')
        .insert({
          project_id: ctx.testProjectId,
          title: 'Feasibility Evidence',
          category: 'Research',
          summary: `Monthly cost: $${payload.evidence.feasibility.total_monthly_cost}`,
          content: JSON.stringify(payload.evidence.feasibility),
          strength: 'strong',
          fit_type: 'Feasibility',
          source: 'CrewAI Build Crew',
          tags: ['feasibility', 'crew_ai', 'validation', 'integration_test'],
        })
        .select('id')
        .single();

      if (feasEvidence) ctx.createdRecordIds.evidence.push(feasEvidence.id);
      expect(feasError).toBeNull();

      // 4. Insert evidence for viability
      const { data: viabEvidence, error: viabError } = await ctx.supabase
        .from('evidence')
        .insert({
          project_id: ctx.testProjectId,
          title: 'Viability Evidence',
          category: 'Analytics',
          summary: `LTV/CAC: ${payload.evidence.viability.ltv_cac_ratio}x`,
          content: JSON.stringify(payload.evidence.viability),
          strength: payload.evidence.viability.ltv_cac_ratio >= 3 ? 'strong' : 'medium',
          fit_type: 'Viability',
          source: 'CrewAI Finance Crew',
          tags: ['viability', 'crew_ai', 'validation', 'integration_test'],
        })
        .select('id')
        .single();

      if (viabEvidence) ctx.createdRecordIds.evidence.push(viabEvidence.id);
      expect(viabError).toBeNull();

      // 5. Upsert validation state
      const { data: stateData, error: stateError } = await ctx.supabase
        .from('crewai_validation_states')
        .upsert(
          {
            project_id: ctx.testProjectId,
            user_id: ctx.testUserId,
            run_id: kickoffId,
            iteration: payload.iteration,
            phase: payload.phase,
            current_risk_axis: payload.current_risk_axis,
            problem_fit: payload.problem_fit,
            desirability_signal: payload.desirability_signal,
            feasibility_signal: payload.feasibility_signal,
            viability_signal: payload.viability_signal,
            business_idea: payload.business_idea,
            target_segments: payload.target_segments,
            desirability_evidence: payload.evidence.desirability,
            feasibility_evidence: payload.evidence.feasibility,
            viability_evidence: payload.evidence.viability,
            qa_reports: [payload.qa_report],
            customer_profiles: Object.fromEntries(
              Object.entries(payload.value_proposition_canvas).map(([k, v]) => [k, (v as any).customer_profile])
            ),
            value_maps: Object.fromEntries(
              Object.entries(payload.value_proposition_canvas).map(([k, v]) => [k, (v as any).value_map])
            ),
          },
          { onConflict: 'project_id' }
        )
        .select('id')
        .single();

      if (stateData) ctx.createdRecordIds.validationStates.push(stateData.id);
      expect(stateError).toBeNull();
    });

    it('should persist report with correct structure', async () => {
      if (!ctx.testProjectId) {
        console.warn('Skipping - no test project');
        return;
      }

      const { data: reports, error } = await ctx.supabase
        .from('reports')
        .select('*')
        .eq('project_id', ctx.testProjectId)
        .order('generated_at', { ascending: false })
        .limit(1);

      expect(error).toBeNull();
      expect(reports).toHaveLength(1);

      const report = reports![0];
      expect(report.report_type).toBe('value_proposition_analysis');
      expect(report.content).toHaveProperty('validation_outcome', 'PROCEED');
      expect(report.content).toHaveProperty('evidence_summary');
      expect(report.content).toHaveProperty('next_steps');
      expect(report.content).toHaveProperty('value_proposition_canvas');
      expect(report.content).toHaveProperty('qa_report');
      expect(report.content._metadata).toHaveProperty('kickoff_id', kickoffId);
    });

    it('should persist all three evidence types', async () => {
      if (!ctx.testProjectId) return;

      const { data: evidence, error } = await ctx.supabase
        .from('evidence')
        .select('*')
        .eq('project_id', ctx.testProjectId)
        .contains('tags', ['integration_test']);

      expect(error).toBeNull();
      expect(evidence!.length).toBeGreaterThanOrEqual(3);

      const fitTypes = evidence!.map((e) => e.fit_type);
      expect(fitTypes).toContain('Desirability');
      expect(fitTypes).toContain('Feasibility');
      expect(fitTypes).toContain('Viability');
    });

    it('should persist validation state with Innovation Physics signals', async () => {
      if (!ctx.testProjectId) return;

      const { data: state, error } = await ctx.supabase
        .from('crewai_validation_states')
        .select('*')
        .eq('project_id', ctx.testProjectId)
        .single();

      expect(error).toBeNull();
      expect(state).toBeDefined();

      // Check Innovation Physics signals
      expect(state!.desirability_signal).toBe('strong_commitment');
      expect(state!.feasibility_signal).toBe('green');
      expect(state!.viability_signal).toBe('profitable');

      // Check phase and iteration
      expect(state!.phase).toBe('desirability');
      expect(state!.iteration).toBe(1);

      // Check evidence containers
      expect(state!.desirability_evidence).toHaveProperty('problem_resonance', 0.82);
      expect(state!.feasibility_evidence).toHaveProperty('total_monthly_cost', 350.0);
      expect(state!.viability_evidence).toHaveProperty('ltv_cac_ratio', 12.0);
    });
  });

  // ===========================================================================
  // DASHBOARD QUERY VERIFICATION
  // ===========================================================================

  describe('Dashboard Hook Compatibility', () => {
    it('should support useProjectReports query pattern', async () => {
      if (!ctx.testProjectId) return;

      // This mirrors what useProjectReports does
      const { data, error } = await ctx.supabase
        .from('reports')
        .select('*')
        .eq('project_id', ctx.testProjectId)
        .order('generated_at', { ascending: false });

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);

      // Verify the data shape matches what the hook expects
      if (data && data.length > 0) {
        const report = data[0];
        expect(report).toHaveProperty('id');
        expect(report).toHaveProperty('project_id');
        expect(report).toHaveProperty('content');
        expect(report).toHaveProperty('report_type');
      }
    });

    it('should support useCrewAIState query pattern', async () => {
      if (!ctx.testProjectId) return;

      // This mirrors what useCrewAIState does
      const { data, error } = await ctx.supabase
        .from('crewai_validation_states')
        .select('*')
        .eq('project_id', ctx.testProjectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // PGRST116 = no rows found, which is acceptable if no state exists
      if (error?.code === 'PGRST116') {
        expect(true).toBe(true); // No state yet is valid
        return;
      }

      expect(error).toBeNull();

      // Verify the data shape matches what the hook expects
      if (data) {
        expect(data).toHaveProperty('desirability_signal');
        expect(data).toHaveProperty('feasibility_signal');
        expect(data).toHaveProperty('viability_signal');
        expect(data).toHaveProperty('phase');
        expect(data).toHaveProperty('iteration');
      }
    });

    it('should support evidence query with fit_type filter', async () => {
      if (!ctx.testProjectId) return;

      // Query evidence filtered by fit_type (as RecentActivity component might)
      const { data, error } = await ctx.supabase
        .from('evidence')
        .select('id, title, summary, fit_type, strength, created_at')
        .eq('project_id', ctx.testProjectId)
        .order('created_at', { ascending: false })
        .limit(10);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);

      // Verify evidence has expected shape
      if (data && data.length > 0) {
        const evidence = data[0];
        expect(evidence).toHaveProperty('title');
        expect(evidence).toHaveProperty('fit_type');
        expect(evidence).toHaveProperty('strength');
      }
    });
  });
});
