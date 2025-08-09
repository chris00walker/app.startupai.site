/**
 * Canvas Generation Workflow
 * 
 * Orchestrates the end-to-end process of generating Strategyzer canvases
 * using specialized AI agents and visual rendering services.
 */

import ValuePropositionAgent from '../agents/strategyzer/ValuePropositionAgent.js';
import BusinessModelAgent from '../agents/strategyzer/BusinessModelAgent.js';
import VisualRenderingService from '../services/VisualRenderingService.js';
import Canvas from '../models/canvasModel.js';
import Client from '../models/clientModel.js';

class CanvasGenerationWorkflow {
  constructor(config = {}) {
    this.config = {
      enableVisualGeneration: config.enableVisualGeneration !== false,
      autoPublish: config.autoPublish || false,
      qualityThreshold: config.qualityThreshold || 0.7,
      ...config
    };

    // Initialize agents and services
    this.vpAgent = new ValuePropositionAgent(config.vpAgent);
    this.bmAgent = new BusinessModelAgent(config.bmAgent);
    this.visualRenderer = new VisualRenderingService(config.visualRenderer);
    
    this.logger = config.logger || console;
  }

  /**
   * Generate Value Proposition Canvas workflow
   * @param {Object} params - Workflow parameters
   * @returns {Object} Generated canvas and metadata
   */
  async generateValuePropositionCanvas(params) {
    const { clientId, title, description, autoExport = false } = params;
    
    try {
      this.logger.info('Starting Value Proposition Canvas generation', { clientId, title });
      
      // Validate client exists
      const client = await Client.findById(clientId);
      if (!client) {
        throw new Error(`Client not found: ${clientId}`);
      }

      // Generate canvas using AI agent
      const startTime = Date.now();
      const result = await this.vpAgent.generateCanvas({
        clientId,
        title: title || `${client.name} - Value Proposition Canvas`,
        description: description || `AI-generated Value Proposition Canvas for ${client.company}`
      });

      const executionTime = Date.now() - startTime;

      // Check quality threshold
      if (result.qualityScore < this.config.qualityThreshold) {
        this.logger.warn('Canvas quality below threshold', {
          qualityScore: result.qualityScore,
          threshold: this.config.qualityThreshold
        });
      }

      // Auto-publish if quality is high enough
      if (this.config.autoPublish && result.qualityScore >= this.config.qualityThreshold) {
        await result.canvas.publish();
      }

      // Generate visual export if enabled
      let visualExport = null;
      if (this.config.enableVisualGeneration && autoExport) {
        try {
          visualExport = await this.visualRenderer.renderCanvas(result.canvas, {
            format: 'svg',
            theme: 'professional'
          });
          
          await result.canvas.recordExport('svg', visualExport.url, visualExport.fileSize);
        } catch (exportError) {
          this.logger.error('Visual export failed', { error: exportError.message });
        }
      }

      // Update client workflow status
      await this.updateClientWorkflowStatus(clientId, 'valueProposition', 'completed');

      this.logger.info('Value Proposition Canvas generation completed', {
        canvasId: result.canvas._id,
        qualityScore: result.qualityScore,
        executionTime
      });

      return {
        success: true,
        canvas: result.canvas,
        qualityScore: result.qualityScore,
        executionTime,
        visualExport,
        workflow: {
          type: 'valueProposition',
          status: 'completed',
          completedAt: new Date()
        }
      };

    } catch (error) {
      this.logger.error('Value Proposition Canvas generation failed', { 
        error: error.message,
        clientId,
        title 
      });
      
      await this.updateClientWorkflowStatus(clientId, 'valueProposition', 'failed');
      
      throw error;
    }
  }

  /**
   * Generate Business Model Canvas workflow
   * @param {Object} params - Workflow parameters
   * @returns {Object} Generated canvas and metadata
   */
  async generateBusinessModelCanvas(params) {
    const { clientId, title, description, autoExport = false, valuePropositionCanvasId } = params;
    
    try {
      this.logger.info('Starting Business Model Canvas generation', { clientId, title });
      
      // Validate client exists
      const client = await Client.findById(clientId);
      if (!client) {
        throw new Error(`Client not found: ${clientId}`);
      }

      // Optionally use existing Value Proposition Canvas as input
      let vpCanvasData = null;
      if (valuePropositionCanvasId) {
        const vpCanvas = await Canvas.findById(valuePropositionCanvasId);
        if (vpCanvas && vpCanvas.type === 'valueProposition') {
          vpCanvasData = vpCanvas.data;
        }
      }

      // Generate canvas using AI agent
      const startTime = Date.now();
      const result = await this.bmAgent.generateCanvas({
        clientId,
        title: title || `${client.name} - Business Model Canvas`,
        description: description || `AI-generated Business Model Canvas for ${client.company}`,
        valuePropositionData: vpCanvasData
      });

      const executionTime = Date.now() - startTime;

      // Check quality threshold
      if (result.qualityScore < this.config.qualityThreshold) {
        this.logger.warn('Canvas quality below threshold', {
          qualityScore: result.qualityScore,
          threshold: this.config.qualityThreshold
        });
      }

      // Auto-publish if quality is high enough
      if (this.config.autoPublish && result.qualityScore >= this.config.qualityThreshold) {
        await result.canvas.publish();
      }

      // Generate visual export if enabled
      let visualExport = null;
      if (this.config.enableVisualGeneration && autoExport) {
        try {
          visualExport = await this.visualRenderer.renderCanvas(result.canvas, {
            format: 'svg',
            theme: 'professional'
          });
          
          await result.canvas.recordExport('svg', visualExport.url, visualExport.fileSize);
        } catch (exportError) {
          this.logger.error('Visual export failed', { error: exportError.message });
        }
      }

      // Update client workflow status
      await this.updateClientWorkflowStatus(clientId, 'businessModel', 'completed');

      this.logger.info('Business Model Canvas generation completed', {
        canvasId: result.canvas._id,
        qualityScore: result.qualityScore,
        executionTime
      });

      return {
        success: true,
        canvas: result.canvas,
        qualityScore: result.qualityScore,
        executionTime,
        visualExport,
        workflow: {
          type: 'businessModel',
          status: 'completed',
          completedAt: new Date()
        }
      };

    } catch (error) {
      this.logger.error('Business Model Canvas generation failed', { 
        error: error.message,
        clientId,
        title 
      });
      
      await this.updateClientWorkflowStatus(clientId, 'businessModel', 'failed');
      
      throw error;
    }
  }

