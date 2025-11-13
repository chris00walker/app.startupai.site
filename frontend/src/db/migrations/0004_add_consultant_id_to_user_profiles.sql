-- Migration: Add consultant_id to user_profiles for consultant → client relationship
-- This enables clients to be actual users who can log in and see the same UI as founders
-- A client is essentially a founder who is working with a consultant

-- Add consultant_id column to user_profiles
ALTER TABLE "user_profiles"
ADD COLUMN "consultant_id" uuid;

-- Add foreign key constraint
ALTER TABLE "user_profiles"
ADD CONSTRAINT "user_profiles_consultant_id_fkey"
FOREIGN KEY ("consultant_id")
REFERENCES "public"."user_profiles"("id")
ON DELETE SET NULL
ON UPDATE NO ACTION;

-- Add index for performance (consultants will frequently query their clients)
CREATE INDEX IF NOT EXISTS "user_profiles_consultant_id_idx"
ON "user_profiles" ("consultant_id");

-- Add comment to explain the relationship
COMMENT ON COLUMN "user_profiles"."consultant_id" IS
'If set, this user is a client of the consultant with this ID. Clients are founders who work with a consultant and see the same UI as founders.';

-- NOTE: To migrate existing clients table data to user_profiles:
-- 1. Create Supabase auth accounts for each client (via API)
-- 2. Create corresponding user_profiles entries with consultant_id set
-- 3. This should be done through the application, not in SQL, to ensure proper auth.users creation
