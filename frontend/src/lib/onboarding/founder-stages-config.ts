/**
 * Founder Stage Configuration - Alex's 7-Stage Validation Journey
 *
 * Single source of truth for founder onboarding stages.
 * Used by:
 * - FounderOnboardingWizard.tsx (progress display)
 * - founder-onboarding-prompt.ts (AI context)
 * - app/api/chat/stream/route.ts (stage progression)
 *
 * @see Plan: /home/chris/.claude/plans/snappy-hugging-lollipop.md
 */

// ============================================================================
// Types
// ============================================================================

export interface StageDataTopic {
  readonly label: string;
  readonly key: string;
}

export interface OnboardingStageConfig {
  readonly stage: number;
  readonly name: string;
  readonly description: string;
  readonly objective: string;
  readonly keyQuestions: readonly string[];
  readonly dataToCollect: readonly string[];
  readonly dataTopics: readonly StageDataTopic[];
  readonly progressThreshold: number;
}

// ============================================================================
// Stage Configuration (Single Source of Truth)
// ============================================================================

export const FOUNDER_STAGES_CONFIG = [
  {
    stage: 1,
    name: 'Welcome & Introduction',
    description: 'Getting to know you and your business idea',
    objective: "Understand the founder's background, inspiration, and current business stage",
    keyQuestions: [
      'What business idea are you most excited about?',
      'What inspired this idea?',
      'What stage is your business currently in?',
    ],
    dataToCollect: ['business_concept', 'inspiration', 'current_stage', 'founder_background'],
    dataTopics: [
      { label: 'Business concept', key: 'business_concept' },
      { label: 'Inspiration', key: 'inspiration' },
      { label: 'Current stage', key: 'current_stage' },
      { label: 'Background', key: 'founder_background' },
    ],
    progressThreshold: 0.7, // Bug B7 fix: Lowered from 0.8 to prevent getting stuck
  },
  {
    stage: 2,
    name: 'Customer Discovery',
    description: 'Understanding your target customers',
    objective: 'Identify and validate target customer segments',
    keyQuestions: [
      'Who do you think would be most interested in this solution?',
      'What specific group of people have this problem most acutely?',
      'How do these customers currently solve this problem?',
    ],
    dataToCollect: ['target_customers', 'customer_segments', 'current_solutions', 'customer_behaviors'],
    dataTopics: [
      { label: 'Target customers', key: 'target_customers' },
      { label: 'Customer segments', key: 'customer_segments' },
      { label: 'Current solutions', key: 'current_solutions' },
      { label: 'Customer behaviors', key: 'customer_behaviors' },
    ],
    progressThreshold: 0.75,
  },
  {
    stage: 3,
    name: 'Problem Definition',
    description: "Defining the core problem you're solving",
    objective: 'Articulate the problem statement with clarity and evidence',
    keyQuestions: [
      'What specific problem does your solution address?',
      'How painful is this problem for your customers?',
      'How often do they encounter this problem?',
      'What evidence do you have that this problem exists?',
    ],
    dataToCollect: ['problem_description', 'pain_level', 'frequency', 'problem_evidence'],
    dataTopics: [
      { label: 'Problem description', key: 'problem_description' },
      { label: 'Pain level', key: 'pain_level' },
      { label: 'Frequency', key: 'frequency' },
      { label: 'Problem evidence', key: 'problem_evidence' },
    ],
    progressThreshold: 0.8,
  },
  {
    stage: 4,
    name: 'Solution Validation',
    description: 'Exploring your proposed solution',
    objective: 'Define the solution approach and unique value proposition',
    keyQuestions: [
      'How does your solution solve this problem?',
      'What makes your approach unique?',
      "What's your key differentiator?",
      'Why would customers choose you over alternatives?',
    ],
    dataToCollect: ['solution_description', 'solution_mechanism', 'unique_value_prop', 'differentiation'],
    dataTopics: [
      { label: 'Solution approach', key: 'solution_description' },
      { label: 'How it works', key: 'solution_mechanism' },
      { label: 'Unique value', key: 'unique_value_prop' },
      { label: 'Differentiation', key: 'differentiation' },
    ],
    progressThreshold: 0.75,
  },
  {
    stage: 5,
    name: 'Competitive Analysis',
    description: 'Understanding the competitive landscape',
    objective: 'Map competitors and identify positioning opportunities',
    keyQuestions: [
      'Who else is solving this problem?',
      'What alternatives do customers have?',
      'What would make customers switch to your solution?',
      'What are the strengths and weaknesses of existing solutions?',
    ],
    dataToCollect: ['competitors', 'alternatives', 'switching_barriers', 'competitive_advantages'],
    dataTopics: [
      { label: 'Competitors', key: 'competitors' },
      { label: 'Alternatives', key: 'alternatives' },
      { label: 'Switching barriers', key: 'switching_barriers' },
      { label: 'Competitive advantages', key: 'competitive_advantages' },
    ],
    progressThreshold: 0.7,
  },
  {
    stage: 6,
    name: 'Resources & Constraints',
    description: 'Assessing your available resources',
    objective: 'Understand budget, team, and constraints',
    keyQuestions: [
      "What's your budget for getting started?",
      'What skills and resources do you have available?',
      'What are your main constraints (time, money, team)?',
      'What channels do you have access to for reaching customers?',
    ],
    dataToCollect: ['budget_range', 'available_resources', 'constraints', 'team_capabilities', 'available_channels'],
    dataTopics: [
      { label: 'Budget range', key: 'budget_range' },
      { label: 'Resources', key: 'available_resources' },
      { label: 'Constraints', key: 'constraints' },
      { label: 'Team capabilities', key: 'team_capabilities' },
      { label: 'Channels', key: 'available_channels' },
    ],
    progressThreshold: 0.75,
  },
  {
    stage: 7,
    name: 'Goals & Next Steps',
    description: 'Setting strategic goals and priorities',
    objective: 'Define success metrics and immediate action items',
    keyQuestions: [
      'What do you want to achieve in the next 3 months?',
      'How will you measure success?',
      "What's your biggest priority right now?",
      "What's the first experiment you want to run?",
    ],
    dataToCollect: ['short_term_goals', 'success_metrics', 'priorities', 'first_experiment'],
    dataTopics: [
      { label: 'Short-term goals', key: 'short_term_goals' },
      { label: 'Success metrics', key: 'success_metrics' },
      { label: 'Priorities', key: 'priorities' },
      { label: 'First experiment', key: 'first_experiment' },
    ],
    progressThreshold: 0.85,
  },
] as const satisfies readonly OnboardingStageConfig[];

