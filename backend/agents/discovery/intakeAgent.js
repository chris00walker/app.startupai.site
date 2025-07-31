import { runAgent } from '../../server/utils/agentRunner.js';

/**
 * Intake agent: collects initial requirements for discovery.
 * @param {object} input - Input data (e.g., client intake form).
 */
export async function intakeAgent(input) {
  return runAgent('intakeAgent', input, {
    // TODO: register tools specific to intakeAgent
  });
}
