/**
 * Consultant Quality Assessment Module
 *
 * Deterministic assessment for Maya's consultant onboarding flow.
 * Mirrors the founder quality assessment but uses consultant-specific stages.
 *
 * @see /home/chris/.claude/plans/precious-kindling-balloon.md
 */

import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import {
  CONSULTANT_STAGES_CONFIG,
  CONSULTANT_TOTAL_STAGES,
  getConsultantStageConfigSafe,
} from './consultant-stages-config';

// ============================================================================
// Types
// ============================================================================

export interface ConsultantConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  stage?: number;
  timestamp?: string;
}

export interface ConsultantQualityAssessment {
  // Topic tracking (PRIMARY for stage advancement)
  topicsCovered: string[];
  // Quality metrics (for analytics only, NOT for gating)
  coverage: number;
  clarity: 'high' | 'medium' | 'low';
  completeness: 'complete' | 'partial' | 'insufficient';
  notes: string;
  // Extracted data
  extractedData: Record<string, string | string[] | number | boolean>;
  // Completion info (Stage 7 only)
  keyInsights?: string[];
  recommendedNextSteps?: string[];
}

// ============================================================================
// Assessment Schema
// ============================================================================

export const consultantAssessmentSchema = z.object({
  // Topic tracking (PRIMARY for stage advancement)
  topicsCovered: z
    .array(z.string())
    .describe(
      'Array of dataToCollect field names that were DISCUSSED in this stage. Include a field if: (1) user provided substantive info, (2) user explicitly said they don\'t know/unsure, (3) user gave a clear answer even if brief. Examples: ["practice_name", "focus_area", "years_in_business"]'
    ),

  // Quality metrics (for analytics/display only, NOT for gating)
  coverage: z
    .number()
    .min(0)
    .max(1)
    .describe('Proportion of stage topics discussed (0.0 to 1.0). NOT used for gating.'),

  clarity: z
    .enum(['high', 'medium', 'low'])
    .describe('How clear and specific the consultant responses are'),

  completeness: z
    .enum(['complete', 'partial', 'insufficient'])
    .describe('Whether enough information has been provided to move forward. NOT used for gating.'),

  notes: z.string().describe('Brief observations about the conversation quality'),

  // Extracted data - the KEY output
  extractedData: z
    .record(
      z.string(),
      z.union([z.string(), z.array(z.string()), z.number(), z.boolean()])
    )
    .describe(
      'Key-value pairs of extracted information. Use the exact field names from dataToCollect. For uncertain responses, use format: "uncertain: [their response]"'
    ),

  // Completion info (only for Stage 7)
  keyInsights: z
    .array(z.string())
    .optional()
    .describe('3-5 key insights about the consulting practice (Stage 7 only)'),

  recommendedNextSteps: z
    .array(z.string())
    .optional()
    .describe('3-5 recommended setup actions (Stage 7 only)'),
});

// ============================================================================
// Assessment Function
// ============================================================================

function getAssessmentModel() {
  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: 'https://api.openai.com/v1',
  });
  return openai('gpt-4o-mini');
}

/**
 * Assess consultant conversation quality for the current stage
 *
 * Uses generateObject for deterministic, structured output.
 * This is the consultant equivalent of assessConversationQuality().
 */
export async function assessConsultantConversation(
  stageNumber: number,
  messages: ConsultantConversationMessage[],
  existingData: Record<string, unknown> = {}
): Promise<ConsultantQualityAssessment | null> {
  const stage = getConsultantStageConfigSafe(stageNumber);

  // Extract recent messages for this stage
  const stageMessages = messages.filter(
    (m) => m.stage === stageNumber || !m.stage
  );
  const recentMessages = stageMessages.slice(-10);

  if (recentMessages.length === 0) {
    return null;
  }

  const conversationText = recentMessages
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n\n');

  const assessmentPrompt = `You are evaluating a consultant practice setup conversation.

## Current Stage: ${stage.name} (Stage ${stageNumber}/${CONSULTANT_TOTAL_STAGES})

**Objective**: ${stage.objective}

**Data Fields to Extract** (IMPORTANT - use these EXACT field names):
${stage.dataToCollect.map((field, i) => `- ${field}: ${stage.dataTopics[i]?.label || field}`).join('\n')}

**Already Collected Data**:
${Object.entries(existingData).map(([k, v]) => `- ${k}: ${JSON.stringify(v)}`).join('\n') || '(none)'}

## Recent Conversation:
${conversationText}

## Your Task:
1. Identify which dataToCollect fields were DISCUSSED (even if answer was "I don't know")
2. Extract actual data values using the EXACT field names from dataToCollect
3. For uncertain responses, prefix with "uncertain: " (e.g., "uncertain: not sure yet")
4. Calculate coverage as: topicsCovered.length / ${stage.dataToCollect.length}

IMPORTANT: A topic is "covered" if the consultant engaged with it, even with uncertainty.
"I'm not sure" or "haven't decided" counts as coverage - mark it and move on.`;

  try {
    const { object } = await generateObject({
      model: getAssessmentModel(),
      schema: consultantAssessmentSchema,
      prompt: assessmentPrompt,
      temperature: 0.1, // Low temp for consistent assessment
    });

    return object as ConsultantQualityAssessment;
  } catch (error) {
    console.error('[consultant-quality-assessment] Assessment failed:', error);
    return null;
  }
}

