import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'vitest';
import { runAgent } from '../../server/utils/agentRunner.js';
import { 
  buildStrategyzerPrompt,
  isCanvasGenerationCapable,
  getFrameworkType
} from '../../server/utils/agentRunner.js';
import Client from '../../server/models/clientModel.js';
import Artefact from '../../server/models/artefactModel.js';

// World object to share state between steps
class StrategyzerWorld {
  constructor() {
    this.client = null;
    this.agentResults = {};
    this.currentWorkflow = null;
    this.errors = [];
  }
}

// Background steps
Given('the AI consulting platform is running', async function() {
  this.world = new StrategyzerWorld();
  // Verify platform components are available
  expect(runAgent).toBeDefined();
  expect(buildStrategyzerPrompt).toBeDefined();
});

Given('the Strategyzer-powered agents are available', async function() {
  // Verify Strategyzer agent capabilities
  const frameworks = ['intakeAgent', 'researchAgent', 'canvasDraftingAgent', 'validationPlanAgent'];
  
  for (const agent of frameworks) {
    const frameworkType = getFrameworkType(agent);
    expect(frameworkType).toBeDefined();
    expect(frameworkType).not.toBe('generic_strategyzer');
  }
});

Given('I have a test client in the system', async function() {
  this.world.client = await Client.create({
    name: 'BDD Test Client',
    email: 'bdd@test.com',
    company: 'BDD Test Company',
    industry: 'Technology',
    description: 'A test client for BDD scenarios',
    currentChallenges: ['Market validation', 'Product-market fit'],
    goals: ['Validate business model', 'Achieve product-market fit']
  });
  
  expect(this.world.client).toBeDefined();
  expect(this.world.client._id).toBeDefined();
});

// Customer Discovery steps
Given('I have client information for discovery', async function() {
  this.world.discoveryInput = {
    clientId: this.world.client._id.toString(),
    industry: this.world.client.industry,
    description: this.world.client.description,
    challenges: this.world.client.currentChallenges,
    goals: this.world.client.goals
  };
});

When('I run the customer discovery workflow', async function() {
  try {
    this.world.agentResults.discovery = await runAgent('intakeAgent', this.world.discoveryInput);
  } catch (error) {
    this.world.errors.push(error);
    throw error;
  }
});

Then('the agent should identify functional jobs-to-be-done', async function() {
  const result = this.world.agentResults.discovery;
  expect(result.customerJobs).toBeDefined();
  expect(result.customerJobs.functional).toBeInstanceOf(Array);
  expect(result.customerJobs.functional.length).toBeGreaterThan(0);
});

Then('the agent should identify emotional jobs-to-be-done', async function() {
  const result = this.world.agentResults.discovery;
  expect(result.customerJobs.emotional).toBeInstanceOf(Array);
  expect(result.customerJobs.emotional.length).toBeGreaterThan(0);
});

Then('the agent should identify social jobs-to-be-done', async function() {
  const result = this.world.agentResults.discovery;
  expect(result.customerJobs.social).toBeInstanceOf(Array);
  expect(result.customerJobs.social.length).toBeGreaterThan(0);
});

Then('the agent should list customer pain points', async function() {
  const result = this.world.agentResults.discovery;
  expect(result.customerPains).toBeInstanceOf(Array);
  expect(result.customerPains.length).toBeGreaterThan(0);
});

Then('the agent should list customer desired gains', async function() {
  const result = this.world.agentResults.discovery;
  expect(result.customerGains).toBeInstanceOf(Array);
  expect(result.customerGains.length).toBeGreaterThan(0);
});

Then('the response should be in valid JSON format', async function() {
  const result = this.world.agentResults.discovery;
  expect(result).toBeTypeOf('object');
  expect(result.status).toBeDefined();
  expect(result.analysis).toBeDefined();
});

Then('the response should include canvas-ready data structures', async function() {
  const result = this.world.agentResults.discovery;
  expect(isCanvasGenerationCapable(result)).toBe(true);
  expect(result.canvasData).toBeDefined();
  expect(result.canvasData.customerProfile).toBeDefined();
});

// Value Proposition Canvas steps
Given('I have completed customer discovery', async function() {
  if (!this.world.agentResults.discovery) {
    this.world.agentResults.discovery = await runAgent('intakeAgent', {
      clientId: this.world.client._id.toString(),
      industry: 'Technology'
    });
  }
});

When('I generate a Value Proposition Canvas', async function() {
  const input = {
    clientId: this.world.client._id.toString(),
    ...this.world.agentResults.discovery
  };
  
  this.world.agentResults.canvas = await runAgent('canvasDraftingAgent', input);
});

