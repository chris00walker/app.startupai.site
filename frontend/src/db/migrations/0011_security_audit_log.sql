-- Security Audit Log table for compliance and security monitoring
-- @story US-AS02, US-AS03, US-AS04, US-AS05
CREATE TABLE "security_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"event_description" text,
	"severity" text DEFAULT 'info' NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"resource_type" text,
	"resource_id" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Add foreign key constraint
ALTER TABLE "security_audit_log"
  ADD CONSTRAINT "fk_security_audit_log_user"
  FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE;

-- Add CHECK constraint for severity
ALTER TABLE "security_audit_log"
  ADD CONSTRAINT "chk_security_audit_log_severity"
  CHECK (severity IN ('info', 'warning', 'critical'));

-- Enable Row Level Security
ALTER TABLE "security_audit_log" ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own audit logs
CREATE POLICY "Users can view own audit logs"
  ON "security_audit_log"
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Service role can insert/manage audit logs
CREATE POLICY "Service role can manage audit logs"
  ON "security_audit_log"
  FOR ALL
  TO service_role
  WITH CHECK (true);

-- Indexes for efficient queries
CREATE INDEX "idx_security_audit_log_user_id"
  ON "security_audit_log" ("user_id");

CREATE INDEX "idx_security_audit_log_event_type"
  ON "security_audit_log" ("event_type");

CREATE INDEX "idx_security_audit_log_user_created"
  ON "security_audit_log" ("user_id", "created_at" DESC);

CREATE INDEX "idx_security_audit_log_severity"
  ON "security_audit_log" ("severity") WHERE severity IN ('warning', 'critical');
