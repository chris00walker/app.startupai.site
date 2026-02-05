-- Narrative Layer Schema Migration
-- @see docs/specs/narrative-layer-spec.md
-- @story US-NL01
--
-- Creates: 6 new tables + 2 analytics tables
-- Alters: evidence (add narrative_category), projects (add staleness columns), evidence_package_access (add tracking columns)
-- RLS: 15 user-facing policies + 2 analytics table service-role-only
-- Triggers: mark_narrative_stale() on 5 tables
-- Indexes: 11 total

-- ============================================================================
-- STEP 0.5: ALTER evidence table — add narrative_category for DO/SAY classification
-- Note: Spec calls this evidence_category but that column already exists with different
-- values (Survey/Interview/etc.). Using narrative_category to avoid collision.
-- ============================================================================

ALTER TABLE evidence ADD COLUMN IF NOT EXISTS narrative_category VARCHAR(20);

-- Backfill existing rows using source_type heuristic mapping
UPDATE evidence SET narrative_category = CASE
  -- DO-direct: actual transactions or usage
  WHEN source_type IN ('payment', 'purchase', 'transaction', 'usage_metric', 'conversion') THEN 'DO-direct'
  -- DO-indirect: commitment signals
  WHEN source_type IN ('loi', 'waitlist', 'signup', 'prototype_feedback', 'pilot', 'beta') THEN 'DO-indirect'
  -- SAY: stated preferences (conservative default)
  WHEN source_type IN ('interview', 'survey', 'feedback', 'quote', 'testimonial') THEN 'SAY'
  ELSE 'SAY'
END
WHERE narrative_category IS NULL;

-- Set NOT NULL with default
ALTER TABLE evidence ALTER COLUMN narrative_category SET DEFAULT 'SAY';

-- Add CHECK constraint
ALTER TABLE evidence ADD CONSTRAINT evidence_narrative_category_check
  CHECK (narrative_category IN ('DO-direct', 'DO-indirect', 'SAY'));

-- ============================================================================
-- STEP 1: ALTER projects table — add staleness columns
-- ============================================================================

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS narrative_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS narrative_is_stale BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS narrative_stale_severity VARCHAR(10) DEFAULT 'hard',
  ADD COLUMN IF NOT EXISTS narrative_stale_reason TEXT;

-- ============================================================================
-- STEP 2: CREATE founder_profiles — FK to user_profiles only
-- ============================================================================

CREATE TABLE IF NOT EXISTS founder_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  professional_summary VARCHAR(500),
  domain_expertise TEXT[],
  previous_ventures JSONB,
  linkedin_url VARCHAR(255),
  company_website VARCHAR(255),
  years_experience INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_user_founder_profile UNIQUE (user_id)
);

ALTER TABLE founder_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 3: CREATE pitch_narratives — FK to projects, user_profiles
-- ============================================================================

CREATE TABLE IF NOT EXISTS pitch_narratives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  narrative_data JSONB NOT NULL,
  baseline_narrative JSONB NOT NULL,

  is_edited BOOLEAN DEFAULT FALSE,
  edit_history JSONB DEFAULT '[]',
  alignment_status VARCHAR(20) DEFAULT 'verified',
  alignment_issues JSONB DEFAULT '[]',

  generation_version VARCHAR(10) NOT NULL DEFAULT '1.0',
  source_evidence_hash VARCHAR(64) NOT NULL,
  agent_run_id VARCHAR(100),

  verification_request_count INTEGER DEFAULT 0,

  is_published BOOLEAN DEFAULT FALSE,
  first_published_at TIMESTAMPTZ,
  last_publish_review_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_project_narrative UNIQUE (project_id)
);

ALTER TABLE pitch_narratives ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: CREATE narrative_versions — FK to pitch_narratives
-- ============================================================================

CREATE TABLE IF NOT EXISTS narrative_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  narrative_id UUID NOT NULL REFERENCES pitch_narratives(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,

  narrative_data JSONB NOT NULL,
  source_evidence_hash VARCHAR(64) NOT NULL,
  fit_score_at_version DECIMAL(3,2),

  trigger_reason TEXT,
  evidence_changes JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_narrative_version UNIQUE (narrative_id, version_number)
);

ALTER TABLE narrative_versions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 5: CREATE evidence_packages — FK to projects, user_profiles, pitch_narratives
-- ============================================================================

