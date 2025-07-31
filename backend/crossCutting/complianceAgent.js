import { runAgent } from '../server/utils/agentRunner.js';

/**
 * Compliance agent: ensures processes meet regulatory requirements.
 * @param {object} input - Input data including policies and artefacts.
 */
export async function complianceAgent(input) {
  return runAgent('complianceAgent', input, {
    // TODO: register tools specific to complianceAgent
  });
}
