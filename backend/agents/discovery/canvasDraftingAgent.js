import { runAgent } from '../../server/utils/agentRunner.js';

/**
 * Canvas drafting agent: creates initial business model canvas drafts.
 * @param {object} input - Input data from previous discovery steps.
 */
export async function canvasDraftingAgent(input) {
  return runAgent('canvasDraftingAgent', input, {
    // TODO: register tools specific to canvasDraftingAgent
  });
}
