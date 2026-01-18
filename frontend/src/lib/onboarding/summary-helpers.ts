/**
 * Summary Modal Helpers
 *
 * Transforms onboarding session data into the format required by SummaryModal.
 * Used to display the Approve/Revise modal after Stage 7 completion.
 *
 * @see Plan: /home/chris/.claude/plans/precious-kindling-balloon.md
 */

import { ONBOARDING_STAGES_CONFIG } from './stages-config';
import type { StageSummaryData } from '@/components/onboarding/SummaryModal';

/**
 * Session stage_data structure from Supabase
 * Contains extracted data from each stage's assessment
 */
interface SessionStageData {
  brief?: Record<string, string | string[] | undefined>;
  [key: string]: unknown;
}

/**
 * Transform session stage_data into StageSummaryData array for SummaryModal
 *
 * @param stageData - The stage_data object from the onboarding session
 * @param currentStage - The current/completed stage number (usually 7)
 * @returns Array of StageSummaryData for each completed stage
 */
export function transformSessionToSummary(
  stageData: SessionStageData | null | undefined,
  currentStage: number = 7
): StageSummaryData[] {
  const briefData = stageData?.brief || {};

  // Build summary for each completed stage
  return ONBOARDING_STAGES_CONFIG.slice(0, currentStage).map(stageConfig => {
    // Extract data for this stage's fields from the brief
    const stageDataFields: Record<string, string | string[] | undefined> = {};

    for (const field of stageConfig.dataToCollect) {
      const value = briefData[field];
      if (value !== undefined) {
        stageDataFields[field] = value as string | string[];
      }
    }

    return {
      stage: stageConfig.stage,
      stageName: stageConfig.name,
      data: stageDataFields,
    };
  });
}

/**
 * Calculate summary statistics from stage data
 *
 * @param summaryData - Array of StageSummaryData
 * @returns Object with statistics: totalFields, capturedFields, uncertainFields
 */
export function calculateSummaryStats(summaryData: StageSummaryData[]): {
  totalFields: number;
  capturedFields: number;
  uncertainFields: number;
} {
  let totalFields = 0;
  let capturedFields = 0;
  let uncertainFields = 0;

  for (const stage of summaryData) {
    const stageConfig = ONBOARDING_STAGES_CONFIG.find(s => s.stage === stage.stage);
    if (!stageConfig) continue;

    totalFields += stageConfig.dataToCollect.length;

    for (const field of stageConfig.dataToCollect) {
      const value = stage.data[field];
      if (value !== undefined && value !== null && value !== '') {
        if (isUncertainValue(value)) {
          uncertainFields++;
        }
        capturedFields++;
      }
    }
  }

  return {
    totalFields,
    capturedFields,
    uncertainFields,
  };
}

/**
 * Check if a value represents uncertainty
 *
 * @param value - The extracted value to check
 * @returns true if the value indicates the user was uncertain
 */
function isUncertainValue(value: string | string[] | undefined): boolean {
  if (!value) return false;

  if (typeof value === 'string') {
    const lowerValue = value.toLowerCase();
    return (
      lowerValue === 'uncertain' ||
      lowerValue === 'unknown' ||
      lowerValue.includes("don't know") ||
      lowerValue.includes("haven't thought") ||
      lowerValue.includes('not sure')
    );
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  return false;
}

/**
 * Extract the entrepreneur brief from session data for display
 *
 * @param stageData - The stage_data object from the onboarding session
 * @returns Formatted brief data for display
 */
export function extractBriefForDisplay(
  stageData: SessionStageData | null | undefined
): Record<string, string | string[]> {
  const briefData = stageData?.brief || {};
  const display: Record<string, string | string[]> = {};

  for (const [key, value] of Object.entries(briefData)) {
    if (value !== undefined && value !== null && value !== '') {
      display[key] = value as string | string[];
    }
  }

  return display;
}
