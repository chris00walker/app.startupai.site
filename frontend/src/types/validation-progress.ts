/**
 * Validation Progress Types
 *
 * These types mirror the Supabase tables from the startupai-crew backend:
 * - validation_runs - Master run state
 * - validation_progress - Append-only progress events
 *
 * Reference: startupai-crew/docs/features/state-persistence.md
 */

// =======================================================================================
// VALIDATION RUN STATE
// =======================================================================================

export type ValidationRunStatus =
  | 'pending'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed';

export interface ValidationRun {
  id: string;
  run_id: string;
  project_id: string;
  user_id: string;
  status: ValidationRunStatus;
  current_phase: number;             // 0-4
  phase_state?: Record<string, unknown>;  // Full ValidationRunState serialized
  hitl_state?: string;               // Current HITL checkpoint name
  hitl_checkpoint_at?: string;       // When HITL checkpoint created
  started_at?: string;
  updated_at?: string;
  completed_at?: string;
  error_message?: string;
}

// =======================================================================================
// PROGRESS EVENT
// =======================================================================================

export type ProgressStatus =
  | 'started'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'skipped';

export interface ValidationProgressEvent {
  id: string;
  run_id: string;
  phase: number;                     // 0-4
  crew: string;
  task?: string;
  agent?: string;
  status: ProgressStatus;
  progress_pct?: number;             // 0-100
  output?: Record<string, unknown>;
  error_message?: string;
  duration_ms?: number;
  created_at: string;
}

// =======================================================================================
// PHASE METADATA
// =======================================================================================

export interface PhaseInfo {
  name: string;
  icon: string;
  description: string;
}

export const PHASE_INFO: Record<number, PhaseInfo> = {
  0: {
    name: 'Onboarding',
    icon: 'MessageSquare',
    description: "Capturing your Founder's Brief",
  },
  1: {
    name: 'VPC Discovery',
    icon: 'Search',
    description: 'Discovering Customer Profile & Value Map',
  },
  2: {
    name: 'Desirability',
    icon: 'Target',
    description: 'Testing market demand with experiments',
  },
  3: {
    name: 'Feasibility',
    icon: 'Wrench',
    description: 'Assessing technical feasibility',
  },
  4: {
    name: 'Viability',
    icon: 'DollarSign',
    description: 'Evaluating unit economics & final decision',
  },
};

// =======================================================================================
// HELPER FUNCTIONS
// =======================================================================================

/**
 * Get human-readable status label
 */
export function getStatusLabel(status: ValidationRunStatus): string {
  const labels: Record<ValidationRunStatus, string> = {
    pending: 'Starting...',
    running: 'In Progress',
    paused: 'Awaiting Approval',
    completed: 'Completed',
    failed: 'Failed',
  };
  return labels[status];
}

/**
 * Get status color for UI display
 */
export function getStatusColor(status: ValidationRunStatus): string {
  const colors: Record<ValidationRunStatus, string> = {
    pending: 'gray',
    running: 'blue',
    paused: 'yellow',
    completed: 'green',
    failed: 'red',
  };
  return colors[status];
}

/**
 * Calculate overall progress from phase
 */
export function calculateOverallProgress(
  currentPhase: number,
  phaseProgress: number = 0
): number {
  // Each phase is 20% of total (5 phases)
  const phaseWeight = 20;
  const baseProgress = currentPhase * phaseWeight;
  const withinPhase = (phaseProgress / 100) * phaseWeight;
  return Math.min(100, Math.round(baseProgress + withinPhase));
}

/**
 * Group progress events by phase and crew
 */
export function groupProgressByPhase(
  events: ValidationProgressEvent[]
): Record<number, ValidationProgressEvent[]> {
  return events.reduce(
    (acc, event) => {
      if (!acc[event.phase]) {
        acc[event.phase] = [];
      }
      acc[event.phase].push(event);
      return acc;
    },
    {} as Record<number, ValidationProgressEvent[]>
  );
}

/**
 * Get the latest event for each crew in a phase
 */
export function getLatestCrewEvents(
  events: ValidationProgressEvent[]
): Record<string, ValidationProgressEvent> {
  return events.reduce(
    (acc, event) => {
      const key = `${event.phase}-${event.crew}`;
      const existing = acc[key];
      if (!existing || new Date(event.created_at) > new Date(existing.created_at)) {
        acc[key] = event;
      }
      return acc;
    },
    {} as Record<string, ValidationProgressEvent>
  );
}
