// Unit tests for agentRunner utility

import { vi } from 'vitest';
import { mockOpenAI, mockMilvus, DatabaseTestHelper } from '../../../utils/testHelpers.js';

// Mock Artefact model first (needs to be hoisted)
const mockArtefactSave = vi.fn().mockResolvedValue({});
const mockArtefactConstructor = vi.fn().mockImplementation(() => ({
  save: mockArtefactSave
}));

vi.mock('../../../../server/models/artefactModel.js', () => ({
  default: mockArtefactConstructor
}));

// Mock all other dependencies
const mockTraceOperation = vi.fn((name, fn) => fn({}));
const mockVectorStore = {
  storeEmbedding: vi.fn(),
  searchSimilar: vi.fn()
};
const mockComplianceAgent = {
  scanContent: vi.fn()
};

vi.mock('../../../../server/utils/observability.js', () => ({
  traceOperation: mockTraceOperation
}));

vi.mock('../../../../server/utils/vectorStore.js', () => mockVectorStore);

vi.mock('../../../../agents/crossCutting/complianceAgent.js', () => ({
  default: class MockComplianceAgent {
    scanContent = mockComplianceAgent.scanContent;
  }
}));

vi.mock('openai', () => ({
  default: class MockOpenAI {
    chat = mockOpenAI.chat;
  }
}));

// Import the function we're testing
const { runAgent } = await import('../../../../server/utils/agentRunner.js');

