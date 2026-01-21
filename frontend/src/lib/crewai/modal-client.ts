/**
 * Modal Serverless Client for StartupAI Validation Engine
 *
 * Provides utilities for interacting with the Modal-deployed validation pipeline.
 * Uses checkpoint-and-resume to avoid idle costs between HITL approvals.
 *
 * @see ADR-002: Modal Serverless Migration in startupai-crew/docs/adr/
 */

// =============================================================================
// Types
// =============================================================================

/**
 * Quick Start hints for seeding Phase 1 analysis.
 * All fields are optional.
 */
export interface QuickStartHints {
  industry?: string;
  target_user?: string;
  geography?: string;
}

/**
 * Legacy kickoff request (7-stage conversation flow)
 * @deprecated Use QuickStartKickoffRequest instead
 */
export interface LegacyKickoffRequest {
  entrepreneur_input: string;
  project_id: string;
  user_id: string;
  session_id?: string;
  conversation_transcript?: string;  // Full conversation from Alex chat
  user_type?: 'founder' | 'consultant';
}

/**
 * Quick Start kickoff request (ADR-006)
 * Replaces 7-stage conversation with 30-second form
 */
export interface QuickStartKickoffRequest {
  raw_idea: string;           // Business idea (min 10 chars)
  project_id: string;
  user_id: string;
  hints?: QuickStartHints;    // Optional context hints
  additional_context?: string; // Optional free-form context (max 10k chars)
  user_type?: 'founder' | 'consultant';
  client_id?: string;          // For consultant flow
}

// Union type for backward compatibility
export type ModalKickoffRequest = LegacyKickoffRequest | QuickStartKickoffRequest;

/**
 * Type guard to check if request is Quick Start format
 */
export function isQuickStartRequest(request: ModalKickoffRequest): request is QuickStartKickoffRequest {
  return 'raw_idea' in request;
}

export interface ModalKickoffResponse {
  run_id: string;
  status: 'started' | 'queued';
  message: string;
}

export interface ModalStatusResponse {
  run_id: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  current_phase: number;
  phase_name: string;
  progress?: {
    crew: string;
    task?: string;
    agent?: string;
    progress_pct: number;
  };
  hitl_checkpoint?: {
    checkpoint: string;
    title: string;
    description: string;
    options: Array<{ id: string; label: string; description?: string }>;
    recommended: string;
    context?: Record<string, any>;
  };
  outputs?: Record<string, any>;
  error?: string;
}

export interface ModalHITLApproveRequest {
  run_id: string;
  checkpoint: string;
  decision: string;
  feedback?: string;
  decided_by?: string;
}

export interface ModalHITLApproveResponse {
  success: boolean;
  message: string;
  resumed: boolean;
  next_phase?: number;
}

export interface ModalClientConfig {
  kickoffUrl: string;
  statusUrl: string;
  hitlApproveUrl: string;
  authToken?: string;
  maxPollAttempts?: number;
  pollIntervalMs?: number;
}

// =============================================================================
// Modal Serverless Client
// =============================================================================

/**
 * Modal Serverless Client
 *
 * Usage:
 * ```ts
 * const client = new ModalClient({
 *   kickoffUrl: process.env.MODAL_KICKOFF_URL,
 *   statusUrl: process.env.MODAL_STATUS_URL,
 *   hitlApproveUrl: process.env.MODAL_HITL_APPROVE_URL,
 *   authToken: process.env.MODAL_AUTH_TOKEN,
 * });
 *
 * // Start validation
 * const { run_id } = await client.kickoff({
 *   entrepreneur_input: '...',
 *   project_id: '...',
 *   user_id: '...',
 * });
 *
 * // Check status
 * const status = await client.getStatus(run_id);
 *
 * // Approve HITL checkpoint
 * await client.approveHITL({
 *   run_id,
 *   checkpoint: 'approve_founders_brief',
 *   decision: 'approved',
 * });
 * ```
 */
export class ModalClient {
  private config: Required<ModalClientConfig>;

  constructor(config: ModalClientConfig) {
    this.config = {
      kickoffUrl: config.kickoffUrl,
      statusUrl: config.statusUrl,
      hitlApproveUrl: config.hitlApproveUrl,
      authToken: config.authToken || '',
      maxPollAttempts: config.maxPollAttempts || 120, // 120 * 5s = 10 minutes max
      pollIntervalMs: config.pollIntervalMs || 5000, // 5 seconds
    };

    if (!this.config.kickoffUrl || !this.config.statusUrl || !this.config.hitlApproveUrl) {
      throw new Error('Modal API URLs are required (kickoffUrl, statusUrl, hitlApproveUrl)');
    }
  }

