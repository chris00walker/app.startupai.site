import { runAgent } from '../../server/utils/agentRunner.js';

/**
 * Synthesis agent: synthesizes findings from experiments and discussions.
 * @param {object} input - Input data from experiments and event-storming.
 */
export async function synthesisAgent(input) {
  return runAgent('synthesisAgent', input, {
    // TODO: register tools specific to synthesisAgent
  });
}