// ============================================================================
// Derived Constants
// ============================================================================

export const FOUNDER_TOTAL_STAGES = FOUNDER_STAGES_CONFIG.length;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get configuration for a specific stage number
 * @param stageNumber - 1-indexed stage number (1-7)
 * @returns Stage configuration or undefined if not found
 */
export function getFounderStageConfig(stageNumber: number): OnboardingStageConfig | undefined {
  return FOUNDER_STAGES_CONFIG.find(s => s.stage === stageNumber);
}

/**
 * Get stage configuration with fallback to first stage
 * @param stageNumber - 1-indexed stage number (1-7)
 * @returns Stage configuration (falls back to stage 1 if not found)
 */
export function getFounderStageConfigSafe(stageNumber: number): OnboardingStageConfig {
  return getFounderStageConfig(stageNumber) ?? FOUNDER_STAGES_CONFIG[0];
}

/**
 * Get display topics for a specific stage (used by OnboardingSidebar)
 * @param stageNumber - 1-indexed stage number (1-7)
 * @returns Array of topics with labels and keys
 */
export function getFounderStageTopics(stageNumber: number): readonly StageDataTopic[] {
  return getFounderStageConfig(stageNumber)?.dataTopics ?? [];
}

/**
 * Generate system context string for AI prompt
 *
 * TDD Refactoring: Now includes keyQuestions to guide Alex on specific topics to cover.
 * Alex should ask these questions in order, adapting naturally to the conversation.
 *
 * @param stageNumber - Current stage number
 * @param collectedData - Data collected so far
 * @returns Formatted context string for AI system prompt
 */
export function getFounderStageSystemContext(
  stageNumber: number,
  collectedData: Record<string, unknown>
): string {
  const stage = getFounderStageConfigSafe(stageNumber);

  const collectedEntries = Object.entries(collectedData)
    .map(([key, value]) => {
      const displayValue = typeof value === 'string'
        ? value.substring(0, 100)
        : JSON.stringify(value).substring(0, 100);
      return `- ${key}: ${displayValue}`;
    })
    .join('\n');

  const missingFields = stage.dataToCollect
    .filter(field => !collectedData[field]);

  // Map data fields to their corresponding questions
  const questionsToAsk = missingFields.length > 0
    ? missingFields.map((field, index) => {
        const questionIndex = stage.dataToCollect.indexOf(field);
        const question = stage.keyQuestions[questionIndex] || `Tell me about your ${field.replace(/_/g, ' ')}`;
        return `${index + 1}. ${question} (collects: ${field})`;
      }).join('\n')
    : 'All topics covered for this stage.';

  return `
## Current Stage: ${stage.name} (Stage ${stageNumber}/${FOUNDER_TOTAL_STAGES})

**Objective**: ${stage.objective}

**Key Questions to Ask** (in order of priority):
${questionsToAsk}

**Already Collected**:
${collectedEntries || '(none yet)'}

**Missing Data Points**: ${missingFields.join(', ') || 'None - all topics covered!'}

**INSTRUCTIONS**:
- Ask ONE question at a time from the "Key Questions to Ask" list above
- If user responds with "I don't know", acknowledge it and move to the next question
- Once all topics are covered, the system will automatically advance to the next stage
- Do NOT say "final question" or "last thing" - you don't control when stages complete
`;
}

/**
 * Get stage name by number
 * @param stageNumber - 1-indexed stage number (1-7)
 * @returns Stage name or fallback string
 */
export function getFounderStageName(stageNumber: number): string {
  return getFounderStageConfig(stageNumber)?.name ?? `Stage ${stageNumber}`;
}
