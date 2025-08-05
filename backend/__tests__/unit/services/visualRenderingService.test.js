/**
 * Visual Rendering Service Tests
 * 
 * Test suite for the Visual Rendering Service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import VisualRenderingService from '../../../services/VisualRenderingService.js';

describe('Visual Rendering Service', () => {
  let renderingService;
  let mockLogger;

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn()
    };

    renderingService = new VisualRenderingService({
      logger: mockLogger,
      outputPath: '/tmp/test-exports',
      enableCaching: true,
      maxConcurrentRenders: 2
    });
  });

  afterEach(async () => {
    if (renderingService && renderingService.cleanup) {
      await renderingService.cleanup();
    }
    vi.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should initialize with default configuration', () => {
      const service = new VisualRenderingService();
      
      expect(service.config.defaultTheme).toBe('professional');
      expect(service.config.defaultDPI).toBe(300);
      expect(service.config.enableCaching).toBe(true);
      expect(service.config.maxConcurrentRenders).toBe(3);
      expect(service.config.pngQuality).toBe(95);
    });

    it('should initialize with custom configuration', () => {
      const customConfig = {
        defaultTheme: 'minimal',
        defaultDPI: 150,
        enableCaching: false,
        maxConcurrentRenders: 1,
        pngQuality: 80
      };

      const service = new VisualRenderingService(customConfig);
      
      expect(service.config.defaultTheme).toBe('minimal');
      expect(service.config.defaultDPI).toBe(150);
      expect(service.config.enableCaching).toBe(false);
      expect(service.config.maxConcurrentRenders).toBe(1);
      expect(service.config.pngQuality).toBe(80);
    });
  });

  describe('Template System', () => {
    it('should get correct template for VPC', () => {
      const template = renderingService.getTemplate('valueProposition', 'professional');
      
      expect(template).toContain('<svg');
      expect(template).toContain('{{title}}');
      expect(template).toContain('Customer Profile');
      expect(template).toContain('Value Map');
    });

    it('should get correct template for BMC', () => {
      const template = renderingService.getTemplate('businessModel', 'professional');
      
      expect(template).toContain('<svg');
      expect(template).toContain('{{title}}');
      expect(template).toContain('Key Partners');
      expect(template).toContain('Revenue Streams');
    });

    it('should get correct canvas title', () => {
      expect(renderingService.getCanvasTitle('valueProposition')).toBe('Value Proposition Canvas');
      expect(renderingService.getCanvasTitle('businessModel')).toBe('Business Model Canvas');
      expect(renderingService.getCanvasTitle('testingBusinessIdeas')).toBe('Testing Business Ideas Framework');
      expect(renderingService.getCanvasTitle('unknown')).toBe('Strategic Canvas');
    });
  });

  describe('Data Processing', () => {
    it('should format list items correctly', () => {
      const items = ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'];
      
      const formatted = renderingService.formatListItems(items);
      
      expect(formatted).toBeDefined();
      expect(formatted).toBeTruthy();
      expect(Array.isArray(formatted) || typeof formatted === 'string').toBe(true);
    });

    it('should escape XML characters properly', () => {
      const text = 'Test & <script>alert("xss")</script>';
      const escaped = renderingService.escapeXML(text);
      
      expect(escaped).toBe('Test &amp; &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });
  });

  describe('Optimization', () => {
    it('should optimize SVG content', () => {
      const svgContent = `
        <svg   width="100"   height="100">
          <rect   x="0"   y="0"   width="100"   height="100"   />
        </svg>
      `;

      const optimized = renderingService.optimizeSVG(svgContent);
      
      expect(optimized).not.toContain('  ');
      expect(optimized).toContain('<svg width="100" height="100">');
    });
  });
});
