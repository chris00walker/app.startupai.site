/**
 * Canvas Generator Agent - Converts structured canvas data into visual formats
 * Part of Sprint 3: Canvas Generation & Visualization
 * 
 * Responsibilities:
 * - Generate SVG visualizations from canvas data
 * - Create PDF exports for client deliverables
 * - Maintain Strategyzer visual standards
 * - Provide canvas quality assessment
 * - Support multiple export formats
 */

import BaseAgent from '../core/BaseAgent.js';
import Canvas from '../../models/canvasModel.js';
import fs from 'fs/promises';
import path from 'path';

export default class CanvasGeneratorAgent extends BaseAgent {
  constructor(options = {}) {
    super(options);
    
    // Set agent-specific properties
    this.preferences.agentType = 'canvas-generator';
    
    // Override preferences with constructor options
    if (options.model) this.preferences.model = options.model;
    if (options.maxTokens) this.preferences.maxTokens = options.maxTokens;
    if (options.temperature) this.preferences.temperature = options.temperature;

    this.canvasType = 'visual';
    
    // Canvas generation configuration
    this.visualConfig = {
      formats: ['svg', 'png', 'pdf'],
      defaultWidth: 1200,
      defaultHeight: 800,
      strategyzrBranding: true,
      qualityThreshold: 0.7
    };

    // Initialize logger with agent context
    if (this.logger && typeof this.logger.child === 'function') {
      this.logger = this.logger.child({ agent: 'CanvasGeneratorAgent' });
    } else {
      this.logger = {
        info: (msg, data) => console.log(`[CanvasGeneratorAgent] ${msg}`, data || ''),
        error: (msg, data) => console.error(`[CanvasGeneratorAgent] ${msg}`, data || ''),
        warn: (msg, data) => console.warn(`[CanvasGeneratorAgent] ${msg}`, data || ''),
        debug: (msg, data) => console.debug(`[CanvasGeneratorAgent] ${msg}`, data || '')
      };
    }

    this.logger.info('CanvasGeneratorAgent initialized', {
      agentType: this.preferences.agentType,
      visualConfig: this.visualConfig
    });
  }