  /**
   * Start validation run
   * Returns immediately with run_id (async execution)
   */
  async kickoff(request: ModalKickoffRequest): Promise<ModalKickoffResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.authToken) {
      headers['Authorization'] = `Bearer ${this.config.authToken}`;
    }

    try {
      const response = await fetch(this.config.kickoffUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Modal kickoff failed (${response.status}): ${errorText}`);
      }

      const data = await response.json();

      if (!data.run_id) {
        throw new Error('Modal kickoff response missing run_id');
      }

      return data as ModalKickoffResponse;
    } catch (error) {
      console.error('[Modal] Kickoff error:', error);
      throw error;
    }
  }

  /**
   * Check validation status
   * Returns current phase, progress, and HITL checkpoint if paused
   */
  async getStatus(runId: string): Promise<ModalStatusResponse> {
    const url = `${this.config.statusUrl}/${runId}`;

    const headers: Record<string, string> = {};

    if (this.config.authToken) {
      headers['Authorization'] = `Bearer ${this.config.authToken}`;
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Modal status check failed (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      return data as ModalStatusResponse;
    } catch (error) {
      console.error('[Modal] Status check error:', error);
      throw error;
    }
  }

  /**
   * Approve HITL checkpoint and resume validation
   * Container restarts from persisted state
   */
  async approveHITL(request: ModalHITLApproveRequest): Promise<ModalHITLApproveResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.authToken) {
      headers['Authorization'] = `Bearer ${this.config.authToken}`;
    }

    try {
      const response = await fetch(this.config.hitlApproveUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Modal HITL approve failed (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      return data as ModalHITLApproveResponse;
    } catch (error) {
      console.error('[Modal] HITL approve error:', error);
      throw error;
    }
  }

  /**
   * Kickoff and poll until complete or HITL pause
   *
   * @param request - Validation inputs
   * @param onProgress - Optional callback for status updates
   * @returns Final status (may be paused at HITL checkpoint)
   */
  async kickoffAndWait(
    request: ModalKickoffRequest,
    onProgress?: (status: ModalStatusResponse) => void
  ): Promise<ModalStatusResponse> {
    // Start execution
    const kickoffResponse = await this.kickoff(request);
    const runId = kickoffResponse.run_id;

    console.log(`[Modal] Validation started: ${runId}`);

    // Poll for completion or HITL pause
    for (let attempt = 0; attempt < this.config.maxPollAttempts; attempt++) {
      await this.sleep(this.config.pollIntervalMs);

      const status = await this.getStatus(runId);

      if (onProgress) {
        onProgress(status);
      }

      console.log(
        `[Modal] Status check ${attempt + 1}/${this.config.maxPollAttempts}: ${status.status} (Phase ${status.current_phase})`
      );

      if (status.status === 'completed') {
        console.log('[Modal] Validation completed successfully');
        return status;
      }

      if (status.status === 'paused') {
        console.log('[Modal] Validation paused at HITL checkpoint:', status.hitl_checkpoint?.checkpoint);
        return status;
      }

      if (status.status === 'failed') {
        throw new Error(`Modal validation failed: ${status.error || 'Unknown error'}`);
      }

      // Continue polling if pending or running
    }

    throw new Error(
      `Modal validation timed out after ${(this.config.maxPollAttempts * this.config.pollIntervalMs) / 1000} seconds`
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a configured Modal client from environment variables
 */
export function createModalClient(config?: Partial<ModalClientConfig>): ModalClient {
  return new ModalClient({
    kickoffUrl: config?.kickoffUrl || process.env.MODAL_KICKOFF_URL || '',
    statusUrl: config?.statusUrl || process.env.MODAL_STATUS_URL || '',
    hitlApproveUrl: config?.hitlApproveUrl || process.env.MODAL_HITL_APPROVE_URL || '',
    authToken: config?.authToken || process.env.MODAL_AUTH_TOKEN,
    maxPollAttempts: config?.maxPollAttempts,
    pollIntervalMs: config?.pollIntervalMs,
  });
}

// =============================================================================
// Phase Name Mapping
// =============================================================================

export const PHASE_NAMES: Record<number, string> = {
  1: 'Research & Brief Generation',  // Phase 1 with BriefGenerationCrew (ADR-006)
  2: 'Desirability',
  3: 'Feasibility',
  4: 'Viability',
};

export function getPhaseName(phase: number): string {
  return PHASE_NAMES[phase] || `Phase ${phase}`;
}

// =============================================================================
// Progress Calculation
// =============================================================================

/**
 * Calculate overall progress percentage across all phases
 */
export function calculateOverallProgress(status: ModalStatusResponse): number {
  const phaseWeights = [25, 30, 25, 20]; // Weights for phases 1-4 (no Phase 0 in Quick Start)
  const completedPhaseProgress = phaseWeights
    .slice(0, Math.max(0, status.current_phase - 1))
    .reduce((sum, w) => sum + w, 0);

  const currentPhaseWeight = phaseWeights[status.current_phase - 1] || 0;
  const currentPhaseProgress = status.progress?.progress_pct || 0;
  const currentContribution = (currentPhaseProgress / 100) * currentPhaseWeight;

  return Math.min(completedPhaseProgress + currentContribution, 100);
}

// =============================================================================
// Mock Implementation (for development until Modal backend is ready)
// =============================================================================

/**
 * Mock Modal kickoff for Quick Start flow.
 * Used when MODAL_USE_MOCK=true or Modal backend doesn't support Quick Start yet.
 *
 * @returns Mock response simulating Modal /kickoff
 */
export async function mockQuickStartKickoff(
  request: QuickStartKickoffRequest
): Promise<ModalKickoffResponse> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const runId = `mock-${crypto.randomUUID()}`;

  console.log('[Modal Mock] Quick Start kickoff:', {
    run_id: runId,
    raw_idea: request.raw_idea.substring(0, 50) + '...',
    hints: request.hints,
    project_id: request.project_id,
  });

  return {
    run_id: runId,
    status: 'started',
    message: 'Mock: Phase 1 validation run initiated. BriefGenerationCrew will analyze your idea.',
  };
}

/**
 * Mock status response for Quick Start flow.
 * Simulates Phase 1 progress and HITL checkpoint.
 */
export function mockQuickStartStatus(runId: string, progressPct: number = 0): ModalStatusResponse {
  // Simulate progression through Phase 1
  if (progressPct < 50) {
    return {
      run_id: runId,
      status: 'running',
      current_phase: 1,
      phase_name: 'Research & Brief Generation',
      progress: {
        crew: 'BriefGenerationCrew',
        task: 'Generating entrepreneur brief',
        agent: 'GV1 (Brief Generator)',
        progress_pct: progressPct,
      },
    };
  } else if (progressPct < 75) {
    // Pause at Stage A - approve_brief
    return {
      run_id: runId,
      status: 'paused',
      current_phase: 1,
      phase_name: 'Research & Brief Generation',
      hitl_checkpoint: {
        checkpoint: 'approve_brief',
        title: 'Review Your Entrepreneur Brief',
        description: 'We\'ve generated a structured brief based on your business idea. Please review and edit if needed.',
        options: [
          { id: 'approved', label: 'Approve', description: 'Continue with this brief' },
          { id: 'rejected', label: 'Revise', description: 'Make changes before continuing' },
        ],
        recommended: 'approved',
        context: {
          brief: {
            business_idea: 'Your business idea summary...',
            target_segments: ['Segment A', 'Segment B'],
            problem_statement: 'The core problem you\'re solving...',
            solution_description: 'Your proposed solution...',
          },
          editable: true,  // Stage A allows edits
        },
      },
    };
  } else if (progressPct < 100) {
    // Pause at Stage B - approve_discovery_output
    return {
      run_id: runId,
      status: 'paused',
      current_phase: 1,
      phase_name: 'Research & Brief Generation',
      hitl_checkpoint: {
        checkpoint: 'approve_discovery_output',
        title: 'Review Discovery Analysis',
        description: 'Our AI has completed market research and competitor analysis. Review the findings.',
        options: [
          { id: 'approved', label: 'Approve & Continue', description: 'Proceed to Phase 2' },
          { id: 'rejected', label: 'Request Changes', description: 'Flag issues for review' },
        ],
        recommended: 'approved',
        context: {
          vpc_data: {
            customer_profiles: {},
            value_maps: {},
          },
          competitor_report: {
            competitors: [],
            analysis: 'Competitive landscape summary...',
          },
          editable: false,  // Stage B is read-only
        },
      },
    };
  }

  return {
    run_id: runId,
    status: 'completed',
    current_phase: 1,
    phase_name: 'Research & Brief Generation',
    outputs: {
      entrepreneur_brief: {},
      vpc_data: {},
      ready_for_phase_2: true,
    },
  };
}

/**
 * Check if Mock Mode is enabled via environment variable.
 */
export function isModalMockEnabled(): boolean {
  return process.env.MODAL_USE_MOCK === 'true' || process.env.NODE_ENV === 'test';
}
