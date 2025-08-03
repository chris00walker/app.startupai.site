/**
 * Canvas API Routes
 * 
 * RESTful API endpoints for canvas CRUD operations
 * Integrates with Canvas Generator Agent and Visual Rendering Service
 */

import { Canvas } from '@/lib/models/Canvas';
import { CanvasGeneratorAgent } from '@/lib/agents/CanvasGeneratorAgent';
import { VisualRenderingService } from '@/lib/services/VisualRenderingService';
import { connectDB } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware/auth';

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

  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
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

// GET /api/canvas - List canvases with filtering and pagination
async function handleGet(req, res) {
  const { 
    page = 1, 
    limit = 20, 
    type, 
    clientId, 
    search,
    sortBy = 'updatedAt',
    sortOrder = 'desc'
  } = req.query;

  try {
    // Build query
    const query = {};
    
    if (type) {
      query.type = type;
    }
    
    if (clientId) {
      query.clientId = clientId;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const canvases = await Canvas.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('clientId', 'name email')
      .lean();

    // Get total count
    const total = await Canvas.countDocuments(query);

    // Add client name for easier frontend display
    const canvasesWithClientName = canvases.map(canvas => ({
      ...canvas,
      clientName: canvas.clientId?.name || 'Unknown Client'
    }));

    return res.status(200).json({
      canvases: canvasesWithClientName,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching canvases:', error);
    return res.status(500).json({ error: 'Failed to fetch canvases' });
  }
}

// POST /api/canvas - Create new canvas
async function handlePost(req, res) {
  const { 
    name,
    type,
    clientId,
    description,
    data = {},
    generateVisual = true 
  } = req.body;

  // Validation
  if (!name || !type || !clientId) {
    return res.status(400).json({ 
      error: 'Missing required fields: name, type, clientId' 
    });
  }

  if (!['valueProposition', 'businessModel', 'testingBusinessIdeas'].includes(type)) {
    return res.status(400).json({ 
      error: 'Invalid canvas type' 
    });
  }

  try {
    // Create canvas document
    const canvas = new Canvas({
      name,
      type,
      clientId,
      description,
      data,
      metadata: {
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        generatedAt: new Date(),
        qualityScore: 0
      }
    });

    // Generate visual if requested and canvas has sufficient data
    if (generateVisual && Object.keys(data).length > 0) {
      try {
        // Assess canvas quality
        const qualityAssessment = await canvasGenerator.assessCanvasQuality(canvas);
        canvas.metadata.qualityScore = qualityAssessment.score;

        // Generate visual if quality is sufficient
        if (qualityAssessment.score >= 0.3) { // 30% minimum for visual generation
          const visualResult = await canvasGenerator.generateVisualCanvas(canvas, {
            format: 'svg',
            theme: 'professional',
            includeMetadata: true
          });

          if (visualResult.success) {
            canvas.visualAssets = {
              svg: visualResult.content,
              formats: ['svg'],
              theme: 'professional',
              generatedAt: new Date()
            };
            canvas.visualGenerated = true;
            canvas.visualGeneratedAt = new Date();
            canvas.visualQualityScore = qualityAssessment.score;
          }
        }
      } catch (visualError) {
        console.error('Visual generation failed:', visualError);
        // Continue without visual - not a blocking error
      }
    }

    // Save canvas
    await canvas.save();

    // Populate client data for response
    await canvas.populate('clientId', 'name email');

    return res.status(201).json({
      ...canvas.toObject(),
      clientName: canvas.clientId?.name || 'Unknown Client'
    });
  } catch (error) {
    console.error('Error creating canvas:', error);
    return res.status(500).json({ error: 'Failed to create canvas' });
  }
}
