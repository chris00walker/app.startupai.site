/**
 * Individual Canvas API Routes
 * 
 * CRUD operations for specific canvas instances
 * Supports GET, PUT, DELETE operations
 */

import { Canvas } from '@/lib/models/Canvas';
import { CanvasGeneratorAgent } from '@/lib/agents/CanvasGeneratorAgent';
import { VisualRenderingService } from '@/lib/services/VisualRenderingService';
import { connectDB } from '@/lib/db';

// Initialize services
let canvasGenerator;
let visualRenderer;

const initializeServices = async () => {
  if (!canvasGenerator) {
    canvasGenerator = new CanvasGeneratorAgent({
      openaiApiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4',
      temperature: 0.7
    });
  }
  
  if (!visualRenderer) {
    visualRenderer = new VisualRenderingService({
      cacheEnabled: true,
      maxConcurrentRenders: 5,
      defaultTheme: 'professional'
    });
  }
};

export default async function handler(req, res) {
  await connectDB();
  await initializeServices();

  const { method, query: { id } } = req;

  // Validate canvas ID
  if (!id) {
    return res.status(400).json({ error: 'Canvas ID is required' });
  }

  try {
    switch (method) {
      case 'GET':
        return await handleGet(req, res, id);
      case 'PUT':
        return await handlePut(req, res, id);
      case 'DELETE':
        return await handleDelete(req, res, id);
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Canvas API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// GET /api/canvas/[id] - Get specific canvas
async function handleGet(req, res, canvasId) {
  try {
    const canvas = await Canvas.findById(canvasId)
      .populate('clientId', 'name email')
      .lean();

    if (!canvas) {
      return res.status(404).json({ error: 'Canvas not found' });
    }

    // Add client name for easier frontend display
    const canvasWithClientName = {
      ...canvas,
      clientName: canvas.clientId?.name || 'Unknown Client'
    };

    return res.status(200).json(canvasWithClientName);
  } catch (error) {
    console.error('Error fetching canvas:', error);
    return res.status(500).json({ error: 'Failed to fetch canvas' });
  }
}

// PUT /api/canvas/[id] - Update canvas
async function handlePut(req, res, canvasId) {
  const { 
    name,
    description,
    data,
    regenerateVisual = false 
  } = req.body;

  try {
    // Find existing canvas
    const existingCanvas = await Canvas.findById(canvasId);
    if (!existingCanvas) {
      return res.status(404).json({ error: 'Canvas not found' });
    }

    // Update fields
    const updateData = {
      updatedAt: new Date()
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (data !== undefined) {
      updateData.data = data;
      updateData['metadata.version'] = (existingCanvas.metadata?.version || 0) + 1;
    }

    // Regenerate visual if requested or data changed significantly
    if (regenerateVisual || (data && hasSignificantDataChanges(existingCanvas.data, data))) {
      try {
        // Assess canvas quality
        const tempCanvas = { ...existingCanvas.toObject(), data: data || existingCanvas.data };
        const qualityAssessment = await canvasGenerator.assessCanvasQuality(tempCanvas);
        
        updateData['metadata.qualityScore'] = qualityAssessment.score;

        // Generate visual if quality is sufficient
        if (qualityAssessment.score >= 0.3) {
          const visualResult = await canvasGenerator.generateVisualCanvas(tempCanvas, {
            format: 'svg',
            theme: existingCanvas.visualAssets?.theme || 'professional',
            includeMetadata: true
          });

          if (visualResult.success) {
            updateData.visualAssets = {
              svg: visualResult.content,
              formats: ['svg'],
              theme: existingCanvas.visualAssets?.theme || 'professional',
              generatedAt: new Date()
            };
            updateData.visualGenerated = true;
            updateData.visualGeneratedAt = new Date();
            updateData.visualQualityScore = qualityAssessment.score;
          }
        }
      } catch (visualError) {
        console.error('Visual regeneration failed:', visualError);
        // Continue without visual - not a blocking error
      }
    }

    // Update canvas
    const updatedCanvas = await Canvas.findByIdAndUpdate(
      canvasId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('clientId', 'name email');

    return res.status(200).json({
      ...updatedCanvas.toObject(),
      clientName: updatedCanvas.clientId?.name || 'Unknown Client'
    });
  } catch (error) {
    console.error('Error updating canvas:', error);
    return res.status(500).json({ error: 'Failed to update canvas' });
  }
}

// DELETE /api/canvas/[id] - Delete canvas
async function handleDelete(req, res, canvasId) {
  try {
    const deletedCanvas = await Canvas.findByIdAndDelete(canvasId);
    
    if (!deletedCanvas) {
      return res.status(404).json({ error: 'Canvas not found' });
    }

    // TODO: Clean up associated visual assets from storage if needed

    return res.status(200).json({ 
      message: 'Canvas deleted successfully',
      deletedId: canvasId 
    });
  } catch (error) {
    console.error('Error deleting canvas:', error);
    return res.status(500).json({ error: 'Failed to delete canvas' });
  }
}

// Helper function to detect significant data changes
function hasSignificantDataChanges(oldData, newData) {
  if (!oldData || !newData) return true;

  // Convert to strings for comparison
  const oldStr = JSON.stringify(oldData);
  const newStr = JSON.stringify(newData);
  
  // If strings are different, check if the difference is significant
  if (oldStr !== newStr) {
    // Calculate change ratio (simple heuristic)
    const changeRatio = Math.abs(oldStr.length - newStr.length) / Math.max(oldStr.length, newStr.length);
    return changeRatio > 0.1; // 10% change threshold
  }
  
  return false;
}
