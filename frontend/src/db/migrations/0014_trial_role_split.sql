-- Migration: Split 'trial' role into 'founder_trial' and 'consultant_trial'
-- This enables proper role-based access control for trial users
-- @story US-FT03, US-FT04

-- Step 1: Add new enum values to user_role
-- PostgreSQL requires adding enum values in a transaction-safe way
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'founder_trial';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'consultant_trial';

-- Step 2: Migrate existing 'trial' users based on their trial_intent
-- Users with trial_intent='consultant_trial' become 'consultant_trial' role
-- All other trial users become 'founder_trial' role (default path)
UPDATE user_profiles
SET role = 'consultant_trial'
WHERE role = 'trial' AND trial_intent = 'consultant_trial';

UPDATE user_profiles
SET role = 'founder_trial'
WHERE role = 'trial' AND (trial_intent = 'founder_trial' OR trial_intent IS NULL);

-- Step 3: Update default for new users
ALTER TABLE user_profiles
ALTER COLUMN role SET DEFAULT 'founder_trial';

-- Step 4: Add comments for documentation
COMMENT ON COLUMN user_profiles.role IS
'User role: admin, founder, consultant, founder_trial, consultant_trial. Trial roles have limited access.';

COMMENT ON COLUMN user_profiles.trial_intent IS
'DEPRECATED: Trial intent is now captured directly in the role field (founder_trial/consultant_trial).';
