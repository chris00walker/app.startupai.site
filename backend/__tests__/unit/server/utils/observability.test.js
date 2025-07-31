// Unit tests for observability utility

import { vi } from 'vitest';

// Mock OpenTelemetry dependencies
const mockSpan = {
  setStatus: vi.fn(),
  recordException: vi.fn(),
  end: vi.fn(),
  setAttributes: vi.fn()
};

const mockTracer = {
  startSpan: vi.fn(() => mockSpan)
};

const mockTracerProvider = {
  getTracer: vi.fn(() => mockTracer)
};

vi.mock('@opentelemetry/api', () => {
  const api = {
    diag: {
      setLogger: vi.fn(),
      setLogLevel: vi.fn()
    },
    DiagConsoleLogger: vi.fn(),
    DiagLogLevel: { INFO: 'INFO' },
    SpanStatusCode: { OK: 'OK', ERROR: 'ERROR' },
    trace: { getTracer: vi.fn(() => mockTracer) }
  };
  return {
    default: api,
    ...api
  };
});

vi.mock('@opentelemetry/sdk-trace-node', () => ({
  NodeTracerProvider: vi.fn().mockImplementation(() => mockTracerProvider)
}));

vi.mock('@opentelemetry/auto-instrumentations-node', () => ({
  getNodeAutoInstrumentations: vi.fn(() => [])
}));

vi.mock('@opentelemetry/sdk-node', () => ({
  NodeSDK: vi.fn().mockImplementation(() => ({
    start: vi.fn()
  }))
}));

// Import the functions we're testing
const { traceOperation, incrementCounter, getCounters } = await import('../../../../server/utils/observability.js');

