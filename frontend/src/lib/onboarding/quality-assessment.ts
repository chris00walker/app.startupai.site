/**
 * Quality Assessment Module for Two-Pass Onboarding Architecture
 *
 * This module provides deterministic backend-driven quality assessment
 * for onboarding conversations. It replaces the previous tool-based
 * approach that had unreliable 18% call rates.
 *
 * Architecture:
 * - Pass 1: LLM generates conversational response (no tools)
 * - Pass 2: Backend ALWAYS calls assessConversationQuality() after each response
 *
 * @see Plan: /home/chris/.claude/plans/async-mixing-ritchie.md
 */

import { z } from 'zod';
import { generateObject } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createHash } from 'crypto';
import { getStageConfigSafe, TOTAL_STAGES } from './stages-config';

// ============================================================================
// Types & Schemas
// ============================================================================

/**
 * Quality assessment schema for generateObject
 * Includes quality metrics and extracted data fields
 *
 * Topic-Based Advancement (TDD Refactoring):
 * - Assessment extracts data only, does NOT gate progression
 * - Stage advances when topics are covered (even with "I don't know")
 * - topicsCovered array explicitly tracks which data fields were discussed
 */
export const qualityAssessmentSchema = z.object({
  // Topic tracking (PRIMARY for stage advancement)
  topicsCovered: z
    .array(z.string())
    .describe('Array of dataToCollect field names that were DISCUSSED in this stage. Include a field if the topic was asked about AND the user responded (even with "I don\'t know")'),

  // Quality metrics (for analytics/display only, NOT for gating)
  coverage: z
    .number()
    .min(0)
    .max(1)
    .describe('Fraction of required data fields that have been discussed (0.0 to 1.0)'),
  clarity: z
    .enum(['high', 'medium', 'low'])
    .describe('How clear and specific the user responses are'),
  completeness: z
    .enum(['complete', 'partial', 'insufficient'])
    .describe('Assessment of data completeness (for analytics only, does NOT gate advancement)'),
  notes: z.string().describe('Brief observations about quality gaps or areas needing more detail'),

  // Data extraction - merged into stage_data.brief
  extractedData: z
    .object({
      // Stage 1: Welcome & Introduction
      business_concept: z.string().optional(),
      inspiration: z.string().optional(),
      current_stage: z.string().optional(),
      founder_background: z.string().optional(),

      // Stage 2: Customer Discovery
      target_customers: z.array(z.string()).optional(),
      customer_segments: z.array(z.string()).optional(),
      current_solutions: z.array(z.string()).optional(),
      customer_behaviors: z.array(z.string()).optional(),

      // Stage 3: Problem Definition
      problem_description: z.string().optional(),
      pain_level: z.string().optional(),
      frequency: z.string().optional(),
      problem_evidence: z.string().optional(),

      // Stage 4: Solution Validation
      solution_description: z.string().optional(),
      solution_mechanism: z.string().optional(),
      unique_value_prop: z.string().optional(),
      differentiation: z.string().optional(),

      // Stage 5: Competitive Analysis
      competitors: z.array(z.string()).optional(),
      alternatives: z.array(z.string()).optional(),
      switching_barriers: z.array(z.string()).optional(),
      competitive_advantages: z.array(z.string()).optional(),

      // Stage 6: Resources & Constraints
      budget_range: z.string().optional(),
      available_resources: z.array(z.string()).optional(),
      constraints: z.array(z.string()).optional(),
      team_capabilities: z.array(z.string()).optional(),
      available_channels: z.array(z.string()).optional(),

      // Stage 7: Goals & Next Steps
      short_term_goals: z.array(z.string()).optional(),
      success_metrics: z.array(z.string()).optional(),
      priorities: z.array(z.string()).optional(),
      first_experiment: z.string().optional(),
    })
    .optional()
    .describe('Extracted data values from the conversation'),

  // Stage 7 completion fields (only populated at final stage)
  // MUST have .min(3) to prevent completion stall (see Erratum 2)
  keyInsights: z
    .array(z.string())
    .min(3)
    .optional()
    .describe('3-5 key insights from the entire conversation (Stage 7 only)'),
  recommendedNextSteps: z
    .array(z.string())
    .min(3)
    .optional()
    .describe('3-5 recommended validation experiments (Stage 7 only)'),
});