  /**
   * Generate visual canvas from structured data
   * @param {string} canvasId - Canvas ID to generate visuals for
   * @param {Object} options - Generation options
   * @returns {Object} Generated visual assets
   */
  async generateVisualCanvas(canvasId, options = {}) {
    const startTime = Date.now();
    
    try {
      this.logger.info('Starting visual canvas generation', { canvasId, options });

      // Fetch canvas data
      const canvas = await Canvas.findById(canvasId);
      if (!canvas) {
        throw new Error(`Canvas not found: ${canvasId}`);
      }

      // Validate canvas data quality
      const qualityScore = this.assessCanvasQuality(canvas);
      if (qualityScore < this.visualConfig.qualityThreshold) {
        this.logger.warn('Canvas quality below threshold', { 
          canvasId, 
          qualityScore, 
          threshold: this.visualConfig.qualityThreshold 
        });
      }

      // Generate visual assets based on canvas type
      let visualAssets = {};
      
      switch (canvas.type) {
        case 'valueProposition':
          visualAssets = await this.generateVPCVisual(canvas, options);
          break;
        case 'businessModel':
          visualAssets = await this.generateBMCVisual(canvas, options);
          break;
        case 'testingBusinessIdeas':
          visualAssets = await this.generateTBIVisual(canvas, options);
          break;
        default:
          throw new Error(`Unsupported canvas type: ${canvas.type}`);
      }

      // Update canvas with visual metadata
      await this.updateCanvasVisualMetadata(canvasId, visualAssets, qualityScore);

      const processingTime = Date.now() - startTime;
      
      this.logger.info('Visual canvas generation completed', {
        canvasId,
        processingTime,
        formats: Object.keys(visualAssets),
        qualityScore
      });

      return {
        canvasId,
        visualAssets,
        qualityScore,
        processingTime,
        metadata: {
          generatedAt: new Date(),
          agentVersion: 'canvas-generator-v1',
          formats: Object.keys(visualAssets)
        }
      };

    } catch (error) {
      this.logger.error('Visual canvas generation failed', { 
        canvasId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Generate Value Proposition Canvas visual
   * @param {Object} canvas - Canvas data
   * @param {Object} options - Generation options
   * @returns {Object} Visual assets
   */
  async generateVPCVisual(canvas, options = {}) {
    this.logger.info('Generating Value Proposition Canvas visual', { 
      canvasId: canvas._id 
    });

    const vpcData = canvas.data;
    
    // Generate SVG
    const svgContent = this.createVPCSVG(vpcData, options);
    
    // Generate additional formats if requested
    const visualAssets = {
      svg: {
        content: svgContent,
        mimeType: 'image/svg+xml',
        size: svgContent.length
      }
    };

    // Add PNG generation if requested
    if (options.formats?.includes('png')) {
      visualAssets.png = await this.convertSVGToPNG(svgContent, options);
    }

    // Add PDF generation if requested
    if (options.formats?.includes('pdf')) {
      visualAssets.pdf = await this.generateVPCPDF(vpcData, options);
    }

    return visualAssets;
  }

  /**
   * Generate Business Model Canvas visual
   * @param {Object} canvas - Canvas data
   * @param {Object} options - Generation options
   * @returns {Object} Visual assets
   */
  async generateBMCVisual(canvas, options = {}) {
    this.logger.info('Generating Business Model Canvas visual', { 
      canvasId: canvas._id 
    });

    const bmcData = canvas.data;
    
    // Generate SVG
    const svgContent = this.createBMCSVG(bmcData, options);
    
    const visualAssets = {
      svg: {
        content: svgContent,
        mimeType: 'image/svg+xml',
        size: svgContent.length
      }
    };

    // Add additional formats if requested
    if (options.formats?.includes('png')) {
      visualAssets.png = await this.convertSVGToPNG(svgContent, options);
    }

    if (options.formats?.includes('pdf')) {
      visualAssets.pdf = await this.generateBMCPDF(bmcData, options);
    }

    return visualAssets;
  }

  /**
   * Generate Testing Business Ideas visual
   * @param {Object} canvas - Canvas data
   * @param {Object} options - Generation options
   * @returns {Object} Visual assets
   */
  async generateTBIVisual(canvas, options = {}) {
    this.logger.info('Generating Testing Business Ideas visual', { 
      canvasId: canvas._id 
    });

    const tbiData = canvas.data;
    
    // Generate SVG for experiment design
    const svgContent = this.createTBISVG(tbiData, options);
    
    return {
      svg: {
        content: svgContent,
        mimeType: 'image/svg+xml',
        size: svgContent.length
      }
    };
  }

  /**
   * Create SVG for Value Proposition Canvas
   * @param {Object} vpcData - VPC data
   * @param {Object} options - Rendering options
   * @returns {string} SVG content
   */
  createVPCSVG(vpcData, options = {}) {
    const width = options.width || this.visualConfig.defaultWidth;
    const height = options.height || this.visualConfig.defaultHeight;
    
    // VPC layout: Customer Profile (left) and Value Map (right)
    const svgContent = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>
            .vpc-title { font-family: Arial, sans-serif; font-size: 24px; font-weight: bold; fill: #2c3e50; }
            .vpc-section-title { font-family: Arial, sans-serif; font-size: 18px; font-weight: bold; fill: #34495e; }
            .vpc-text { font-family: Arial, sans-serif; font-size: 14px; fill: #2c3e50; }
            .vpc-customer-section { fill: #e8f4f8; stroke: #3498db; stroke-width: 2; }
            .vpc-value-section { fill: #f8e8e8; stroke: #e74c3c; stroke-width: 2; }
            .vpc-border { fill: none; stroke: #bdc3c7; stroke-width: 1; }
          </style>
        </defs>
        
        <!-- Title -->
        <text x="${width/2}" y="30" text-anchor="middle" class="vpc-title">Value Proposition Canvas</text>
        
        <!-- Customer Profile Section (Left) -->
        <rect x="50" y="60" width="${width/2 - 75}" height="${height - 120}" class="vpc-customer-section" rx="10"/>
        <text x="75" y="85" class="vpc-section-title">Customer Profile</text>
        
        <!-- Customer Jobs -->
        <text x="75" y="120" class="vpc-section-title">Jobs</text>
        ${this.renderVPCItems(vpcData.customerProfile?.customerJobs || [], 75, 140, width/2 - 150)}
        
        <!-- Customer Pains -->
        <text x="75" y="${height/3 + 60}" class="vpc-section-title">Pains</text>
        ${this.renderVPCItems(vpcData.customerProfile?.pains || [], 75, height/3 + 80, width/2 - 150)}
        
        <!-- Customer Gains -->
        <text x="75" y="${2*height/3 + 20}" class="vpc-section-title">Gains</text>
        ${this.renderVPCItems(vpcData.customerProfile?.gains || [], 75, 2*height/3 + 40, width/2 - 150)}
        
        <!-- Value Map Section (Right) -->
        <rect x="${width/2 + 25}" y="60" width="${width/2 - 75}" height="${height - 120}" class="vpc-value-section" rx="10"/>
        <text x="${width/2 + 50}" y="85" class="vpc-section-title">Value Map</text>
        
        <!-- Products & Services -->
        <text x="${width/2 + 50}" y="120" class="vpc-section-title">Products & Services</text>
        ${this.renderVPCItems(vpcData.valueMap?.products || [], width/2 + 50, 140, width/2 - 150)}
        
        <!-- Pain Relievers -->
        <text x="${width/2 + 50}" y="${height/3 + 60}" class="vpc-section-title">Pain Relievers</text>
        ${this.renderVPCItems(vpcData.valueMap?.painRelievers || [], width/2 + 50, height/3 + 80, width/2 - 150)}
        
        <!-- Gain Creators -->
        <text x="${width/2 + 50}" y="${2*height/3 + 20}" class="vpc-section-title">Gain Creators</text>
        ${this.renderVPCItems(vpcData.valueMap?.gainCreators || [], width/2 + 50, 2*height/3 + 40, width/2 - 150)}
        
        <!-- Strategyzer Branding -->
        ${this.visualConfig.strategyzrBranding ? this.addStrategyzrBranding(width, height) : ''}
      </svg>
    `;

    return svgContent.trim();
  }

  /**
   * Create SVG for Business Model Canvas
   * @param {Object} bmcData - BMC data
   * @param {Object} options - Rendering options
   * @returns {string} SVG content
   */
  createBMCSVG(bmcData, options = {}) {
    const width = options.width || this.visualConfig.defaultWidth;
    const height = options.height || this.visualConfig.defaultHeight;
    
    // BMC 3x3 grid layout
    const cellWidth = (width - 100) / 3;
    const cellHeight = (height - 150) / 3;
    
    const svgContent = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>
            .bmc-title { font-family: Arial, sans-serif; font-size: 24px; font-weight: bold; fill: #2c3e50; }
            .bmc-section-title { font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; fill: #34495e; }
            .bmc-text { font-family: Arial, sans-serif; font-size: 12px; fill: #2c3e50; }
            .bmc-cell { fill: #f8f9fa; stroke: #495057; stroke-width: 2; }
            .bmc-value-cell { fill: #fff3cd; stroke: #856404; stroke-width: 2; }
          </style>
        </defs>
        
        <!-- Title -->
        <text x="${width/2}" y="30" text-anchor="middle" class="bmc-title">Business Model Canvas</text>
        
        <!-- Row 1: Key Partners, Key Activities, Value Propositions, Customer Relationships, Customer Segments -->
        <rect x="50" y="60" width="${cellWidth}" height="${cellHeight}" class="bmc-cell" rx="5"/>
        <text x="60" y="80" class="bmc-section-title">Key Partners</text>
        ${this.renderBMCItems(bmcData.keyPartners || [], 60, 100, cellWidth - 20)}
        
        <rect x="${50 + cellWidth}" y="60" width="${cellWidth}" height="${cellHeight}" class="bmc-cell" rx="5"/>
        <text x="${60 + cellWidth}" y="80" class="bmc-section-title">Key Activities</text>
        ${this.renderBMCItems(bmcData.keyActivities || [], 60 + cellWidth, 100, cellWidth - 20)}
        
        <rect x="${50 + 2*cellWidth}" y="60" width="${cellWidth}" height="${cellHeight}" class="bmc-value-cell" rx="5"/>
        <text x="${60 + 2*cellWidth}" y="80" class="bmc-section-title">Value Propositions</text>
        ${this.renderBMCItems(bmcData.valuePropositions || [], 60 + 2*cellWidth, 100, cellWidth - 20)}
        
        <!-- Row 2: Key Resources, Cost Structure, Revenue Streams -->
        <rect x="50" y="${60 + cellHeight}" width="${cellWidth}" height="${cellHeight}" class="bmc-cell" rx="5"/>
        <text x="60" y="${80 + cellHeight}" class="bmc-section-title">Key Resources</text>
        ${this.renderBMCItems(bmcData.keyResources || [], 60, 100 + cellHeight, cellWidth - 20)}
        
        <rect x="${50 + cellWidth}" y="${60 + cellHeight}" width="${cellWidth}" height="${cellHeight}" class="bmc-cell" rx="5"/>
        <text x="${60 + cellWidth}" y="${80 + cellHeight}" class="bmc-section-title">Customer Relationships</text>
        ${this.renderBMCItems(bmcData.customerRelationships || [], 60 + cellWidth, 100 + cellHeight, cellWidth - 20)}
        
        <rect x="${50 + 2*cellWidth}" y="${60 + cellHeight}" width="${cellWidth}" height="${cellHeight}" class="bmc-cell" rx="5"/>
        <text x="${60 + 2*cellWidth}" y="${80 + cellHeight}" class="bmc-section-title">Channels</text>
        ${this.renderBMCItems(bmcData.channels || [], 60 + 2*cellWidth, 100 + cellHeight, cellWidth - 20)}
        
        <!-- Row 3: Cost Structure, Revenue Streams -->
        <rect x="50" y="${60 + 2*cellHeight}" width="${cellWidth * 1.5}" height="${cellHeight}" class="bmc-cell" rx="5"/>
        <text x="60" y="${80 + 2*cellHeight}" class="bmc-section-title">Cost Structure</text>
        ${this.renderBMCItems(bmcData.costStructure || [], 60, 100 + 2*cellHeight, cellWidth * 1.5 - 20)}
        
        <rect x="${50 + cellWidth * 1.5}" y="${60 + 2*cellHeight}" width="${cellWidth * 1.5}" height="${cellHeight}" class="bmc-cell" rx="5"/>
        <text x="${60 + cellWidth * 1.5}" y="${80 + 2*cellHeight}" class="bmc-section-title">Revenue Streams</text>
        ${this.renderBMCItems(bmcData.revenueStreams || [], 60 + cellWidth * 1.5, 100 + 2*cellHeight, cellWidth * 1.5 - 20)}
        
        <!-- Customer Segments (right side) -->
        <rect x="${50 + 2*cellWidth}" y="${60 + 2*cellHeight}" width="${cellWidth}" height="${cellHeight}" class="bmc-cell" rx="5"/>
        <text x="${60 + 2*cellWidth}" y="${80 + 2*cellHeight}" class="bmc-section-title">Customer Segments</text>
        ${this.renderBMCItems(bmcData.customerSegments || [], 60 + 2*cellWidth, 100 + 2*cellHeight, cellWidth - 20)}
        
        <!-- Strategyzer Branding -->
        ${this.visualConfig.strategyzrBranding ? this.addStrategyzrBranding(width, height) : ''}
      </svg>
    `;

    return svgContent.trim();
  }

  /**
   * Create SVG for Testing Business Ideas
   * @param {Object} tbiData - TBI data
   * @param {Object} options - Rendering options
   * @returns {string} SVG content
   */
  createTBISVG(tbiData, options = {}) {
    const width = options.width || this.visualConfig.defaultWidth;
    const height = options.height || this.visualConfig.defaultHeight;
    
    // Simple TBI layout for experiments
    const svgContent = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>
            .tbi-title { font-family: Arial, sans-serif; font-size: 24px; font-weight: bold; fill: #2c3e50; }
            .tbi-section-title { font-family: Arial, sans-serif; font-size: 18px; font-weight: bold; fill: #34495e; }
            .tbi-text { font-family: Arial, sans-serif; font-size: 14px; fill: #2c3e50; }
            .tbi-cell { fill: #e8f5e8; stroke: #27ae60; stroke-width: 2; }
          </style>
        </defs>
        
        <!-- Title -->
        <text x="${width/2}" y="30" text-anchor="middle" class="tbi-title">Testing Business Ideas</text>
        
        <!-- Experiment Design -->
        <rect x="50" y="60" width="${width - 100}" height="${height/2 - 60}" class="tbi-cell" rx="10"/>
        <text x="75" y="85" class="tbi-section-title">Experiment Design</text>
        ${this.renderTBIContent(tbiData, 75, 110, width - 150)}
        
        <!-- Success Metrics -->
        <rect x="50" y="${height/2 + 20}" width="${width - 100}" height="${height/2 - 80}" class="tbi-cell" rx="10"/>
        <text x="75" y="${height/2 + 45}" class="tbi-section-title">Success Metrics</text>
        
        <!-- Strategyzer Branding -->
        ${this.visualConfig.strategyzrBranding ? this.addStrategyzrBranding(width, height) : ''}
      </svg>
    `;

    return svgContent.trim();
  }

  /**
   * Render VPC items as SVG text elements
   * @param {Array} items - Items to render
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} maxWidth - Maximum width
   * @returns {string} SVG text elements
   */
  renderVPCItems(items, x, y, maxWidth) {
    if (!items || items.length === 0) {
      return `<text x="${x}" y="${y + 20}" class="vpc-text">No items defined</text>`;
    }

    return items.slice(0, 5).map((item, index) => {
      const text = this.truncateText(item, 40);
      return `<text x="${x}" y="${y + 20 + (index * 25)}" class="vpc-text">• ${text}</text>`;
    }).join('\n');
  }

  /**
   * Render BMC items as SVG text elements
   * @param {Array} items - Items to render
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} maxWidth - Maximum width
   * @returns {string} SVG text elements
   */
  renderBMCItems(items, x, y, maxWidth) {
    if (!items || items.length === 0) {
      return `<text x="${x}" y="${y + 20}" class="bmc-text">No items defined</text>`;
    }

    return items.slice(0, 4).map((item, index) => {
      const text = this.truncateText(item, 30);
      return `<text x="${x}" y="${y + 20 + (index * 20)}" class="bmc-text">• ${text}</text>`;
    }).join('\n');
  }

  /**
   * Render TBI content
   * @param {Object} tbiData - TBI data
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} maxWidth - Maximum width
   * @returns {string} SVG content
   */
  renderTBIContent(tbiData, x, y, maxWidth) {
    const experiments = tbiData.experiments || [];
    if (experiments.length === 0) {
      return `<text x="${x}" y="${y + 20}" class="tbi-text">No experiments defined</text>`;
    }

    return experiments.slice(0, 3).map((experiment, index) => {
      // Handle both string and object formats
      const experimentName = typeof experiment === 'string' ? experiment : experiment.name;
      const text = this.truncateText(experimentName, 60);
      return `<text x="${x}" y="${y + 20 + (index * 25)}" class="tbi-text">• ${text}</text>`;
    }).join('\n');
  }

  /**
   * Add Strategyzer branding to SVG
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @returns {string} Branding SVG elements
   */
  addStrategyzrBranding(width, height) {
    return `
      <text x="${width - 150}" y="${height - 20}" class="vpc-text" font-size="12" fill="#95a5a6">
        Generated by Strategyzer AI
      </text>
    `;
  }

  /**
   * Truncate text to fit within visual constraints
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated text
   */
  truncateText(text, maxLength) {
    if (!text || typeof text !== 'string') return '';
    return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
  }

  /**
   * Convert SVG to PNG (placeholder implementation)
   * @param {string} svgContent - SVG content
   * @param {Object} options - Conversion options
   * @returns {Object} PNG data
   */
  async convertSVGToPNG(svgContent, options = {}) {
    // TODO: Implement actual SVG to PNG conversion using sharp or similar
    this.logger.info('PNG conversion requested (placeholder implementation)');
    
    return {
      content: Buffer.from('PNG placeholder'),
      mimeType: 'image/png',
      size: 1024
    };
  }

  /**
   * Generate PDF for VPC (placeholder implementation)
   * @param {Object} vpcData - VPC data
   * @param {Object} options - PDF options
   * @returns {Object} PDF data
   */
  async generateVPCPDF(vpcData, options = {}) {
    // TODO: Implement actual PDF generation using puppeteer or similar
    this.logger.info('VPC PDF generation requested (placeholder implementation)');
    
    return {
      content: Buffer.from('PDF placeholder'),
      mimeType: 'application/pdf',
      size: 2048
    };
  }

  /**
   * Generate PDF for BMC (placeholder implementation)
   * @param {Object} bmcData - BMC data
   * @param {Object} options - PDF options
   * @returns {Object} PDF data
   */
  async generateBMCPDF(bmcData, options = {}) {
    // TODO: Implement actual PDF generation
    this.logger.info('BMC PDF generation requested (placeholder implementation)');
    
    return {
      content: Buffer.from('PDF placeholder'),
      mimeType: 'application/pdf',
      size: 2048
    };
  }

  /**
   * Assess canvas quality for visual generation
   * @param {Object} canvas - Canvas object
   * @returns {number} Quality score (0-1)
   */
  assessCanvasQuality(canvas) {
    if (!canvas || !canvas.data) return 0;

    let score = 0;
    let totalFields = 0;

    const data = canvas.data;

    // Count populated fields based on canvas type
    if (canvas.type === 'valueProposition') {
      // VPC has nested structure: customerProfile and valueMap
      const customerProfileFields = ['customerJobs', 'pains', 'gains'];
      const valueMapFields = ['products', 'painRelievers', 'gainCreators'];
      
      customerProfileFields.forEach(field => {
        totalFields++;
        if (data.customerProfile && data.customerProfile[field] && 
            Array.isArray(data.customerProfile[field]) && data.customerProfile[field].length > 0) {
          score++;
        }
      });
      
      valueMapFields.forEach(field => {
        totalFields++;
        if (data.valueMap && data.valueMap[field] && 
            Array.isArray(data.valueMap[field]) && data.valueMap[field].length > 0) {
          score++;
        }
      });
    } else if (canvas.type === 'businessModel') {
      const fields = [
        'keyPartners', 'keyActivities', 'keyResources', 'valuePropositions',
        'customerRelationships', 'channels', 'customerSegments', 
        'costStructure', 'revenueStreams'
      ];
      fields.forEach(field => {
        totalFields++;
        if (data[field] && Array.isArray(data[field]) && data[field].length > 0) {
          score++;
        }
      });
    }

    return totalFields > 0 ? score / totalFields : 0;
  }

  /**
   * Update canvas with visual metadata
   * @param {string} canvasId - Canvas ID
   * @param {Object} visualAssets - Generated visual assets
   * @param {number} qualityScore - Quality score
   */
  async updateCanvasVisualMetadata(canvasId, visualAssets, qualityScore) {
    try {
      await Canvas.findByIdAndUpdate(canvasId, {
        $set: {
          'metadata.visualGenerated': true,
          'metadata.visualGeneratedAt': new Date(),
          'metadata.visualQualityScore': qualityScore,
          'metadata.visualFormats': Object.keys(visualAssets),
          'metadata.visualAssetSizes': Object.fromEntries(
            Object.entries(visualAssets).map(([format, asset]) => [format, asset.size])
          )
        }
      });

      this.logger.info('Canvas visual metadata updated', { canvasId, qualityScore });
    } catch (error) {
      this.logger.error('Failed to update canvas visual metadata', { 
        canvasId, 
        error: error.message 
      });
    }
  }
}
