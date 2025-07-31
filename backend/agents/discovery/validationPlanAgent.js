import { runAgent } from '../../server/utils/agentRunner.js';

/**
 * Validation plan agent: outlines a plan to validate the business model.
 * @param {object} input - Input data from research and canvas drafting.
 */
export async function validationPlanAgent(input) {
  return runAgent('validationPlanAgent', input, {
    // TODO: register tools specific to validationPlanAgent
  });
}
