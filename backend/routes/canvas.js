import express from 'express';
import Canvas from '../models/canvasModel.js';
import ValuePropositionAgent from '../agents/strategyzer/ValuePropositionAgent.js';
import BusinessModelAgent from '../agents/strategyzer/BusinessModelAgent.js';
import VisualRenderingService from '../services/VisualRenderingService.js';
import CanvasGenerationWorkflow from '../workflows/canvasGenerationWorkflow.js';

const router = express.Router();

// Initialize services
const visualRenderer = new VisualRenderingService();
const vpAgent = new ValuePropositionAgent();
const bmAgent = new BusinessModelAgent();
const canvasWorkflow = new CanvasGenerationWorkflow();

/**
 * Get all canvases for a client
 */
router.get('/client/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const canvases = await Canvas.findByClient(clientId);
    
    res.json({
      success: true,
      canvases: canvases.map(canvas => ({
        id: canvas._id,
        type: canvas.type,
        title: canvas.title,
        status: canvas.status,
        completion: canvas.completeness,
        lastModified: canvas.updatedAt,
        aiGenerated: canvas.metadata?.aiGenerated || false,
        qualityScore: canvas.qualityScore
      }))
    });
  } catch (error) {
    console.error('Error fetching canvases:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch canvases' 
    });
  }
});

/**
 * Get specific canvas by ID
 */
router.get('/:canvasId', async (req, res) => {
  try {
    const { canvasId } = req.params;
    const canvas = await Canvas.findById(canvasId);
    
    if (!canvas) {
      return res.status(404).json({
        success: false,
        error: 'Canvas not found'
      });
    }
    
    res.json({
      success: true,
      canvas
    });
  } catch (error) {
    console.error('Error fetching canvas:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch canvas' 
    });
  }
});

/**
 * Generate Value Proposition Canvas using AI
 */
router.post('/generate/value-proposition', async (req, res) => {
  try {
    const { clientId, title, description } = req.body;
    
    if (!clientId) {
      return res.status(400).json({
        success: false,
        error: 'Client ID is required'
      });
    }
    
    // Generate canvas using AI agent
    const result = await vpAgent.generateCanvas({
      clientId,
      title: title || 'AI-Generated Value Proposition Canvas',
      description
    });
    
    res.json({
      success: true,
      canvas: result.canvas,
      qualityScore: result.qualityScore,
      executionTime: result.executionTime
    });
  } catch (error) {
    console.error('Error generating Value Proposition Canvas:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate Value Proposition Canvas' 
    });
  }
});

/**
 * Generate Business Model Canvas using AI
 */
router.post('/generate/business-model', async (req, res) => {
  try {
    const { clientId, title, description } = req.body;
    
    if (!clientId) {
      return res.status(400).json({
        success: false,
        error: 'Client ID is required'
      });
    }
    
    // Generate canvas using AI agent
    const result = await bmAgent.generateCanvas({
      clientId,
      title: title || 'AI-Generated Business Model Canvas',
      description
    });
    
    res.json({
      success: true,
      canvas: result.canvas,
      qualityScore: result.qualityScore,
      executionTime: result.executionTime
    });
  } catch (error) {
    console.error('Error generating Business Model Canvas:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate Business Model Canvas' 
    });
  }
});

/**
 * Export canvas as visual format (SVG, PNG, PDF)
 */
router.post('/:canvasId/export', async (req, res) => {
  try {
    const { canvasId } = req.params;
    const { format = 'svg', theme = 'professional' } = req.body;
    
    const canvas = await Canvas.findById(canvasId);
    if (!canvas) {
      return res.status(404).json({
        success: false,
        error: 'Canvas not found'
      });
    }
    
    // Generate visual export
    const exportResult = await visualRenderer.renderCanvas(canvas, {
      format,
      theme,
      includeMetadata: true
    });
    
    // Record export in canvas
    await canvas.recordExport(format, exportResult.url, exportResult.fileSize);
    
    res.json({
      success: true,
      export: {
        url: exportResult.url,
        format,
        fileSize: exportResult.fileSize,
        downloadUrl: `/api/canvas/download/${exportResult.filename}`
      }
    });
  } catch (error) {
    console.error('Error exporting canvas:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to export canvas' 
    });
  }
});

/**
 * Update canvas data
 */
router.put('/:canvasId', async (req, res) => {
  try {
    const { canvasId } = req.params;
    const { data, title, description } = req.body;
    
    const canvas = await Canvas.findById(canvasId);
    if (!canvas) {
      return res.status(404).json({
        success: false,
        error: 'Canvas not found'
      });
    }
    
    // Update canvas
    if (title) canvas.title = title;
    if (description) canvas.description = description;
    if (data) canvas.data = { ...canvas.data, ...data };
    
    // Create version for change tracking
    await canvas.createVersion(req.body, req.user?.id || 'system');
    await canvas.save();
    
    res.json({
      success: true,
      canvas
    });
  } catch (error) {
    console.error('Error updating canvas:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update canvas' 
    });
  }
});

/**
 * Delete canvas
 */
router.delete('/:canvasId', async (req, res) => {
  try {
    const { canvasId } = req.params;
    
    const canvas = await Canvas.findById(canvasId);
    if (!canvas) {
      return res.status(404).json({
        success: false,
        error: 'Canvas not found'
      });
    }
    
    await Canvas.findByIdAndDelete(canvasId);
    
    res.json({
      success: true,
      message: 'Canvas deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting canvas:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete canvas' 
    });
  }
});

/**
 * Generate complete Strategyzer framework (VP + BM canvases)
 */
router.post('/workflow/complete-framework', async (req, res) => {
  try {
    const { clientId, autoExport = true } = req.body;
    
    if (!clientId) {
      return res.status(400).json({
        success: false,
        error: 'Client ID is required'
      });
    }
    
    const result = await canvasWorkflow.generateCompleteFramework({
      clientId,
      autoExport
    });
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error generating complete framework:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate complete framework' 
    });
  }
});

/**
 * Get workflow status for client
 */
router.get('/workflow/status/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    
    const status = await canvasWorkflow.getWorkflowStatus(clientId);
    
    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    console.error('Error fetching workflow status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch workflow status' 
    });
  }
});

/**
 * Get canvas statistics
 */
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await Canvas.getStatistics();
    
    res.json({
      success: true,
      statistics: stats
    });
  } catch (error) {
    console.error('Error fetching canvas statistics:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch statistics' 
    });
  }
});

export default router;
