/**
 * Consultant Stage Configuration for Maya (Practice Setup)
 *
 * Single source of truth for Maya's 7-stage consultant onboarding.
 * Used by:
 * - Maya's system prompt in /api/consultant/chat/route.ts
 * - Consultant onboarding progress display
 * - Quality assessment for consultant sessions
 *
 * @see Plan: /home/chris/.claude/plans/precious-kindling-balloon.md
 */

// ============================================================================
// Types
// ============================================================================

export interface ConsultantStageDataTopic {
  readonly label: string;
  readonly key: string;
}

export interface ConsultantStageConfig {
  readonly stage: number;
  readonly name: string;
  readonly description: string;
  readonly objective: string;
  readonly keyQuestions: readonly string[];
  readonly dataToCollect: readonly string[];
  readonly dataTopics: readonly ConsultantStageDataTopic[];
  readonly progressThreshold: number;
}

// ============================================================================
// Stage Configuration (Single Source of Truth)
// ============================================================================

export const CONSULTANT_STAGES_CONFIG = [
  {
    stage: 1,
    name: 'Welcome & Practice Overview',
    description: 'Getting to know your consulting practice',
    objective: 'Understand the consultant\'s practice name, focus area, and overall positioning',
    keyQuestions: [
      'What is the name of your consulting practice?',
      'What is your main area of consulting focus?',
      'How long have you been in consulting?',
    ],
    dataToCollect: ['practice_name', 'focus_area', 'years_in_business', 'practice_overview'],
    dataTopics: [
      { label: 'Practice name', key: 'practice_name' },
      { label: 'Focus area', key: 'focus_area' },
      { label: 'Years in business', key: 'years_in_business' },
      { label: 'Practice overview', key: 'practice_overview' },
    ],
    progressThreshold: 0.7,
  },
  {
    stage: 2,
    name: 'Practice Size & Structure',
    description: 'Understanding your team and structure',
    objective: 'Understand team size, structure, and capacity',
    keyQuestions: [
      'How many people are in your practice? (solo, 2-10, 11-50, 51+)',
      'What is your team structure? (partners, associates, contractors)',
      'How many active clients do you typically manage at once?',
    ],
    dataToCollect: ['team_size', 'team_structure', 'active_clients_capacity', 'practice_model'],
    dataTopics: [
      { label: 'Team size', key: 'team_size' },
      { label: 'Team structure', key: 'team_structure' },
      { label: 'Client capacity', key: 'active_clients_capacity' },
      { label: 'Practice model', key: 'practice_model' },
    ],
    progressThreshold: 0.75,
  },
  {
    stage: 3,
    name: 'Industries & Services',
    description: 'Your specializations and offerings',
    objective: 'Identify industry focus and service offerings',
    keyQuestions: [
      'Which industries do you primarily serve?',
      'What are your main service offerings?',
      'Do you have any specialized methodologies or frameworks?',
      'What types of projects do you typically take on?',
    ],
    dataToCollect: ['target_industries', 'service_offerings', 'methodologies', 'project_types'],
    dataTopics: [
      { label: 'Target industries', key: 'target_industries' },
      { label: 'Service offerings', key: 'service_offerings' },
      { label: 'Methodologies', key: 'methodologies' },
      { label: 'Project types', key: 'project_types' },
    ],
    progressThreshold: 0.75,
  },
  {
    stage: 4,
    name: 'Current Tools & Workflow',
    description: 'Understanding your existing tech stack',
    objective: 'Document current tools and workflow processes',
    keyQuestions: [
      'What tools do you currently use for client management?',
      'How do you handle project tracking and deliverables?',
      'What is your typical client engagement workflow?',
    ],
    dataToCollect: ['current_tools', 'project_tracking', 'client_workflow', 'pain_with_tools'],
    dataTopics: [
      { label: 'Current tools', key: 'current_tools' },
      { label: 'Project tracking', key: 'project_tracking' },
      { label: 'Client workflow', key: 'client_workflow' },
      { label: 'Tool pain points', key: 'pain_with_tools' },
    ],
    progressThreshold: 0.7,
  },
  {
    stage: 5,
    name: 'Client Management',
    description: 'How you manage client relationships',
    objective: 'Understand client relationship management approach',
    keyQuestions: [
      'How do you currently onboard new clients?',
      'What information do you typically gather from clients at the start?',
      'How do you communicate project progress to clients?',
      'What does your client reporting look like?',
    ],
    dataToCollect: ['client_onboarding', 'intake_process', 'progress_communication', 'reporting_approach'],
    dataTopics: [
      { label: 'Client onboarding', key: 'client_onboarding' },
      { label: 'Intake process', key: 'intake_process' },
      { label: 'Progress communication', key: 'progress_communication' },
      { label: 'Reporting approach', key: 'reporting_approach' },
    ],
    progressThreshold: 0.75,
  },
  {
    stage: 6,
    name: 'Pain Points & Challenges',
    description: 'Identifying your biggest challenges',
    objective: 'Understand current challenges and frustrations',
    keyQuestions: [
      'What are the biggest challenges in running your practice?',
      'Where do you spend the most time on non-billable work?',
      'What would make the biggest difference in your day-to-day?',
    ],
    dataToCollect: ['biggest_challenges', 'time_sinks', 'desired_improvements', 'frustrations'],
    dataTopics: [
      { label: 'Biggest challenges', key: 'biggest_challenges' },
      { label: 'Time sinks', key: 'time_sinks' },
      { label: 'Desired improvements', key: 'desired_improvements' },
      { label: 'Frustrations', key: 'frustrations' },
    ],
    progressThreshold: 0.7,
  },
  {
    stage: 7,
    name: 'Goals & White-Label Setup',
    description: 'Setting up your workspace preferences',
    objective: 'Define goals and white-label/branding preferences',
    keyQuestions: [
      'What are your goals for using StartupAI with your clients?',
      'Are you interested in white-labeling reports for your clients?',
      'What branding elements would you want to customize?',
      'How would you like your clients to perceive the AI-generated analysis?',
    ],
    dataToCollect: ['goals', 'white_label_interest', 'branding_preferences', 'client_perception'],
    dataTopics: [
      { label: 'Goals', key: 'goals' },
      { label: 'White-label interest', key: 'white_label_interest' },
      { label: 'Branding preferences', key: 'branding_preferences' },
      { label: 'Client perception', key: 'client_perception' },
    ],
    progressThreshold: 0.8,
  },
] as const satisfies readonly ConsultantStageConfig[];

