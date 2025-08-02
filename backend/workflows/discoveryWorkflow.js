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

    // Research step - preserve clientId
    const researchInput = { ...intakeResult, clientId };
    const researchResult = await researchAgent(researchInput);

    // Canvas drafting step - preserve clientId
    const canvasInput = { ...researchResult, clientId };
    const canvasResult = await canvasDraftingAgent(canvasInput);

    // Validation plan step - preserve clientId
    const planInput = { ...canvasResult, clientId };
    const planResult = await validationPlanAgent(planInput);

    return planResult;
  } catch (err) {
    console.error('Discovery workflow failed', err);
    // emitEscalation({ clientId, workflow: 'discovery', error: err });
    throw err;
  }
}
