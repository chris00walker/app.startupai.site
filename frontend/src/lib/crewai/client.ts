/**
 * CrewAI Enterprise Integration Client
 *
 * Provides typed interface to CrewAI AMP via direct API calls.
 * Handles kickoff, status polling, and result retrieval for the StartupAI crew.
 */

import type {
  EntrepreneurInput,
  EntrepreneurBrief,
  KickoffResponse,
  CrewStatus,
} from './types';

const CREWAI_BASE_URL = process.env.MCP_CREWAI_ENTERPRISE_SERVER_URL;
const CREWAI_TOKEN = process.env.MCP_CREWAI_ENTERPRISE_BEARER_TOKEN;

if (!CREWAI_BASE_URL || !CREWAI_TOKEN) {
  console.error('[CrewAI Client] Missing configuration:', {
    hasUrl: !!CREWAI_BASE_URL,
    hasToken: !!CREWAI_TOKEN,
  });
}

/**
 * Format entrepreneur brief data from database into CrewAI crew input format
 */
export function formatBriefForCrew(brief: Record<string, any>): EntrepreneurInput {
  return {
    target_customer: brief.primary_customer_segment ||
      JSON.stringify(brief.customer_segments || []),
    problem_description: brief.problem_description || '',
    pain_level: brief.problem_pain_level || 5,
    solution_description: `${brief.solution_description || ''}. Unique Value: ${brief.unique_value_proposition || ''}`,
    key_differentiators: brief.differentiation_factors || [],
    competitors: brief.competitors || [],
    available_channels: brief.available_channels || [],
    budget_range: brief.budget_range || 'not specified',
    business_stage: brief.business_stage || 'idea',
    goals: JSON.stringify(brief.three_month_goals || []),
  };
}

/**
 * Kick off the StartupAI strategic analysis crew
 */
export async function kickoffCrewAIAnalysis(
  briefData: Record<string, any>,
  projectId: string,
  userId: string
): Promise<string> {
  if (!CREWAI_BASE_URL || !CREWAI_TOKEN) {
    throw new Error('CrewAI configuration missing. Check MCP env vars.');
  }

  console.log('[CrewAI Client] Kicking off analysis:', {
    projectId,
    userId,
    hasData: !!briefData,
  });

  const entrepreneurInput = formatBriefForCrew(briefData);

  const response = await fetch(`${CREWAI_BASE_URL}/kickoff`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CREWAI_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: { entrepreneur_input: entrepreneurInput },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[CrewAI Client] Kickoff failed:', {
      status: response.status,
      statusText: response.statusText,
      error,
    });
    throw new Error(`CrewAI kickoff failed: ${response.status} - ${error}`);
  }

  const result: KickoffResponse = await response.json();
  console.log('[CrewAI Client] Kickoff successful:', {
    kickoffId: result.kickoff_id,
  });

  return result.kickoff_id;
}

/**
 * Get the status and results of a crew execution
 */
export async function getCrewAIStatus(kickoffId: string): Promise<CrewStatus> {
  if (!CREWAI_BASE_URL || !CREWAI_TOKEN) {
    throw new Error('CrewAI configuration missing. Check MCP env vars.');
  }

  const response = await fetch(`${CREWAI_BASE_URL}/status/${kickoffId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${CREWAI_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[CrewAI Client] Status check failed:', {
      kickoffId,
      status: response.status,
      error,
    });
    throw new Error(`CrewAI status check failed: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Poll for crew completion with exponential backoff
 */
export async function waitForCrewCompletion(
  kickoffId: string,
  options: {
    maxAttempts?: number;
    initialDelay?: number;
    maxDelay?: number;
    onProgress?: (status: CrewStatus) => void;
  } = {}
): Promise<CrewStatus> {
  const {
    maxAttempts = 60, // ~5 minutes with exponential backoff
    initialDelay = 2000,
    maxDelay = 30000,
    onProgress,
  } = options;

  let delay = initialDelay;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await getCrewAIStatus(kickoffId);

    if (onProgress) {
      onProgress(status);
    }

    if (status.state === 'COMPLETED') {
      console.log('[CrewAI Client] Crew completed:', { kickoffId, attempt });
      return status;
    }

    if (status.state === 'FAILED') {
      console.error('[CrewAI Client] Crew failed:', { kickoffId, status: status.status });
      throw new Error(`Crew execution failed: ${status.status}`);
    }

    // Exponential backoff with jitter
    const jitter = Math.random() * 1000;
    await new Promise(resolve => setTimeout(resolve, delay + jitter));
    delay = Math.min(delay * 1.5, maxDelay);
  }

  throw new Error(`Crew execution timeout after ${maxAttempts} attempts`);
}
