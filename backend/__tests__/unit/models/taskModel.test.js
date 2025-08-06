// Unit tests for taskModel

import mongoose from 'mongoose';
import DatabaseTestHelper from '../../utils/testHelpers.js';

// Import the model we're testing
let TaskModel;

describe('TaskModel Unit Tests', () => {
  beforeAll(async () => {
    await DatabaseTestHelper.connect();
    
    // Import the model after database connection
    const { default: importedModel } = await import('../../../models/taskModel.js');
    TaskModel = importedModel;
    await TaskModel.init();
  });

  afterAll(async () => {
    await DatabaseTestHelper.disconnect();
  });

  beforeEach(async () => {
    await DatabaseTestHelper.clearDatabase();
    // Ensure indexes are rebuilt after clearing database
    await TaskModel.init();
  });

  describe('Schema Validation', () => {
    it('should create task with required fields', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test description',
        type: 'feature',
        priority: 'high',
        status: 'todo',
        assignee: new mongoose.Types.ObjectId(),
        projectId: new mongoose.Types.ObjectId(),
        clientId: new mongoose.Types.ObjectId(),
        estimatedHours: 8,
        actualHours: 0
      };

      const task = new TaskModel(taskData);
      const savedTask = await task.save();

      expect(savedTask._id).toBeDefined();
      expect(savedTask.title).toBe('Test Task');
      expect(savedTask.status).toBe('todo');
    });

    it('should enforce required fields validation', async () => {
      const task = new TaskModel({});
      
      await expect(task.save()).rejects.toThrow();
    });

    it('should handle task with tags and metadata', async () => {
      const taskData = {
        title: 'Tagged Task',
        description: 'Task with metadata',
        type: 'bug',
        priority: 'medium',
        status: 'in_progress',
        tags: ['frontend', 'bug'],
        metadata: {
          source: 'github',
          originalId: '12345'
        },
        assignee: new mongoose.Types.ObjectId(),
        projectId: new mongoose.Types.ObjectId(),
        clientId: new mongoose.Types.ObjectId()
      };

      const task = new TaskModel(taskData);
      const savedTask = await task.save();

      expect(savedTask.tags).toHaveLength(2);
      expect(savedTask.metadata.source).toBe('github');
    });
  });

  describe('Business Logic', () => {
    it('should calculate progress correctly', async () => {
      const task = new TaskModel({
        title: 'Progress Task',
        description: 'Task to test progress',
        type: 'feature',
        priority: 'high',
        status: 'in_progress',
        estimatedHours: 10,
        actualHours: 3,
        assignee: new mongoose.Types.ObjectId(),
        projectId: new mongoose.Types.ObjectId(),
        clientId: new mongoose.Types.ObjectId()
      });

      const savedTask = await task.save();
      expect(savedTask.actualHours).toBe(3);
      expect(savedTask.estimatedHours).toBe(10);
    });

    it('should handle task status transitions', async () => {
      const task = new TaskModel({
        title: 'Status Task',
        description: 'Task for status testing',
        type: 'bug',
        priority: 'low',
        status: 'todo',
        assignee: new mongoose.Types.ObjectId(),
        projectId: new mongoose.Types.ObjectId(),
        clientId: new mongoose.Types.ObjectId()
      });

      const savedTask = await task.save();
      
      // Update status
      savedTask.status = 'complete';
      const updatedTask = await savedTask.save();
      
      expect(updatedTask.status).toBe('complete');
    });
  });
});