/**
 * Canvas Visual Generation API Route
 * 
 * Generates visual representations of canvases using the Visual Rendering Service
 * Supports different themes, formats, and real-time generation
 */

import { Canvas } from '@/lib/models/Canvas';
import { VisualRenderingService } from '@/lib/services/VisualRenderingService';
import { connectDB } from '@/lib/db';

// Initialize Visual Rendering Service
let visualRenderer;

const initializeService = async () => {
  if (!visualRenderer) {
    visualRenderer = new VisualRenderingService({
      cacheEnabled: true,
      maxConcurrentRenders: 5,
      defaultTheme: 'professional',
      defaultDPI: 300
    });
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  await connectDB();
  await initializeService();

  const { query: { id }, body } = req;
  const {
    theme = 'professional',
    format = 'svg',
    width = 1200,
    height = 800,
    dpi = 300,
    includeMetadata = true,
    forceRegenerate = false
  } = body;

  // Validate canvas ID
  if (!id) {
    return res.status(400).json({ error: 'Canvas ID is required' });
  }

  // Validate format
  if (!['svg', 'png', 'pdf'].includes(format.toLowerCase())) {
    return res.status(400).json({ error: 'Invalid format. Supported: svg, png, pdf' });
  }

  // Validate theme
  if (!['professional', 'creative', 'minimal'].includes(theme)) {
    return res.status(400).json({ error: 'Invalid theme. Supported: professional, creative, minimal' });
  }

  try {
    // Find canvas
    const canvas = await Canvas.findById(id).lean();
    if (!canvas) {
      return res.status(404).json({ error: 'Canvas not found' });
    }

    // Check if visual already exists and is current
    const cacheKey = `${id}-${theme}-${format}-${width}x${height}`;
    const hasCurrentVisual = canvas.visualAssets && 
      canvas.visualAssets.theme === theme &&
      canvas.visualAssets.formats?.includes(format) &&
      !forceRegenerate;

    let visualContent;
    let metadata = {};

    if (hasCurrentVisual && format === 'svg') {
      // Return cached SVG
      visualContent = canvas.visualAssets.svg;
      metadata = {
        cached: true,
        generatedAt: canvas.visualAssets.generatedAt,
        theme: canvas.visualAssets.theme
      };
    } else {
      // Generate new visual
      const renderOptions = {
        format: format.toLowerCase(),
        theme,
        width: parseInt(width),
        height: parseInt(height),
        dpi: parseInt(dpi),
        includeMetadata
      };

      const renderResult = await visualRenderer.renderCanvas(canvas, renderOptions);

      if (!renderResult.success) {
        return res.status(500).json({ 
          error: 'Visual generation failed',
          message: renderResult.error 
        });
      }

      visualContent = renderResult.content;
      metadata = renderResult.metadata;

      // Update canvas with new visual assets (for SVG format)
      if (format.toLowerCase() === 'svg') {
        await Canvas.findByIdAndUpdate(id, {
          $set: {
            visualAssets: {
              svg: visualContent,
              formats: ['svg'],
              theme,
              generatedAt: new Date()
            },
            visualGenerated: true,
            visualGeneratedAt: new Date(),
            visualQualityScore: canvas.metadata?.qualityScore || 0
          }
        });
      }
    }

    // Set appropriate content type
    const contentTypes = {
      svg: 'image/svg+xml',
      png: 'image/png',
      pdf: 'application/pdf'
    };

    // For SVG, return as JSON with content
    if (format.toLowerCase() === 'svg') {
      return res.status(200).json({
        success: true,
        content: visualContent,
        metadata: {
          ...metadata,
          format,
          theme,
          dimensions: { width: parseInt(width), height: parseInt(height) },
          canvasId: id,
          canvasType: canvas.type,
          generatedAt: new Date().toISOString()
        }
      });
    }

    // For binary formats (PNG, PDF), return as buffer
    res.setHeader('Content-Type', contentTypes[format.toLowerCase()]);
    res.setHeader('Content-Disposition', `inline; filename="canvas-${id}.${format}"`);
    
    if (typeof visualContent === 'string') {
      // Convert base64 to buffer if needed
      const buffer = Buffer.from(visualContent, 'base64');
      return res.status(200).send(buffer);
    } else {
      // Already a buffer
      return res.status(200).send(visualContent);
    }

  } catch (error) {
    console.error('Visual generation error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate visual',
      message: error.message 
    });
  }
}
