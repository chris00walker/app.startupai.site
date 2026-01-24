-- Migration: Add trial_intent column to user_profiles
-- Purpose: Track founder vs consultant trial intent for routing

-- Add column with default for new users
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS trial_intent TEXT DEFAULT 'founder_trial';

-- Backfill existing trial users (infer from role)
-- Trial users without explicit trial_intent get founder_trial as default
UPDATE user_profiles
SET trial_intent = 'founder_trial'
WHERE role = 'trial' AND trial_intent IS NULL;

-- Non-trial users keep NULL trial_intent (not applicable)
-- No action needed - they won't use trial routing

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.trial_intent IS
  'Trial user intent: founder_trial (validating own idea) or consultant_trial (exploring for clients)';
