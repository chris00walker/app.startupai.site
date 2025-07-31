import { runAgent } from '../../server/utils/agentRunner.js';

/**
 * Eventstorm facilitator agent: runs event storming sessions.
 * @param {object} input - Input data including domain models and experiments.
 */
export async function eventstormFacilitatorAgent(input) {
  return runAgent('eventstormFacilitatorAgent', input, {
    // TODO: register tools specific to eventstormFacilitatorAgent
  });
}
