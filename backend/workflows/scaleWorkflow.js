/**
 * Scale Workflow - AI-powered business scaling strategies
 * Provides insights and strategies for scaling business operations
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Generate scaling strategy using AI analysis
 * @param {Object} scaleData - Current business state and scaling goals
 * @returns {Object} Scaling strategy and recommendations
 */
export async function generateScalingStrategy(scaleData) {
  try {
    const prompt = `
As a scaling strategy expert, develop a comprehensive scaling plan for the following business:

Current Business State:
- Current Revenue: ${scaleData.currentRevenue || 'Not specified'}
- Team Size: ${scaleData.teamSize || 'Not specified'}
- Market Position: ${scaleData.marketPosition || 'Not specified'}
- Key Challenges: ${scaleData.challenges || 'Not specified'}
- Growth Goals: ${scaleData.growthGoals || 'Not specified'}
- Timeline: ${scaleData.timeline || 'Not specified'}
- Available Resources: ${scaleData.resources || 'Not specified'}

Please provide:
1. Scaling readiness assessment
2. Priority scaling areas (operations, team, technology, market)
3. Specific scaling strategies and tactics
4. Resource requirements and timeline
5. Key metrics to track
6. Potential scaling risks and mitigation strategies
7. Recommended scaling phases

Format your response with actionable insights and clear implementation steps.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert business scaling strategist with experience helping companies grow from startup to enterprise scale."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1800,
      temperature: 0.7
    });

    const strategy = completion.choices[0].message.content;

    return {
      success: true,
      strategy: strategy,
      readinessScore: extractReadinessScore(strategy),
      priorityAreas: extractPriorityAreas(strategy),
      phases: extractScalingPhases(strategy),
      metrics: extractKeyMetrics(strategy),
      risks: extractScalingRisks(strategy)
    };

  } catch (error) {
    console.error('Scaling strategy generation error:', error);
    return {
      success: false,
      error: 'Failed to generate scaling strategy',
      message: error.message
    };
  }
}

/**
 * Extract readiness score from strategy
 */
function extractReadinessScore(strategy) {
  const scoreMatch = strategy.match(/readiness.*?(\d+)\/10|(\d+)\/10.*?ready/i);
  return scoreMatch ? parseInt(scoreMatch[1] || scoreMatch[2]) : null;
}

/**
 * Extract priority scaling areas
 */
function extractPriorityAreas(strategy) {
  const areas = [];
  const lines = strategy.split('\n');
  
  for (const line of lines) {
    if (line.toLowerCase().includes('priority') || line.toLowerCase().includes('focus')) {
      const areaMatch = line.match(/(operations|team|technology|market|sales|product)/gi);
      if (areaMatch) {
        areas.push(...areaMatch.map(area => area.toLowerCase()));
      }
    }
  }
  
  return [...new Set(areas)].slice(0, 4); // Return unique areas, max 4
}

/**
 * Extract scaling phases
 */
function extractScalingPhases(strategy) {
  const phases = [];
  const lines = strategy.split('\n');
  
  for (const line of lines) {
    if (line.toLowerCase().includes('phase') || line.toLowerCase().includes('stage')) {
      phases.push(line.trim());
      if (phases.length >= 3) break;
    }
  }
  
  return phases;
}

/**
 * Extract key metrics to track
 */
function extractKeyMetrics(strategy) {
  const metrics = [];
  const lines = strategy.split('\n');
  
  for (const line of lines) {
    if (line.toLowerCase().includes('metric') || line.toLowerCase().includes('kpi') || line.toLowerCase().includes('track')) {
      const metricMatch = line.match(/(revenue|growth|retention|acquisition|conversion|churn)/gi);
      if (metricMatch) {
        metrics.push(...metricMatch.map(metric => metric.toLowerCase()));
      }
    }
  }
  
  return [...new Set(metrics)].slice(0, 5); // Return unique metrics, max 5
}

/**
 * Extract scaling risks
 */
function extractScalingRisks(strategy) {
  const risks = [];
  const lines = strategy.split('\n');
  
  let inRiskSection = false;
  for (const line of lines) {
    if (line.toLowerCase().includes('risk') || line.toLowerCase().includes('challenge')) {
      inRiskSection = true;
      if (line.trim().length > 10) {
        risks.push(line.trim());
      }
      continue;
    }
    if (inRiskSection && line.trim() && !line.toLowerCase().includes('mitigation')) {
      risks.push(line.trim());
      if (risks.length >= 3) break;
    }
    if (line.toLowerCase().includes('recommendation') || line.toLowerCase().includes('conclusion')) {
      inRiskSection = false;
    }
  }
  
  return risks;
}

// Export with expected function name for routes
export const runScaleWorkflow = generateScalingStrategy;

export default {
  generateScalingStrategy,
  runScaleWorkflow
};