export type QualityAssessment = z.infer<typeof qualityAssessmentSchema>;

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  stage?: number;
  timestamp?: string; // ISO timestamp for UI display and React keys (see Erratum 1)
}

// ============================================================================
// OpenRouter Configuration
// ============================================================================

function getAssessmentModel() {
  const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  // Use Claude 3.5 Haiku for fast, cheap, reliable structured output
  // Note: OpenRouter passes schema to Claude for JSON mode
  return openrouter('anthropic/claude-3.5-haiku');
}

/**
 * Get Anthropic model directly for more reliable structured output
 * Fallback if OpenRouter has issues with JSON mode
 */
async function getAnthropicAssessmentModel() {
  const { createAnthropic } = await import('@ai-sdk/anthropic');
  const anthropic = createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
  return anthropic('claude-3-5-haiku-latest');
}

// ============================================================================
// Assessment Functions
// ============================================================================

/**
 * Build the assessment prompt for a specific stage
 *
 * @param stage - Current stage number (1-7)
 * @param history - Full conversation history
 * @param existingBrief - Data already collected from previous stages
 * @returns Formatted prompt string for generateObject
 */
export function buildAssessmentPrompt(
  stage: number,
  history: ConversationMessage[],
  existingBrief: Record<string, unknown>
): string {
  const config = getStageConfigSafe(stage);

  // Filter to messages from current stage only
  const stageMessages = history.filter(m => m.stage === stage);

  // FALLBACK: If no stage-tagged messages, include all non-system messages
  // This handles legacy sessions created before Two-Pass deployment (see Erratum 3)
  const messagesForAssessment =
    stageMessages.length > 0
      ? stageMessages
      : history.filter(m => m.role !== 'system');

  const conversationText =
    messagesForAssessment.length > 0
      ? messagesForAssessment.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n')
      : 'No messages yet for this stage.';

  const existingDataText =
    Object.keys(existingBrief).length > 0
      ? JSON.stringify(existingBrief, null, 2)
      : '(No data collected yet)';

  return `You are assessing an onboarding conversation for quality and completeness.

IMPORTANT: You MUST respond with a valid JSON object only. Do not include any explanatory text, markdown formatting, or code blocks - just the raw JSON object.

## Stage ${stage}: ${config.name}
**Objective**: ${config.objective}
**Required Data**: ${config.dataToCollect.join(', ')}
**Progress Threshold**: ${config.progressThreshold} (${(config.progressThreshold * 100).toFixed(0)}%)

## Data Already Collected (from previous stages)
${existingDataText}

## Current Stage Conversation
${conversationText}

## Your Task
1. **Topics Covered** (MOST IMPORTANT): List which of the required data fields have been DISCUSSED in this stage.
   - Required fields: ${config.dataToCollect.join(', ')}
   - A topic is "covered" if:
     * Alex asked about it AND the user responded (even with "I don't know")
     * OR the user volunteered information about it
   - IMPORTANT: "I don't know", "haven't thought about that", or similar uncertainty responses COUNT as the topic being covered
   - Return an array of field names that have been discussed, e.g., ["business_concept", "inspiration"]

2. **Coverage (0-1)**: Calculate as: topicsCovered.length / ${config.dataToCollect.length}
   - Coverage measures TOPICS DISCUSSED, not QUALITY of answers
   - Be precise - 0.5 means half the fields have been discussed

3. **Clarity**: Rate overall response quality (for analytics only):
   - "high": Specific, concrete answers with examples or numbers
   - "medium": Somewhat vague but understandable (including honest uncertainty)
   - "low": Very vague, evasive, or unhelpful responses

4. **Completeness**: Assessment for analytics (does NOT gate advancement):
   - "complete": Coverage >= ${(config.progressThreshold * 100).toFixed(0)}% (topics discussed, even if some answers are uncertain)
   - "partial": Making progress but more topics need to be covered
   - "insufficient": Major topics haven't been discussed yet

5. **Extract Data**: Pull out values mentioned for the required fields.
   - If user said "I don't know" or expressed uncertainty, extract as "uncertain" or "unknown"
   - This is VALID DATA - knowing what they don't know helps the analysis

6. **Notes**: Brief observations about gaps or what needs validation.
${
  stage === TOTAL_STAGES
    ? `
## Stage 7 Completion (IMPORTANT)
This is the final stage. If completeness is "complete", also provide:
- **keyInsights**: 3-5 key insights from the ENTIRE conversation (all 7 stages)
- **recommendedNextSteps**: 3-5 suggested validation experiments based on everything discussed
`
    : ''
}
## Required Response Format
Respond ONLY with a JSON object in this exact format (no markdown, no explanation):
{
  "topicsCovered": ["<field1>", "<field2>", ...],
  "coverage": <number between 0 and 1>,
  "clarity": "<high|medium|low>",
  "completeness": "<complete|partial|insufficient>",
  "notes": "<string>",
  "extractedData": { <field>: <value>, ... }${stage === TOTAL_STAGES ? ',\n  "keyInsights": ["<insight1>", "<insight2>", "<insight3>"],\n  "recommendedNextSteps": ["<step1>", "<step2>", "<step3>"]' : ''}
}`;
}

