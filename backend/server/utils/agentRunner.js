// Generic runner for OpenAI-based workflows
import OpenAI from 'openai';
import Artefact from '../models/artefactModel.js';
import * as vectorStore from './vectorStore.js';
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
    const prompt = `You are ${agentName}, a specialized AI agent. Process the following input and provide a structured response:\n\nInput: ${JSON.stringify(safeInput, null, 2)}`;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    // Parse the AI response
    let responseData;
    try {
      responseData = JSON.parse(completion.choices[0].message.content);
    } catch (e) {
      throw new Error('Invalid JSON response');
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
    const artefactData = {
      id: artefactId,
      name: `${agentName}_result`,
      type: 'Analysis',
      status: 'completed',
      agentId: agentName,
      content: storedOutput,
      metadata: { ...responseData, clientId: safeInput.clientId },
      createdAt: new Date(),
    };
    if (safeInput.clientId) {
      artefactData.clientId = safeInput.clientId;
    }

    // Save artefact
    const artefact = new Artefact(artefactData);
    await artefact.save();

    // Persist to vector store, handling errors gracefully
    try {
      await vectorStore.storeEmbedding(
        `${agentName}-${safeInput.clientId || ''}-${artefactData.id}`,
        storedOutput,
        { agent: agentName, clientId: safeInput.clientId }
      );
    } catch (e) {
      console.error('Vector store failed', e);
    }

    return responseData;
  });
}
