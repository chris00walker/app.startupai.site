import { runAgent } from '../server/utils/agentRunner.js';

/**
 * Knowledge management agent: curates and organizes project knowledge.
 * @param {object} input - Input data including artefacts and logs.
 */
export async function knowledgeManagementAgent(input) {
  return runAgent('knowledgeManagementAgent', input, {
    // TODO: register tools specific to knowledgeManagementAgent
  });
}
