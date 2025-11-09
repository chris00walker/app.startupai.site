-- ============================================================================
-- CONSULTANT PROFILES TABLE
-- ============================================================================
-- This migration creates the consultant_profiles table for storing
-- consultant-specific onboarding data and workspace configuration.
--
-- Related to Phase 3: Consultant Features
-- ============================================================================

-- Create consultant_profiles table
CREATE TABLE IF NOT EXISTS consultant_profiles (
  -- Primary Key (references user_profiles)
  id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Company Information
  company_name TEXT,
  practice_size TEXT CHECK (practice_size IN ('solo', '2-10', '11-50', '51+')),
  current_clients INTEGER DEFAULT 0,

  -- Practice Details (stored as arrays)
  industries TEXT[] DEFAULT '{}',
  services TEXT[] DEFAULT '{}',
  tools_used TEXT[] DEFAULT '{}',

  -- Onboarding Data
  pain_points TEXT,

  -- White-label Configuration
  white_label_enabled BOOLEAN DEFAULT false,
  white_label_config JSONB DEFAULT '{}',

  -- Onboarding Status
  onboarding_completed BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on onboarding_completed for efficient filtering
CREATE INDEX IF NOT EXISTS idx_consultant_profiles_onboarding_completed
  ON consultant_profiles(onboarding_completed);

-- Create index on company_name for search
CREATE INDEX IF NOT EXISTS idx_consultant_profiles_company_name
  ON consultant_profiles(company_name);

-- ============================================================================
-- TRIGGER: Auto-update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION set_consultant_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_consultant_profiles_updated_at ON consultant_profiles;
CREATE TRIGGER set_consultant_profiles_updated_at
  BEFORE UPDATE ON consultant_profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_consultant_profiles_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE consultant_profiles ENABLE ROW LEVEL SECURITY;

-- Consultants can view their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'consultant_profiles'
      AND policyname = 'Consultants can view own profile'
  ) THEN
    CREATE POLICY "Consultants can view own profile"
      ON consultant_profiles
      FOR SELECT
      USING (auth.uid() = id);
  END IF;
END$$;

-- Consultants can insert their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'consultant_profiles'
      AND policyname = 'Consultants can insert own profile'
  ) THEN
    CREATE POLICY "Consultants can insert own profile"
      ON consultant_profiles
      FOR INSERT
      WITH CHECK (auth.uid() = id);
  END IF;
END$$;

-- Consultants can update their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'consultant_profiles'
      AND policyname = 'Consultants can update own profile'
  ) THEN
    CREATE POLICY "Consultants can update own profile"
      ON consultant_profiles
      FOR UPDATE
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END$$;

-- Admins can view all consultant profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'consultant_profiles'
      AND policyname = 'Admins can view all consultant profiles'
  ) THEN
    CREATE POLICY "Admins can view all consultant profiles"
      ON consultant_profiles
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'admin'
        )
      );
  END IF;
END$$;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE consultant_profiles IS 'Stores consultant-specific profile data including company information, practice details, and white-label configuration';
COMMENT ON COLUMN consultant_profiles.practice_size IS 'Size of consulting practice: solo, 2-10, 11-50, or 51+';
COMMENT ON COLUMN consultant_profiles.industries IS 'Array of industries the consultant serves (e.g., ["SaaS", "E-commerce"])';
COMMENT ON COLUMN consultant_profiles.services IS 'Array of services offered (e.g., ["Strategy", "Product", "Marketing"])';
COMMENT ON COLUMN consultant_profiles.tools_used IS 'Array of tools currently used (e.g., ["Notion", "Figma"])';
COMMENT ON COLUMN consultant_profiles.white_label_config IS 'JSON configuration for white-label settings (logo, colors, domain, etc.)';
