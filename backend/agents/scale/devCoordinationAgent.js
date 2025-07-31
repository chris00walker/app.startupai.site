import { runAgent } from '../../server/utils/agentRunner.js';

/**
 * Development coordination agent: manages developer tasks and planning.
 * @param {object} input - Input data including MVP specs.
 */
export async function devCoordinationAgent(input) {
  return runAgent('devCoordinationAgent', input, {
    // TODO: register tools specific to devCoordinationAgent
  });
}
