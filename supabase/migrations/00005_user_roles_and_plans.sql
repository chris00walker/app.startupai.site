-- User roles and subscription plans migration
-- Adds role enum, plan status, and seed data support for multi-tenant experience.

-- Create role enum type if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'founder', 'consultant', 'trial');
  END IF;
END$$;

-- Add role column to user_profiles if missing
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'trial'::user_role;

-- Add plan_status column for lifecycle management
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS plan_status TEXT DEFAULT 'active';

-- Ensure subscription_tier has a default value
ALTER TABLE user_profiles
  ALTER COLUMN subscription_tier SET DEFAULT 'free';

-- Backfill role for existing records based on subscription tier if missing
UPDATE user_profiles
SET role = CASE
  WHEN role IS NOT NULL THEN role
  WHEN subscription_tier IN ('enterprise', 'pro') THEN 'consultant'::user_role
  ELSE 'trial'::user_role
END
WHERE role IS NULL;

-- Maintain updated_at timestamp when profile changes
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER set_user_profiles_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
