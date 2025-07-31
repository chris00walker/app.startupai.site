import { runAgent } from '../../server/utils/agentRunner.js';

/**
 * Research agent: gathers external market and domain research.
 * @param {object} input - Input data (e.g., client details, previous artefacts).
 */
export async function researchAgent(input) {
  return runAgent('researchAgent', input, {
    // TODO: register tools specific to researchAgent
  });
}
