import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  industry: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'completed', 'paused'],
    default: 'pending'
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  businessModel: {
    type: String,
    trim: true
  },
  targetMarket: {
    type: String,
    trim: true
  },
  currentChallenges: [{
    type: String,
    trim: true
  }],
  goals: [{
    type: String,
    trim: true
  }],
  budget: {
    type: Number,
    min: 0
  },
  timeline: {
    type: String,
    trim: true
  },
  contactInfo: {
    phone: String,
    address: String,
    website: String
  },
  assignedConsultant: {
    type: String,
    trim: true
  },
  workflowStatus: {
    discovery: {
      status: { type: String, enum: ['not_started', 'in_progress', 'completed'], default: 'not_started' },
      completedAt: Date,
      results: mongoose.Schema.Types.Mixed
    },
    validation: {
      status: { type: String, enum: ['not_started', 'in_progress', 'completed'], default: 'not_started' },
      completedAt: Date,
      results: mongoose.Schema.Types.Mixed
    },
    scale: {
      status: { type: String, enum: ['not_started', 'in_progress', 'completed'], default: 'not_started' },
      completedAt: Date,
      results: mongoose.Schema.Types.Mixed
    }
  },
  metrics: {
    totalTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    totalArtefacts: { type: Number, default: 0 },
    lastActivity: { type: Date, default: Date.now }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
clientSchema.index({ email: 1 });
clientSchema.index({ status: 1 });
clientSchema.index({ industry: 1 });
clientSchema.index({ 'metrics.lastActivity': -1 });

// Virtual for completion percentage
clientSchema.virtual('completionPercentage').get(function() {
  if (this.metrics.totalTasks === 0) return 0;
  return Math.round((this.metrics.completedTasks / this.metrics.totalTasks) * 100);
});

// Method to update last activity
clientSchema.methods.updateActivity = function() {
  this.metrics.lastActivity = new Date();
  return this.save();
};

// Method to update workflow status
clientSchema.methods.updateWorkflowStatus = function(workflowType, status, results = null) {
  this.workflowStatus[workflowType].status = status;
  if (status === 'completed') {
    this.workflowStatus[workflowType].completedAt = new Date();
    if (results) {
      this.workflowStatus[workflowType].results = results;
    }
  }
  this.metrics.lastActivity = new Date();
  return this.save();
};

export default mongoose.model('Client', clientSchema);
