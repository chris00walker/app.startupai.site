/**
 * Multi-Agent Orchestrator - Coordinates multiple AI agents for collaborative consulting
 * Enables complex business strategy discussions with specialized AI agents
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Multi-Agent Orchestrator Class
 * Manages collaboration between different AI agent personas
 */
export class MultiAgentOrchestrator {
  constructor() {
    this.agents = {
      strategist: {
        name: 'Strategic Advisor',
        role: 'Senior Strategy Consultant',
        expertise: 'Business strategy, market analysis, competitive positioning',
        personality: 'Analytical, data-driven, big-picture thinking'
      },
      financial: {
        name: 'Financial Analyst',
        role: 'CFO/Financial Expert',
        expertise: 'Financial modeling, valuation, investment analysis, risk assessment',
        personality: 'Detail-oriented, conservative, numbers-focused'
      },
      marketing: {
        name: 'Marketing Director',
        role: 'Chief Marketing Officer',
        expertise: 'Brand strategy, customer acquisition, digital marketing, growth hacking',
        personality: 'Creative, customer-centric, growth-oriented'
      },
      operations: {
        name: 'Operations Manager',
        role: 'COO/Operations Expert',
        expertise: 'Process optimization, supply chain, scaling operations, efficiency',
        personality: 'Practical, systematic, execution-focused'
      },
      innovation: {
        name: 'Innovation Lead',
        role: 'Chief Innovation Officer',
        expertise: 'Product development, technology trends, disruptive innovation',
        personality: 'Visionary, tech-savvy, future-oriented'
      }
    };
    
    this.conversationHistory = [];
    this.activeAgents = [];
  }

  /**
   * Start a multi-agent consultation session
   * @param {Object} consultationRequest - The business challenge or question
   * @param {Array} requestedAgents - List of agent types to include
   * @returns {Object} Orchestrated consultation results
   */
  async startConsultation(consultationRequest, requestedAgents = ['strategist', 'financial', 'marketing']) {
    try {
      this.activeAgents = requestedAgents.filter(agent => this.agents[agent]);
      this.conversationHistory = [];

      const consultation = {
        id: this.generateConsultationId(),
        topic: consultationRequest.topic,
        context: consultationRequest.context,
        agents: this.activeAgents,
        rounds: [],
        synthesis: null,
        recommendations: []
      };

      // Round 1: Initial perspectives from each agent
      const initialRound = await this.conductRound(consultationRequest, 'initial');
      consultation.rounds.push(initialRound);

      // Round 2: Cross-agent discussion and refinement
      const discussionRound = await this.conductRound(consultationRequest, 'discussion', initialRound);
      consultation.rounds.push(discussionRound);

      // Final synthesis
      consultation.synthesis = await this.synthesizeConsultation(consultation);
      consultation.recommendations = this.extractRecommendations(consultation.synthesis);

      return {
        success: true,
        consultation: consultation
      };

    } catch (error) {
      console.error('Multi-agent consultation error:', error);
      return {
        success: false,
        error: 'Failed to conduct multi-agent consultation',
        message: error.message
      };
    }
  }

  /**
   * Conduct a round of agent responses
   */
  async conductRound(consultationRequest, roundType, previousRound = null) {
    const round = {
      type: roundType,
      responses: {},
      timestamp: new Date().toISOString()
    };

    for (const agentType of this.activeAgents) {
      const agent = this.agents[agentType];
      const response = await this.getAgentResponse(agent, consultationRequest, roundType, previousRound);
      round.responses[agentType] = response;
    }

    return round;
  }

  /**
   * Get response from a specific agent
   */
  async getAgentResponse(agent, consultationRequest, roundType, previousRound = null) {
    let prompt = this.buildAgentPrompt(agent, consultationRequest, roundType, previousRound);

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are ${agent.name}, a ${agent.role} with expertise in ${agent.expertise}. Your personality is ${agent.personality}. Provide insights from your specific perspective and expertise.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 800,
      temperature: 0.7
    });

    return {
      agent: agent.name,
      role: agent.role,
      response: completion.choices[0].message.content,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Build prompt for agent based on round type
   */
  buildAgentPrompt(agent, consultationRequest, roundType, previousRound) {
    const baseContext = `
Business Challenge: ${consultationRequest.topic}
Context: ${consultationRequest.context || 'No additional context provided'}
`;

    if (roundType === 'initial') {
      return `${baseContext}

As a ${agent.role}, provide your initial analysis and recommendations for this business challenge. Focus on insights from your area of expertise: ${agent.expertise}.

Please structure your response with:
1. Key insights from your perspective
2. Specific recommendations
3. Potential risks or considerations
4. Success metrics you would track

Keep your response focused and actionable.`;
    }

    if (roundType === 'discussion' && previousRound) {
      const otherResponses = Object.entries(previousRound.responses)
        .filter(([agentType, _]) => agentType !== agent.name.toLowerCase().replace(' ', ''))
        .map(([agentType, response]) => `${response.role}: ${response.response}`)
        .join('\n\n');

      return `${baseContext}

Previous round responses from other experts:
${otherResponses}

Now, as a ${agent.role}, please:
1. Comment on the other experts' perspectives
2. Identify areas of agreement or disagreement
3. Refine your recommendations based on the discussion
4. Highlight any critical points that may have been missed

Provide a collaborative response that builds on the collective insights.`;
    }

    return baseContext;
  }

  /**
   * Synthesize the entire consultation into final recommendations
   */
  async synthesizeConsultation(consultation) {
    const allResponses = consultation.rounds
      .flatMap(round => Object.values(round.responses))
      .map(response => `${response.role}: ${response.response}`)
      .join('\n\n');

    const synthesisPrompt = `
Based on the following multi-agent consultation on "${consultation.topic}", provide a comprehensive synthesis and final recommendations:

${allResponses}

Please provide:
1. Executive summary of key findings
2. Areas of consensus among experts
3. Areas of disagreement and how to resolve them
4. Prioritized action plan
5. Implementation timeline
6. Success metrics and KPIs
7. Risk mitigation strategies

Format this as a professional consulting report summary.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a senior consulting partner synthesizing insights from multiple domain experts into actionable business recommendations."
        },
        {
          role: "user",
          content: synthesisPrompt
        }
      ],
      max_tokens: 1200,
      temperature: 0.6
    });

    return completion.choices[0].message.content;
  }

  /**
   * Extract actionable recommendations from synthesis
   */
  extractRecommendations(synthesis) {
    const recommendations = [];
    const lines = synthesis.split('\n');
    
    for (const line of lines) {
      if (line.includes('recommend') || line.includes('should') || line.includes('action')) {
        recommendations.push(line.trim());
        if (recommendations.length >= 5) break;
      }
    }
    
    return recommendations;
  }

  /**
   * Generate unique consultation ID
   */
  generateConsultationId() {
    return `consultation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get available agent types
   */
  getAvailableAgents() {
    return Object.keys(this.agents).map(key => ({
      type: key,
      ...this.agents[key]
    }));
  }

  /**
   * Add custom agent to the orchestrator
   */
  addCustomAgent(agentType, agentConfig) {
    this.agents[agentType] = agentConfig;
  }
}

export default MultiAgentOrchestrator;
