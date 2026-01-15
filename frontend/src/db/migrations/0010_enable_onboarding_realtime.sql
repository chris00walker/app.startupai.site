-- Migration: Enable Supabase Realtime for onboarding_sessions
-- Applied: 2026-01-15 via Supabase MCP
-- Purpose: Allow instant progress updates during onboarding chat
--
-- This migration adds onboarding_sessions to the Realtime publication
-- with filtered columns (only scalar fields, excludes large JSONB).
-- This enables WebSocket-based instant updates instead of polling.

-- Enable Realtime for onboarding_sessions (scalar columns only)
-- Excludes: conversation_history, stage_data, ai_context, user_context (large JSONB)
ALTER PUBLICATION supabase_realtime ADD TABLE onboarding_sessions (
  id,
  session_id,
  user_id,
  status,
  current_stage,
  stage_progress,
  overall_progress,
  last_activity,
  completed_at
);
