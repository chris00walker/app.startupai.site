import { Page } from '@playwright/test';

/**
 * Mock response types for external APIs
 */
export interface MockGateEvaluationResponse {
  status: 'Passed' | 'Failed' | 'Pending';
  reasons: string[];
  readiness_score: number;
  evidence_count: number;
  experiments_count: number;
  stage: string;
}

export interface MockCrewAIResponse {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  job_id: string;
  result?: Record<string, unknown>;
}

/**
 * Default mock responses
 */
export const DEFAULT_GATE_RESPONSE: MockGateEvaluationResponse = {
  status: 'Pending',
  reasons: [],
  readiness_score: 45,
  evidence_count: 3,
  experiments_count: 2,
  stage: 'DESIRABILITY',
};

export const DEFAULT_CREWAI_RESPONSE: MockCrewAIResponse = {
  status: 'pending',
  job_id: 'mock-e2e-job-123',
};

/**
 * Mock the gate evaluation Netlify function
 * This is called by useGateEvaluation hook and can be slow
 */
export async function mockGateEvaluation(
  page: Page,
  response: MockGateEvaluationResponse = DEFAULT_GATE_RESPONSE
): Promise<void> {
  await page.route('**/.netlify/functions/gate-evaluate', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

/**
 * Mock CrewAI analysis endpoints
 * These call external validation services and can be slow
 */
export async function mockCrewAIAnalysis(
  page: Page,
  response: MockCrewAIResponse = DEFAULT_CREWAI_RESPONSE
): Promise<void> {
  // Mock all CrewAI-related endpoints
  await page.route('**/api/crewai/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });

  // Direct platform calls are not expected in the UI flow.
}

/**
 * Mock AI agent status endpoint
 */
export async function mockAgentStatus(page: Page): Promise<void> {
  await page.route('**/api/agents/status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        founders: [],
        activeWorkflow: null,
        latestReport: null,
      }),
    });
  });
}

/**
 * Setup all dashboard-related API mocks
 * Call this BEFORE navigating to the dashboard page
 */
export async function setupDashboardMocks(page: Page): Promise<void> {
  await Promise.all([
    mockGateEvaluation(page),
    mockCrewAIAnalysis(page),
    mockAgentStatus(page),
  ]);
}

/**
 * Clear all route mocks
 * Use this if you need to restore real API behavior mid-test
 */
export async function clearMocks(page: Page): Promise<void> {
  await page.unrouteAll();
}
