const mongoose = require('mongoose');
const OldArtefact = require('../models/artefactModel'); // Current model
const NewArtefact = require('../models/optimizedArtefactModel'); // Optimized model

/**
 * Migration script to upgrade artefacts to optimized AI-powered schema
 * This demonstrates how to leverage MongoDB's new AI capabilities
 */

class SchemaMigration {
  constructor() {
    this.migrationStats = {
      total: 0,
      migrated: 0,
      failed: 0,
      enhanced: 0
    };
  }

  async migrate() {
    try {
      console.log('🚀 Starting migration to optimized AI schema...');
      
      // Get all existing artefacts
      const oldArtefacts = await OldArtefact.find({});
      this.migrationStats.total = oldArtefacts.length;
      
      console.log(`📊 Found ${oldArtefacts.length} artefacts to migrate`);

      // Process in batches for better performance
      const batchSize = 10;
      for (let i = 0; i < oldArtefacts.length; i += batchSize) {
        const batch = oldArtefacts.slice(i, i + batchSize);
        await this.processBatch(batch);
      }

      // Create optimized indexes
      await this.createOptimizedIndexes();

      // Generate migration report
      await this.generateMigrationReport();

      console.log('✅ Migration completed successfully!');
      console.log('📈 Migration Statistics:', this.migrationStats);

    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  async processBatch(artefacts) {
    const migrationPromises = artefacts.map(oldArtefact => 
      this.migrateArtefact(oldArtefact)
    );
    
    await Promise.allSettled(migrationPromises);
  }

  async migrateArtefact(oldArtefact) {
    try {
      console.log(`🔄 Migrating artefact: ${oldArtefact.id}`);

      // Parse and enhance the old content
      const enhancedContent = this.enhanceContent(oldArtefact.content);
      
      // Determine workflow stage from agent type
      const workflowStage = this.determineWorkflowStage(oldArtefact.agentId);
      
      // Create new optimized artefact
      const newArtefact = new NewArtefact({
        // Preserve existing core data
        id: oldArtefact.id,
        clientId: oldArtefact.clientId,
        agentId: oldArtefact.agentId,
        agentType: oldArtefact.agentId, // Use agentId as agentType
        name: oldArtefact.name,
        type: oldArtefact.type,
        status: oldArtefact.status,
        
        // Enhanced workflow metadata
        workflowId: `migrated_workflow_${oldArtefact.clientId}`,
        workflowStage,
        
        // Optimized content structure
        content: {
          raw: oldArtefact.content, // Preserve original
          structured: enhancedContent.structured,
          metadata: enhancedContent.metadata,
          embeddings: {} // Will be populated later with vector embeddings
        },
        
        // Enhanced execution context
        execution: {
          input_context: { migrated: true, originalAgentId: oldArtefact.agentId },
          output_context: enhancedContent.structured,
          agent_state: { completed: oldArtefact.status === 'completed' },
          dependencies: [], // Will be populated by dependency analysis
          dependents: []
        },
        
        // Quality validation
        validation: {
          is_validated: false, // Will be validated post-migration
          validation_score: enhancedContent.qualityScore,
          validation_notes: 'Migrated from legacy schema'
        },
        
        // Versioning
        version: 1,
        
        // Preserve timestamps
        createdAt: oldArtefact.createdAt,
        updatedAt: oldArtefact.updatedAt || new Date(),
        processedAt: oldArtefact.updatedAt || new Date(),
        
        // Enhanced searchability
        searchable_content: this.generateSearchableContent(enhancedContent.structured),
        tags: this.generateTags(enhancedContent.structured),
        keywords: this.extractKeywords(enhancedContent.structured)
      });

      await newArtefact.save();
      this.migrationStats.migrated++;
      
      console.log(`✅ Successfully migrated: ${oldArtefact.id}`);

    } catch (error) {
      console.error(`❌ Failed to migrate ${oldArtefact.id}:`, error.message);
      this.migrationStats.failed++;
    }
  }

  enhanceContent(oldContent) {
    let structured = {};
    let qualityScore = 0.5;

    try {
      // Handle different content formats
      if (typeof oldContent === 'string') {
        try {
          // Try to parse as JSON
          const parsed = JSON.parse(oldContent);
          structured = this.normalizeStructure(parsed);
        } catch (e) {
          // Treat as plain text analysis
          structured = {
            analysis: oldContent,
            recommendations: this.extractRecommendations(oldContent),
            nextSteps: this.extractNextSteps(oldContent),
            insights: this.extractInsights(oldContent),
            confidence: 0.6,
            reasoning: 'Migrated from legacy text content'
          };
        }
      } else if (typeof oldContent === 'object') {
        structured = this.normalizeStructure(oldContent);
      }

      // Calculate quality score
      qualityScore = this.calculateMigrationQuality(structured);

      return {
        structured,
        qualityScore,
        metadata: {
          model_used: 'legacy_migration',
          processing_time: 0,
          token_count: this.estimateTokenCount(structured),
          cost: 0,
          quality_score: qualityScore,
          migration_enhanced: true
        }
      };

    } catch (error) {
      console.warn('Content enhancement failed, using fallback:', error.message);
      
      return {
        structured: {
          analysis: 'Content could not be enhanced during migration',
          recommendations: ['Review and update content manually'],
          nextSteps: ['Manual content review required'],
          insights: ['Migration enhancement failed'],
          confidence: 0.3,
          reasoning: 'Fallback due to migration error'
        },
        qualityScore: 0.3,
        metadata: {
          model_used: 'migration_fallback',
          quality_score: 0.3,
          migration_error: error.message
        }
      };
    }
  }

  normalizeStructure(content) {
    // Normalize various content structures to standard format
    const normalized = {
      analysis: content.analysis || content.summary || content.description || '',
      recommendations: this.ensureArray(content.recommendations || content.suggestions || []),
      nextSteps: this.ensureArray(content.nextSteps || content.next_steps || content.actions || []),
      insights: this.ensureArray(content.insights || content.findings || content.observations || []),
      confidence: typeof content.confidence === 'number' ? content.confidence : 0.7,
      reasoning: content.reasoning || content.rationale || 'Migrated from legacy content'
    };

    // Fill empty arrays with extracted content
    if (normalized.recommendations.length === 0 && normalized.analysis) {
      normalized.recommendations = this.extractRecommendations(normalized.analysis);
    }
    
    if (normalized.nextSteps.length === 0 && normalized.analysis) {
      normalized.nextSteps = this.extractNextSteps(normalized.analysis);
    }
    
    if (normalized.insights.length === 0 && normalized.analysis) {
      normalized.insights = this.extractInsights(normalized.analysis);
    }

    return normalized;
  }

  ensureArray(value) {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return value ? [value] : [];
    return [];
  }

  extractRecommendations(text) {
    // Simple extraction logic - in production, use NLP
    const recommendations = [];
    const lines = text.split('\n');
    
    lines.forEach(line => {
      if (line.toLowerCase().includes('recommend') || 
          line.toLowerCase().includes('suggest') ||
          line.toLowerCase().includes('should')) {
        recommendations.push(line.trim());
      }
    });
    
    return recommendations.length > 0 ? recommendations : ['Review analysis for actionable insights'];
  }

  extractNextSteps(text) {
    const steps = [];
    const lines = text.split('\n');
    
    lines.forEach(line => {
      if (line.toLowerCase().includes('next') || 
          line.toLowerCase().includes('step') ||
          line.toLowerCase().includes('action')) {
        steps.push(line.trim());
      }
    });
    
    return steps.length > 0 ? steps : ['Define specific action items based on analysis'];
  }

  extractInsights(text) {
    const insights = [];
    const lines = text.split('\n');
    
    lines.forEach(line => {
      if (line.toLowerCase().includes('insight') || 
          line.toLowerCase().includes('finding') ||
          line.toLowerCase().includes('key') ||
          line.toLowerCase().includes('important')) {
        insights.push(line.trim());
      }
    });
    
    return insights.length > 0 ? insights : ['Key insights available in analysis'];
  }

  determineWorkflowStage(agentId) {
    const stageMapping = {
      'intakeAgent': 'discovery',
      'researchAgent': 'discovery',
      'canvasDraftingAgent': 'discovery',
      'validationPlanAgent': 'validation',
      'scaleAgent': 'scale'
    };
    
    return stageMapping[agentId] || 'discovery';
  }

  calculateMigrationQuality(structured) {
    let score = 0.4; // Base migration score
    
    if (structured.analysis && structured.analysis.length > 50) score += 0.2;
    if (structured.recommendations && structured.recommendations.length > 0) score += 0.15;
    if (structured.nextSteps && structured.nextSteps.length > 0) score += 0.15;
    if (structured.insights && structured.insights.length > 0) score += 0.1;
    
    return Math.min(1.0, score);
  }

  generateSearchableContent(structured) {
    return [
      structured.analysis,
      ...(structured.recommendations || []),
      ...(structured.nextSteps || []),
      ...(structured.insights || [])
    ].filter(Boolean).join(' ');
  }

  generateTags(structured) {
    const text = this.generateSearchableContent(structured).toLowerCase();
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    
    return text.split(/\W+/)
      .filter(word => word.length > 3 && !commonWords.includes(word))
      .slice(0, 10);
  }

  extractKeywords(structured) {
    // Simple keyword extraction - in production, use NLP libraries
    const businessKeywords = [
      'strategy', 'market', 'customer', 'revenue', 'growth', 'competitive',
      'analysis', 'recommendation', 'insight', 'opportunity', 'challenge',
      'solution', 'implementation', 'validation', 'scale', 'optimization'
    ];
    
    const text = this.generateSearchableContent(structured).toLowerCase();
    return businessKeywords.filter(keyword => text.includes(keyword));
  }

  estimateTokenCount(structured) {
    const text = this.generateSearchableContent(structured);
    return Math.ceil(text.length / 4); // Rough token estimation
  }

  async createOptimizedIndexes() {
    console.log('📊 Creating optimized indexes...');
    
    try {
      // Create compound indexes for efficient querying
      await NewArtefact.collection.createIndex({ clientId: 1, workflowStage: 1, status: 1 });
      await NewArtefact.collection.createIndex({ agentType: 1, createdAt: -1 });
      await NewArtefact.collection.createIndex({ workflowId: 1, agentType: 1 });
      await NewArtefact.collection.createIndex({ 'validation.is_validated': 1, 'validation.validation_score': -1 });
      
      // Text index for full-text search
      await NewArtefact.collection.createIndex({ 
        searchable_content: 'text', 
        name: 'text', 
        tags: 'text',
        keywords: 'text'
      });
      
      console.log('✅ Optimized indexes created successfully');
      
    } catch (error) {
      console.warn('⚠️  Index creation failed:', error.message);
    }
  }

  async generateMigrationReport() {
    console.log('📋 Generating migration report...');
    
    const report = {
      migration: this.migrationStats,
      timestamp: new Date(),
      newSchemaStats: await this.getNewSchemaStats(),
      recommendations: this.generateRecommendations()
    };
    
    console.log('📊 Migration Report:', JSON.stringify(report, null, 2));
    return report;
  }

  async getNewSchemaStats() {
    try {
      const stats = await NewArtefact.aggregate([
        {
          $group: {
            _id: null,
            totalArtefacts: { $sum: 1 },
            avgQuality: { $avg: '$content.metadata.quality_score' },
            workflowStages: { $addToSet: '$workflowStage' },
            agentTypes: { $addToSet: '$agentType' },
            validatedCount: { 
              $sum: { $cond: ['$validation.is_validated', 1, 0] }
            }
          }
        }
      ]);
      
      return stats[0] || {};
    } catch (error) {
      console.warn('Stats generation failed:', error);
      return {};
    }
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.migrationStats.failed > 0) {
      recommendations.push('Review failed migrations and fix data quality issues');
    }
    
    if (this.migrationStats.migrated > 0) {
      recommendations.push('Run validation on migrated artefacts to ensure quality');
      recommendations.push('Generate vector embeddings for semantic search capabilities');
      recommendations.push('Update frontend to use enhanced artefact API endpoints');
    }
    
    recommendations.push('Consider implementing MongoDB Atlas Vector Search for semantic capabilities');
    recommendations.push('Set up automated quality monitoring for new artefacts');
    
    return recommendations;
  }
}

// Export for use in migration scripts
module.exports = SchemaMigration;

// Run migration if called directly
if (require.main === module) {
  const migration = new SchemaMigration();
  
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/multi-agent-platform')
    .then(() => {
      console.log('🔗 Connected to MongoDB');
      return migration.migrate();
    })
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}
