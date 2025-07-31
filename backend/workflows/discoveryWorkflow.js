import Artefact from '../server/models/artefactModel.js';
import {
  intakeAgent,
  researchAgent,
  canvasDraftingAgent,
  validationPlanAgent,
} from '../agents/discovery/index.js';
// Optional event emitter for human escalation
// import { emitEscalation } from '../events.js';

/**
 * Discovery workflow: sequentially runs discovery agents, pulling latest artefacts.
 */
export async function runDiscoveryWorkflow(clientId) {
  try {
    // Intake step: use previous intake artefact or start fresh
    const lastIntake = await Artefact.findOne({ clientId, name: 'intakeAgent' }).sort({ createdAt: -1 });
    const intakeInput = lastIntake ? lastIntake.data : { clientId };
    const intakeResult = await intakeAgent(intakeInput);

    // Research step
    const researchResult = await researchAgent(intakeResult);

    // Canvas drafting step
    const canvasResult = await canvasDraftingAgent(researchResult);

    // Validation plan step
    const planResult = await validationPlanAgent(canvasResult);

    return planResult;
  } catch (err) {
    console.error('Discovery workflow failed', err);
    // emitEscalation({ clientId, workflow: 'discovery', error: err });
    throw err;
  }
}