// ============================================================================
// Derived Constants
// ============================================================================

export const CONSULTANT_TOTAL_STAGES = CONSULTANT_STAGES_CONFIG.length;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get configuration for a specific consultant stage number
 * @param stageNumber - 1-indexed stage number (1-7)
 * @returns Stage configuration or undefined if not found
 */
export function getConsultantStageConfig(stageNumber: number): ConsultantStageConfig | undefined {
  return CONSULTANT_STAGES_CONFIG.find(s => s.stage === stageNumber);
}

/**
 * Get consultant stage configuration with fallback to first stage
 * @param stageNumber - 1-indexed stage number (1-7)
 * @returns Stage configuration (falls back to stage 1 if not found)
 */
export function getConsultantStageConfigSafe(stageNumber: number): ConsultantStageConfig {
  return getConsultantStageConfig(stageNumber) ?? CONSULTANT_STAGES_CONFIG[0];
}

/**
 * Generate system context string for Maya's AI prompt
 *
 * Similar to Alex's context generation but for consultant-specific stages.
 *
 * @param stageNumber - Current stage number
 * @param collectedData - Data collected so far
 * @returns Formatted context string for Maya's system prompt
 */
export function getConsultantStageSystemContext(
  stageNumber: number,
  collectedData: Record<string, unknown>
): string {
  const stage = getConsultantStageConfigSafe(stageNumber);

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
## Current Stage: ${stage.name} (Stage ${stageNumber}/${CONSULTANT_TOTAL_STAGES})

**Objective**: ${stage.objective}

**Key Questions to Ask** (in order of priority):
${questionsToAsk}

**Already Collected**:
${collectedEntries || '(none yet)'}

**Missing Data Points**: ${missingFields.join(', ') || 'None - all topics covered!'}

**INSTRUCTIONS**:
- Ask ONE question at a time from the "Key Questions to Ask" list above
- If consultant responds with "I don't know" or "not sure", acknowledge it and move to the next question
- Once all topics are covered, use the advanceStage tool to move to the next stage
- Keep responses professional and collaborative
`;
}

/**
 * Get consultant stage name by number
 * @param stageNumber - 1-indexed stage number (1-7)
 * @returns Stage name or fallback string
 */
export function getConsultantStageName(stageNumber: number): string {
  return getConsultantStageConfig(stageNumber)?.name ?? `Stage ${stageNumber}`;
}

/**
 * Get topics to collect for a specific consultant stage
 * @param stageNumber - 1-indexed stage number (1-7)
 * @returns Array of topic objects with label and key
 */
export function getConsultantStageTopics(stageNumber: number): readonly ConsultantStageDataTopic[] {
  return getConsultantStageConfig(stageNumber)?.dataTopics ?? [];
}
