// Unit tests for taskModel

import mongoose from 'mongoose';
import { DatabaseTestHelper, generateTestTask } from '../../utils/testHelpers.js';

// Import the model we're testing
let TaskModel;

describe('TaskModel Unit Tests', () => {
  let dbHelper;

  beforeAll(async () => {
    dbHelper = new DatabaseTestHelper();
    await dbHelper.connect();
    
    // Import the model after database connection
    const { default: importedModel } = await import('../../../models/taskModel.js');
    TaskModel = importedModel;
    await TaskModel.init();
  });

  afterAll(async () => {
    await dbHelper.disconnect();
  });

  beforeEach(async () => {
    await dbHelper.clearDatabase();
    // Ensure indexes are rebuilt after clearing database
    await TaskModel.init();
  });

  describe('Schema Validation', () => {
    it('should create a valid task with required fields', async () => {
      const taskData = generateTestTask({
        title: 'Market Validation',
        status: 'todo',
        assignedTo: 'ValidationAgent',
        clientId: 'client-123',
        description: 'Validate market assumptions',
        priority: 'high'
      });

      const task = new TaskModel(taskData);
      const savedTask = await task.save();

      expect(savedTask._id).toBeDefined();
      expect(savedTask.title).toBe('Market Validation');
      expect(savedTask.status).toBe('todo');
      expect(savedTask.assignedTo).toBe('ValidationAgent');
      expect(savedTask.clientId).toBe('client-123');
      expect(savedTask.description).toBe('Validate market assumptions');
      expect(savedTask.priority).toBe('high');
      expect(savedTask.createdAt).toBeDefined();
      expect(savedTask.updatedAt).toBeDefined();
    });

    it('should reject task without required fields', async () => {
      const task = new TaskModel({});
      
      await expect(task.save()).rejects.toThrow();
    });

    it('should reject task with invalid status', async () => {
      const taskData = generateTestTask({
        status: 'invalid-status'
      });

      const task = new TaskModel(taskData);
      
      await expect(task.save()).rejects.toThrow();
    });

    it('should reject task with invalid priority', async () => {
      const taskData = generateTestTask({
        priority: 'invalid-priority'
      });

      const task = new TaskModel(taskData);
      
      await expect(task.save()).rejects.toThrow();
    });

    it('should handle id uniqueness appropriately', async () => {
      const taskData1 = {
        id: 'unique-id-1',
        title: 'Test Task 1',
        clientId: 'test-client-123',
        assignedTo: 'TestAgent',
        status: 'todo',
        category: 'research'
      };
      
      const taskData2 = {
        id: 'unique-id-2',
        title: 'Test Task 2',
        clientId: 'test-client-123',
        assignedTo: 'TestAgent',
        status: 'in-progress',
        category: 'analysis'
      };
      
      const task1 = await new TaskModel(taskData1).save();
      const task2 = await new TaskModel(taskData2).save();
      
      expect(task1.id).toBe('unique-id-1');
      expect(task2.id).toBe('unique-id-2');
    });
  });

  describe('Model Methods', () => {
    it('should find tasks by clientId', async () => {
      const clientId = 'test-client-123';
      
      // Create multiple tasks for the same client
      const task1 = new TaskModel(generateTestTask({ 
        clientId,
        title: 'Task 1' 
      }));
      const task2 = new TaskModel(generateTestTask({ 
        clientId,
        title: 'Task 2' 
      }));
      const task3 = new TaskModel(generateTestTask({ 
        clientId: 'different-client',
        title: 'Task 3' 
      }));

      await Promise.all([task1.save(), task2.save(), task3.save()]);

      const clientTasks = await TaskModel.find({ clientId });
      
      expect(clientTasks).toHaveLength(2);
      expect(clientTasks.map(t => t.title)).toContain('Task 1');
      expect(clientTasks.map(t => t.title)).toContain('Task 2');
      expect(clientTasks.map(t => t.title)).not.toContain('Task 3');
    });

    it('should find tasks by status', async () => {
      const task1 = new TaskModel(generateTestTask({ 
        status: 'todo' 
      }));
      const task2 = new TaskModel(generateTestTask({ 
        status: 'in-progress' 
      }));
      const task3 = new TaskModel(generateTestTask({ 
        status: 'todo' 
      }));

      await Promise.all([task1.save(), task2.save(), task3.save()]);

      const pendingTasks = await TaskModel.find({ status: 'todo' });
      
      expect(pendingTasks).toHaveLength(2);
    });

    it('should find tasks by assignedAgent', async () => {
      const task1 = new TaskModel(generateTestTask({ 
        assignedTo: 'ValidationAgent' 
      }));
      const task2 = new TaskModel(generateTestTask({ 
        assignedTo: 'AnalysisAgent' 
      }));
      const task3 = new TaskModel(generateTestTask({ 
        assignedTo: 'ValidationAgent' 
      }));

      await Promise.all([task1.save(), task2.save(), task3.save()]);

      const validationTasks = await TaskModel.find({ assignedTo: 'ValidationAgent' });
      
      expect(validationTasks).toHaveLength(2);
    });

    it('should update task status', async () => {
      const task = new TaskModel(generateTestTask({ 
        status: 'todo' 
      }));
      
      await task.save();
      
      await task.save();
      const updatedTask = await TaskModel.findByIdAndUpdate(
        task._id,
        { status: 'in-progress' },
        { new: true }
      );
      
      expect(updatedTask.status).toBe('in-progress');
    });

    it('should update task progress', async () => {
      const task = new TaskModel(generateTestTask({ 
        progress: 0 
      }));
      
      const savedTask = await task.save();
      
      const updatedTask = await TaskModel.findByIdAndUpdate(
        savedTask._id,
        { progress: 50 },
        { new: true }
      );
      
      expect(updatedTask.progress).toBe(50);
    });
  });

  describe('Data Integrity', () => {
    it('should automatically set timestamps', async () => {
      const task = new TaskModel(generateTestTask());
      const savedTask = await task.save();

      expect(savedTask.createdAt).toBeInstanceOf(Date);
      expect(savedTask.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt timestamp on modification', async () => {
      const task = new TaskModel(generateTestTask());
      const savedTask = await task.save();
      const originalUpdatedAt = savedTask.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      savedTask.title = 'Updated Title';
      const updatedTask = await savedTask.save();

      expect(updatedTask.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('should validate progress is between 0 and 100', async () => {
      const taskData1 = generateTestTask({ progress: -10 });
      const taskData2 = generateTestTask({ progress: 150 });

      const task1 = new TaskModel(taskData1);
      const task2 = new TaskModel(taskData2);
      
      await expect(task1.save()).rejects.toThrow();
      await expect(task2.save()).rejects.toThrow();
    });
  });

  describe('Business Logic', () => {
    it('should handle task completion workflow', async () => {
      const taskData = generateTestTask({
        status: 'in-progress',
        progress: 50
      });
      const task = new TaskModel(taskData);
      const savedTask = await task.save();

      const updatedTask = await TaskModel.findByIdAndUpdate(
        savedTask._id,
        { status: 'done', progress: 100 },
        { new: true }
      );

      expect(updatedTask.status).toBe('done');
      expect(updatedTask.progress).toBe(100);
    });
  });
});
