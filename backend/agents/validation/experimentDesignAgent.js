import { runAgent } from '../../server/utils/agentRunner.js';

/**
 * Experiment design agent: designs experiments for validation.
 * @param {object} input - Input data including validation plan.
 */
export async function experimentDesignAgent(input) {
  return runAgent('experimentDesignAgent', input, {
    // TODO: register tools specific to experimentDesignAgent
  });
}