  /**
   * Generate complete Strategyzer framework (VP + BM canvases)
   * @param {Object} params - Workflow parameters
   * @returns {Object} Generated canvases and metadata
   */
  async generateCompleteFramework(params) {
    const { clientId, autoExport = true } = params;
    
    try {
      this.logger.info('Starting complete Strategyzer framework generation', { clientId });
      
      const client = await Client.findById(clientId);
      if (!client) {
        throw new Error(`Client not found: ${clientId}`);
      }

      // Step 1: Generate Value Proposition Canvas
      const vpResult = await this.generateValuePropositionCanvas({
        clientId,
        title: `${client.name} - Value Proposition Canvas`,
        autoExport: false // We'll export both together
      });

      // Step 2: Generate Business Model Canvas using VP data
      const bmResult = await this.generateBusinessModelCanvas({
        clientId,
        title: `${client.name} - Business Model Canvas`,
        valuePropositionCanvasId: vpResult.canvas._id,
        autoExport: false
      });

      // Step 3: Generate combined visual export if enabled
      let combinedExport = null;
      if (this.config.enableVisualGeneration && autoExport) {
        try {
          combinedExport = await this.visualRenderer.renderMultipleCanvases([
            vpResult.canvas,
            bmResult.canvas
          ], {
            format: 'pdf',
            theme: 'professional',
            layout: 'combined'
          });
        } catch (exportError) {
          this.logger.error('Combined visual export failed', { error: exportError.message });
        }
      }

      // Update client workflow status to completed
      await this.updateClientWorkflowStatus(clientId, 'discovery', 'completed');

      this.logger.info('Complete Strategyzer framework generation completed', {
        clientId,
        vpCanvasId: vpResult.canvas._id,
        bmCanvasId: bmResult.canvas._id
      });

      return {
        success: true,
        valuePropositionCanvas: vpResult.canvas,
        businessModelCanvas: bmResult.canvas,
        qualityScores: {
          valueProposition: vpResult.qualityScore,
          businessModel: bmResult.qualityScore,
          average: (vpResult.qualityScore + bmResult.qualityScore) / 2
        },
        combinedExport,
        workflow: {
          type: 'completeFramework',
          status: 'completed',
          completedAt: new Date()
        }
      };

    } catch (error) {
      this.logger.error('Complete framework generation failed', { 
        error: error.message,
        clientId 
      });
      
      await this.updateClientWorkflowStatus(clientId, 'discovery', 'failed');
      
      throw error;
    }
  }

  /**
   * Update client workflow status
   * @private
   */
  async updateClientWorkflowStatus(clientId, workflowType, status) {
    try {
      const client = await Client.findById(clientId);
      if (client) {
        if (!client.workflowStatus) {
          client.workflowStatus = {};
        }
        
        client.workflowStatus[workflowType] = {
          status,
          completedAt: status === 'completed' ? new Date() : undefined,
          failedAt: status === 'failed' ? new Date() : undefined
        };
        
        await client.save();
      }
    } catch (error) {
      this.logger.error('Failed to update client workflow status', { 
        error: error.message,
        clientId,
        workflowType,
        status 
      });
    }
  }

  /**
   * Get workflow status for client
   */
  async getWorkflowStatus(clientId) {
    try {
      const client = await Client.findById(clientId);
      if (!client) {
        throw new Error(`Client not found: ${clientId}`);
      }

      const canvases = await Canvas.findByClient(clientId);
      
      return {
        client: {
          id: client._id,
          name: client.name,
          company: client.company
        },
        workflowStatus: client.workflowStatus || {},
        canvases: canvases.map(canvas => ({
          id: canvas._id,
          type: canvas.type,
          title: canvas.title,
          status: canvas.status,
          qualityScore: canvas.qualityScore,
          completion: canvas.completeness,
          createdAt: canvas.createdAt,
          updatedAt: canvas.updatedAt
        }))
      };
    } catch (error) {
      this.logger.error('Failed to get workflow status', { 
        error: error.message,
        clientId 
      });
      throw error;
    }
  }
}

export default CanvasGenerationWorkflow;
