// Enhanced Strategyzer-powered agent runner for OpenAI workflows
import OpenAI from 'openai';
import Artefact from '../models/artefactModel.js';
import { traceOperation } from './observability.js';
import ComplianceAgent from '../../agents/crossCutting/complianceAgent.js';

/**
 * Executes an agent with tracing, persistence to MongoDB and vector store.
 * @param {string} agentName - Identifier for the agent/span and artefact name.
 * @param {object} input - Input payload for the agent.
 * @param {object} toolsConfig - Configuration for agent tools registration.
 */
export async function runAgent(agentName, input, toolsConfig = {}) {
  return traceOperation(agentName, async (span) => {
    // Prepare input and initialize the OpenAI client
    const safeInput = input || {};
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    // Enhanced agent execution with Strategyzer framework support
    const prompt = buildStrategyzerPrompt(agentName, safeInput);
    
    console.log(`[${agentName}] Using enhanced Strategyzer-aware prompt`);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using cost-effective model for development/testing
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const rawResponse = completion.choices[0].message.content;
    console.log(`[${agentName}] Raw OpenAI response:`, rawResponse);

    // Parse the AI response
    let responseData;
    try {
      responseData = JSON.parse(rawResponse);
      console.log(`[${agentName}] Successfully parsed JSON response`);
    } catch (e) {
      console.error(`[${agentName}] JSON parsing failed:`, e.message);
      console.error(`[${agentName}] Raw response that failed to parse:`, rawResponse);
      
      // Fallback: create a structured response from the raw text
      responseData = {
        analysis: rawResponse,
        recommendations: ["Review and refine the AI agent response format"],
        nextSteps: ["Implement better structured prompting"],
        insights: ["AI response needs JSON formatting improvement"],
        status: "completed_with_fallback",
        rawResponse: rawResponse
      };
      console.log(`[${agentName}] Using fallback structured response`);
    }

    // Perform compliance scanning/redaction (supports both checkCompliance and scanContent APIs)
    let storedOutput = completion.choices[0].message.content;
    const complianceAgent = new ComplianceAgent();
    let complianceResult;
    if (typeof complianceAgent.checkCompliance === 'function') {
      complianceResult = await complianceAgent.checkCompliance({ clientId: safeInput.clientId, content: storedOutput });
    } else if (typeof complianceAgent.scanContent === 'function') {
      complianceResult = await complianceAgent.scanContent(storedOutput);
    }
    if (complianceResult?.redactedContent) {
      storedOutput = complianceResult.redactedContent;
    } else if (complianceResult?.content) {
      storedOutput = complianceResult.content;
    }

    // Build artefact payload
    const artefactId = `${agentName}-${Date.now()}-${Math.random().toString(36).substring(2,8)}`;
    // Extract clientId from various possible input formats
    const clientId = safeInput.clientId || safeInput.id || (typeof safeInput === 'string' ? safeInput : null);
    console.log(`[${agentName}] Extracted clientId:`, clientId);
    
    if (!clientId) {
      console.error(`[${agentName}] No clientId found in input:`, safeInput);
      throw new Error('ClientId is required for artefact creation');
    }

    // Create artefact data structure
    const artefactData = {
      id: artefactId,
      clientId: clientId,
      name: `${agentName}_result`,
      type: 'Analysis',
      status: 'completed',
      agentId: agentName,
      content: storedOutput,
      metadata: { ...responseData, clientId: clientId },
      createdAt: new Date(),
    };

    // Save artefact
    const artefact = new Artefact(artefactData);
    await artefact.save();

    // Artefact successfully saved to MongoDB
    console.log(`[${agentName}] Successfully created artefact for client ${clientId}`);

    return responseData;
  });
}

/**
 * Build Strategyzer-aware prompts based on agent type and methodology
 */
export function buildStrategyzerPrompt(agentName, input) {
  const strategyzerPrompts = {
    intakeAgent: buildCustomerDiscoveryPrompt(input),
    researchAgent: buildMarketAnalysisPrompt(input),
    canvasDraftingAgent: buildValuePropositionPrompt(input),
    validationPlanAgent: buildTestingBusinessIdeasPrompt(input)
  };
  
  return strategyzerPrompts[agentName] || buildGenericStrategyzerPrompt(agentName, input);
}

/**
 * Customer Discovery prompt following Strategyzer methodology
 */
export function buildCustomerDiscoveryPrompt(input) {
  return `You are a Customer Discovery specialist following Alex Osterwalder's Strategyzer methodology.

Your task is to analyze the client and identify:
1. Customer Jobs-to-be-done (functional, emotional, social)
2. Customer Pains (undesired outcomes, obstacles, risks)
3. Customer Gains (required, expected, desired, unexpected)

IMPORTANT: Return ONLY valid JSON in this exact structure:
{
  "analysis": "Deep analysis of customer discovery insights",
  "customerJobs": {
    "functional": ["list of functional jobs"],
    "emotional": ["list of emotional jobs"],
    "social": ["list of social jobs"]
  },
  "customerPains": ["list of customer pain points"],
  "customerGains": ["list of customer desired gains"],
  "recommendations": ["actionable recommendations"],
  "nextSteps": ["specific next steps for validation"],
  "insights": ["key strategic insights"],
  "canvasData": {
    "customerProfile": {
      "jobs": ["combined jobs list"],
      "pains": ["pain points"],
      "gains": ["desired gains"]
    }
  },
  "status": "completed"
}

Client Input: ${JSON.stringify(input, null, 2)}`;
}

/**
 * Market Analysis prompt with competitive intelligence
 */
