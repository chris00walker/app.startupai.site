-- ============================================================================
-- Migration 00013: Dashboard AI Assistant Conversations Table
-- ============================================================================
-- Purpose: Store conversation history for the Dashboard AI Assistant
-- This enables persistent conversations across sessions for both founders and consultants
--
-- Date: November 11, 2025
-- Author: Claude Code
-- Related Feature: Phase 3B.1 - Dashboard AI Assistant Component
-- ============================================================================

-- Create assistant_conversations table
CREATE TABLE IF NOT EXISTS assistant_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  client_id UUID, -- For consultants managing specific clients (references consultant_clients when that table is created)
  user_role VARCHAR(20) NOT NULL CHECK (user_role IN ('founder', 'consultant')),
  user_message TEXT NOT NULL,
  assistant_message TEXT NOT NULL,
  tool_calls JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_assistant_conversations_user_id ON assistant_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_assistant_conversations_project_id ON assistant_conversations(project_id);
CREATE INDEX IF NOT EXISTS idx_assistant_conversations_client_id ON assistant_conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_assistant_conversations_created_at ON assistant_conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assistant_conversations_user_project ON assistant_conversations(user_id, project_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_assistant_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assistant_conversations_updated_at
  BEFORE UPDATE ON assistant_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_assistant_conversations_updated_at();

-- Row Level Security (RLS)
ALTER TABLE assistant_conversations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own conversations
CREATE POLICY "Users can read own conversations"
  ON assistant_conversations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own conversations
CREATE POLICY "Users can insert own conversations"
  ON assistant_conversations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own conversations
CREATE POLICY "Users can update own conversations"
  ON assistant_conversations
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own conversations
CREATE POLICY "Users can delete own conversations"
  ON assistant_conversations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE assistant_conversations IS 'Stores conversation history for Dashboard AI Assistant';
COMMENT ON COLUMN assistant_conversations.user_id IS 'User who owns this conversation';
COMMENT ON COLUMN assistant_conversations.project_id IS 'Project context (for founders)';
COMMENT ON COLUMN assistant_conversations.client_id IS 'Client context (for consultants)';
COMMENT ON COLUMN assistant_conversations.user_role IS 'User role: founder or consultant';
COMMENT ON COLUMN assistant_conversations.user_message IS 'Message from the user';
COMMENT ON COLUMN assistant_conversations.assistant_message IS 'Response from the AI assistant';
COMMENT ON COLUMN assistant_conversations.tool_calls IS 'JSON array of tool calls made during this exchange';
COMMENT ON COLUMN assistant_conversations.metadata IS 'Additional metadata (analysis IDs, report IDs, etc.)';
