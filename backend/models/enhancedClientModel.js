import mongoose from 'mongoose';

// Enhanced Client Schema with AI-optimized features
const enhancedClientSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  company: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  industry: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending', 'archived'],
    default: 'active',
    index: true
  },

  // AI Preferences and Configuration
  preferences: {
    aiModel: {
      type: String,
      enum: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      default: 'gpt-4'
    },
    maxTokensPerRequest: {
      type: Number,
      default: 4000,
      min: 100,
      max: 8000
    },
    temperature: {
      type: Number,
      default: 0.7,
      min: 0,
      max: 2
    },
    costBudget: {
      type: Number,
      default: 100.00,
      min: 0
    },
    qualityThreshold: {
      type: Number,
      default: 0.8,
      min: 0,
      max: 1
    }
  },

  // Strategyzer-specific profiles
  strategyzerProfiles: {
    valueProposition: {
      customerJobs: [{
        type: String,
        trim: true
      }],
      customerPains: [{
        type: String,
        trim: true
      }],
      customerGains: [{
        type: String,
        trim: true
      }],
      products: [{
        type: String,
        trim: true
      }],
      painRelievers: [{
        type: String,
        trim: true
      }],
      gainCreators: [{
        type: String,
        trim: true
      }]
    },
    businessModel: {
      keyPartners: [{
        type: String,
        trim: true
      }],
      keyActivities: [{
        type: String,
        trim: true
      }],
      keyResources: [{
        type: String,
        trim: true
      }],
      valuePropositions: [{
        type: String,
        trim: true
      }],
      customerRelationships: [{
        type: String,
        trim: true
      }],
      channels: [{
        type: String,
        trim: true
      }],
      customerSegments: [{
        type: String,
        trim: true
      }],
      costStructure: [{
        type: String,
        trim: true
      }],
      revenueStreams: [{
        type: String,
        trim: true
      }]
    },
    testingBusinessIdeas: {
      hypotheses: [{
        statement: String,
        priority: {
          type: String,
          enum: ['high', 'medium', 'low'],
          default: 'medium'
        },
        status: {
          type: String,
          enum: ['untested', 'testing', 'validated', 'invalidated'],
          default: 'untested'
        },
        evidence: [String],
        createdAt: {
          type: Date,
          default: Date.now
        }
      }],
      experiments: [{
        name: String,
        hypothesis: String,
        method: String,
        metrics: [String],
        results: String,
        conclusion: String,
        status: {
          type: String,
          enum: ['planned', 'running', 'completed', 'cancelled'],
          default: 'planned'
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }]
    }
  },

  // AI Usage Metrics and Cost Tracking
  aiMetrics: {
    totalTokensUsed: {
      type: Number,
      default: 0,
      min: 0
    },
    totalCost: {
      type: Number,
      default: 0,
      min: 0
    },
    requestCount: {
      type: Number,
      default: 0,
      min: 0
    },
    averageTokensPerRequest: {
      type: Number,
      default: 0,
      min: 0
    },
    averageQualityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    },
    lastUsed: {
      type: Date,
      default: Date.now
    }
  },

  // Workflow Status Tracking
  workflowTracking: {
    valueProposition: {
      status: {
        type: String,
        enum: ['not-started', 'in-progress', 'completed', 'failed'],
        default: 'not-started'
      },
      lastUpdated: {
        type: Date,
        default: Date.now
      },
      results: mongoose.Schema.Types.Mixed
    },
    businessModel: {
      status: {
        type: String,
        enum: ['not-started', 'in-progress', 'completed', 'failed'],
        default: 'not-started'
      },
      lastUpdated: {
        type: Date,
        default: Date.now
      },
      results: mongoose.Schema.Types.Mixed
    },
    testingBusinessIdeas: {
      status: {
        type: String,
        enum: ['not-started', 'in-progress', 'completed', 'failed'],
        default: 'not-started'
      },
      lastUpdated: {
        type: Date,
        default: Date.now
      },
      results: mongoose.Schema.Types.Mixed
    }
  },

  // Vector Embeddings for AI Search
  embeddings: {
    profile: {
      type: [Number],
      default: []
    },
    preferences: {
      type: [Number],
      default: []
    },
    lastEmbeddingUpdate: {
      type: Date,
      default: Date.now
    }
  },

  // Audit Trail
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  lastActivity: {
    type: Date,
    default: Date.now,
    index: true
  },
  createdBy: {
    type: String,
    default: 'system'
  },
  updatedBy: {
    type: String,
    default: 'system'
  }
}, {
  timestamps: true,
  collection: 'enhanced_clients'
});

