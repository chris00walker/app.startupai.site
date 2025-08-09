/**
 * Unit Tests: Canvas Generator Agent
 * Tests visual canvas generation, SVG creation, and export functionality
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';
import DatabaseTestHelper from '../../../utils/testHelpers.js';
import CanvasGeneratorAgent from '../../../../agents/canvas/CanvasGeneratorAgent.js';
import Canvas from '../../../../models/canvasModel.js';

describe('Canvas Generator Agent', () => {
  // database handled by helper
  let canvasGenerator;
  let testCanvas;

  beforeAll(async () => {
    await DatabaseTestHelper.connect();
  });

  afterAll(async () => {
    await DatabaseTestHelper.disconnect();
  });

  beforeEach(async () => {
    // Clear database
    await DatabaseTestHelper.clearDatabase();
    // Re-register schema
    if (!mongoose.models[Canvas.modelName]) {
      mongoose.model(Canvas.modelName, Canvas.schema);
    }

    // Initialize Canvas Generator Agent
    canvasGenerator = new CanvasGeneratorAgent({
      model: 'gpt-4o-mini',
      temperature: 0.1,
      maxTokens: 2000
    });

    // Create test canvas
    testCanvas = await Canvas.create({
      clientId: new mongoose.Types.ObjectId(),
      type: 'valueProposition',
      title: 'Test VPC',
      description: 'Test Value Proposition Canvas',
      data: {
        customerProfile: {
          customerJobs: [
            'Manage customer relationships effectively',
            'Track sales performance metrics'
          ],
          pains: [
            'Manual data entry is time-consuming',
            'Lack of real-time insights'
          ],
          gains: [
            'Automated reporting saves time',
            'Better customer insights'
          ]
        },
        valueMap: {
          products: [
            'CRM Software',
            'Analytics Dashboard'
          ],
          painRelievers: [
            'Automated data synchronization',
            'Real-time reporting'
          ],
          gainCreators: [
            'Advanced analytics',
            'Predictive insights'
          ]
        }
      },
      metadata: {
        agentId: 'vpc-agent-v1',
        qualityScore: 0.85,
        tokensUsed: 1500,
        generationCost: 0.003,
        aiModel: 'gpt-4o-mini'
      }
    });
  });

  describe('Agent Initialization', () => {
    it('should initialize with canvas-specific properties', () => {
      expect(canvasGenerator.preferences.agentType).toBe('canvas-generator');
      expect(canvasGenerator.canvasType).toBe('visual');
      expect(canvasGenerator.visualConfig).toBeDefined();
      expect(canvasGenerator.visualConfig.formats).toContain('svg');
      expect(canvasGenerator.visualConfig.formats).toContain('png');
      expect(canvasGenerator.visualConfig.formats).toContain('pdf');
    });

    it('should have proper visual configuration', () => {
      expect(canvasGenerator.visualConfig.defaultWidth).toBe(1200);
      expect(canvasGenerator.visualConfig.defaultHeight).toBe(800);
      expect(canvasGenerator.visualConfig.strategyzrBranding).toBe(true);
      expect(canvasGenerator.visualConfig.qualityThreshold).toBe(0.7);
    });
  });

  describe('Canvas Quality Assessment', () => {
    it('should assess VPC quality correctly', () => {
      const qualityScore = canvasGenerator.assessCanvasQuality(testCanvas);
      expect(qualityScore).toBeGreaterThan(0.8); // All 6 VPC fields are populated
      expect(qualityScore).toBeLessThanOrEqual(1.0);
    });

    it('should handle empty canvas data', () => {
      const emptyCanvas = {
        type: 'valueProposition',
        data: {}
      };
      const qualityScore = canvasGenerator.assessCanvasQuality(emptyCanvas);
      expect(qualityScore).toBe(0);
    });

    it('should assess BMC quality correctly', async () => {
      const bmcCanvas = await Canvas.create({
        clientId: new mongoose.Types.ObjectId(),
        type: 'businessModel',
        title: 'Test BMC',
        description: 'Test Business Model Canvas',
        data: {
          keyPartners: ['Technology providers', 'Strategic alliances'],
          keyActivities: ['Software development', 'Customer support'],
          keyResources: ['Development team', 'Technology platform'],
          valuePropositions: ['Automated CRM solution', 'Real-time analytics'],
          customerRelationships: ['Self-service', 'Personal assistance'],
          channels: ['Direct sales', 'Online platform'],
          customerSegments: ['Small businesses', 'Enterprise clients'],
          costStructure: ['Development costs', 'Infrastructure costs'],
          revenueStreams: ['Subscription fees', 'Professional services']
        },
        metadata: {
          agentId: 'bmc-agent-v1',
          qualityScore: 0.9,
          tokensUsed: 2000,
          generationCost: 0.004,
          aiModel: 'gpt-4o-mini'
        }
      });

      const qualityScore = canvasGenerator.assessCanvasQuality(bmcCanvas);
      expect(qualityScore).toBe(1.0); // All 9 BMC fields are populated
    });
  });

  describe('Visual Canvas Generation', () => {
    it('should generate visual assets for VPC', async () => {
      const result = await canvasGenerator.generateVisualCanvas(testCanvas._id, {
        formats: ['svg']
      });

      expect(result).toBeDefined();
      expect(result.canvasId).toEqual(testCanvas._id);
      expect(result.visualAssets).toBeDefined();
      expect(result.visualAssets.svg).toBeDefined();
      expect(result.visualAssets.svg.content).toContain('Value Proposition Canvas');
      expect(result.visualAssets.svg.mimeType).toBe('image/svg+xml');
      expect(result.qualityScore).toBeGreaterThan(0.8);
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('should generate visual assets for BMC', async () => {
      // Update test canvas to BMC type
      await Canvas.findByIdAndUpdate(testCanvas._id, {
        type: 'businessModel',
        data: {
          keyPartners: ['Technology providers'],
          keyActivities: ['Software development'],
          keyResources: ['Development team'],
          valuePropositions: ['Automated solution'],
          customerRelationships: ['Self-service'],
          channels: ['Direct sales'],
          customerSegments: ['Small businesses'],
          costStructure: ['Development costs'],
          revenueStreams: ['Subscription fees']
        }
      });

      // Create a new canvas version
      testCanvas = await Canvas.findById(testCanvas._id);
      await Canvas.version(testCanvas._id);

      const result = await canvasGenerator.generateVisualCanvas(testCanvas._id, {
        formats: ['svg']
      });

      expect(result.visualAssets.svg.content).toContain('Business Model Canvas');
      expect(result.visualAssets.svg.content).toContain('Key Partners');
      expect(result.visualAssets.svg.content).toContain('Value Propositions');
    });

    it('should handle multiple format generation', async () => {
      const result = await canvasGenerator.generateVisualCanvas(testCanvas._id, {
        formats: ['svg', 'png', 'pdf']
      });

      expect(result.visualAssets.svg).toBeDefined();
      expect(result.visualAssets.png).toBeDefined();
      expect(result.visualAssets.pdf).toBeDefined();
      expect(result.metadata.formats).toContain('svg');
      expect(result.metadata.formats).toContain('png');
      expect(result.metadata.formats).toContain('pdf');
    });

    it('should handle missing canvas gracefully', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      await expect(
        canvasGenerator.generateVisualCanvas(nonExistentId)
      ).rejects.toThrow('Canvas not found');
    });

    it('should handle unsupported canvas type', async () => {
      await Canvas.findByIdAndUpdate(testCanvas._id, {
        type: 'unsupportedType'
      });

      await expect(
        canvasGenerator.generateVisualCanvas(testCanvas._id)
      ).rejects.toThrow('Unsupported canvas type');
    });
  });

  describe('SVG Generation', () => {
    it('should create valid VPC SVG', () => {
      const vpcData = testCanvas.data;
      const svgContent = canvasGenerator.createVPCSVG(vpcData);

      expect(svgContent).toContain('<svg');
      expect(svgContent).toContain('Value Proposition Canvas');
      expect(svgContent).toContain('Customer Profile');
      expect(svgContent).toContain('Value Map');
      expect(svgContent).toContain('Jobs');
      expect(svgContent).toContain('Pains');
      expect(svgContent).toContain('Gains');
      expect(svgContent).toContain('Products & Services');
      expect(svgContent).toContain('Pain Relievers');
      expect(svgContent).toContain('Gain Creators');
      expect(svgContent).toContain('</svg>');
    });

    it('should create valid BMC SVG', () => {
      const bmcData = {
        keyPartners: ['Technology providers'],
        keyActivities: ['Software development'],
        keyResources: ['Development team'],
        valuePropositions: ['Automated solution'],
        customerRelationships: ['Self-service'],
        channels: ['Direct sales'],
        customerSegments: ['Small businesses'],
        costStructure: ['Development costs'],
        revenueStreams: ['Subscription fees']
      };

      const svgContent = canvasGenerator.createBMCSVG(bmcData);

      expect(svgContent).toContain('<svg');
      expect(svgContent).toContain('Business Model Canvas');
      expect(svgContent).toContain('Key Partners');
      expect(svgContent).toContain('Key Activities');
      expect(svgContent).toContain('Value Propositions');
      expect(svgContent).toContain('Customer Segments');
      expect(svgContent).toContain('Cost Structure');
      expect(svgContent).toContain('Revenue Streams');
      expect(svgContent).toContain('</svg>');
    });

    it('should handle empty data gracefully in SVG generation', () => {
      const emptyData = {};
      const svgContent = canvasGenerator.createVPCSVG(emptyData);

      expect(svgContent).toContain('<svg');
      expect(svgContent).toContain('No items defined');
      expect(svgContent).toContain('</svg>');
    });

    it('should include Strategyzer branding when enabled', () => {
      const vpcData = testCanvas.data;
      const svgContent = canvasGenerator.createVPCSVG(vpcData);

      expect(svgContent).toContain('Generated by Strategyzer AI');
    });

    it('should respect custom dimensions', () => {
      const vpcData = testCanvas.data;
      const customOptions = { width: 1600, height: 1000 };
      const svgContent = canvasGenerator.createVPCSVG(vpcData, customOptions);

      expect(svgContent).toContain('width="1600"');
      expect(svgContent).toContain('height="1000"');
    });
  });

  describe('Text Rendering and Formatting', () => {
    it('should render VPC items correctly', () => {
      const items = ['Item 1', 'Item 2', 'Item 3'];
      const renderedItems = canvasGenerator.renderVPCItems(items, 100, 100, 300);

      expect(renderedItems).toContain('Item 1');
      expect(renderedItems).toContain('Item 2');
      expect(renderedItems).toContain('Item 3');
      expect(renderedItems).toContain('•');
    });

    it('should render BMC items correctly', () => {
      const items = ['BMC Item 1', 'BMC Item 2'];
      const renderedItems = canvasGenerator.renderBMCItems(items, 100, 100, 300);

      expect(renderedItems).toContain('BMC Item 1');
      expect(renderedItems).toContain('BMC Item 2');
      expect(renderedItems).toContain('•');
    });

    it('should truncate long text appropriately', () => {
      const longText = 'This is a very long text that should be truncated to fit within the visual constraints of the canvas';
      const truncatedText = canvasGenerator.truncateText(longText, 30);

      expect(truncatedText.length).toBeLessThanOrEqual(30);
      expect(truncatedText).toContain('...');
    });

    it('should handle empty or null text', () => {
      expect(canvasGenerator.truncateText(null, 30)).toBe('');
      expect(canvasGenerator.truncateText(undefined, 30)).toBe('');
      expect(canvasGenerator.truncateText('', 30)).toBe('');
    });

    it('should limit number of items displayed', () => {
      const manyItems = Array.from({ length: 10 }, (_, i) => `Item ${i + 1}`);
      const renderedItems = canvasGenerator.renderVPCItems(manyItems, 100, 100, 300);

      // Should only render first 5 items
      expect(renderedItems).toContain('Item 1');
      expect(renderedItems).toContain('Item 5');
      expect(renderedItems).not.toContain('Item 6');
    });
  });

  describe('Canvas Metadata Updates', () => {
    it('should update canvas with visual metadata', async () => {
      const visualAssets = {
        svg: { size: 1024 },
        png: { size: 2048 }
      };

      await canvasGenerator.updateCanvasVisualMetadata(
        testCanvas._id, 
        visualAssets, 
        0.85
      );

      const updatedCanvas = await Canvas.findById(testCanvas._id);
      expect(updatedCanvas.metadata.visualGenerated).toBe(true);
      expect(updatedCanvas.metadata.visualQualityScore).toBe(0.85);
      expect(updatedCanvas.metadata.visualFormats).toContain('svg');
      expect(updatedCanvas.metadata.visualFormats).toContain('png');
      expect(updatedCanvas.metadata.visualAssetSizes.svg).toBe(1024);
      expect(updatedCanvas.metadata.visualAssetSizes.png).toBe(2048);
    });

    it('should handle metadata update errors gracefully', async () => {
      const invalidId = new mongoose.Types.ObjectId();
      
      // Should not throw error
      await expect(
        canvasGenerator.updateCanvasVisualMetadata(invalidId, {}, 0.5)
      ).resolves.not.toThrow();
    });
  });

  describe('Export Format Support', () => {
    it('should support PNG conversion (placeholder)', async () => {
      const svgContent = '<svg>test</svg>';
      const pngResult = await canvasGenerator.convertSVGToPNG(svgContent);

      expect(pngResult).toBeDefined();
      expect(pngResult.mimeType).toBe('image/png');
      expect(pngResult.content).toBeDefined();
      expect(pngResult.size).toBeGreaterThan(0);
    });

    it('should support VPC PDF generation (placeholder)', async () => {
      const vpcData = testCanvas.data;
      const pdfResult = await canvasGenerator.generateVPCPDF(vpcData);

      expect(pdfResult).toBeDefined();
      expect(pdfResult.mimeType).toBe('application/pdf');
      expect(pdfResult.content).toBeDefined();
      expect(pdfResult.size).toBeGreaterThan(0);
    });

    it('should support BMC PDF generation (placeholder)', async () => {
      const bmcData = {
        keyPartners: ['Partner 1'],
        valuePropositions: ['Value 1']
      };
      const pdfResult = await canvasGenerator.generateBMCPDF(bmcData);

      expect(pdfResult).toBeDefined();
      expect(pdfResult.mimeType).toBe('application/pdf');
      expect(pdfResult.content).toBeDefined();
      expect(pdfResult.size).toBeGreaterThan(0);
    });
  });

  describe('Testing Business Ideas Support', () => {
    it('should generate TBI visual', async () => {
      // Create TBI canvas
      const tbiCanvas = await Canvas.create({
        clientId: new mongoose.Types.ObjectId(),
        type: 'testingBusinessIdeas',
        title: 'Test TBI',
        description: 'Test Testing Business Ideas Canvas',
        data: {
          experiments: [
            {
              name: 'Landing page test for value proposition',
              hypothesis: 'Customers will engage with our value proposition',
              method: 'A/B testing',
              status: 'planned'
            },
            {
              name: 'Customer interview validation',
              hypothesis: 'Customers have the pain points we identified',
              method: 'Interviews',
              status: 'planned'
            },
            {
              name: 'Prototype usability testing',
              hypothesis: 'Users can easily navigate our solution',
              method: 'Usability testing',
              status: 'planned'
            }
          ]
        },
        metadata: {
          agentId: 'tbi-agent-v1',
          qualityScore: 0.8,
          tokensUsed: 1200,
          generationCost: 0.002,
          aiModel: 'gpt-4o-mini'
        }
      });

      const result = await canvasGenerator.generateVisualCanvas(tbiCanvas._id);

      expect(result.visualAssets.svg).toBeDefined();
      expect(result.visualAssets.svg.content).toContain('Testing Business Ideas');
      expect(result.visualAssets.svg.content).toContain('Experiment Design');
    });

    it('should create valid TBI SVG', () => {
      const tbiData = {
        experiments: [
          {
            name: 'Landing page test',
            hypothesis: 'Users will engage with landing page',
            method: 'A/B testing'
          },
          {
            name: 'Customer interviews',
            hypothesis: 'Customers have identified pain points',
            method: 'Interview'
          },
          {
            name: 'MVP testing',
            hypothesis: 'MVP solves customer problems',
            method: 'Prototype testing'
          }
        ]
      };

      const svgContent = canvasGenerator.createTBISVG(tbiData);

      expect(svgContent).toContain('<svg');
      expect(svgContent).toContain('Testing Business Ideas');
      expect(svgContent).toContain('Experiment Design');
      expect(svgContent).toContain('Success Metrics');
      expect(svgContent).toContain('Landing page test');
      expect(svgContent).toContain('</svg>');
    });
  });

  describe('Quality Thresholds and Warnings', () => {
    it('should warn when canvas quality is below threshold', async () => {
      // Create low-quality canvas
      const lowQualityCanvas = await Canvas.create({
        clientId: new mongoose.Types.ObjectId(),
        type: 'valueProposition',
        title: 'Low Quality VPC',
        description: 'Canvas with minimal data',
        data: {
          customerJobs: ['One job only']
          // Missing most fields
        },
        metadata: {
          agentId: 'vpc-agent-v1',
          qualityScore: 0.3,
          tokensUsed: 500,
          generationCost: 0.001,
          aiModel: 'gpt-4o-mini'
        }
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await canvasGenerator.generateVisualCanvas(lowQualityCanvas._id);

      expect(result.qualityScore).toBeLessThan(0.7);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[CanvasGeneratorAgent] Canvas quality below threshold'),
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });
  });
});
