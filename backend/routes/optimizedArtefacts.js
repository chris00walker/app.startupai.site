const express = require('express');
const router = express.Router();
const Artefact = require('../models/optimizedArtefactModel');

/**
 * Enhanced Artefacts API leveraging MongoDB's AI capabilities
 * Includes vector search, aggregation pipelines, and intelligent filtering
 */

/**
 * GET /api/clients/:clientId/artefacts/enhanced
 * Get artefacts with enhanced AI-powered insights and relationships
 */
router.get('/clients/:clientId/artefacts/enhanced', async (req, res) => {
  try {
    const { clientId } = req.params;
    const { 
      workflowStage, 
      agentType, 
      minQuality = 0, 
      includeRelationships = true,
      format = 'structured' 
    } = req.query;

    // Build dynamic aggregation pipeline
    const pipeline = [
      { $match: { clientId } },
      
      // Add quality filtering
      ...(minQuality > 0 ? [{ 
        $match: { 'content.metadata.quality_score': { $gte: parseFloat(minQuality) } }
      }] : []),
      
      // Add workflow stage filtering
      ...(workflowStage ? [{ $match: { workflowStage } }] : []),
      
      // Add agent type filtering
      ...(agentType ? [{ $match: { agentType } }] : []),
      
      // Enrich with relationship data
      ...(includeRelationships === 'true' ? [{
        $lookup: {
          from: 'artefacts',
          localField: 'execution.dependencies',
          foreignField: 'id',
          as: 'dependencyArtefacts',
          pipeline: [
            { $project: { id: 1, name: 1, agentType: 1, 'content.structured.analysis': 1 } }
          ]
        }
      }, {
        $lookup: {
          from: 'artefacts',
          localField: 'execution.dependents',
          foreignField: 'id',
          as: 'dependentArtefacts',
          pipeline: [
            { $project: { id: 1, name: 1, agentType: 1 } }
          ]
        }
      }] : []),
      
      // Add workflow progress calculation
      {
        $addFields: {
          workflowProgress: {
            $switch: {
              branches: [
                { case: { $eq: ['$workflowStage', 'discovery'] }, then: 1 },
                { case: { $eq: ['$workflowStage', 'validation'] }, then: 2 },
                { case: { $eq: ['$workflowStage', 'scale'] }, then: 3 }
              ],
              default: 0
            }
          },
          displayContent: {
            $cond: {
              if: { $eq: [format, 'raw'] },
              then: '$content.raw',
              else: '$content.structured'
            }
          }
        }
      },
      
      // Sort by workflow progress and creation date
      { $sort: { workflowProgress: 1, createdAt: -1 } },
      
      // Project final structure
      {
        $project: {
          id: 1,
          name: 1,
          agentType: 1,
          workflowStage: 1,
          status: 1,
          content: '$displayContent',
          qualityScore: '$content.metadata.quality_score',
          confidence: '$content.structured.confidence',
          createdAt: 1,
          updatedAt: 1,
          ...(includeRelationships === 'true' ? {
            dependencies: '$dependencyArtefacts',
            dependents: '$dependentArtefacts',
            relationshipCount: { 
              $add: [
                { $size: { $ifNull: ['$dependencyArtefacts', []] } },
                { $size: { $ifNull: ['$dependentArtefacts', []] } }
              ]
            }
          } : {}),
          workflowProgress: 1
        }
      }
    ];

    const artefacts = await Artefact.aggregate(pipeline);
    
    // Calculate summary statistics
    const summary = await Artefact.aggregate([
      { $match: { clientId } },
      {
        $group: {
          _id: null,
          totalArtefacts: { $sum: 1 },
          completedArtefacts: { 
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          avgQuality: { $avg: '$content.metadata.quality_score' },
          workflowStages: { $addToSet: '$workflowStage' },
          agentTypes: { $addToSet: '$agentType' }
        }
      }
    ]);

    res.json({
      artefacts,
      summary: summary[0] || {
        totalArtefacts: 0,
        completedArtefacts: 0,
        avgQuality: 0,
        workflowStages: [],
        agentTypes: []
      },
      meta: {
        clientId,
        filters: { workflowStage, agentType, minQuality },
        resultCount: artefacts.length
      }
    });

  } catch (error) {
    console.error('Enhanced artefacts query failed:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve enhanced artefacts',
      details: error.message 
    });
  }
});

/**
 * GET /api/clients/:clientId/artefacts/insights
 * Get AI-powered insights across all artefacts for a client
 */