describe('Observability Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('traceOperation Function', () => {
    it('should execute operation with tracing', async () => {
      const operationName = 'testOperation';
      const mockOperation = vi.fn().mockResolvedValue('operation result');

      const result = await traceOperation(operationName, mockOperation);

      expect(mockTracerProvider.getTracer).toHaveBeenCalledWith('multi-agent-platform');
      expect(mockTracer.startSpan).toHaveBeenCalledWith(operationName);
      expect(mockOperation).toHaveBeenCalledWith(mockSpan);
      expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: 'OK' });
      expect(mockSpan.end).toHaveBeenCalled();
      expect(result).toBe('operation result');
    });

    it('should handle operation errors with tracing', async () => {
      const operationName = 'failingOperation';
      const operationError = new Error('Operation failed');
      const mockOperation = vi.fn().mockRejectedValue(operationError);

      await expect(traceOperation(operationName, mockOperation)).rejects.toThrow('Operation failed');

      expect(mockSpan.recordException).toHaveBeenCalledWith(operationError);
      expect(mockSpan.setStatus).toHaveBeenCalledWith({ 
        code: 'ERROR', 
        message: 'Operation failed' 
      });
      expect(mockSpan.end).toHaveBeenCalled();
    });

    it('should handle synchronous operations', async () => {
      const operationName = 'syncOperation';
      const mockOperation = vi.fn().mockReturnValue('sync result');

      const result = await traceOperation(operationName, mockOperation);

      expect(mockOperation).toHaveBeenCalledWith(mockSpan);
      expect(result).toBe('sync result');
      expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: 'OK' });
    });

    it('should handle operations that return undefined', async () => {
      const operationName = 'undefinedOperation';
      const mockOperation = vi.fn().mockReturnValue(undefined);

      const result = await traceOperation(operationName, mockOperation);

      expect(result).toBeUndefined();
      expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: 'OK' });
    });

    it('should set span attributes for complex operations', async () => {
      const operationName = 'complexOperation';
      const mockOperation = vi.fn().mockImplementation((span) => {
        span.setAttributes({ 
          'operation.type': 'agent-execution',
          'operation.input.size': 1024 
        });
        return 'complex result';
      });

      await traceOperation(operationName, mockOperation);

      expect(mockSpan.setAttributes).toHaveBeenCalledWith({
        'operation.type': 'agent-execution',
        'operation.input.size': 1024
      });
    });
  });

  describe('Counter Functions', () => {
    it('should increment counter', () => {
      const counterName = 'test_counter';
      
      incrementCounter(counterName);
      incrementCounter(counterName);
      incrementCounter(counterName);

      const counters = getCounters();
      expect(counters[counterName]).toBe(3);
    });

    it('should increment counter with custom value', () => {
      const counterName = 'custom_counter';
      
      incrementCounter(counterName, 5);
      incrementCounter(counterName, 3);

      const counters = getCounters();
      expect(counters[counterName]).toBe(8);
    });

    it('should handle multiple counters', () => {
      const counter1 = 'counter_one';
      const counter2 = 'counter_two';
      
      incrementCounter(counter1, 10);
      incrementCounter(counter2, 20);
      incrementCounter(counter1, 5);

      const counters = getCounters();
      expect(counters[counter1]).toBe(15);
      expect(counters[counter2]).toBe(20);
    });

    it('should initialize new counters to zero', () => {
      const newCounter = 'new_counter_' + Date.now();
      
      incrementCounter(newCounter);

      const counters = getCounters();
      expect(counters[newCounter]).toBe(1);
    });

    it('should return copy of counters object', () => {
      const counterName = 'immutable_test';
      incrementCounter(counterName, 42);

      const counters1 = getCounters();
      const counters2 = getCounters();

      expect(counters1).toEqual(counters2);
      expect(counters1).not.toBe(counters2); // Different objects
      
      // Modifying returned object shouldn't affect internal state
      counters1[counterName] = 999;
      expect(getCounters()[counterName]).toBe(42);
    });
  });

  describe('Error Handling', () => {
    it('should handle span creation errors gracefully', async () => {
      const operationName = 'spanErrorOperation';
      const spanError = new Error('Span creation failed');
      mockTracer.startSpan.mockImplementationOnce(() => {
        throw spanError;
      });

      const mockOperation = vi.fn().mockReturnValue('operation result');

      // Should still execute operation even if tracing fails
      const result = await traceOperation(operationName, mockOperation);
      
      expect(result).toBe('operation result');
      expect(mockOperation).toHaveBeenCalled();
    });

    it('should handle tracer provider errors', async () => {
      const operationName = 'tracerErrorOperation';
      const tracerError = new Error('Tracer provider failed');
      mockTracerProvider.getTracer.mockImplementationOnce(() => {
        throw tracerError;
      });

      const mockOperation = vi.fn().mockReturnValue('operation result');

      const result = await traceOperation(operationName, mockOperation);
      
      expect(result).toBe('operation result');
      expect(mockOperation).toHaveBeenCalled();
    });
  });

  describe('Performance Monitoring', () => {
    it('should track operation timing', async () => {
      const operationName = 'timedOperation';
      const mockOperation = vi.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'timed result';
      });

      const startTime = Date.now();
      await traceOperation(operationName, mockOperation);
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(10);
      expect(mockSpan.end).toHaveBeenCalled();
    });

    it('should handle concurrent operations', async () => {
      const operations = Array.from({ length: 5 }, (_, i) => 
        traceOperation(`operation_${i}`, async () => `result_${i}`)
      );

      const results = await Promise.all(operations);

      expect(results).toEqual(['result_0', 'result_1', 'result_2', 'result_3', 'result_4']);
      expect(mockTracer.startSpan).toHaveBeenCalledTimes(5);
      expect(mockSpan.end).toHaveBeenCalledTimes(5);
    });
  });

  describe('Integration with Agent Operations', () => {
    it('should trace agent execution workflow', async () => {
      const agentName = 'testAgent';
      const mockAgentOperation = vi.fn().mockImplementation(async (span) => {
        span.setAttributes({
          'agent.name': agentName,
          'agent.input.type': 'client_data',
          'agent.status': 'processing'
        });
        
        incrementCounter('agent_executions');
        incrementCounter(`agent_${agentName}_executions`);
        
        return {
          success: true,
          result: 'Agent processing complete'
        };
      });

      const result = await traceOperation(`agent_${agentName}`, mockAgentOperation);

      expect(result.success).toBe(true);
      expect(mockSpan.setAttributes).toHaveBeenCalledWith({
        'agent.name': agentName,
        'agent.input.type': 'client_data',
        'agent.status': 'processing'
      });

      const counters = getCounters();
      expect(counters['agent_executions']).toBe(1);
      expect(counters[`agent_${agentName}_executions`]).toBe(1);
    });
  });
});
