import { and, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { trialUsageCounters } from '@/db/schema/usage-quota';

export async function findTrialUsageCounter(params: {
  userId: string;
  action: string;
  period: string;
  periodStart: Date;
}) {
  const { userId, action, period, periodStart } = params;

  const [record] = await db
    .select()
    .from(trialUsageCounters)
    .where(
      and(
        eq(trialUsageCounters.userId, userId),
        eq(trialUsageCounters.action, action),
        eq(trialUsageCounters.period, period),
        eq(trialUsageCounters.periodStart, periodStart)
      )
    )
    .limit(1);

  return record ?? null;
}

export async function upsertTrialUsageCounter(params: {
  userId: string;
  action: string;
  period: string;
  periodStart: Date;
  count: number;
  now: Date;
}) {
  const { userId, action, period, periodStart, count, now } = params;

  await db
    .insert(trialUsageCounters)
    .values({
      userId,
      action,
      period,
      periodStart,
      count,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        trialUsageCounters.userId,
        trialUsageCounters.action,
        trialUsageCounters.period,
        trialUsageCounters.periodStart,
      ],
      set: {
        count,
        updatedAt: now,
      },
    });
}