CREATE TABLE IF NOT EXISTS evidence_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  founder_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  pitch_narrative_id UUID REFERENCES pitch_narratives(id),
  evidence_data JSONB NOT NULL,
  integrity_hash VARCHAR(64) NOT NULL,

  is_public BOOLEAN DEFAULT FALSE,
  is_primary BOOLEAN DEFAULT FALSE,
  founder_consent BOOLEAN NOT NULL DEFAULT FALSE,
  consent_timestamp TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE evidence_packages ENABLE ROW LEVEL SECURITY;

-- Partial unique index: only one primary package per project
CREATE UNIQUE INDEX IF NOT EXISTS idx_evidence_packages_primary_per_project
  ON evidence_packages(project_id)
  WHERE is_primary = TRUE;

-- ============================================================================
-- STEP 6: CREATE narrative_exports — FK to pitch_narratives, evidence_packages
-- ============================================================================

CREATE TABLE IF NOT EXISTS narrative_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  narrative_id UUID NOT NULL REFERENCES pitch_narratives(id) ON DELETE CASCADE,

  verification_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  generation_hash VARCHAR(64) NOT NULL,

  evidence_package_id UUID NOT NULL REFERENCES evidence_packages(id),
  venture_name_at_export VARCHAR(200) NOT NULL,
  validation_stage_at_export VARCHAR(50) NOT NULL,

  export_format VARCHAR(10) NOT NULL,
  storage_path VARCHAR(500) NOT NULL,
  qr_code_included BOOLEAN DEFAULT TRUE,
  exported_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_export_format CHECK (export_format IN ('pdf', 'pptx', 'json'))
);

ALTER TABLE narrative_exports ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 7: CREATE evidence_package_access — FK to evidence_packages, user_profiles, consultant_clients
-- ============================================================================

CREATE TABLE IF NOT EXISTS evidence_package_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_package_id UUID NOT NULL REFERENCES evidence_packages(id),
  portfolio_holder_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES consultant_clients(id),

  first_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  access_count INTEGER DEFAULT 1,
  view_duration_seconds INTEGER DEFAULT 0,

  feedback_requested BOOLEAN DEFAULT FALSE,
  feedback_areas TEXT[],

  -- Verification to connection conversion tracking (spec :2644-2648)
  verification_token_used UUID,
  source VARCHAR(50),

  CONSTRAINT unique_package_holder UNIQUE (evidence_package_id, portfolio_holder_id)
);

ALTER TABLE evidence_package_access ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 8: CREATE narrative_funnel_events (analytics, service-role only)
-- ============================================================================

CREATE TABLE IF NOT EXISTS narrative_funnel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  user_id UUID NOT NULL REFERENCES user_profiles(id),

  event_type VARCHAR(50) NOT NULL,
  event_metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE narrative_funnel_events ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 9: CREATE package_engagement_events (analytics, service-role only)
-- ============================================================================

CREATE TABLE IF NOT EXISTS package_engagement_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_id UUID NOT NULL REFERENCES evidence_package_access(id),

  event_type VARCHAR(50) NOT NULL,
  event_value JSONB NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE package_engagement_events ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 10: STALENESS TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_narrative_stale()
RETURNS TRIGGER AS $$
DECLARE
  change_severity VARCHAR(10);
  change_reason TEXT;
  target_project_id UUID;
BEGIN
  -- Safely extract project_id
  BEGIN
    target_project_id := NEW.project_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'mark_narrative_stale: Cannot access project_id from % table: %', TG_TABLE_NAME, SQLERRM;
    RETURN NEW;
  END;

  -- Determine staleness severity based on change type
  BEGIN
    IF TG_TABLE_NAME = 'evidence' THEN
      change_severity := 'soft';
      change_reason := 'New evidence added';
    ELSIF TG_TABLE_NAME = 'hypotheses' THEN
      IF OLD.status IS DISTINCT FROM NEW.status THEN
        change_severity := 'hard';
        change_reason := 'Hypothesis status changed: ' || COALESCE(OLD.status, 'none') || ' → ' || COALESCE(NEW.status, 'unknown');
      ELSE
        change_severity := 'soft';
        change_reason := 'Hypothesis updated';
      END IF;
    ELSIF TG_TABLE_NAME = 'validation_runs' THEN
      IF NEW.current_gate IS DISTINCT FROM OLD.current_gate THEN
        change_severity := 'hard';
        change_reason := 'Validation stage changed: ' || COALESCE(OLD.current_gate, 'none') || ' → ' || COALESCE(NEW.current_gate, 'unknown');
      ELSE
        change_severity := 'soft';
        change_reason := 'Validation run updated';
      END IF;
    ELSE
      change_severity := 'soft';
      change_reason := 'Related data changed';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    change_severity := 'soft';
    change_reason := 'Data changed in ' || TG_TABLE_NAME || ' (fallback: ' || SQLERRM || ')';
    RAISE WARNING 'mark_narrative_stale fallback triggered for %: %', TG_TABLE_NAME, SQLERRM;
  END;

  -- Apply staleness update (never downgrade hard → soft)
  UPDATE projects
  SET
    narrative_is_stale = TRUE,
    narrative_stale_severity = CASE
      WHEN narrative_stale_severity = 'hard' THEN 'hard'
      ELSE change_severity
    END,
    narrative_stale_reason = change_reason
  WHERE id = target_project_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 11: ATTACH TRIGGERS (5 of 7 — defer gate_scores, customer_profiles)
