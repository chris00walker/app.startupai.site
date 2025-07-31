import Artefact from '../server/models/artefactModel.js';
import {
  mvpSpecAgent,
  devCoordinationAgent,
  iterationManagementAgent,
} from '../agents/scale/index.js';
// import { emitEscalation } from '../events.js';

/**
 * Scale workflow: sequentially runs scale agents, pulling latest artefacts.
 */
export async function runScaleWorkflow(clientId) {
  try {
    // Use latest validation artefact as input
    const lastValidation = await Artefact.findOne({ clientId, name: 'validationAgent' })
      .sort({ createdAt: -1 });
    const validationInput = lastValidation?.data;

    const mvpResult = await mvpSpecAgent(validationInput);
    const devResult = await devCoordinationAgent(mvpResult);
    const iterResult = await iterationManagementAgent(devResult);

    return iterResult;
  } catch (err) {
    console.error('Scale workflow failed', err);
    // emitEscalation({ clientId, workflow: 'scale', error: err });
    throw err;
  }
}
