-- Seed default feature flags
-- @story US-A06
--
-- This migration seeds the default feature flags for the system.
-- The feature_flags table was created via Drizzle db:push.

-- Insert default feature flags (skip if already exists)
INSERT INTO feature_flags (key, name, description, enabled_globally, percentage_rollout)
VALUES
  (
    'quick_start_v2',
    'Quick Start V2',
    'New streamlined quick start flow with improved UX',
    false,
    0
  ),
  (
    'phase_2_agents',
    'Phase 2 Validation Agents',
    'Enable Phase 2 desirability validation agents',
    true,
    100
  ),
  (
    'ad_platform_integration',
    'Ad Platform Integration',
    'Enable live ad platform connections for validation campaigns',
    false,
    0
  ),
  (
    'consultant_trial',
    'Consultant Trial Mode',
    'Enable consultant trial experience for advisor personas',
    true,
    100
  ),
  (
    'impersonation_mode',
    'Admin Impersonation',
    'Allow admins to view the app as a specific user (read-only)',
    true,
    100
  )
ON CONFLICT (key) DO NOTHING;