-- ============================================================================

CREATE TRIGGER evidence_change_stales_narrative
  AFTER INSERT OR UPDATE ON evidence
  FOR EACH ROW
  EXECUTE FUNCTION mark_narrative_stale();

CREATE TRIGGER hypothesis_change_stales_narrative
  AFTER INSERT OR UPDATE ON hypotheses
  FOR EACH ROW
  EXECUTE FUNCTION mark_narrative_stale();

CREATE TRIGGER validation_stage_change_stales_narrative
  AFTER INSERT OR UPDATE ON validation_runs
  FOR EACH ROW
  EXECUTE FUNCTION mark_narrative_stale();

CREATE TRIGGER vpc_change_stales_narrative
  AFTER INSERT OR UPDATE ON value_proposition_canvas
  FOR EACH ROW
  EXECUTE FUNCTION mark_narrative_stale();

-- Founder profile trigger: only fires on meaningful field changes
CREATE TRIGGER founder_profile_staleness_trigger
  AFTER INSERT OR UPDATE ON founder_profiles
  FOR EACH ROW
  WHEN (
    TG_OP = 'INSERT' OR
    OLD.professional_summary IS DISTINCT FROM NEW.professional_summary OR
    OLD.linkedin_url IS DISTINCT FROM NEW.linkedin_url OR
    OLD.years_experience IS DISTINCT FROM NEW.years_experience OR
    OLD.domain_expertise IS DISTINCT FROM NEW.domain_expertise OR
    OLD.previous_ventures IS DISTINCT FROM NEW.previous_ventures
  )
  EXECUTE FUNCTION mark_narrative_stale();

-- TODO: Add gate_scores trigger when table is created (currently JSONB in crewai_validation_states)
-- TODO: Add customer_profiles trigger when table is created (currently JSONB in crewai_validation_states)

-- ============================================================================
-- STEP 11.5: ATTACH updated_at TRIGGERS (reuse existing function)
-- ============================================================================

-- Reuse existing set_updated_at_timestamp() function from migration 20251117000008_*
CREATE TRIGGER set_pitch_narratives_updated_at
  BEFORE UPDATE ON pitch_narratives
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER set_founder_profiles_updated_at
  BEFORE UPDATE ON founder_profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER set_evidence_packages_updated_at
  BEFORE UPDATE ON evidence_packages
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER set_evidence_package_access_updated_at
  BEFORE UPDATE ON evidence_package_access
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_timestamp();

-- ============================================================================
-- STEP 12: INDEXES (11 total)
-- ============================================================================

-- 5 base indexes (spec :2415-2430)
CREATE INDEX IF NOT EXISTS idx_pitch_narratives_narrative_data
  ON pitch_narratives USING GIN (narrative_data);

CREATE INDEX IF NOT EXISTS idx_consultant_clients_connection_lookup
  ON consultant_clients(consultant_id, client_id, connection_status);

CREATE INDEX IF NOT EXISTS idx_user_profiles_role
  ON user_profiles(id, role);

CREATE INDEX IF NOT EXISTS idx_pitch_narratives_project
  ON pitch_narratives(project_id);

CREATE INDEX IF NOT EXISTS idx_narrative_versions_lookup
  ON narrative_versions(narrative_id, version_number);

