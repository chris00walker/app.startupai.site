// Generic runner for OpenAI-based workflows
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
    
    // Create a simple agent execution using OpenAI chat completions
    const prompt = `You are ${agentName}, a specialized AI agent. Process the following input and provide a structured JSON response.

IMPORTANT: Your response must be valid JSON format only, no additional text or explanation.

Input: ${JSON.stringify(safeInput, null, 2)}

Please analyze this input and return a JSON object with the following structure:
{
  "analysis": "your analysis of the input",
  "recommendations": ["list of recommendations"],
  "nextSteps": ["suggested next steps"],
  "insights": ["key insights discovered"],
  "status": "completed"
}`;
    
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
