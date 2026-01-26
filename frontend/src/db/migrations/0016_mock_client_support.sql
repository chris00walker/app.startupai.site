-- Migration: Add mock client support for consultant trials
-- @story US-CT01, US-CT02

-- Add is_mock flag to consultant_clients to identify mock/sample clients
ALTER TABLE consultant_clients ADD COLUMN IF NOT EXISTS is_mock BOOLEAN DEFAULT FALSE;

-- Add is_mock flag to user_profiles for mock client users
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_mock BOOLEAN DEFAULT FALSE;

-- Add is_mock flag to projects for mock project data
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_mock BOOLEAN DEFAULT FALSE;

-- Create indexes for mock client queries
CREATE INDEX IF NOT EXISTS idx_consultant_clients_is_mock ON consultant_clients(is_mock) WHERE is_mock = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_mock ON user_profiles(is_mock) WHERE is_mock = TRUE;
CREATE INDEX IF NOT EXISTS idx_projects_is_mock ON projects(is_mock) WHERE is_mock = TRUE;

-- Comment on columns
COMMENT ON COLUMN consultant_clients.is_mock IS 'True for mock clients created during trial onboarding';
COMMENT ON COLUMN user_profiles.is_mock IS 'True for mock user profiles (not real users)';
COMMENT ON COLUMN projects.is_mock IS 'True for mock projects with sample data';
