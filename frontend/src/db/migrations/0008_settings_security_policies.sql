-- Migration: Add RLS policies, foreign keys, and CHECK constraints to Settings tables
-- Created: 2026-01-24
-- Purpose: Security hardening for notification_preferences, user_preferences, login_history

-- ============================================
-- NOTIFICATION PREFERENCES
-- ============================================

-- Add foreign key constraint
ALTER TABLE "notification_preferences"
  ADD CONSTRAINT "fk_notification_preferences_user"
  FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE "notification_preferences" ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only manage their own notification preferences
CREATE POLICY "Users can manage own notification preferences"
  ON "notification_preferences"
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- USER PREFERENCES
-- ============================================

-- Add foreign key constraint
ALTER TABLE "user_preferences"
  ADD CONSTRAINT "fk_user_preferences_user"
  FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE "user_preferences" ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only manage their own preferences
CREATE POLICY "Users can manage own preferences"
  ON "user_preferences"
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Add CHECK constraints for enum validation
ALTER TABLE "user_preferences"
  ADD CONSTRAINT "check_theme"
  CHECK (theme IN ('light', 'dark', 'system'));

ALTER TABLE "user_preferences"
  ADD CONSTRAINT "check_canvas_type"
  CHECK (default_canvas_type IN ('vpc', 'bmc', 'tbi'));

ALTER TABLE "user_preferences"
  ADD CONSTRAINT "check_autosave_interval"
  CHECK (auto_save_interval IN ('1min', '5min', '10min', 'disabled'));

ALTER TABLE "user_preferences"
  ADD CONSTRAINT "check_ai_assistance_level"
  CHECK (ai_assistance_level IN ('minimal', 'balanced', 'aggressive'));

-- ============================================
-- LOGIN HISTORY
-- ============================================

-- Add foreign key constraint
ALTER TABLE "login_history"
  ADD CONSTRAINT "fk_login_history_user"
  FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE "login_history" ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own login history (SELECT only, no INSERT/UPDATE/DELETE from client)
CREATE POLICY "Users can view own login history"
  ON "login_history"
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Service role policy for inserting login history (via webhook/server)
CREATE POLICY "Service role can insert login history"
  ON "login_history"
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Index for faster user_id lookups on login_history (frequent queries)
CREATE INDEX IF NOT EXISTS "idx_login_history_user_id"
  ON "login_history" ("user_id");

-- Index for date-range queries on login_history
CREATE INDEX IF NOT EXISTS "idx_login_history_created_at"
  ON "login_history" ("created_at" DESC);
