import { runAgent } from '../../server/utils/agentRunner.js';

/**
 * Validation agent: finalizes validation and determines success criteria.
 * @param {object} input - Input data including synthesized findings.
 */
export async function validationAgent(input) {
  return runAgent('validationAgent', input, {
    // TODO: register tools specific to validationAgent
  });
}
