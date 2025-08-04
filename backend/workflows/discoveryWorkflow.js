/**
 * Discovery Workflow - AI-powered client discovery and analysis
 * Helps identify client needs, market opportunities, and strategic insights
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Analyze client discovery data using AI
 * @param {Object} discoveryData - Client discovery information
 * @returns {Object} AI-generated insights and recommendations
 */
export async function analyzeDiscovery(discoveryData) {
  try {
    const prompt = `
As a strategic business consultant, analyze the following client discovery data and provide insights:

Client Information:
- Industry: ${discoveryData.industry || 'Not specified'}
- Company Size: ${discoveryData.companySize || 'Not specified'}
- Current Challenges: ${discoveryData.challenges || 'Not specified'}
- Goals: ${discoveryData.goals || 'Not specified'}
- Budget Range: ${discoveryData.budget || 'Not specified'}

Please provide:
1. Key insights about the client's situation
2. Potential opportunities for value creation
3. Recommended next steps
4. Risk factors to consider
5. Strategic recommendations

Format your response as a structured analysis with clear sections.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert business strategist and consultant specializing in client discovery and strategic analysis."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.7
    });

    return {
      success: true,
      analysis: completion.choices[0].message.content,
      insights: extractInsights(completion.choices[0].message.content),
      recommendations: extractRecommendations(completion.choices[0].message.content)
    };

  } catch (error) {
    console.error('Discovery analysis error:', error);
    return {
      success: false,
      error: 'Failed to analyze discovery data',
      message: error.message
    };
  }
}

/**
 * Extract key insights from AI analysis
 */
function extractInsights(analysis) {
  // Simple extraction logic - could be enhanced with more sophisticated parsing
  const insights = [];
  const lines = analysis.split('\n');
  
  for (const line of lines) {
    if (line.includes('insight') || line.includes('opportunity') || line.includes('challenge')) {
      insights.push(line.trim());
    }
  }
  
  return insights.slice(0, 5); // Return top 5 insights
}

/**
 * Extract recommendations from AI analysis
 */
function extractRecommendations(analysis) {
  const recommendations = [];
  const lines = analysis.split('\n');
  
  for (const line of lines) {
    if (line.includes('recommend') || line.includes('suggest') || line.includes('should')) {
      recommendations.push(line.trim());
    }
  }
  
  return recommendations.slice(0, 3); // Return top 3 recommendations
}

// Export with expected function name for routes
export const runDiscoveryWorkflow = analyzeDiscovery;

export default {
  analyzeDiscovery,
  runDiscoveryWorkflow
};
