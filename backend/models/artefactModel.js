import mongoose from 'mongoose';

const artefactSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['Research', 'Analysis', 'Planning', 'Operations', 'Strategy', 'Report']
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'in-progress', 'completed', 'failed'],
    default: 'pending'
  },
  clientId: {
    type: String,
    required: true
  },
  agentId: {
    type: String,
    required: true
  },
  content: {
    type: String,
    default: ''
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: String,
    default: 'system'
  }
});

// Update the updatedAt field before saving
artefactSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes for better query performance
artefactSchema.index({ id: 1 }, { unique: true, sparse: true, name: 'artefact_id_unique' });
artefactSchema.index({ clientId: 1 });
artefactSchema.index({ status: 1 });
artefactSchema.index({ type: 1 });
artefactSchema.index({ createdAt: -1 });

const Artefact = mongoose.models.Artefact || mongoose.model('Artefact', artefactSchema);

export default Artefact;
