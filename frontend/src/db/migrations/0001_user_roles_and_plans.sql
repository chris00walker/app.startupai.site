-- Adds user_role enum, role/plan_status columns, and triggers for updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'founder', 'consultant', 'trial');
  END IF;
END$$;

ALTER TABLE "user_profiles"
  ADD COLUMN IF NOT EXISTS "plan_status" text DEFAULT 'active' NOT NULL,
  ADD COLUMN IF NOT EXISTS "role" user_role DEFAULT 'trial' NOT NULL;

UPDATE "user_profiles"
SET "role" = CASE
  WHEN "role" IS NOT NULL THEN "role"
  WHEN subscription_tier IN ('enterprise', 'pro') THEN 'consultant'::user_role
  ELSE 'trial'::user_role
END
WHERE "role" IS NULL;

CREATE OR REPLACE FUNCTION set_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_user_profiles_updated_at ON "user_profiles";
CREATE TRIGGER set_user_profiles_updated_at
BEFORE UPDATE ON "user_profiles"
FOR EACH ROW EXECUTE FUNCTION set_user_profiles_updated_at();