/**
 * Assess conversation quality with retry logic
 *
 * Uses Anthropic SDK directly for reliable structured output.
 * Falls back to OpenRouter if Anthropic API key is not available.
 *
 * Note: AI SDK v5 removed the `mode: 'json'` parameter. Structured output
 * is now handled automatically by the provider when a schema is passed.
 * For Anthropic, the SDK uses tool-based JSON generation by default,
 * or native structured output (outputFormat) on newer models.
 *
 * @param prompt - The assessment prompt
 * @param maxRetries - Maximum retry attempts (default: 3)
 * @returns QualityAssessment or null if all retries fail
 */
export async function assessWithRetry(
  prompt: string,
  maxRetries: number = 3
): Promise<QualityAssessment | null> {
  // ALWAYS prefer Anthropic SDK directly for reliable structured output
  // OpenRouter may not properly relay JSON mode settings to Claude
  let model;
  const useAnthropicDirect = !!process.env.ANTHROPIC_API_KEY;

  if (useAnthropicDirect) {
    try {
      model = await getAnthropicAssessmentModel();
      console.log('[quality-assessment] Using Anthropic SDK directly for structured output');
    } catch (err) {
      console.warn('[quality-assessment] Failed to initialize Anthropic, falling back to OpenRouter:', err);
      model = getAssessmentModel();
    }
  } else {
    model = getAssessmentModel();
    console.log('[quality-assessment] Using OpenRouter for assessment (ANTHROPIC_API_KEY not set)');
    console.warn('[quality-assessment] WARNING: OpenRouter may have unreliable JSON output. Set ANTHROPIC_API_KEY for better results.');
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // AI SDK v5: `mode` parameter is deprecated/ignored
      // Structured output is determined by the provider automatically when schema is passed
      // For Anthropic, this uses tool-based JSON or native structured output
      const { object } = await generateObject({
        model,
        schema: qualityAssessmentSchema,
        prompt,
        // Note: Do NOT pass `mode: 'json'` - it's deprecated in AI SDK v5
        // The schema alone tells the SDK to use structured output
      });
      return object;
    } catch (error) {
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // 1s, 2s, 4s (capped)
      console.warn(
        `[quality-assessment] Attempt ${attempt}/${maxRetries} failed, retrying in ${delay}ms:`,
        error
      );

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  console.error('[quality-assessment] Assessment failed after all retries');
  return null;
}

/**
 * Main entry point: assess conversation quality for a stage
 *
 * @param stage - Current stage number (1-7)
 * @param history - Full conversation history
 * @param existingBrief - Data already collected
 * @returns QualityAssessment or null if assessment fails
 */
export async function assessConversationQuality(
  stage: number,
  history: ConversationMessage[],
  existingBrief: Record<string, unknown>
): Promise<QualityAssessment | null> {
  const prompt = buildAssessmentPrompt(stage, history, existingBrief);

  console.log('[quality-assessment] Starting assessment for stage', stage, {
    historyLength: history.length,
    stageMessageCount: history.filter(m => m.stage === stage).length,
    existingFields: Object.keys(existingBrief),
  });

  const assessment = await assessWithRetry(prompt);

  if (assessment) {
    console.log('[quality-assessment] Assessment complete:', {
      stage,
      topicsCovered: assessment.topicsCovered || [],
      coverage: assessment.coverage,
      clarity: assessment.clarity,
      completeness: assessment.completeness,
      extractedFields: Object.keys(assessment.extractedData || {}),
    });
  }

  return assessment;
}

// ============================================================================
// State Machine Functions
// ============================================================================

/**
 * Determine if stage should advance based on topic coverage
 *
 * TDD Refactoring: Topic-based advancement instead of quality gating
 * - Stage advances when 75%+ of topics have been DISCUSSED (asked & responded)
 * - "I don't know" responses COUNT as topic coverage (valid data)
 * - Completeness field is for analytics only, NOT for gating
 *
 * Fallback: Message-based advancement after 6+ messages (3 exchanges)
 *
 * @param assessment - Quality assessment result (includes topicsCovered array)
 * @param currentStage - Current stage number (1-7)
 * @param stageMessageCount - Optional: Number of messages in current stage
 * @returns true if stage should advance
 */
export function shouldAdvanceStage(
  assessment: QualityAssessment,
  currentStage: number,
  stageMessageCount?: number
): boolean {
  const config = getStageConfigSafe(currentStage);

  // Cannot advance past final stage
  if (currentStage >= TOTAL_STAGES) {
    return false;
  }

  // PRIMARY: Topic-based advancement
  // Advance when 75%+ of required topics have been discussed
  const requiredTopics = config.dataToCollect;
  const topicsCovered = assessment.topicsCovered || [];
  const topicCoverageRatio = topicsCovered.length / requiredTopics.length;

  // Stage-specific threshold (from config) or default 75%
  const topicThreshold = Math.min(config.progressThreshold, 0.75);
  const topicBasedAdvance = topicCoverageRatio >= topicThreshold;

  // FALLBACK: Message-based advancement (safety net)
  // After 6+ messages (3 exchanges) in a stage, advance if at least 60% coverage
  // This prevents infinite loops if topic detection has issues
  const messageBasedAdvance =
    stageMessageCount !== undefined &&
    stageMessageCount >= 6 &&
    assessment.coverage >= 0.6;

  // Log advancement decision
  if (topicBasedAdvance || messageBasedAdvance) {
    console.log('[quality-assessment] Stage advancement:', {
      stage: currentStage,
      method: topicBasedAdvance ? 'topic-based' : 'message-based',
      topicsCovered: topicsCovered,
      topicCoverageRatio: topicCoverageRatio.toFixed(2),
      requiredTopics: requiredTopics,
      messageCount: stageMessageCount,
      coverage: assessment.coverage,
    });
  }

  return topicBasedAdvance || messageBasedAdvance;
}

/**
 * Check if onboarding is complete (Stage 7 finished)
 *
 * @param assessment - Quality assessment result
 * @param currentStage - Current stage number
 * @returns true if onboarding is complete
 */
export function isOnboardingComplete(
  assessment: QualityAssessment,
  currentStage: number
): boolean {
  // Must be at Stage 7 and marked complete
  if (currentStage !== TOTAL_STAGES) {
    return false;
  }

  // Must have keyInsights and recommendedNextSteps populated
  const hasInsights = !!(assessment.keyInsights && assessment.keyInsights.length >= 3);
  const hasNextSteps = !!(assessment.recommendedNextSteps && assessment.recommendedNextSteps.length >= 3);

  return assessment.completeness === 'complete' && hasInsights && hasNextSteps;
}

// ============================================================================
// Data Merging Functions
// ============================================================================

/**
 * Merge extracted data into existing brief
 *
 * For arrays: appends new values (deduped)
 * For strings: overwrites with new non-empty values
 *
 * @param existingBrief - Current brief data
 * @param extractedData - Newly extracted data
 * @returns Merged brief data
 */
export function mergeExtractedData(
  existingBrief: Record<string, unknown>,
  extractedData: Record<string, unknown> | undefined
): Record<string, unknown> {
  if (!extractedData) return existingBrief;

  const merged = { ...existingBrief };

  for (const [key, value] of Object.entries(extractedData)) {
    // Skip undefined, null, or empty values
    if (value === undefined || value === null || value === '') {
      continue;
    }

    // For arrays, append and dedupe
    if (Array.isArray(value)) {
      if (Array.isArray(merged[key])) {
        merged[key] = [...new Set([...(merged[key] as unknown[]), ...value])];
      } else {
        merged[key] = value;
      }
    } else {
      // For non-arrays, prefer new non-empty values
      merged[key] = value;
    }
  }

  return merged;
}

// ============================================================================
// Idempotency Functions
// ============================================================================

/**
 * Generate stable idempotency key for assessment
 *
 * Uses sessionId + messageIndex + stage + userMessage content to create
 * a unique key that prevents duplicate assessments on retry.
 *
 * @param sessionId - Session identifier
 * @param messageIndex - Number of messages at request start
 * @param stage - Current stage at request start
 * @param userMessage - User message content
 * @returns Idempotency key string
 */
export function hashMessageForIdempotency(
  sessionId: string,
  messageIndex: number,
  stage: number,
  userMessage: string
): string {
  const hash = createHash('sha256')
    .update(`${sessionId}:${messageIndex}:${stage}:${userMessage}`)
    .digest('hex')
    .slice(0, 16); // First 16 chars is enough for uniqueness

  return `assessment_${hash}`;
}

// ============================================================================
// Progress Calculation (Preserved from original implementation)
// ============================================================================

/**
 * Calculate overall progress percentage
 *
 * @param newStage - Current or new stage number
 * @param coverage - Coverage score from assessment (0-1)
 * @param isCompleted - Whether onboarding is complete
 * @param messageCount - Total message count
 * @returns Progress percentage (0-100)
 */
export function calculateOverallProgress(
  newStage: number,
  coverage: number,
  isCompleted: boolean,
  messageCount: number
): number {
  if (isCompleted) return 100;

  // Base progress: Stage 1 = 0-14%, Stage 2 = 14-28%, ..., Stage 7 = 85-100%
  const baseProgress = Math.floor(((newStage - 1) / TOTAL_STAGES) * 100);
  const stageWeight = Math.floor(100 / TOTAL_STAGES); // ~14% per stage

  // Quality-based progress
  const qualityBasedProgress = baseProgress + Math.floor(coverage * stageWeight);

  // Message-based minimum (0.5% per message, capped at stage max)
  const messageBasedProgress = Math.min(
    baseProgress + stageWeight - 1,
    Math.floor(messageCount * 0.5)
  );

  // Use the higher of quality-based or message-based, capped at 95%
  return Math.min(95, Math.max(qualityBasedProgress, messageBasedProgress));
}
