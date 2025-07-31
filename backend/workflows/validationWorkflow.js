import Artefact from '../server/models/artefactModel.js';
import {
  experimentDesignAgent,
  dataCollectionAgent,
  eventstormFacilitatorAgent,
  synthesisAgent,
  validationAgent,
} from '../agents/validation/index.js';
// import { emitEscalation } from '../events.js';

/**
 * Validation workflow: sequentially runs validation agents, pulling latest artefacts.
 */
export async function runValidationWorkflow(clientId) {
  try {
    // Use latest validation plan artefact as input
    const lastPlan = await Artefact.findOne({ clientId, name: 'validationPlanAgent' })
      .sort({ createdAt: -1 });
    const planInput = lastPlan?.data;

    const designResult = await experimentDesignAgent(planInput);
    const dataResult = await dataCollectionAgent(designResult);
    const eventResult = await eventstormFacilitatorAgent(dataResult);
    const synthResult = await synthesisAgent(eventResult);
    const validationResult = await validationAgent(synthResult);

    return validationResult;
  } catch (err) {
    console.error('Validation workflow failed', err);
    // emitEscalation({ clientId, workflow: 'validation', error: err });
    throw err;
  }
}
