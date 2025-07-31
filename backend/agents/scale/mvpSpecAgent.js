import { runAgent } from '../../server/utils/agentRunner.js';

/**
 * MVP spec agent: defines minimum viable product specifications.
 * @param {object} input - Input data from validation results.
 */
export async function mvpSpecAgent(input) {
  return runAgent('mvpSpecAgent', input, {
    // TODO: register tools specific to mvpSpecAgent
  });
}
