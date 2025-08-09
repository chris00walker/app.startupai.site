const mongoose = require('mongoose');

// Enhanced Artefact Schema optimized for AI Agent workflows
const ArtefactSchema = new mongoose.Schema({
  // Core identification
  id: { type: String, required: true, unique: true },
  clientId: { type: String, required: true, index: true },
  
  // Agent workflow metadata
  agentId: { type: String, required: true },
  agentType: { 
    type: String, 
    enum: ['intakeAgent', 'researchAgent', 'canvasDraftingAgent', 'validationPlanAgent', 'scaleAgent'],
    required: true,
    index: true
  },
  workflowId: { type: String, required: true, index: true },
  workflowStage: { 
    type: String, 
    enum: ['discovery', 'validation', 'scale'],
    required: true,
    index: true
  },
  
  // Artefact metadata
  name: { type: String, required: true },
  type: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'in_progress', 'completed', 'failed'],
    default: 'pending',
    index: true
  },
  
  // AI-optimized content structure
  content: {
    // Raw AI response for backup
    raw: { type: mongoose.Schema.Types.Mixed },
    
    // Structured AI output
    structured: {
      analysis: { type: String },
      recommendations: [{ type: String }],
      nextSteps: [{ type: String }],
      insights: [{ type: String }],
      confidence: { type: Number, min: 0, max: 1 },
      reasoning: { type: String }
    },
    
    // Vector embeddings for semantic search
    embeddings: {
      content_vector: [{ type: Number }], // For content similarity
      semantic_vector: [{ type: Number }], // For semantic search
      summary_vector: [{ type: Number }]   // For summary matching
    },
    
    // Metadata for AI processing
    metadata: {
      model_used: { type: String },
      processing_time: { type: Number },
      token_count: { type: Number },
      cost: { type: Number },
      quality_score: { type: Number, min: 0, max: 1 }
    }
  },
  
  // Agent execution context
  execution: {
    input_context: { type: mongoose.Schema.Types.Mixed },
    output_context: { type: mongoose.Schema.Types.Mixed },
    agent_state: { type: mongoose.Schema.Types.Mixed },
    dependencies: [{ type: String }], // Other artefact IDs this depends on
    dependents: [{ type: String }]    // Artefacts that depend on this
  },
  
  // Quality and validation
  validation: {
    is_validated: { type: Boolean, default: false },
    validation_score: { type: Number, min: 0, max: 1 },
    validation_notes: { type: String },
    human_reviewed: { type: Boolean, default: false }
  },
  
  // Versioning for iterative improvement
  version: { type: Number, default: 1 },
  parent_version: { type: String }, // Reference to previous version
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  processedAt: { type: Date },
  
  // Search optimization
  searchable_content: { type: String }, // Flattened content for full-text search
  tags: [{ type: String, index: true }],
  keywords: [{ type: String, index: true }]
}, {
  timestamps: true,
  // Enable text search on key fields
  collection: 'artefacts'
});

// Compound indexes for efficient querying
ArtefactSchema.index({ clientId: 1, workflowStage: 1, status: 1 });
ArtefactSchema.index({ agentType: 1, createdAt: -1 });
ArtefactSchema.index({ workflowId: 1, agentType: 1 });
ArtefactSchema.index({ 'validation.is_validated': 1, 'validation.validation_score': -1 });

// Text index for full-text search
ArtefactSchema.index({ 
  searchable_content: 'text', 
  name: 'text', 
  'content.structured.analysis': 'text',
  tags: 'text',
  keywords: 'text'
});

// Vector search index (for Atlas Vector Search)
// This would be created via MongoDB Atlas UI or API
ArtefactSchema.index({ 'content.embeddings.content_vector': '2dsphere' });

// Pre-save middleware to optimize content for search and AI
ArtefactSchema.pre('save', function(next) {
  // Flatten content for searchability
  if (this.content && this.content.structured) {
    const structured = this.content.structured;
    this.searchable_content = [
      structured.analysis,
      ...(structured.recommendations || []),
      ...(structured.nextSteps || []),
      ...(structured.insights || [])
    ].filter(Boolean).join(' ');
  }
  
  // Auto-generate tags from content
  if (this.searchable_content && (!this.tags || this.tags.length === 0)) {
    // Simple keyword extraction (in production, use NLP library)
    const words = this.searchable_content.toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 3)
      .slice(0, 10);
    this.tags = [...new Set(words)];
  }
  
  this.updatedAt = new Date();
  next();
});

// Instance methods for AI workflow optimization
ArtefactSchema.methods.getStructuredContent = function() {
  return this.content?.structured || {};
};

ArtefactSchema.methods.updateWithAIResponse = function(aiResponse, metadata = {}) {
  // Parse AI response intelligently
  let structured = {};
  
  if (typeof aiResponse === 'string') {
    try {
      structured = JSON.parse(aiResponse);
    } catch (e) {
      structured = { analysis: aiResponse };
    }
  } else if (typeof aiResponse === 'object') {
    structured = aiResponse;
  }
  
  this.content = {
    raw: aiResponse,
    structured: structured,
    metadata: {
      model_used: metadata.model || 'gpt-4o-mini',
      processing_time: metadata.processing_time || 0,
      token_count: metadata.token_count || 0,
      cost: metadata.cost || 0,
      quality_score: metadata.quality_score || 0.8,
      ...metadata
    },
    embeddings: this.content?.embeddings || {}
  };
  
  this.status = 'completed';
  this.processedAt = new Date();
  
  return this;
};

// Static methods for workflow queries
ArtefactSchema.statics.findByWorkflow = function(clientId, workflowStage) {
  return this.find({ clientId, workflowStage }).sort({ createdAt: 1 });
};

ArtefactSchema.statics.findDependencyChain = function(artefactId) {
  // Find all artefacts that depend on this one
  return this.find({ 'execution.dependencies': artefactId });
};

ArtefactSchema.statics.getWorkflowProgress = function(clientId) {
  return this.aggregate([
    { $match: { clientId } },
    { 
      $group: {
        _id: '$workflowStage',
        total: { $sum: 1 },
        completed: { 
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        avg_quality: { $avg: '$content.metadata.quality_score' }
      }
    }
  ]);
};

module.exports = mongoose.model('Artefact', ArtefactSchema);
