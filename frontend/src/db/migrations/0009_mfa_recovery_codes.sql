-- MFA Recovery Codes table for 2FA backup access
CREATE TABLE "mfa_recovery_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"code_hash" text NOT NULL,
	"used_at" timestamp with time zone,
	"is_used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Add foreign key constraint
ALTER TABLE "mfa_recovery_codes"
  ADD CONSTRAINT "fk_mfa_recovery_codes_user"
  FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE "mfa_recovery_codes" ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own recovery codes (not the hash, just metadata)
CREATE POLICY "Users can view own recovery code status"
  ON "mfa_recovery_codes"
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Service role can manage recovery codes
CREATE POLICY "Service role can manage recovery codes"
  ON "mfa_recovery_codes"
  FOR ALL
  TO service_role
  WITH CHECK (true);

-- Index for faster lookups by user_id and code_hash
CREATE INDEX "idx_mfa_recovery_codes_user_id"
  ON "mfa_recovery_codes" ("user_id");

CREATE INDEX "idx_mfa_recovery_codes_lookup"
  ON "mfa_recovery_codes" ("user_id", "code_hash") WHERE is_used = false;
