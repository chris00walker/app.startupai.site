// TODO: Implement proper database queries
// import { getUserProfile } from '@/db/queries/users';
// import { findTrialUsageCounter, upsertTrialUsageCounter } from '@/db/repositories/trialUsage';
import { evaluateTrialAllowance, getPeriodStart, getTrialActionConfig, resolveTrialRole } from './trial-limits';

// Temporary stub functions until database layer is implemented
async function getUserProfile(userId: string) {
  // TODO: Implement actual database query
  return {
    role: 'trial' as const,
    planStatus: 'trial' as const,
    subscriptionStatus: 'trial' as const
  };
}

async function findTrialUsageCounter(params: any) {
  // TODO: Implement actual database query
  return {
    count: 0
  };
}

async function upsertTrialUsageCounter(params: any) {
  // TODO: Implement actual database operation
  return;
}

export async function assertTrialAllowance(params: {
  userId: string;
  action: string;
  now?: Date;
}): Promise<{ allowed: boolean; remaining: number }> {
  const { userId, action, now = new Date() } = params;

  const profile = await getUserProfile(userId);
  const config = getTrialActionConfig(action);

  if (!profile || !config) {
    return { allowed: true, remaining: Number.POSITIVE_INFINITY };
  }

  const { role, isTrial, readonlyMode } = resolveTrialRole({
    profileRole: profile.role,
    appRole: profile.role,
    planStatus: profile.planStatus ?? profile.subscriptionStatus ?? undefined,
  });

  if (!isTrial || readonlyMode) {
    return { allowed: true, remaining: Number.POSITIVE_INFINITY };
  }

  const periodStartDate = getPeriodStart(now, config.period);

  const record = await findTrialUsageCounter({
    userId,
    action,
    period: config.period,
    periodStart: periodStartDate,
  });

  const currentCount = record?.count ?? 0;
  const { allowed, remaining } = evaluateTrialAllowance({
    currentCount,
    config,
  });

  if (!allowed) {
    return { allowed, remaining: 0 };
  }

  await upsertTrialUsageCounter({
    userId,
    action,
    period: config.period,
    periodStart: periodStartDate,
    count: currentCount + 1,
    now,
  });

  return {
    allowed: true,
    remaining: Math.max(remaining - 1, 0),
  };
}
