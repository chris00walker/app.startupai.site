/**
 * CrewAI AMP (Agent Management Platform) Client
 *
 * Provides utilities for interacting with deployed CrewAI crews via the AMP API.
 * Supports the kickoff → poll → results pattern for asynchronous crew execution.
 */

export interface CrewAIKickoffRequest {
  inputs: Record<string, any>;
}

export interface CrewAIKickoffResponse {
  kickoff_id: string;
  status: 'QUEUED' | 'RUNNING';
}

export interface CrewAIStatusResponse {
  kickoff_id: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETE' | 'ERROR';
  output?: string | Record<string, any>;
  error?: string;
  created_at?: string;
  started_at?: string;
  completed_at?: string;
}

export interface CrewAIClientConfig {
  apiUrl: string;
  apiToken?: string;
  maxPollAttempts?: number;
  pollIntervalMs?: number;
}

/**
 * CrewAI AMP Client
 *
 * Usage:
 * ```ts
 * const client = new CrewAIAMPClient({
 *   apiUrl: process.env.CREWAI_API_URL,
 *   apiToken: process.env.CREWAI_API_TOKEN,
 * });
 *
 * const result = await client.kickoffAndWait({
 *   inputs: { strategic_question: '...', project_context: '...' }
 * });
 * ```
 */
export class CrewAIAMPClient {
  private config: Required<CrewAIClientConfig>;

  constructor(config: CrewAIClientConfig) {
    this.config = {
      apiUrl: config.apiUrl,
      apiToken: config.apiToken || '',
      maxPollAttempts: config.maxPollAttempts || 60, // 60 * 5s = 5 minutes max
      pollIntervalMs: config.pollIntervalMs || 5000, // 5 seconds
    };

    if (!this.config.apiUrl) {
      throw new Error('CrewAI AMP API URL is required');
    }
  }

  /**
   * Start crew execution
   */
  async kickoff(request: CrewAIKickoffRequest): Promise<CrewAIKickoffResponse> {
    const url = `${this.config.apiUrl}/kickoff`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiToken) {
      headers['Authorization'] = `Bearer ${this.config.apiToken}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `CrewAI kickoff failed (${response.status}): ${errorText}`
        );
      }

      const data = await response.json();

      if (!data.kickoff_id) {
        throw new Error('CrewAI kickoff response missing kickoff_id');
      }

      return data as CrewAIKickoffResponse;
    } catch (error) {
      console.error('[CrewAI AMP] Kickoff error:', error);
      throw error;
    }
  }

  /**
   * Check execution status
   */
  async getStatus(kickoffId: string): Promise<CrewAIStatusResponse> {
    const url = `${this.config.apiUrl}/status/${kickoffId}`;

    const headers: Record<string, string> = {};

    if (this.config.apiToken) {
      headers['Authorization'] = `Bearer ${this.config.apiToken}`;
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `CrewAI status check failed (${response.status}): ${errorText}`
        );
      }

      const data = await response.json();
      return data as CrewAIStatusResponse;
    } catch (error) {
      console.error('[CrewAI AMP] Status check error:', error);
      throw error;
    }
  }

  /**
   * Kickoff crew and poll until complete
   *
   * @param request - Crew inputs
   * @param onProgress - Optional callback for status updates
   * @returns Final crew output
   */
  async kickoffAndWait(
    request: CrewAIKickoffRequest,
    onProgress?: (status: CrewAIStatusResponse) => void
  ): Promise<CrewAIStatusResponse> {
    // Start execution
    const kickoffResponse = await this.kickoff(request);
    const kickoffId = kickoffResponse.kickoff_id;

    console.log(`[CrewAI AMP] Crew started: ${kickoffId}`);

    // Poll for completion
    for (let attempt = 0; attempt < this.config.maxPollAttempts; attempt++) {
      await this.sleep(this.config.pollIntervalMs);

      const status = await this.getStatus(kickoffId);

      if (onProgress) {
        onProgress(status);
      }

      console.log(
        `[CrewAI AMP] Status check ${attempt + 1}/${this.config.maxPollAttempts}: ${status.status}`
      );

      if (status.status === 'COMPLETE') {
        console.log('[CrewAI AMP] Crew execution completed successfully');
        return status;
      }

      if (status.status === 'ERROR') {
        throw new Error(`CrewAI execution failed: ${status.error || 'Unknown error'}`);
      }

      // Continue polling if QUEUED or RUNNING
    }

    throw new Error(
      `CrewAI execution timed out after ${this.config.maxPollAttempts * this.config.pollIntervalMs / 1000} seconds`
    );
  }

  /**
   * Get expected inputs for the crew
   */
  async getInputs(): Promise<Record<string, any>> {
    const url = `${this.config.apiUrl}/inputs`;

    const headers: Record<string, string> = {};

    if (this.config.apiToken) {
      headers['Authorization'] = `Bearer ${this.config.apiToken}`;
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `CrewAI inputs fetch failed (${response.status}): ${errorText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error('[CrewAI AMP] Inputs fetch error:', error);
      throw error;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Create a configured CrewAI AMP client from environment variables
 */
export function createCrewAIClient(config?: Partial<CrewAIClientConfig>): CrewAIAMPClient {
  return new CrewAIAMPClient({
    apiUrl: config?.apiUrl || process.env.CREWAI_API_URL || '',
    apiToken: config?.apiToken || process.env.CREWAI_API_TOKEN,
    maxPollAttempts: config?.maxPollAttempts,
    pollIntervalMs: config?.pollIntervalMs,
  });
}
