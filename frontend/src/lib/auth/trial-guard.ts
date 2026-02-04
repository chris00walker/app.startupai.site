/**
 * @story US-FT02, US-CT04
 */
import { getUserProfile } from '@/db/queries/users';
import { findTrialUsageCounter, upsertTrialUsageCounter } from '@/db/repositories/trialUsage';
import { evaluateTrialAllowance, getPeriodStart, getTrialActionConfig, resolveTrialRole } from './trial-limits';

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
    planStatus: profile.plan_status ?? profile.subscription_status ?? undefined,
  });

  if (!isTrial || readonlyMode) {
    return { allowed: true, remaining: Number.POSITIVE_INFINITY };
  }

  const periodStartDate = getPeriodStart(now, config.period);

  const record = await findTrialUsageCounter({
    userId,
    trackedAction: action,
    period: config.period,
    periodStart: periodStartDate,
  });

  const currentCount = record?.usage_count ?? 0;
  const { allowed, remaining } = evaluateTrialAllowance({
    currentCount,
    config,
  });

  if (!allowed) {
    return { allowed, remaining: 0 };
  }

  await upsertTrialUsageCounter({
    userId,
    trackedAction: action,
    period: config.period,
    periodStart: periodStartDate,
    usageCount: currentCount + 1,
    now,
  });

  return {
    allowed: true,
    remaining: Math.max(remaining - 1, 0),
  };
}
