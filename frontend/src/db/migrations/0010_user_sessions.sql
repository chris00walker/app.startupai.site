-- User Sessions table for device management (US-AS05)
CREATE TABLE "user_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"device_type" text,
	"browser" text,
	"operating_system" text,
	"location" text,
	"device_name" text,
	"is_current" boolean DEFAULT false NOT NULL,
	"last_active_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	CONSTRAINT "user_sessions_session_token_unique" UNIQUE("session_token")
);

-- Add foreign key constraint
ALTER TABLE "user_sessions"
  ADD CONSTRAINT "fk_user_sessions_user"
  FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE "user_sessions" ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view and manage their own sessions
CREATE POLICY "Users can view own sessions"
  ON "user_sessions"
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own sessions"
  ON "user_sessions"
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Service role can manage all sessions
CREATE POLICY "Service role can manage sessions"
  ON "user_sessions"
  FOR ALL
  TO service_role
  WITH CHECK (true);

-- Indexes for efficient queries
CREATE INDEX "idx_user_sessions_user_id"
  ON "user_sessions" ("user_id");

CREATE INDEX "idx_user_sessions_last_active"
  ON "user_sessions" ("user_id", "last_active_at" DESC);

CREATE INDEX "idx_user_sessions_token"
  ON "user_sessions" ("session_token");
