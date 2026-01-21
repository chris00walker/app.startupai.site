-- Quick Start Fields Migration (ADR-006)
-- Adds raw_idea, hints, and additional_context columns to projects table
-- for the Quick Start form that replaces the 7-stage AI conversation

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS raw_idea text,
ADD COLUMN IF NOT EXISTS hints jsonb,
ADD COLUMN IF NOT EXISTS additional_context text;

-- Add comment for documentation
COMMENT ON COLUMN projects.raw_idea IS 'Business idea from Quick Start form (min 10 chars)';
COMMENT ON COLUMN projects.hints IS 'Optional Quick Start hints: {industry?, target_user?, geography?}';
COMMENT ON COLUMN projects.additional_context IS 'Optional additional context (max 10k chars)';
