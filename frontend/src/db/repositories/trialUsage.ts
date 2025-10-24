/**
 * Trial Usage Repository
 * 
 * Database operations for trial_usage_counters table.
 * Tracks usage limits for trial users.
 * 
 * Phase 0 implementation using direct Supabase client.
 */

import { createClient as createAdminClient } from '@/lib/supabase/admin';

export async function findTrialUsageCounter(params: {
  userId: string;
  action: string;
  period: string;
  periodStart: Date;
}) {
  const supabase = createAdminClient();
  
  const { data, error } = await supabase
    .from('trial_usage_counters')
    .select('*')
    .eq('user_id', params.userId)
    .eq('action', params.action)
    .eq('period', params.period)
    .eq('period_start', params.periodStart.toISOString())
    .single();
  
  if (error) {
    // Not found is expected, return null
    return null;
  }
  
  return data;
}

export async function upsertTrialUsageCounter(params: {
  userId: string;
  action: string;
  period: string;
  periodStart: Date;
  count: number;
  now: Date;
}) {
  const supabase = createAdminClient();
  
  const { error } = await supabase
    .from('trial_usage_counters')
    .upsert({
      user_id: params.userId,
      action: params.action,
      period: params.period,
      period_start: params.periodStart.toISOString(),
      count: params.count,
      updated_at: params.now.toISOString()
    });
  
  if (error) {
    console.error('Failed to upsert trial usage:', error);
  }
}
