/**
 * Trial Status API
 *
 * Returns comprehensive trial status for the current user including:
 * - Days remaining in trial
 * - Usage limits and current usage
 * - Locked features
 *
 * @story US-CT04, US-FT02
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveTrialRole, TRIAL_LIMITS } from '@/lib/auth/trial-limits';
import { findTrialUsageCounter } from '@/db/repositories/trialUsage';

// Features locked for trial users
const CONSULTANT_TRIAL_LOCKED_FEATURES = [
  'real_invites',
  'white_label',
  'priority_processing',
  'unlimited_clients',
];

const FOUNDER_TRIAL_LOCKED_FEATURES = [
  'unlimited_projects',
  'priority_processing',
  'export_reports',
  'team_members',
];

interface TrialStatusResponse {
  is_trial: boolean;
  role: string;
  days_remaining: number | null;
  expires_at: string | null;
  limits: {
    mock_clients?: { used: number; max: number };
    projects?: { used: number; max: number };
    reports_daily?: { used: number; max: number };
    workflows_monthly?: { used: number; max: number };
  };
  locked_features: string[];
  upgrade_url: string;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Resolve trial status
    const { role, isTrial } = resolveTrialRole({
      profileRole: profile.role,
      appRole: profile.role,
      planStatus: profile.plan_status,
    });

    // If not a trial user, return minimal response
    if (!isTrial) {
      const response: TrialStatusResponse = {
        is_trial: false,
        role,
        days_remaining: null,
        expires_at: null,
        limits: {},
        locked_features: [],
        upgrade_url: '/pricing',
      };
      return NextResponse.json(response);
    }

    // Calculate days remaining
    let daysRemaining: number | null = null;
    if (profile.trial_expires_at) {
      const expiresAt = new Date(profile.trial_expires_at);
      const now = new Date();
      const diffMs = expiresAt.getTime() - now.getTime();
      daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    // Get usage data for trial limits
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const monthStart = new Date(now);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const lifetimeStart = new Date(1970, 0, 1);

    // Fetch usage counters in parallel
    const [projectsUsage, reportsUsage, workflowsUsage] = await Promise.all([
      findTrialUsageCounter({
        userId: user.id,
        trackedAction: 'projects.create',
        period: 'lifetime',
        periodStart: lifetimeStart,
      }),
      findTrialUsageCounter({
        userId: user.id,
        trackedAction: 'reports.generate',
        period: 'daily',
        periodStart: today,
      }),
      findTrialUsageCounter({
        userId: user.id,
        trackedAction: 'workflows.run',
        period: 'monthly',
        periodStart: monthStart,
      }),
    ]);

    // Build limits object based on role
    const limits: TrialStatusResponse['limits'] = {};

    if (role === 'consultant_trial') {
      // For consultant trial, show mock clients limit (via SECURITY DEFINER function)
      const { data: mockClientCount } = await supabase.rpc('count_consultant_mock_clients');

      limits.mock_clients = {
        used: mockClientCount || 0,
        max: 2,
      };
    }

    if (role === 'founder_trial') {
      limits.projects = {
        used: projectsUsage?.usage_count || 0,
        max: TRIAL_LIMITS['projects.create'].limit,
      };
    }

    // These limits apply to both trial types
    limits.reports_daily = {
      used: reportsUsage?.usage_count || 0,
      max: TRIAL_LIMITS['reports.generate'].limit,
    };

    limits.workflows_monthly = {
      used: workflowsUsage?.usage_count || 0,
      max: TRIAL_LIMITS['workflows.run'].limit,
    };

    // Determine locked features based on role
    const lockedFeatures = role === 'consultant_trial'
      ? CONSULTANT_TRIAL_LOCKED_FEATURES
      : FOUNDER_TRIAL_LOCKED_FEATURES;

    // Determine upgrade URL
    const upgradeUrl = role === 'consultant_trial'
      ? '/pricing?plan=consultant'
      : '/pricing?plan=founder';

    const response: TrialStatusResponse = {
      is_trial: true,
      role,
      days_remaining: daysRemaining,
      expires_at: profile.trial_expires_at,
      limits,
      locked_features: lockedFeatures,
      upgrade_url: upgradeUrl,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[TrialStatus] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get trial status' },
      { status: 500 }
    );
  }
}