// Indexes for performance
enhancedClientSchema.index({ email: 1, status: 1 });
enhancedClientSchema.index({ company: 1, industry: 1 });
enhancedClientSchema.index({ 'aiMetrics.totalCost': 1 });
enhancedClientSchema.index({ 'workflowTracking.valueProposition.status': 1 });
enhancedClientSchema.index({ lastActivity: -1 });

// Instance Methods

// Update AI usage metrics
enhancedClientSchema.methods.updateAIMetrics = function(tokensUsed, cost, model) {
  this.aiMetrics.totalTokensUsed += tokensUsed;
  this.aiMetrics.totalCost += cost;
  this.aiMetrics.requestCount += 1;
  this.aiMetrics.averageTokensPerRequest = this.aiMetrics.totalTokensUsed / this.aiMetrics.requestCount;
  this.aiMetrics.lastUsed = new Date();
  this.lastActivity = new Date();
  
  return this.save();
};

// Update workflow status
enhancedClientSchema.methods.updateWorkflowStatus = function(workflowType, status, results = null) {
  if (!this.workflowTracking[workflowType]) {
    throw new Error(`Invalid workflow type: ${workflowType}`);
  }
  
  this.workflowTracking[workflowType].status = status;
  this.workflowTracking[workflowType].lastUpdated = new Date();
  
  if (results) {
    this.workflowTracking[workflowType].results = results;
  }
  
  this.lastActivity = new Date();
  return this.save();
};

// Check if within cost budget
enhancedClientSchema.methods.isWithinCostBudget = function(additionalCost = 0) {
  return (this.aiMetrics.totalCost + additionalCost) <= this.preferences.costBudget;
};

// Get AI preferences with fallbacks
enhancedClientSchema.methods.getAIPreferences = function() {
  return {
    aiModel: this.preferences.aiModel || 'gpt-4',
    maxTokensPerRequest: this.preferences.maxTokensPerRequest || 4000,
    temperature: this.preferences.temperature || 0.7,
    costBudget: this.preferences.costBudget || 100.00,
    qualityThreshold: this.preferences.qualityThreshold || 0.8
  };
};

// Calculate cost efficiency metrics
enhancedClientSchema.methods.calculateCostEfficiency = function() {
  const totalTokens = this.aiMetrics.totalTokensUsed;
  const totalCost = this.aiMetrics.totalCost;
  const requestCount = this.aiMetrics.requestCount;
  
  return {
    averageCostPerToken: totalTokens > 0 ? totalCost / totalTokens : 0,
    averageCostPerRequest: requestCount > 0 ? totalCost / requestCount : 0,
    totalRequests: requestCount,
    totalTokens: totalTokens,
    totalCost: totalCost
  };
};

// Update last activity
enhancedClientSchema.methods.updateActivity = function() {
  this.lastActivity = new Date();
  return this.save();
};

// Static Methods

// Find clients by industry
enhancedClientSchema.statics.findByIndustry = function(industry) {
  return this.find({ industry: industry, status: 'active' });
};

// Find clients with high AI usage
enhancedClientSchema.statics.findHighUsageClients = function(costThreshold = 50) {
  return this.find({ 'aiMetrics.totalCost': { $gte: costThreshold } });
};

// Find clients by workflow status
enhancedClientSchema.statics.findByWorkflowStatus = function(workflowType, status) {
  const query = {};
  query[`workflowTracking.${workflowType}.status`] = status;
  return this.find(query);
};

// Pre-save middleware
enhancedClientSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (this.isModified() && !this.isNew) {
    this.lastActivity = new Date();
  }
  next();
});

// Virtual for full workflow completion status
enhancedClientSchema.virtual('workflowCompletionStatus').get(function() {
  const workflows = this.workflowTracking;
  const completed = Object.values(workflows).filter(w => w.status === 'completed').length;
  const total = Object.keys(workflows).length;
  return {
    completed,
    total,
    percentage: total > 0 ? (completed / total) * 100 : 0
  };
});

// Ensure virtual fields are serialized
enhancedClientSchema.set('toJSON', { virtuals: true });
enhancedClientSchema.set('toObject', { virtuals: true });

export default mongoose.model('EnhancedClient', enhancedClientSchema);