export function buildMarketAnalysisPrompt(input) {
  return `You are a Market Research specialist using Strategyzer business model analysis.

Analyze the market and competitive landscape to inform business model design:
1. Market size and opportunity (TAM/SAM/SOM)
2. Competitive landscape and positioning
3. Industry trends and disruptions
4. Customer segment analysis

IMPORTANT: Return ONLY valid JSON in this exact structure:
{
  "analysis": "Comprehensive market analysis",
  "marketSize": {
    "TAM": "Total addressable market",
    "SAM": "Serviceable addressable market",
    "SOM": "Serviceable obtainable market"
  },
  "competitiveAnalysis": ["list of key competitors and positioning"],
  "industryTrends": ["list of relevant industry trends"],
  "customerSegments": ["identified customer segments"],
  "recommendations": ["strategic recommendations"],
  "nextSteps": ["next steps for business model design"],
  "insights": ["key market insights"],
  "canvasData": {
    "marketContext": {
      "size": "market size summary",
      "trends": ["key trends"],
      "competition": ["competitive insights"]
    }
  },
  "status": "completed"
}

Client Input: ${JSON.stringify(input, null, 2)}`;
}

/**
 * Value Proposition Canvas prompt following Osterwalder methodology
 */
export function buildValuePropositionPrompt(input) {
  return `You are a Value Proposition Design specialist following Alex Osterwalder's proven methodology.

Create a comprehensive Value Proposition Canvas with:
1. Customer Profile (Jobs, Pains, Gains)
2. Value Map (Products/Services, Pain Relievers, Gain Creators)
3. Fit Assessment (Product-Market Fit validation)

IMPORTANT: Return ONLY valid JSON in this exact structure:
{
  "analysis": "Value proposition analysis and fit assessment",
  "valuePropositionCanvas": {
    "customerProfile": {
      "customerJobs": ["jobs customers want to accomplish"],
      "customerPains": ["pains customers experience"],
      "customerGains": ["gains customers desire"]
    },
    "valueMap": {
      "productsServices": ["products and services offered"],
      "painRelievers": ["how offerings relieve customer pains"],
      "gainCreators": ["how offerings create customer gains"]
    },
    "fitAssessment": {
      "problemSolutionFit": "assessment of problem-solution fit",
      "productMarketFit": "assessment of product-market fit",
      "fitScore": 0.8
    }
  },
  "businessModelElements": {
    "keyPartners": ["strategic partners"],
    "keyActivities": ["key business activities"],
    "keyResources": ["critical resources"],
    "costStructure": ["main cost drivers"],
    "revenueStreams": ["revenue generation methods"]
  },
  "recommendations": ["strategic recommendations"],
  "nextSteps": ["next steps for validation"],
  "insights": ["key value proposition insights"],
  "status": "completed"
}

Client Input: ${JSON.stringify(input, null, 2)}`;
}

/**
 * Testing Business Ideas prompt following Osterwalder's experimentation methodology
 */
export function buildTestingBusinessIdeasPrompt(input) {
  return `You are a Business Validation specialist following Alex Osterwalder's "Testing Business Ideas" methodology.

Design a comprehensive testing and validation plan:
1. Hypothesis formation (Desirability, Feasibility, Viability)
2. Experiment design from Strategyzer's experiment library
3. Evidence collection and validation framework

IMPORTANT: Return ONLY valid JSON in this exact structure:
{
  "analysis": "Testing strategy and validation plan analysis",
  "hypotheses": {
    "desirability": ["customer desirability hypotheses"],
    "feasibility": ["technical feasibility hypotheses"],
    "viability": ["business viability hypotheses"]
  },
  "experiments": [
    {
      "name": "experiment name",
      "type": "experiment type from Strategyzer library",
      "hypothesis": "hypothesis being tested",
      "method": "experiment method",
      "successCriteria": "success metrics",
      "cost": "low/medium/high",
      "time": "time required",
      "evidenceStrength": "weak/medium/strong"
    }
  ],
  "validationPlan": {
    "phase1": "initial validation approach",
    "phase2": "deeper validation approach",
    "phase3": "market validation approach"
  },
  "recommendations": ["testing recommendations"],
  "nextSteps": ["immediate next steps"],
  "insights": ["validation insights"],
  "status": "completed"
}

Client Input: ${JSON.stringify(input, null, 2)}`;
}

/**
 * Generic Strategyzer prompt for other agents
 */
export function buildGenericStrategyzerPrompt(agentName, input) {
  return `You are ${agentName}, a strategic business consultant following Strategyzer methodologies.

Provide strategic analysis that contributes to business model development and validation.

IMPORTANT: Return ONLY valid JSON in this exact structure:
{
  "analysis": "your strategic analysis",
  "recommendations": ["actionable recommendations"],
  "nextSteps": ["specific next steps"],
  "insights": ["key strategic insights"],
  "strategicValue": "how this contributes to overall business model",
  "status": "completed"
}

Client Input: ${JSON.stringify(input, null, 2)}`;
}

/**
 * Determine the Strategyzer framework type based on agent
 */
export function getFrameworkType(agentName) {
  const frameworkMapping = {
    intakeAgent: 'customer_discovery',
    researchAgent: 'market_analysis', 
    canvasDraftingAgent: 'value_proposition_canvas',
    validationPlanAgent: 'testing_business_ideas'
  };
  
  return frameworkMapping[agentName] || 'strategic_analysis';
}

/**
 * Check if the response data can generate visual canvas
 */
export function isCanvasGenerationCapable(responseData) {
  // Check if response contains canvas-ready data structures
  return !!(responseData.valuePropositionCanvas || 
           responseData.businessModelElements ||
           responseData.canvasData ||
           responseData.experiments);
}
