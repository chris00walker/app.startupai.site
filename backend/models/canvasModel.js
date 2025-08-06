import mongoose from 'mongoose';

// Canvas Schema for Strategyzer visual frameworks
const canvasSchema = new mongoose.Schema({
  // Basic Information
  clientId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['valueProposition', 'businessModel', 'testingBusinessIdeas'],
    index: true
  },
  title: {
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
    enum: ['draft', 'in-review', 'published', 'archived'],
    default: 'draft',
    index: true
  },

  // Canvas Data Structure (varies by type)
  data: {
    // Value Proposition Canvas
    customerProfile: {
      customerJobs: [{
        type: String,
        trim: true
      }],
      pains: [{
        type: String,
        trim: true
      }],
      gains: [{
        type: String,
        trim: true
      }]
    },
    valueMap: {
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

    // Business Model Canvas
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
    }],

    // Testing Business Ideas
    hypotheses: [{
      statement: {
        type: String,
        required: true
      },
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
      evidence: [{
        type: String,
        trim: true
      }],
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    experiments: [{
      name: {
        type: String,
        required: true
      },
      hypothesis: String,
      method: String,
      metrics: [{
        type: String,
        trim: true
      }],
      results: String,
      conclusion: String,
      status: {
        type: String,
        enum: ['planned', 'running', 'completed', 'cancelled'],
        default: 'planned'
      },
      startDate: Date,
      endDate: Date,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  },

  // AI and Quality Metadata
  metadata: {
    agentId: {
      type: String,
      required: true
    },
    version: {
      type: String,
      default: '1.0'
    },
    qualityScore: {
      type: Number,
      min: 0,
      max: 1,
      default: 0
    },
    tokensUsed: {
      type: Number,
      default: 0
    },
    generationCost: {
      type: Number,
      default: 0
    },
    processingTime: {
      type: Number,
      default: 0
    },
    aiModel: {
      type: String,
      default: 'gpt-4'
    },
    prompt: String,
    rawResponse: String,
    
    // Visual Generation Metadata
    visualGenerated: {
      type: Boolean,
      default: false
    },
    visualGeneratedAt: Date,
    visualQualityScore: {
      type: Number,
      min: 0,
      max: 1
    },
    visualFormats: [{
      type: String,
      enum: ['svg', 'png', 'pdf']
    }],
    visualAssetSizes: {
      svg: Number,
      png: Number,
      pdf: Number
    }
  },

  // Visual and Export Settings
  visualSettings: {
    theme: {
      type: String,
      enum: ['default', 'professional', 'creative', 'minimal'],
      default: 'professional'
    },
    colorScheme: {
      type: String,
      enum: ['blue', 'green', 'orange', 'purple', 'custom'],
      default: 'blue'
    },
    layout: {
      type: String,
      enum: ['standard', 'compact', 'detailed'],
      default: 'standard'
    },
    customColors: {
      primary: String,
      secondary: String,
      accent: String
    }
  },

  // Collaboration and Sharing
  collaboration: {
    isShared: {
      type: Boolean,
      default: false
    },
    sharedWith: [{
      email: String,
      permission: {
        type: String,
        enum: ['view', 'comment', 'edit'],
        default: 'view'
      },
      sharedAt: {
        type: Date,
        default: Date.now
      }
    }],
    comments: [{
      author: String,
      content: String,
      section: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  },

  // Version Control
  versions: [{
    versionNumber: String,
    data: mongoose.Schema.Types.Mixed,
    createdAt: {
      type: Date,
      default: Date.now
    },
    createdBy: String,
    changes: String
  }],

  // Export History
  exports: [{
    format: {
      type: String,
      enum: ['pdf', 'png', 'svg', 'json'],
      required: true
    },
    url: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    fileSize: Number
  }],

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
  publishedAt: Date,
  createdBy: {
    type: String,
    default: 'ai-agent'
  },
  updatedBy: {
    type: String,
    default: 'ai-agent'
  }
}, {
  timestamps: true,
  collection: 'canvases'
});

// Indexes for performance
canvasSchema.index({ clientId: 1, type: 1 });
canvasSchema.index({ status: 1, createdAt: -1 });
canvasSchema.index({ 'metadata.qualityScore': -1 });
canvasSchema.index({ 'metadata.agentId': 1 });

// Validation based on canvas type
canvasSchema.pre('save', function(next) {
  if (this.type === 'valueProposition') {
    if (!this.data.customerProfile || !this.data.valueMap) {
      return next(new Error('Value Proposition Canvas requires customerProfile and valueMap'));
    }
  }
  
  if (this.type === 'businessModel') {
    const requiredFields = ['keyPartners', 'keyActivities', 'keyResources', 'valuePropositions', 
                           'customerRelationships', 'channels', 'customerSegments', 'costStructure', 'revenueStreams'];
    const hasAllFields = requiredFields.every(field => this.data[field] !== undefined);
    if (!hasAllFields) {
      return next(new Error('Business Model Canvas requires all 9 building blocks'));
    }
  }
  
  if (this.type === 'testingBusinessIdeas') {
    if (!this.data.hypotheses && !this.data.experiments) {
      return next(new Error('Testing Business Ideas Canvas requires hypotheses or experiments'));
    }
  }
  
  next();
});

// Instance Methods

// Update quality score
canvasSchema.methods.updateQualityScore = async function(score) {
  // Use direct update to avoid potential version conflicts in rapid test cycles
  const updated = await this.constructor.findByIdAndUpdate(this._id, {
    'metadata.qualityScore': score,
    updatedAt: new Date()
  }, { new: true, lean: false });
  // Sync local instance for further chained assertions in tests
  if (updated) {
    this.set(updated.toObject());
    this.metadata.qualityScore = score;
  }
  return updated;
};

// Publish canvas
canvasSchema.methods.publish = async function() {
  const updated = await this.constructor.findByIdAndUpdate(this._id, {
    status: 'published',
    publishedAt: new Date(),
    updatedAt: new Date()
  }, { new: true, lean: false });
  if (updated) this.set(updated.toObject());
  return updated;
};

// Archive canvas
canvasSchema.methods.archive = async function() {
  const updated = await this.constructor.findByIdAndUpdate(this._id, {
    status: 'archived',
    updatedAt: new Date()
  }, { new: true, lean: false });
  if (updated) this.set(updated.toObject());
  return updated;
};

// Create new version
canvasSchema.methods.createVersion = async function(changes, createdBy = 'system') {
  const versionNumber = `${this.versions.length + 1}.0`;
  const update = {
    $push: {
      versions: {
        versionNumber,
        data: this.data,
        changes,
        createdBy,
        createdAt: new Date()
      }
    },
    $set: {
      'metadata.version': versionNumber,
      updatedAt: new Date()
    }
  };
  const updated = await this.constructor.findByIdAndUpdate(this._id, update, { new: true, lean: false });
  if (updated) this.set(updated.toObject());
  return updated;
};

// Add comment
canvasSchema.methods.addComment = function(author, content, section = 'general') {
  this.collaboration.comments.push({
    author,
    content,
    section
  });
  return this.save();
};

// Share canvas
canvasSchema.methods.shareWith = function(email, permission = 'view') {
  const existingShare = this.collaboration.sharedWith.find(s => s.email === email);
  if (existingShare) {
    existingShare.permission = permission;
  } else {
    this.collaboration.sharedWith.push({ email, permission });
  }
  this.collaboration.isShared = true;
  return this.save();
};

// Generate export data
canvasSchema.methods.generateExportData = function() {
  return {
    title: this.title,
    type: this.type,
    data: this.data,
    metadata: this.metadata,
    visualSettings: this.visualSettings,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Record export
canvasSchema.methods.recordExport = function(format, url, fileSize) {
  this.exports.push({
    format,
    url,
    fileSize
  });
  return this.save();
};

// Static Methods

// Find canvases by client
canvasSchema.statics.findByClient = function(clientId) {
  return this.find({ clientId, status: { $ne: 'archived' } })
             .sort({ updatedAt: -1 });
};

// Find canvases by type
canvasSchema.statics.findByType = function(type) {
  return this.find({ type, status: { $ne: 'archived' } })
             .sort({ updatedAt: -1 });
};

// Find published canvases
canvasSchema.statics.findPublished = function() {
  return this.find({ status: 'published' })
             .sort({ publishedAt: -1 });
};

// Find high-quality canvases
canvasSchema.statics.findHighQuality = function(threshold = 0.8) {
  return this.find({ 'metadata.qualityScore': { $gte: threshold } })
             .sort({ 'metadata.qualityScore': -1 });
};

// Find canvases by agent
canvasSchema.statics.findByAgent = function(agentId) {
  return this.find({ 'metadata.agentId': agentId })
             .sort({ createdAt: -1 });
};

/**
 * Create a new version of a canvas identified by ID.
 * This pushes the current canvas `data` and metadata into the `versions` array
 * and updates the `metadata.version` field so that consumers (and tests) can
 * reference historical states.
 *
 * @param {string|mongoose.Types.ObjectId} canvasId - The _id of the canvas.
 * @param {string} [changes='Automated version'] - Description of the changes that triggered this version bump.
 * @param {string} [createdBy='system'] - Who/what initiated the version creation.
 * @returns {Promise<mongoose.Document>} The updated canvas document instance.
 */
canvasSchema.statics.version = async function(canvasId, changes = 'Automated version', createdBy = 'system') {
  const update = {
    $push: {
      versions: {
        versionNumber: undefined, // placeholder – set below after array length known
        data: undefined,          // placeholder
        createdAt: new Date(),
        createdBy,
        changes
      }
    },
    $set: {
      updatedAt: new Date()
    }
  };

  // Fetch current document length first (lean)
  const current = await this.findById(canvasId).lean();
  if (!current) {
    throw new Error('Canvas not found');
  }
  const nextVersion = `${(current.versions?.length || 0) + 1}.0`;
  update.$push.versions.versionNumber = nextVersion;
  update.$push.versions.data = current.data;
  update.$set['metadata.version'] = nextVersion;

  const updated = await this.findByIdAndUpdate(canvasId, update, { new: true, lean: false });
  return updated;
};

// Get canvas statistics
canvasSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        avgQuality: { $avg: '$metadata.qualityScore' },
        totalCost: { $sum: '$metadata.generationCost' }
      }
    }
  ]);
  
  return stats;
};

// Virtual for canvas completeness
canvasSchema.virtual('completeness').get(function() {
  let totalFields = 0;
  let filledFields = 0;
  
  if (this.type === 'valueProposition') {
    const fields = ['customerJobs', 'pains', 'gains', 'products', 'painRelievers', 'gainCreators'];
    totalFields = fields.length;
    fields.forEach(field => {
      if (this.data.customerProfile?.[field]?.length > 0 || this.data.valueMap?.[field]?.length > 0) {
        filledFields++;
      }
    });
  } else if (this.type === 'businessModel') {
    const fields = ['keyPartners', 'keyActivities', 'keyResources', 'valuePropositions', 
                   'customerRelationships', 'channels', 'customerSegments', 'costStructure', 'revenueStreams'];
    totalFields = fields.length;
    fields.forEach(field => {
      if (this.data[field]?.length > 0) {
        filledFields++;
      }
    });
  }
  
  return totalFields > 0 ? (filledFields / totalFields) * 100 : 0;
});

// Ensure virtual fields are serialized
canvasSchema.set('toJSON', { virtuals: true });
canvasSchema.set('toObject', { virtuals: true });

export default mongoose.models.Canvas || mongoose.model('Canvas', canvasSchema);
