// Unit tests for intakeAgent

import { mockOpenAI, mockWorkflowData } from '../../../utils/testHelpers.js';

// Mock the agentRunner dependency
const mockRunAgent = vi.fn();
vi.mock('../../../../server/utils/agentRunner.js', () => ({
  runAgent: mockRunAgent
}));

// Import the agent we're testing
const { intakeAgent } = await import('../../../../agents/discovery/intakeAgent.js');

describe('IntakeAgent Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should call runAgent with correct parameters', async () => {
      const mockInput = {
        name: 'Test Client',
        email: 'test@example.com',
        projectDescription: 'Test project for intake processing'
      };

      const mockResponse = {
        success: true,
        result: 'Intake processed successfully',
        extractedRequirements: ['requirement 1', 'requirement 2']
      };

      mockRunAgent.mockResolvedValue(mockResponse);

      const result = await intakeAgent(mockInput);

      expect(mockRunAgent).toHaveBeenCalledWith(
        'intakeAgent',
        mockInput,
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle empty input gracefully', async () => {
      const mockInput = {};
      const mockResponse = {
        success: false,
        error: 'No input provided'
      };

      mockRunAgent.mockResolvedValue(mockResponse);

      const result = await intakeAgent(mockInput);

      expect(mockRunAgent).toHaveBeenCalledWith(
        'intakeAgent',
        mockInput,
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });

    it('should pass through agent runner errors', async () => {
      const mockInput = mockWorkflowData.input;
      const mockError = new Error('Agent runner failed');

      mockRunAgent.mockRejectedValue(mockError);

      await expect(intakeAgent(mockInput)).rejects.toThrow('Agent runner failed');
    });
  });

  describe('Input Validation', () => {
    it('should handle various input types', async () => {
      const testInputs = [
        { name: 'Client A', email: 'a@test.com' },
        { projectDescription: 'Just description' },
        { name: 'Client B', projectDescription: 'Complex project', additionalInfo: 'Extra data' }
      ];

      mockRunAgent.mockResolvedValue({ success: true });

      for (const input of testInputs) {
        await intakeAgent(input);
        expect(mockRunAgent).toHaveBeenCalledWith(
          'intakeAgent',
          input,
          expect.any(Object)
        );
      }
    });

    it('should handle null and undefined inputs', async () => {
      mockRunAgent.mockResolvedValue({ success: false });

      await intakeAgent(null);
      expect(mockRunAgent).toHaveBeenCalledWith('intakeAgent', null, expect.any(Object));

      await intakeAgent(undefined);
      expect(mockRunAgent).toHaveBeenCalledWith('intakeAgent', undefined, expect.any(Object));
    });
  });

  describe('Agent Configuration', () => {
    it('should pass correct agent name to runAgent', async () => {
      const mockInput = { test: 'data' };
      mockRunAgent.mockResolvedValue({ success: true });

      await intakeAgent(mockInput);

      const [agentName] = mockRunAgent.mock.calls[0];
      expect(agentName).toBe('intakeAgent');
    });

    it('should pass tools configuration to runAgent', async () => {
      const mockInput = { test: 'data' };
      mockRunAgent.mockResolvedValue({ success: true });

      await intakeAgent(mockInput);

      const [, , toolsConfig] = mockRunAgent.mock.calls[0];
      expect(toolsConfig).toEqual(expect.any(Object));
    });
  });

  describe('Response Handling', () => {
    it('should return successful response structure', async () => {
      const mockInput = mockWorkflowData.input;
      const mockResponse = {
        success: true,
        result: 'Intake completed',
        data: {
          clientInfo: mockInput,
          extractedRequirements: ['req1', 'req2'],
          nextSteps: ['validation', 'research']
        }
      };

      mockRunAgent.mockResolvedValue(mockResponse);

      const result = await intakeAgent(mockInput);

      expect(result.success).toBe(true);
      expect(result.result).toBe('Intake completed');
      expect(result.data).toBeDefined();
      expect(result.data.extractedRequirements).toEqual(['req1', 'req2']);
    });

    it('should return error response structure', async () => {
      const mockInput = {};
      const mockResponse = {
        success: false,
        error: 'Invalid input data',
        details: 'Missing required fields'
      };

      mockRunAgent.mockResolvedValue(mockResponse);

      const result = await intakeAgent(mockInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid input data');
      expect(result.details).toBe('Missing required fields');
    });
  });
});