// ============================================================================
// Stage Advancement Logic
// ============================================================================

/**
 * Determine if consultant should advance to the next stage
 *
 * PRIMARY: Topic-based advancement (3 of 4 topics covered)
 * FALLBACK: Message-based (6+ messages with 60% coverage)
 */
export function shouldConsultantAdvanceStage(
  assessment: ConsultantQualityAssessment,
  currentStage: number,
  stageMessageCount?: number
): boolean {
  const config = getConsultantStageConfigSafe(currentStage);

  // Don't advance beyond Stage 7
  if (currentStage >= CONSULTANT_TOTAL_STAGES) {
    return false;
  }

  // PRIMARY: Topic-based advancement
  const requiredTopics = config.dataToCollect;
  const topicsCovered = assessment.topicsCovered || [];
  const topicCoverageRatio = topicsCovered.length / requiredTopics.length;
  const topicThreshold = Math.min(config.progressThreshold, 0.75);
  const topicBasedAdvance = topicCoverageRatio >= topicThreshold;

  // FALLBACK: Message-based advancement (safety net)
  const messageBasedAdvance =
    stageMessageCount !== undefined &&
    stageMessageCount >= 6 &&
    assessment.coverage >= 0.6;

  console.log('[consultant-quality-assessment] Advancement check:', {
    stage: currentStage,
    topicsCovered: topicsCovered.length,
    requiredTopics: requiredTopics.length,
    topicCoverageRatio,
    topicThreshold,
    topicBasedAdvance,
    messageBasedAdvance,
  });

  return topicBasedAdvance || messageBasedAdvance;
}

/**
 * Check if consultant onboarding is complete (Stage 7 finished)
 */
export function isConsultantOnboardingComplete(
  assessment: ConsultantQualityAssessment,
  currentStage: number
): boolean {
  if (currentStage !== CONSULTANT_TOTAL_STAGES) {
    return false;
  }

  // Use same logic as advancement
  return shouldConsultantAdvanceStage(assessment, currentStage);
}

// ============================================================================
// Data Merging Utilities
// ============================================================================

/**
 * Merge extracted data into existing consultant data
 */
export function mergeConsultantExtractedData(
  existingData: Record<string, unknown>,
  newData: Record<string, unknown>
): Record<string, unknown> {
  const merged = { ...existingData };

  for (const [key, value] of Object.entries(newData)) {
    // Skip empty values
    if (value === null || value === undefined || value === '') {
      continue;
    }

    // Skip if existing value is better (not uncertain)
    const existingValue = merged[key];
    if (existingValue && typeof existingValue === 'string') {
      const isExistingUncertain = existingValue.startsWith('uncertain:');
      const isNewUncertain =
        typeof value === 'string' && value.startsWith('uncertain:');

      // Keep existing if it's certain and new is uncertain
      if (!isExistingUncertain && isNewUncertain) {
        continue;
      }
    }

    merged[key] = value;
  }

  return merged;
}

/**
 * Calculate overall progress for consultant onboarding
 */
export function calculateConsultantProgress(
  currentStage: number,
  stageCoverage: number,
  isCompleted: boolean
): number {
  if (isCompleted) {
    return 100;
  }

  // Base progress from completed stages (0-85%)
  const baseProgress = Math.floor(((currentStage - 1) / CONSULTANT_TOTAL_STAGES) * 85);

  // Stage progress contribution (0-12% per stage)
  const stageWeight = Math.floor(85 / CONSULTANT_TOTAL_STAGES);
  const stageProgress = Math.floor(stageCoverage * stageWeight);

  return Math.min(95, baseProgress + stageProgress);
}

/**
 * Generate idempotency key for a message
 */
export function hashConsultantMessage(
  sessionId: string,
  messageIndex: number,
  stage: number,
  content: string
): string {
  const data = `${sessionId}:${messageIndex}:${stage}:${content.substring(0, 50)}`;
  // Simple hash for idempotency
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `assessment_${Math.abs(hash).toString(36)}`;
}
