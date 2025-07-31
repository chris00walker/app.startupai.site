// Integration tests for agent workflows

import { vi } from 'vitest';
import { DatabaseTestHelper, mockOpenAI, mockMilvus, generateTestClient } from '../utils/testHelpers.js';

// Mock OpenAI module
vi.mock('openai', () => {
  const OpenAI = vi.fn().mockImplementation(() => mockOpenAI);
  return { default: OpenAI, OpenAI };
});

// Import the components we're testing
let runAgent, storeEmbedding, ArtefactModel, TaskModel;

describe('Agent Workflow Integration Tests', () => {
  let dbHelper;

  beforeAll(async () => {
    dbHelper = new DatabaseTestHelper();
    await dbHelper.connect();
    
    // Import modules after database connection
    const agentRunnerModule = await import('../../server/utils/agentRunner.js');
    const vectorStoreModule = await import('../../server/utils/vectorStore.js');
    const artefactModule = await import('../../models/artefactModel.js');
    const taskModule = await import('../../models/taskModel.js');
    
    runAgent = agentRunnerModule.runAgent;
    storeEmbedding = vectorStoreModule.storeEmbedding;
    ArtefactModel = artefactModule.default;
    TaskModel = taskModule.default;
    
    // Initialize all models to ensure indexes are created
    await ArtefactModel.init();
    await TaskModel.init();
  });

  afterAll(async () => {
    await dbHelper.disconnect();
  });

  beforeEach(async () => {
    await dbHelper.clearDatabase();
    vi.clearAllMocks();
    
    // Reinitialize models after database clear to ensure indexes
    await ArtefactModel.init();
    await TaskModel.init();
    
    // Set up default mock responses
    mockOpenAI.chat.completions.create.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            success: true,
            result: 'Integration test agent response',
            analysis: 'Detailed analysis from integration test',
            recommendations: ['rec1', 'rec2']
          })
        }
      }]
    });
  });

  describe('Client Intake Workflow', () => {
    it('should complete full client intake workflow', async () => {
      const clientData = generateTestClient({
        name: 'Integration Test Client',
        email: 'integration@test.com',
        projectDescription: 'Full integration test project'
      });

      // Step 1: Run intake agent with proper clientId
      const intakeResult = await runAgent('intakeAgent', { ...clientData, clientId: clientData.id });
      
      expect(intakeResult.success).toBe(true);
      expect(intakeResult.result).toBeDefined();

      // Step 2: Verify artefact was created
      const artefacts = await ArtefactModel.find({ 
        clientId: clientData.id 
      });
      expect(artefacts.length).toBeGreaterThan(0);
    });

    it('should handle intake workflow with task creation', async () => {
      const clientData = generateTestClient();

      // Run intake agent with proper clientId
      await runAgent('intakeAgent', { ...clientData, clientId: clientData.id });

      // Create follow-up task with correct schema
      const task = new TaskModel({
        id: 'intake-followup-task',
        title: 'Follow up on intake',
        status: 'todo',
        assignedTo: 'validationAgent',
        clientId: clientData.id,
        description: 'Validate intake requirements'
      });
      await task.save();

      // Verify task was created correctly
      const foundTask = await TaskModel.findOne({ id: 'intake-followup-task' });
      expect(foundTask.clientId).toBe(clientData.id);
      expect(foundTask.assignedTo).toBe('validationAgent');
    });
  });
});
