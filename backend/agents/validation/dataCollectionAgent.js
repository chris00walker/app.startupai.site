import { runAgent } from '../../server/utils/agentRunner.js';

/**
 * Data collection agent: manages experimental data gathering.
 * @param {object} input - Input data including experiment design.
 */
export async function dataCollectionAgent(input) {
  return runAgent('dataCollectionAgent', input, {
    // TODO: register tools specific to dataCollectionAgent
  });
}
