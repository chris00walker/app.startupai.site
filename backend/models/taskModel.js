import mongoose from 'mongoose';

// Unified Task schema used across the backend. KEEP THIS AS SINGLE SOURCE OF TRUTH.
const taskSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString(),
  },

  id: {
    type: String,
    unique: true,
    required: false,
  },
  clientId: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'complete', 'exception', 'todo', 'in-progress', 'review', 'done'],
    default: 'pending',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  assignedTo: {
    type: String,
    default: 'system',
  },
  agentId: {
    type: String,
    default: null,
  },
  category: {
    type: String,
    enum: ['research', 'analysis', 'strategy', 'implementation', 'review'],
    default: 'research',
  },
  tags: [String],
  dueDate: {
    type: Date,
    default: null,
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  estimatedHours: {
    type: Number,
    default: 0,
  },
  actualHours: {
    type: Number,
    default: 0,
  },
  dependencies: [String],
  attachments: [{ name: String, url: String, type: String }],
  comments: [{ author: String, content: String, timestamp: { type: Date, default: Date.now } }],
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
    default: null,
  },
});

// Middleware – keep id/_id in sync and timestamp fields accurate
taskSchema.pre('save', function (next) {
  if (!this.id) this.id = this._id.toString();

  this.updatedAt = new Date();
  if (this.status === 'done' && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

// Indexes for performance
taskSchema.index({ id: 1 }, { unique: true, sparse: true, name: 'task_id_unique' });
taskSchema.index({ clientId: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ agentId: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ createdAt: -1 });

const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);
export default Task;
