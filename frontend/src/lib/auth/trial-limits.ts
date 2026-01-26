import { BYPASS_LIMITS } from '@/lib/env';
import type { UserRole } from '@/db/schema';
import { deriveRole, isTrialReadonly } from './roles';

type TrialPeriod = 'daily' | 'monthly' | 'lifetime';

type TrialActionConfig = {
  limit: number;
  period: TrialPeriod;
  description: string;
};

export type TrialAction = keyof typeof TRIAL_LIMITS;

/**
 * ⚠️ TEMPORARY TESTING OVERRIDE
 * The onboarding usage guard is globally disabled while NEXT_PUBLIC_ONBOARDING_BYPASS=true.
 * TODO(RELEASE): Set NEXT_PUBLIC_ONBOARDING_BYPASS=false and verify plan-based limits before enabling purchases.
 */
export const TRIAL_LIMITS = {
  'reports.generate': {
    limit: 3,
    period: 'daily',
    description: 'AI-generated reports per day',
  },
  'projects.create': {
    limit: 3,
    period: 'lifetime',
    description: 'Projects created during trial',
  },
  'workflows.run': {
    limit: 5,
    period: 'monthly',
    description: 'AI workflow runs per calendar month',
  },
} satisfies Record<string, TrialActionConfig> as Record<string, TrialActionConfig>;

export function resolveTrialRole({
  profileRole,
  appRole,
  planStatus,
}: {
  profileRole?: string | null;
  appRole?: string | null;
  planStatus?: string | null;
}): {
  role: UserRole;
  isTrial: boolean;
  readonlyMode: boolean;
} {
  const role = deriveRole({ profileRole, appRole });
  const readonlyMode = isTrialReadonly(planStatus);
  return {
    role,
    isTrial: role === 'founder_trial' || role === 'consultant_trial',
    readonlyMode,
  };
}

export function getTrialActionConfig(action: string): TrialActionConfig | null {
  return (TRIAL_LIMITS as Record<string, TrialActionConfig>)[action] ?? null;
}

export function getPeriodStart(date: Date, period: TrialPeriod): Date {
  const periodStart = new Date(date);

  switch (period) {
    case 'daily':
      periodStart.setHours(0, 0, 0, 0);
      break;
    case 'monthly':
      periodStart.setDate(1);
      periodStart.setHours(0, 0, 0, 0);
      break;
    case 'lifetime':
      periodStart.setFullYear(1970, 0, 1);
      periodStart.setHours(0, 0, 0, 0);
      break;
    default:
      periodStart.setHours(0, 0, 0, 0);
  }

  return periodStart;
}

export function evaluateTrialAllowance({
  currentCount,
  config,
}: {
  currentCount: number;
  config: TrialActionConfig;
}): {
  allowed: boolean;
  remaining: number;
} {
  if (BYPASS_LIMITS) {
    return { allowed: true, remaining: Number.POSITIVE_INFINITY };
  }

  const remaining = Math.max(config.limit - currentCount, 0);
  return {
    allowed: remaining > 0,
    remaining,
  };
}
