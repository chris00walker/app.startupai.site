import { runAgent } from '../server/utils/agentRunner.js';

/**
 * Observability agent: monitors and reports system health and metrics.
 * @param {object} input - Input data including system metrics.
 */
export async function observabilityAgent(input) {
  return runAgent('observabilityAgent', input, {
    // TODO: register tools specific to observabilityAgent
  });
}