describe('AgentRunner Unit Tests', () => {
  let dbHelper;

  beforeAll(async () => {
    dbHelper = new DatabaseTestHelper();
    await dbHelper.connect();
  });

  afterAll(async () => {
    await dbHelper.disconnect();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up default mock responses
    mockOpenAI.chat.completions.create.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            success: true,
            result: 'Mock agent response',
            analysis: 'Mock analysis content'
          })
        }
      }]
    });

    mockComplianceAgent.scanContent.mockResolvedValue({
      isCompliant: true,
      redactedContent: 'Clean content'
    });

    mockVectorStore.storeEmbedding.mockResolvedValue({ success: true });
    mockArtefactSave.mockResolvedValue({ _id: 'saved-artefact-id' });
  });

  describe('Basic Functionality', () => {
    it('should execute agent with valid input', async () => {
      const agentName = 'testAgent';
      const input = { test: 'data', clientId: 'test-client-123' };
      const toolsConfig = {};

      const result = await runAgent(agentName, input, toolsConfig);

      expect(mockTraceOperation).toHaveBeenCalledWith(agentName, expect.any(Function));
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        result: 'Mock agent response',
        analysis: 'Mock analysis content'
      });
    });

    it('should handle OpenAI API call with correct parameters', async () => {
      const agentName = 'validationAgent';
      const input = { clientData: 'test data', clientId: 'test-client-123' };

      await runAgent(agentName, input);

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4',
        messages: [{
          role: 'user',
          content: expect.stringContaining('You are validationAgent')
        }],
        temperature: 0.7
      });
    });

    it('should process compliance scanning', async () => {
      const agentName = 'testAgent';
      const input = { sensitiveData: 'test content', clientId: 'test-client-123' };

      await runAgent(agentName, input);

      expect(mockComplianceAgent.scanContent).toHaveBeenCalledWith(
        expect.stringContaining('Mock agent response')
      );
    });

    it('should store artefact in database', async () => {
      const agentName = 'researchAgent';
      const input = { research: 'query', clientId: 'test-client-123' };

      await runAgent(agentName, input);

      expect(mockArtefactConstructor).toHaveBeenCalledWith({
        id: expect.any(String),
        name: `${agentName}_result`,
        type: 'Analysis',
        status: 'completed',
        agentId: agentName,
        clientId: input.clientId,
        content: 'Clean content',
        metadata: expect.any(Object),
        createdAt: expect.any(Date)
      });
      expect(mockArtefactSave).toHaveBeenCalled();
    });

    it('should store embedding in vector store', async () => {
      const agentName = 'analysisAgent';
      const input = { data: 'analysis input', clientId: 'test-client-123' };

      await runAgent(agentName, input);

      expect(mockVectorStore.storeEmbedding).toHaveBeenCalledWith(
        expect.any(String),
        'Clean content',
        expect.any(Object)
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle OpenAI API errors', async () => {
      const agentName = 'testAgent';
      const input = { test: 'data', clientId: 'test-client-123' };
      const apiError = new Error('OpenAI API failed');

      mockOpenAI.chat.completions.create.mockRejectedValue(apiError);

      await expect(runAgent(agentName, input)).rejects.toThrow('OpenAI API failed');
    });

    it('should handle compliance scanning errors', async () => {
      const agentName = 'testAgent';
      const input = { test: 'data', clientId: 'test-client-123' };
      const complianceError = new Error('Compliance scan failed');

      mockComplianceAgent.scanContent.mockRejectedValue(complianceError);

      await expect(runAgent(agentName, input)).rejects.toThrow('Compliance scan failed');
    });

    it('should handle database save errors', async () => {
      const agentName = 'testAgent';
      const input = { test: 'data', clientId: 'test-client-123' };
      const dbError = new Error('Database save failed');

      mockArtefactSave.mockRejectedValue(dbError);

      await expect(runAgent(agentName, input)).rejects.toThrow('Database save failed');
    });

    it('should handle vector store errors gracefully', async () => {
      const agentName = 'testAgent';
      const input = { test: 'data', clientId: 'test-client-123' };
      const vectorError = new Error('Vector store failed');

      mockVectorStore.storeEmbedding.mockRejectedValue(vectorError);

      // Should still complete successfully even if vector store fails
      const result = await runAgent(agentName, input);
      expect(result.success).toBe(true);
    });

    it('should handle invalid JSON response from OpenAI', async () => {
      const agentName = 'testAgent';
      const input = { test: 'data', clientId: 'test-client-123' };

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: 'Invalid JSON response'
          }
        }]
      });

      await expect(runAgent(agentName, input)).rejects.toThrow();
    });
  });

  describe('Input Validation', () => {
    it('should handle empty input', async () => {
      const agentName = 'testAgent';
      const input = { clientId: 'test-client-123' };

      const result = await runAgent(agentName, input);

      expect(result).toBeDefined();
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
    });

    it('should handle null input', async () => {
      const agentName = 'testAgent';
      const input = { clientId: 'test-client-123' };

      const result = await runAgent(agentName, input);

      expect(result).toBeDefined();
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
    });

    it('should handle complex nested input', async () => {
      const agentName = 'testAgent';
      const input = {
        clientId: 'test-client-123',
        client: {
          name: 'Test Client',
          details: {
            project: 'Complex project',
            requirements: ['req1', 'req2']
          }
        }
      };

      const result = await runAgent(agentName, input);

      expect(result).toBeDefined();
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [{
            role: 'user',
            content: expect.stringContaining(JSON.stringify(input, null, 2))
          }]
        })
      );
    });
  });

  describe('Tools Configuration', () => {
    it('should handle empty tools configuration', async () => {
      const agentName = 'testAgent';
      const input = { test: 'data', clientId: 'test-client-123' };
      const toolsConfig = {};

      const result = await runAgent(agentName, input, toolsConfig);

      expect(result).toBeDefined();
    });

    it('should handle tools configuration with custom settings', async () => {
      const agentName = 'testAgent';
      const input = { test: 'data', clientId: 'test-client-123' };
      const toolsConfig = {
        temperature: 0.5,
        maxTokens: 1000,
        customTools: ['tool1', 'tool2']
      };

      const result = await runAgent(agentName, input, toolsConfig);

      expect(result).toBeDefined();
    });
  });

  describe('Response Processing', () => {
    it('should parse valid JSON response correctly', async () => {
      const agentName = 'testAgent';
      const input = { test: 'data', clientId: 'test-client-123' };
      const mockResponse = {
        success: true,
        analysis: 'Detailed analysis',
        recommendations: ['rec1', 'rec2']
      };

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify(mockResponse)
          }
        }]
      });

      const result = await runAgent(agentName, input);

      expect(result).toEqual(mockResponse);
    });

    it('should handle response with compliance redaction', async () => {
      const agentName = 'testAgent';
      const input = { test: 'data', clientId: 'test-client-123' };

      mockComplianceAgent.scanContent.mockResolvedValue({
        isCompliant: false,
        redactedContent: 'Redacted sensitive content'
      });

      await runAgent(agentName, input);

      expect(mockArtefactConstructor).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Redacted sensitive content'
        })
      );
    });
  });
});