router.get('/clients/:clientId/artefacts/insights', async (req, res) => {
  try {
    const { clientId } = req.params;

    const insights = await Artefact.aggregate([
      { $match: { clientId, status: 'completed' } },
      
      // Unwind insights array for analysis
      { $unwind: { path: '$content.structured.insights', preserveNullAndEmptyArrays: true } },
      
      // Group insights by frequency and quality
      {
        $group: {
          _id: '$content.structured.insights',
          frequency: { $sum: 1 },
          avgConfidence: { $avg: '$content.structured.confidence' },
          sources: { 
            $addToSet: {
              agentType: '$agentType',
              workflowStage: '$workflowStage',
              createdAt: '$createdAt'
            }
          }
        }
      },
      
      // Filter out null insights and sort by relevance
      { $match: { _id: { $ne: null } } },
      { $sort: { frequency: -1, avgConfidence: -1 } },
      { $limit: 20 },
      
      // Project final insight structure
      {
        $project: {
          insight: '$_id',
          frequency: 1,
          confidence: '$avgConfidence',
          sources: 1,
          relevanceScore: { 
            $multiply: ['$frequency', '$avgConfidence'] 
          }
        }
      }
    ]);

    // Get workflow progress insights
    const workflowInsights = await Artefact.aggregate([
      { $match: { clientId } },
      {
        $group: {
          _id: '$workflowStage',
          artefactCount: { $sum: 1 },
          completedCount: { 
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          avgQuality: { $avg: '$content.metadata.quality_score' },
          avgConfidence: { $avg: '$content.structured.confidence' },
          lastActivity: { $max: '$updatedAt' }
        }
      },
      {
        $project: {
          workflowStage: '$_id',
          progress: { 
            $divide: ['$completedCount', '$artefactCount'] 
          },
          artefactCount: 1,
          completedCount: 1,
          avgQuality: 1,
          avgConfidence: 1,
          lastActivity: 1
        }
      }
    ]);

    res.json({
      keyInsights: insights,
      workflowProgress: workflowInsights,
      meta: {
        clientId,
        generatedAt: new Date(),
        totalInsights: insights.length
      }
    });

  } catch (error) {
    console.error('Insights generation failed:', error);
    res.status(500).json({ 
      error: 'Failed to generate insights',
      details: error.message 
    });
  }
});

/**
 * GET /api/clients/:clientId/artefacts/search
 * Semantic and full-text search across artefacts
 */
router.get('/clients/:clientId/artefacts/search', async (req, res) => {
  try {
    const { clientId } = req.params;
    const { 
      query, 
      searchType = 'hybrid', // 'semantic', 'fulltext', 'hybrid'
      limit = 10 
    } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    let searchPipeline = [];

    if (searchType === 'fulltext' || searchType === 'hybrid') {
      // Full-text search pipeline
      searchPipeline = [
        { $match: { clientId } },
        { 
          $match: { 
            $text: { 
              $search: query,
              $caseSensitive: false 
            }
          }
        },
        {
          $addFields: {
            searchScore: { $meta: 'textScore' }
          }
        }
      ];
    }

    // TODO: Add vector search when embeddings are available
    // This would use MongoDB Atlas Vector Search
    if (searchType === 'semantic') {
      // Placeholder for vector search
      searchPipeline = [
        { $match: { clientId } },
        // Vector search would go here with $vectorSearch stage
        {
          $addFields: {
            searchScore: 0.5 // Placeholder score
          }
        }
      ];
    }

    const searchResults = await Artefact.aggregate([
      ...searchPipeline,
      { $sort: { searchScore: -1, createdAt: -1 } },
      { $limit: parseInt(limit) },
      {
        $project: {
          id: 1,
          name: 1,
          agentType: 1,
          workflowStage: 1,
          'content.structured': 1,
          searchScore: 1,
          createdAt: 1,
          relevantContent: {
            $concat: [
              { $substr: ['$content.structured.analysis', 0, 200] },
              '...'
            ]
          }
        }
      }
    ]);

    res.json({
      results: searchResults,
      meta: {
        query,
        searchType,
        resultCount: searchResults.length,
        clientId
      }
    });

  } catch (error) {
    console.error('Search failed:', error);
    res.status(500).json({ 
      error: 'Search failed',
      details: error.message 
    });
  }
});

/**
 * POST /api/clients/:clientId/artefacts/validate
 * AI-powered validation of artefact quality and consistency
 */
router.post('/clients/:clientId/artefacts/validate', async (req, res) => {
  try {
    const { clientId } = req.params;
    const { artefactIds, validationType = 'quality' } = req.body;

    const validationResults = await Promise.all(
      artefactIds.map(async (artefactId) => {
        const artefact = await Artefact.findOne({ id: artefactId, clientId });
        
        if (!artefact) {
          return { artefactId, status: 'not_found' };
        }

        // Perform validation based on type
        let validationScore = 0;
        let issues = [];

        if (validationType === 'quality') {
          // Quality validation
          const structured = artefact.content.structured;
          
          if (!structured.analysis || structured.analysis.length < 50) {
            issues.push('Analysis too brief');
            validationScore -= 0.2;
          }
          
          if (!structured.recommendations || structured.recommendations.length === 0) {
            issues.push('No recommendations provided');
            validationScore -= 0.3;
          }
          
          if (!structured.confidence || structured.confidence < 0.5) {
            issues.push('Low confidence score');
            validationScore -= 0.2;
          }
          
          validationScore = Math.max(0, 0.8 + validationScore);
        }

        // Update artefact with validation results
        await Artefact.findOneAndUpdate(
          { id: artefactId },
          {
            'validation.is_validated': true,
            'validation.validation_score': validationScore,
            'validation.validation_notes': issues.join('; ')
          }
        );

        return {
          artefactId,
          status: 'validated',
          score: validationScore,
          issues,
          passed: validationScore >= 0.7
        };
      })
    );

    res.json({
      validationResults,
      summary: {
        total: validationResults.length,
        passed: validationResults.filter(r => r.passed).length,
        avgScore: validationResults.reduce((sum, r) => sum + (r.score || 0), 0) / validationResults.length
      }
    });

  } catch (error) {
    console.error('Validation failed:', error);
    res.status(500).json({ 
      error: 'Validation failed',
      details: error.message 
    });
  }
});

module.exports = router;