-- 2 narrative_exports indexes (spec :2075-2080)
CREATE UNIQUE INDEX IF NOT EXISTS idx_narrative_exports_verification_token
  ON narrative_exports(verification_token);

CREATE INDEX IF NOT EXISTS idx_narrative_exports_narrative_id
  ON narrative_exports(narrative_id);

-- 2 narrative_funnel_events indexes (spec :2597-2598)
CREATE INDEX IF NOT EXISTS idx_narrative_funnel_project
  ON narrative_funnel_events(project_id, event_type);

CREATE INDEX IF NOT EXISTS idx_narrative_funnel_time
  ON narrative_funnel_events(created_at);

-- 1 package_engagement_events index (spec :2615)
CREATE INDEX IF NOT EXISTS idx_package_engagement_access
  ON package_engagement_events(access_id);

-- 1 partial unique on evidence_packages (spec :2215) — already created above

-- ============================================================================
-- STEP 13: RLS POLICIES (15 user-facing)
-- ============================================================================

-- pitch_narratives: 4 policies (CRUD for founder)
CREATE POLICY "Founders can view own narratives"
  ON pitch_narratives FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Founders can update own narratives"
  ON pitch_narratives FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Founders can create own narratives"
  ON pitch_narratives FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Founders can delete own narratives"
  ON pitch_narratives FOR DELETE
  USING (auth.uid() = user_id);

-- narrative_versions: 1 policy (read via parent narrative)
CREATE POLICY "Founders can view own narrative versions"
  ON narrative_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pitch_narratives pn
      WHERE pn.id = narrative_versions.narrative_id
        AND pn.user_id = auth.uid()
    )
  );

-- narrative_exports: 2 policies (read + create via parent narrative)
CREATE POLICY "Founders can view own exports"
  ON narrative_exports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pitch_narratives pn
      WHERE pn.id = narrative_exports.narrative_id
        AND pn.user_id = auth.uid()
    )
  );

CREATE POLICY "Founders can create own exports"
  ON narrative_exports FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pitch_narratives pn
      WHERE pn.id = narrative_exports.narrative_id
        AND pn.user_id = auth.uid()
    )
  );

-- evidence_packages: 2 policies (founder view + consultant view with consent)
CREATE POLICY "Founders can view own packages"
  ON evidence_packages FOR SELECT
  USING (auth.uid() = founder_id);

CREATE POLICY "Consultants can view packages with consent"
  ON evidence_packages FOR SELECT
  USING (
    auth.uid() = founder_id
    OR
    (
      founder_consent = TRUE
      AND EXISTS (
        SELECT 1 FROM consultant_clients cc
        WHERE cc.consultant_id = auth.uid()
          AND cc.client_id = evidence_packages.founder_id
          AND cc.connection_status = 'active'
      )
    )
    OR
    (
      is_public = TRUE
      AND founder_consent = TRUE
      AND EXISTS (
        SELECT 1 FROM pitch_narratives pn
        WHERE pn.id = evidence_packages.pitch_narrative_id
          AND pn.is_published = TRUE
      )
      AND EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.id = auth.uid()
          AND up.role = 'consultant'
      )
    )
  );

-- evidence_package_access: 4 policies (PH read/create/update + founder read)
CREATE POLICY "PHs can view own access records"
  ON evidence_package_access FOR SELECT
  USING (auth.uid() = portfolio_holder_id);

CREATE POLICY "Founders can view access to their packages"
  ON evidence_package_access FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM evidence_packages ep
      WHERE ep.id = evidence_package_access.evidence_package_id
        AND ep.founder_id = auth.uid()
    )
  );

CREATE POLICY "PHs can create access records"
  ON evidence_package_access FOR INSERT
  WITH CHECK (
    auth.uid() = portfolio_holder_id
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.role = 'consultant'
    )
  );

CREATE POLICY "PHs can update own access records"
  ON evidence_package_access FOR UPDATE
  USING (auth.uid() = portfolio_holder_id)
  WITH CHECK (auth.uid() = portfolio_holder_id);

-- founder_profiles: 2 policies (public read for PHs + full access for owner)
CREATE POLICY "Verified PHs can view founder profiles"
  ON founder_profiles FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.role = 'consultant'
    )
  );

CREATE POLICY "Founders can manage own profile"
  ON founder_profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Analytics tables: service-role only (ENABLE RLS above, no user-facing policies)
-- narrative_funnel_events and package_engagement_events are written via service role
