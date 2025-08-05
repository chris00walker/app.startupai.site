/**
 * Visual Rendering Service
 * 
 * Enhanced rendering service for Strategyzer canvases with template system,
 * optimization, and advanced export capabilities.
 */

import sharp from 'sharp';
import puppeteer from 'puppeteer';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class VisualRenderingService {
  constructor(config = {}) {
    this.config = {
      templatesPath: config.templatesPath || path.join(__dirname, '../templates/canvas'),
      outputPath: config.outputPath || path.join(__dirname, '../exports'),
      defaultTheme: config.defaultTheme || 'professional',
      defaultDPI: config.defaultDPI || 300,
      enableCaching: config.enableCaching !== false,
      cacheExpiry: config.cacheExpiry || 3600000, // 1 hour
      maxConcurrentRenders: config.maxConcurrentRenders || 3,
      pngQuality: config.pngQuality || 95,
      browserOptions: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection',
          '--disable-extensions',
          '--disable-default-apps',
          '--disable-sync',
          '--disable-translate',
          '--hide-scrollbars',
          '--mute-audio',
          '--no-default-browser-check',
          '--no-pings',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ],
        executablePath: '/usr/bin/chromium-browser',
        timeout: 60000
      }
    };

    this.logger = config.logger || console;
    this.cache = new Map();
    this.renderQueue = [];
    this.activeRenders = 0;
    
    // Don't initialize Puppeteer on startup - use lazy initialization
    this.browserInitialized = false;
    this.browserInitializationAttempted = false;
  }

  async initializeService() {
    try {
      await fs.mkdir(this.config.outputPath, { recursive: true });
      this.logger.info('Visual Rendering Service initialized (Puppeteer will be initialized on first use)');
    } catch (error) {
      this.logger.error('Failed to initialize Visual Rendering Service', { error: error.message });
      throw error;
    }
  }

  async initializeBrowser() {
    if (this.browserInitialized || this.browserInitializationAttempted) {
      return this.browser;
    }

    this.browserInitializationAttempted = true;
    
    try {
      this.logger.info('Attempting to initialize Puppeteer browser...');
      this.browser = await puppeteer.launch(this.config.browserOptions);
      this.browserInitialized = true;
      this.logger.info('Puppeteer browser initialized successfully');
      return this.browser;
    } catch (error) {
      this.logger.warn('Puppeteer browser initialization failed - visual rendering will be disabled', { error: error.message });
      this.browser = null;
      return null;
    }
  }

  /**
   * Render canvas to specified format with enhanced capabilities
   */
  async renderCanvas(canvasData, options = {}) {
    const startTime = Date.now();
    
    try {
      const renderOptions = {
        format: options.format || 'png',
        theme: options.theme || this.config.defaultTheme,
        width: options.width || 1200,
        height: options.height || 800,
        dpi: options.dpi || this.config.defaultDPI,
        includeMetadata: options.includeMetadata !== false
      };

      // Check cache first
      const cacheKey = this.generateCacheKey(canvasData, renderOptions);
      if (this.config.enableCaching && this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.config.cacheExpiry) {
          return cached.result;
        }
      }

      // Queue render if at capacity
      if (this.activeRenders >= this.config.maxConcurrentRenders) {
        await this.queueRender();
      }

      this.activeRenders++;
      
      try {
        // Generate enhanced SVG
        const svgContent = await this.generateEnhancedSVG(canvasData, renderOptions);
        
        let result;
        switch (renderOptions.format.toLowerCase()) {
          case 'svg':
            result = await this.processSVG(svgContent, renderOptions);
            break;
          case 'png':
            result = await this.convertToPNG(svgContent, renderOptions);
            break;
          case 'pdf':
            result = await this.convertToPDF(svgContent, renderOptions);
            break;
          default:
            throw new Error(`Unsupported format: ${renderOptions.format}`);
        }

        // Cache result
        if (this.config.enableCaching) {
          this.cache.set(cacheKey, { result, timestamp: Date.now() });
        }

        const processingTime = Date.now() - startTime;
        
        return {
          ...result,
          metadata: {
            processingTime,
            format: renderOptions.format,
            theme: renderOptions.theme,
            dimensions: { width: renderOptions.width, height: renderOptions.height },
            generatedAt: new Date().toISOString()
          }
        };

      } finally {
        this.activeRenders--;
        this.processQueue();
      }

    } catch (error) {
      this.logger.error('Canvas rendering failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate enhanced SVG with professional templates
   */
  async generateEnhancedSVG(canvasData, options) {
    const template = this.getTemplate(canvasData.type, options.theme);
    return this.processTemplate(template, canvasData, options);
  }

  /**
   * Process template with canvas data
   */
  processTemplate(template, canvasData, options) {
    let svgContent = template;

    // Extract template data
    const templateData = this.extractTemplateData(canvasData);
    
    // Replace template variables
    const variables = {
      width: options.width,
      height: options.height,
      title: this.getCanvasTitle(canvasData.type),
      timestamp: new Date().toLocaleDateString(),
      ...templateData
    };

    // Process all variables
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      svgContent = svgContent.replace(regex, this.escapeXML(String(value)));
    }

    return svgContent;
  }

  /**
   * Convert SVG to high-quality PNG
   */
  async convertToPNG(svgContent, options) {
    try {
      const buffer = Buffer.from(svgContent);
      
      const pngBuffer = await sharp(buffer)
        .png({ quality: this.config.pngQuality })
        .resize(options.width, options.height, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .toBuffer();

      const filename = `canvas_${Date.now()}.png`;
      const filepath = path.join(this.config.outputPath, filename);
      
      await fs.writeFile(filepath, pngBuffer);

      return {
        format: 'png',
        buffer: pngBuffer,
        filepath,
        filename,
        size: pngBuffer.length
      };

    } catch (error) {
      throw new Error(`PNG conversion failed: ${error.message}`);
    }
  }

  /**
   * Convert SVG to PDF
   */
  async convertToPDF(svgContent, options) {
    try {
      const browser = await this.initializeBrowser();
      if (!browser) {
        // Graceful degradation - return SVG if Puppeteer fails
        this.logger.warn('Puppeteer unavailable, returning SVG instead of PDF');
        return {
          data: Buffer.from(svgContent),
          mimeType: 'image/svg+xml',
          filename: `canvas.svg`
        };
      }

      const page = await browser.newPage();
      
      try {
        await page.setViewport({
          width: options.width,
          height: options.height,
          deviceScaleFactor: options.dpi / 96
        });

        const htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <style>body { margin: 0; padding: 20px; }</style>
            </head>
            <body>${svgContent}</body>
          </html>
        `;

        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
          width: options.width,
          height: options.height,
          printBackground: true
        });

        const filename = `canvas_${Date.now()}.pdf`;
        const filepath = path.join(this.config.outputPath, filename);
        
        await fs.writeFile(filepath, pdfBuffer);

        return {
          format: 'pdf',
          buffer: pdfBuffer,
          filepath,
          filename,
          size: pdfBuffer.length
        };

      } finally {
        await page.close();
      }

    } catch (error) {
      throw new Error(`PDF conversion failed: ${error.message}`);
    }
  }

  /**
   * Process SVG with optimizations
   */
  async processSVG(svgContent, options) {
    const optimizedSVG = this.optimizeSVG(svgContent);
    
    const filename = `canvas_${Date.now()}.svg`;
    const filepath = path.join(this.config.outputPath, filename);
    
    await fs.writeFile(filepath, optimizedSVG);

    return {
      format: 'svg',
      content: optimizedSVG,
      filepath,
      filename,
      size: optimizedSVG.length
    };
  }

  /**
   * Batch render multiple canvases
   */
  async batchRender(canvases, options = {}) {
    const results = [];
    const batchOptions = { concurrency: 2, format: 'png', ...options };

    for (let i = 0; i < canvases.length; i += batchOptions.concurrency) {
      const batch = canvases.slice(i, i + batchOptions.concurrency);
      
      const batchPromises = batch.map(async (canvas) => {
        try {
          const result = await this.renderCanvas(canvas, batchOptions);
          return { success: true, result, canvas: canvas.id };
        } catch (error) {
          return { success: false, error: error.message, canvas: canvas.id };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  // Template system
  getTemplate(canvasType, theme) {
    const templates = {
      valueProposition: this.getVPCTemplate(theme),
      businessModel: this.getBMCTemplate(theme),
      testingBusinessIdeas: this.getTBITemplate(theme)
    };
    
    return templates[canvasType] || templates.valueProposition;
  }

  getVPCTemplate(theme = 'professional') {
    return `
      <svg width="{{width}}" height="{{height}}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>
            .vpc-title { font-family: Arial, sans-serif; font-size: 24px; font-weight: bold; fill: #2c3e50; }
            .vpc-section-title { font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; fill: #34495e; }
            .vpc-text { font-family: Arial, sans-serif; font-size: 12px; fill: #2c3e50; }
            .vpc-customer { fill: #e8f4fd; stroke: #3498db; stroke-width: 2; }
            .vpc-value { fill: #fff2e8; stroke: #e67e22; stroke-width: 2; }
          </style>
        </defs>
        
        <rect width="100%" height="100%" fill="white"/>
        <text x="600" y="40" text-anchor="middle" class="vpc-title">{{title}}</text>
        
        <!-- Customer Profile -->
        <rect x="50" y="80" width="500" height="600" class="vpc-customer" rx="10"/>
        <text x="300" y="110" text-anchor="middle" class="vpc-section-title">Customer Profile</text>
        
        <text x="70" y="140" class="vpc-section-title">Customer Jobs</text>
        {{customer_jobs}}
        
        <text x="70" y="280" class="vpc-section-title">Pains</text>
        {{customer_pains}}
        
        <text x="70" y="420" class="vpc-section-title">Gains</text>
        {{customer_gains}}
        
        <!-- Value Map -->
        <rect x="600" y="80" width="500" height="600" class="vpc-value" rx="10"/>
        <text x="850" y="110" text-anchor="middle" class="vpc-section-title">Value Map</text>
        
        <text x="620" y="140" class="vpc-section-title">Products &amp; Services</text>
        {{products_services}}
        
        <text x="620" y="280" class="vpc-section-title">Pain Relievers</text>
        {{pain_relievers}}
        
        <text x="620" y="420" class="vpc-section-title">Gain Creators</text>
        {{gain_creators}}
        
        <text x="600" y="720" text-anchor="middle" class="vpc-text">Generated on {{timestamp}}</text>
      </svg>
    `;
  }

  getBMCTemplate(theme = 'professional') {
    return `
      <svg width="{{width}}" height="{{height}}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>
            .bmc-title { font-family: Arial, sans-serif; font-size: 24px; font-weight: bold; fill: #2c3e50; }
            .bmc-section-title { font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; fill: #34495e; }
            .bmc-text { font-family: Arial, sans-serif; font-size: 11px; fill: #2c3e50; }
            .bmc-section { fill: #f8f9fa; stroke: #dee2e6; stroke-width: 1; }
          </style>
        </defs>
        
        <rect width="100%" height="100%" fill="white"/>
        <text x="600" y="30" text-anchor="middle" class="bmc-title">{{title}}</text>
        
        <!-- 9 BMC Blocks -->
        <rect x="20" y="60" width="200" height="300" class="bmc-section" rx="5"/>
        <text x="120" y="80" text-anchor="middle" class="bmc-section-title">Key Partners</text>
        {{key_partners}}
        
        <rect x="240" y="60" width="200" height="150" class="bmc-section" rx="5"/>
        <text x="340" y="80" text-anchor="middle" class="bmc-section-title">Key Activities</text>
        {{key_activities}}
        
        <rect x="460" y="60" width="280" height="300" class="bmc-section" rx="5"/>
        <text x="600" y="80" text-anchor="middle" class="bmc-section-title">Value Propositions</text>
        {{value_propositions}}
        
        <rect x="760" y="60" width="200" height="150" class="bmc-section" rx="5"/>
        <text x="860" y="80" text-anchor="middle" class="bmc-section-title">Customer Relationships</text>
        {{customer_relationships}}
        
        <rect x="980" y="60" width="200" height="300" class="bmc-section" rx="5"/>
        <text x="1080" y="80" text-anchor="middle" class="bmc-section-title">Customer Segments</text>
        {{customer_segments}}
        
        <rect x="240" y="230" width="200" height="130" class="bmc-section" rx="5"/>
        <text x="340" y="250" text-anchor="middle" class="bmc-section-title">Key Resources</text>
        {{key_resources}}
        
        <rect x="760" y="230" width="200" height="130" class="bmc-section" rx="5"/>
        <text x="860" y="250" text-anchor="middle" class="bmc-section-title">Channels</text>
        {{channels}}
        
        <rect x="20" y="380" width="520" height="120" class="bmc-section" rx="5"/>
        <text x="280" y="400" text-anchor="middle" class="bmc-section-title">Cost Structure</text>
        {{cost_structure}}
        
        <rect x="560" y="380" width="620" height="120" class="bmc-section" rx="5"/>
        <text x="870" y="400" text-anchor="middle" class="bmc-section-title">Revenue Streams</text>
        {{revenue_streams}}
        
        <text x="600" y="530" text-anchor="middle" class="bmc-text">Generated on {{timestamp}}</text>
      </svg>
    `;
  }

  getTBITemplate(theme = 'professional') {
    return `
      <svg width="{{width}}" height="{{height}}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>
            .tbi-title { font-family: Arial, sans-serif; font-size: 24px; font-weight: bold; fill: #2c3e50; }
            .tbi-section-title { font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; fill: #34495e; }
            .tbi-text { font-family: Arial, sans-serif; font-size: 12px; fill: #2c3e50; }
            .tbi-section { fill: #f8f9fa; stroke: #dee2e6; stroke-width: 2; }
          </style>
        </defs>
        
        <rect width="100%" height="100%" fill="white"/>
        <text x="600" y="40" text-anchor="middle" class="tbi-title">{{title}}</text>
        
        <rect x="50" y="80" width="1100" height="600" class="tbi-section" rx="10"/>
        <text x="600" y="110" text-anchor="middle" class="tbi-section-title">Testing Business Ideas Framework</text>
        
        <text x="70" y="150" class="tbi-section-title">Hypothesis</text>
        {{hypothesis}}
        
        <text x="70" y="250" class="tbi-section-title">Experiment</text>
        {{experiment}}
        
        <text x="70" y="350" class="tbi-section-title">Success Criteria</text>
        {{success_criteria}}
        
        <text x="70" y="450" class="tbi-section-title">Results</text>
        {{results}}
        
        <text x="70" y="550" class="tbi-section-title">Next Steps</text>
        {{next_steps}}
        
        <text x="600" y="720" text-anchor="middle" class="tbi-text">Generated on {{timestamp}}</text>
      </svg>
    `;
  }

  // Utility methods
  extractTemplateData(canvasData) {
    const data = {};
    
    if (canvasData.sections) {
      for (const [key, value] of Object.entries(canvasData.sections)) {
        if (Array.isArray(value)) {
          data[key] = value.map((item, index) => 
            `<text x="70" y="${160 + (index * 20)}" class="vpc-text">${this.escapeXML(item)}</text>`
          ).join('');
        } else {
          data[key] = `<text x="70" y="160" class="vpc-text">${this.escapeXML(String(value))}</text>`;
        }
      }
    }
    
    return data;
  }

  getCanvasTitle(type) {
    const titles = {
      valueProposition: 'Value Proposition Canvas',
      businessModel: 'Business Model Canvas',
      testingBusinessIdeas: 'Testing Business Ideas Framework'
    };
    
    return titles[type] || 'Strategyzer Canvas';
  }

  escapeXML(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  optimizeSVG(svgContent) {
    // Basic SVG optimization
    return svgContent
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .trim();
  }

  generateCacheKey(canvasData, options) {
    const keyData = {
      canvas: canvasData,
      options: {
        format: options.format,
        theme: options.theme,
        width: options.width,
        height: options.height
      }
    };
    
    return crypto.createHash('md5')
      .update(JSON.stringify(keyData))
      .digest('hex');
  }

  async queueRender() {
    return new Promise((resolve) => {
      this.renderQueue.push(resolve);
    });
  }

  processQueue() {
    if (this.renderQueue.length > 0 && this.activeRenders < this.config.maxConcurrentRenders) {
      const resolve = this.renderQueue.shift();
      resolve();
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    
    this.cache.clear();
    this.renderQueue = [];
    this.activeRenders = 0;
  }

  // Health check
  async healthCheck() {
    try {
      if (!this.browser) {
        await this.initializeService();
      }
      
      return {
        status: 'healthy',
        browser: !!this.browser,
        activeRenders: this.activeRenders,
        queueLength: this.renderQueue.length,
        cacheSize: this.cache.size
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

export default VisualRenderingService;