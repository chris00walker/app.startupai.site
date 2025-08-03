/**
 * Canvas Export API Route
 * 
 * Handles canvas export in multiple formats with professional quality
 * Integrates with Visual Rendering Service for high-quality outputs
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
      maxConcurrentRenders: 3,
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
    format = 'pdf',
    theme = 'professional',
    quality = 'high',
    includeMetadata = true,
    includeBranding = true
  } = body;

  // Validate canvas ID
  if (!id) {
    return res.status(400).json({ error: 'Canvas ID is required' });
  }

  // Validate format
  if (!['svg', 'png', 'pdf'].includes(format.toLowerCase())) {
    return res.status(400).json({ error: 'Invalid format. Supported: svg, png, pdf' });
  }

  try {
    // Find canvas
    const canvas = await Canvas.findById(id)
      .populate('clientId', 'name email')
      .lean();
      
    if (!canvas) {
      return res.status(404).json({ error: 'Canvas not found' });
    }

    // Determine export dimensions based on format and quality
    const exportConfigs = {
      svg: { width: 1200, height: 800, dpi: 96 },
      png: {
        low: { width: 800, height: 600, dpi: 150 },
        medium: { width: 1200, height: 800, dpi: 200 },
        high: { width: 1800, height: 1200, dpi: 300 },
        print: { width: 2400, height: 1600, dpi: 300 }
      },
      pdf: {
        low: { width: 1200, height: 800, dpi: 150 },
        medium: { width: 1200, height: 800, dpi: 200 },
        high: { width: 1200, height: 800, dpi: 300 },
        print: { width: 1200, height: 800, dpi: 300 }
      }
    };

    const config = format === 'svg' 
      ? exportConfigs.svg 
      : exportConfigs[format][quality] || exportConfigs[format].high;

    // Prepare render options
    const renderOptions = {
      format: format.toLowerCase(),
      theme,
      width: config.width,
      height: config.height,
      dpi: config.dpi,
      includeMetadata,
      includeBranding,
      exportQuality: quality
    };

    // Generate visual
    const renderResult = await visualRenderer.renderCanvas(canvas, renderOptions);

    if (!renderResult.success) {
      return res.status(500).json({ 
        error: 'Export generation failed',
        message: renderResult.error 
      });
    }

    // Prepare filename
    const canvasName = canvas.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'canvas';
    const clientName = canvas.clientId?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'client';
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${clientName}_${canvasName}_${timestamp}.${format}`;

    // Set response headers
    const contentTypes = {
      svg: 'image/svg+xml',
      png: 'image/png',
      pdf: 'application/pdf'
    };

    res.setHeader('Content-Type', contentTypes[format.toLowerCase()]);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');
    
    // Add export metadata headers
    res.setHeader('X-Canvas-ID', id);
    res.setHeader('X-Canvas-Type', canvas.type);
    res.setHeader('X-Export-Quality', quality);
    res.setHeader('X-Export-Theme', theme);
    res.setHeader('X-Generated-At', new Date().toISOString());

    // Log export activity
    console.log(`Canvas export: ${id} -> ${format} (${quality}) for client ${canvas.clientId?.name || 'unknown'}`);

    // Update canvas export statistics
    try {
      await Canvas.findByIdAndUpdate(id, {
        $inc: { 'metadata.exportCount': 1 },
        $set: { 'metadata.lastExportedAt': new Date() },
        $push: {
          'metadata.exportHistory': {
            format,
            quality,
            theme,
            exportedAt: new Date()
          }
        }
      });
    } catch (updateError) {
      console.error('Failed to update export statistics:', updateError);
      // Don't fail the export for this
    }

    // Return the generated content
    if (format.toLowerCase() === 'svg') {
      // SVG as text
      return res.status(200).send(renderResult.content);
    } else {
      // Binary formats
      if (typeof renderResult.content === 'string') {
        // Convert base64 to buffer
        const buffer = Buffer.from(renderResult.content, 'base64');
        return res.status(200).send(buffer);
      } else {
        // Already a buffer
        return res.status(200).send(renderResult.content);
      }
    }

  } catch (error) {
    console.error('Export error:', error);
    return res.status(500).json({ 
      error: 'Failed to export canvas',
      message: error.message 
    });
  }
}

// Configure Next.js API route for larger payloads
export const config = {
  api: {
    responseLimit: '10mb', // Allow larger exports
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}