Then('the canvas should use customer jobs from discovery', async function() {
  const canvas = this.world.agentResults.canvas;
  const discovery = this.world.agentResults.discovery;
  
  expect(canvas.valuePropositionCanvas).toBeDefined();
  expect(canvas.valuePropositionCanvas.customerProfile.jobs).toEqual(
    expect.arrayContaining(discovery.customerJobs.functional)
  );
});

Then('the canvas should use customer pains from discovery', async function() {
  const canvas = this.world.agentResults.canvas;
  const discovery = this.world.agentResults.discovery;
  
  expect(canvas.valuePropositionCanvas.customerProfile.pains).toEqual(
    expect.arrayContaining(discovery.customerPains)
  );
});

Then('the canvas should use customer gains from discovery', async function() {
  const canvas = this.world.agentResults.canvas;
  const discovery = this.world.agentResults.discovery;
  
  expect(canvas.valuePropositionCanvas.customerProfile.gains).toEqual(
    expect.arrayContaining(discovery.customerGains)
  );
});

Then('the canvas should suggest relevant pain relievers', async function() {
  const canvas = this.world.agentResults.canvas;
  
  expect(canvas.valuePropositionCanvas.valueMap.painRelievers).toBeInstanceOf(Array);
  expect(canvas.valuePropositionCanvas.valueMap.painRelievers.length).toBeGreaterThan(0);
});

Then('the canvas should suggest relevant gain creators', async function() {
  const canvas = this.world.agentResults.canvas;
  
  expect(canvas.valuePropositionCanvas.valueMap.gainCreators).toBeInstanceOf(Array);
  expect(canvas.valuePropositionCanvas.valueMap.gainCreators.length).toBeGreaterThan(0);
});

// Multi-agent orchestration steps
Given('I start a discovery workflow', async function() {
  this.world.currentWorkflow = 'discovery';
  this.world.workflowInput = {
    clientId: this.world.client._id.toString(),
    industry: this.world.client.industry,
    description: this.world.client.description
  };
});

When('the intake agent processes client information', async function() {
  this.world.agentResults.intake = await runAgent('intakeAgent', this.world.workflowInput);
});

When('the research agent analyzes market context', async function() {
  const enrichedInput = {
    ...this.world.workflowInput,
    ...this.world.agentResults.intake
  };
  this.world.agentResults.research = await runAgent('researchAgent', enrichedInput);
});

When('the canvas drafting agent creates initial frameworks', async function() {
  const enrichedInput = {
    ...this.world.workflowInput,
    ...this.world.agentResults.intake,
    ...this.world.agentResults.research
  };
  this.world.agentResults.canvas = await runAgent('canvasDraftingAgent', enrichedInput);
});

When('the validation plan agent designs experiments', async function() {
  const enrichedInput = {
    ...this.world.workflowInput,
    ...this.world.agentResults.intake,
    ...this.world.agentResults.research,
    ...this.world.agentResults.canvas
  };
  this.world.agentResults.validation = await runAgent('validationPlanAgent', enrichedInput);
});

Then('each agent should build upon previous agent outputs', async function() {
  // Verify progressive enrichment
  expect(Object.keys(this.world.agentResults.intake)).toContain('customerJobs');
  expect(Object.keys(this.world.agentResults.research)).toContain('marketAnalysis');
  expect(Object.keys(this.world.agentResults.canvas)).toContain('valuePropositionCanvas');
  expect(Object.keys(this.world.agentResults.validation)).toContain('validationPlan');
});

Then('the final output should be a comprehensive customer profile', async function() {
  const finalResult = this.world.agentResults.validation;
  
  expect(finalResult).toBeDefined();
  expect(finalResult.status).toBe('completed');
  expect(finalResult.analysis).toBeDefined();
});

Then('all artifacts should be stored with proper metadata', async function() {
  const clientId = this.world.client._id;
  const artefacts = await Artefact.find({ clientId });
  
  expect(artefacts.length).toBeGreaterThan(0);
  
  for (const artefact of artefacts) {
    expect(artefact.clientId).toEqual(clientId);
    expect(artefact.name).toBeDefined();
    expect(artefact.data).toBeDefined();
    expect(artefact.createdAt).toBeDefined();
  }
});

Then('the workflow should maintain client context throughout', async function() {
  const clientId = this.world.client._id.toString();
  
  // Verify all agent results maintain client context
  for (const [agentName, result] of Object.entries(this.world.agentResults)) {
    expect(result).toBeDefined();
    // Client ID should be preserved in the workflow context
    expect(this.world.workflowInput.clientId).toBe(clientId);
  }
});

export { StrategyzerWorld };
