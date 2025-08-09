/**
 * Validation Workflow - AI-powered business model validation
 * Validates business ideas, models, and strategies using AI insights
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Validate business model using AI analysis
 * @param {Object} businessModel - Business model data to validate
 * @returns {Object} Validation results and recommendations
 */
export async function validateBusinessModel(businessModel) {
  try {
    const prompt = `
As a business validation expert, analyze and validate the following business model:

Business Model Details:
- Value Proposition: ${businessModel.valueProposition || 'Not specified'}
- Target Market: ${businessModel.targetMarket || 'Not specified'}
- Revenue Model: ${businessModel.revenueModel || 'Not specified'}
- Key Resources: ${businessModel.keyResources || 'Not specified'}
- Key Partners: ${businessModel.keyPartners || 'Not specified'}
- Cost Structure: ${businessModel.costStructure || 'Not specified'}

Please provide:
1. Validation score (1-10) with reasoning
2. Strengths of the business model
3. Weaknesses and potential risks
4. Market viability assessment
5. Specific recommendations for improvement
6. Key assumptions that need testing

Format your response with clear sections and actionable insights.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert business model validator with extensive experience in startup and enterprise strategy validation."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.6
    });

    const analysis = completion.choices[0].message.content;

    return {
      success: true,
      validation: analysis,
      score: extractValidationScore(analysis),
      strengths: extractStrengths(analysis),
      weaknesses: extractWeaknesses(analysis),
      recommendations: extractValidationRecommendations(analysis)
    };

  } catch (error) {
    console.error('Business model validation error:', error);
    return {
      success: false,
      error: 'Failed to validate business model',
      message: error.message
    };
  }
}

/**
 * Extract validation score from analysis
 */
function extractValidationScore(analysis) {
  const scoreMatch = analysis.match(/(\d+)\/10|score.*?(\d+)/i);
  return scoreMatch ? parseInt(scoreMatch[1] || scoreMatch[2]) : null;
}

/**
 * Extract strengths from analysis
 */
function extractStrengths(analysis) {
  const strengths = [];
  const lines = analysis.split('\n');
  
  let inStrengthsSection = false;
  for (const line of lines) {
    if (line.toLowerCase().includes('strength')) {
      inStrengthsSection = true;
      continue;
    }
    if (inStrengthsSection && line.trim() && !line.toLowerCase().includes('weakness')) {
      strengths.push(line.trim());
      if (strengths.length >= 3) break;
    }
    if (line.toLowerCase().includes('weakness') || line.toLowerCase().includes('risk')) {
      inStrengthsSection = false;
    }
  }
  
  return strengths;
}

/**
 * Extract weaknesses from analysis
 */
function extractWeaknesses(analysis) {
  const weaknesses = [];
  const lines = analysis.split('\n');
  
  let inWeaknessSection = false;
  for (const line of lines) {
    if (line.toLowerCase().includes('weakness') || line.toLowerCase().includes('risk')) {
      inWeaknessSection = true;
      continue;
    }
    if (inWeaknessSection && line.trim() && !line.toLowerCase().includes('recommendation')) {
      weaknesses.push(line.trim());
      if (weaknesses.length >= 3) break;
    }
    if (line.toLowerCase().includes('recommendation') || line.toLowerCase().includes('improvement')) {
      inWeaknessSection = false;
    }
  }
  
  return weaknesses;
}

/**
 * Extract recommendations from validation analysis
 */
function extractValidationRecommendations(analysis) {
  const recommendations = [];
  const lines = analysis.split('\n');
  
  for (const line of lines) {
    if (line.includes('recommend') || line.includes('should') || line.includes('improve')) {
      recommendations.push(line.trim());
      if (recommendations.length >= 3) break;
    }
  }
  
  return recommendations;
}

// Export with expected function name for routes
export const runValidationWorkflow = validateBusinessModel;

export default {
  validateBusinessModel,
  runValidationWorkflow
};
