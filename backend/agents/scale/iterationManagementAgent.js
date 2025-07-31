import { runAgent } from '../../server/utils/agentRunner.js';

/**
 * Iteration management agent: plans and tracks development iterations.
 * @param {object} input - Input data including ongoing tasks and metrics.
 */
export async function iterationManagementAgent(input) {
  return runAgent('iterationManagementAgent', input, {
    // TODO: register tools specific to iterationManagementAgent
  });
}
