-- Flywheel Learning System Tables
-- Captures anonymized learnings from validation flows for continuous improvement
-- Uses pgvector for semantic similarity search

-- ============================================================================
-- ENABLE VECTOR EXTENSION
-- ============================================================================
-- Note: This may already be enabled; CREATE EXTENSION IF NOT EXISTS is safe
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- LEARNINGS TABLE
-- Core table for storing anonymized learnings with embeddings
-- ============================================================================
CREATE TABLE IF NOT EXISTS learnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Learning identification
  learning_type TEXT NOT NULL CHECK (learning_type IN ('pattern', 'outcome', 'domain')),

  -- Anonymized context
  founder TEXT NOT NULL, -- Anonymized founder ID (e.g., "founder_1234")
  phase TEXT NOT NULL CHECK (phase IN ('IDEATION', 'DESIRABILITY', 'FEASIBILITY', 'VIABILITY', 'VALIDATED')),
  industry TEXT, -- Industry classification

  -- Learning content
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  context_abstract TEXT, -- Text summary of anonymized context

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),

  -- Vector embedding for semantic search (1536 dimensions for text-embedding-3-small)
  embedding vector(1536),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for learnings
CREATE INDEX IF NOT EXISTS idx_learnings_type ON learnings(learning_type);
CREATE INDEX IF NOT EXISTS idx_learnings_phase ON learnings(phase);
CREATE INDEX IF NOT EXISTS idx_learnings_industry ON learnings(industry);
CREATE INDEX IF NOT EXISTS idx_learnings_tags ON learnings USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_learnings_created_at ON learnings(created_at DESC);

-- Vector index for similarity search (IVFFlat for good balance of speed/accuracy)
-- Note: Index type can be changed based on data volume
CREATE INDEX IF NOT EXISTS idx_learnings_embedding ON learnings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ============================================================================
-- PATTERNS TABLE
-- Recurring patterns identified across multiple validations
-- ============================================================================
CREATE TABLE IF NOT EXISTS patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Pattern identification
  name TEXT NOT NULL,
  description TEXT NOT NULL,

  -- Classification
  category TEXT NOT NULL CHECK (category IN ('customer', 'market', 'product', 'business_model', 'competition', 'pivot')),
  phase TEXT NOT NULL CHECK (phase IN ('IDEATION', 'DESIRABILITY', 'FEASIBILITY', 'VIABILITY', 'VALIDATED')),

  -- Pattern details
  indicators TEXT[] DEFAULT '{}', -- Signs that this pattern applies
  typical_outcomes TEXT[] DEFAULT '{}', -- Common outcomes when pattern is present
  recommended_actions TEXT[] DEFAULT '{}', -- Suggested responses

  -- Frequency and validation
  occurrence_count INTEGER DEFAULT 1,
  success_rate DECIMAL(3,2), -- Rate of positive outcomes when pattern is present
  last_observed_at TIMESTAMPTZ DEFAULT NOW(),

  -- Industries where pattern is commonly observed
  industries TEXT[] DEFAULT '{}',

  -- Vector embedding for matching
  embedding vector(1536),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for patterns
CREATE INDEX IF NOT EXISTS idx_patterns_category ON patterns(category);
CREATE INDEX IF NOT EXISTS idx_patterns_phase ON patterns(phase);
CREATE INDEX IF NOT EXISTS idx_patterns_industries ON patterns USING GIN(industries);
CREATE INDEX IF NOT EXISTS idx_patterns_occurrence ON patterns(occurrence_count DESC);

-- Vector index for pattern matching
CREATE INDEX IF NOT EXISTS idx_patterns_embedding ON patterns
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);

-- ============================================================================
-- OUTCOMES TABLE
-- Tracks validation outcomes for learning from results
-- ============================================================================
CREATE TABLE IF NOT EXISTS outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Outcome identification
  validation_id TEXT NOT NULL, -- Anonymized validation ID
  founder TEXT NOT NULL, -- Anonymized founder ID

  -- Final state
  final_phase TEXT NOT NULL CHECK (final_phase IN ('IDEATION', 'DESIRABILITY', 'FEASIBILITY', 'VIABILITY', 'VALIDATED')),
  recommendation TEXT NOT NULL CHECK (recommendation IN ('PROCEED', 'PIVOT', 'KILL', 'INCONCLUSIVE')),

  -- Journey summary (anonymized)
  total_pivots INTEGER DEFAULT 0,
  pivot_types TEXT[] DEFAULT '{}', -- Types of pivots executed
  phases_completed TEXT[] DEFAULT '{}', -- Phases that were completed

  -- Key signals at outcome
  desirability_signal TEXT CHECK (desirability_signal IN ('STRONG', 'WEAK', 'NONE')),
  feasibility_signal TEXT CHECK (feasibility_signal IN ('POSSIBLE', 'CONSTRAINED', 'IMPOSSIBLE')),
  viability_signal TEXT CHECK (viability_signal IN ('PROFITABLE', 'MARGINAL', 'UNDERWATER')),

  -- Industry context
  industry TEXT,
  business_model_type TEXT, -- e.g., "B2B SaaS", "Marketplace", "D2C"

  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  duration_hours DECIMAL(10,2), -- Time from start to completion

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for outcomes
CREATE INDEX IF NOT EXISTS idx_outcomes_recommendation ON outcomes(recommendation);
CREATE INDEX IF NOT EXISTS idx_outcomes_final_phase ON outcomes(final_phase);
CREATE INDEX IF NOT EXISTS idx_outcomes_industry ON outcomes(industry);
CREATE INDEX IF NOT EXISTS idx_outcomes_completed_at ON outcomes(completed_at DESC);

-- ============================================================================
-- DOMAIN EXPERTISE TABLE
-- Industry-specific knowledge accumulated over time
-- ============================================================================
CREATE TABLE IF NOT EXISTS domain_expertise (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Domain identification
  industry TEXT NOT NULL,
  sub_domain TEXT, -- More specific classification

  -- Knowledge content
  topic TEXT NOT NULL,
  insight TEXT NOT NULL,

  -- Classification
  expertise_type TEXT NOT NULL CHECK (expertise_type IN ('benchmark', 'trend', 'best_practice', 'risk_factor', 'success_factor')),

  -- Validation metrics (for benchmarks)
  metric_name TEXT, -- e.g., "CAC", "LTV", "Conversion Rate"
  metric_value_low DECIMAL(15,2), -- Range low
  metric_value_high DECIMAL(15,2), -- Range high
  metric_unit TEXT, -- e.g., "USD", "percent", "months"

  -- Confidence and sourcing
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  source TEXT, -- Where this knowledge came from
  observation_count INTEGER DEFAULT 1, -- How many times observed
  last_validated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Vector embedding for retrieval
  embedding vector(1536),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for domain expertise
CREATE INDEX IF NOT EXISTS idx_domain_expertise_industry ON domain_expertise(industry);
CREATE INDEX IF NOT EXISTS idx_domain_expertise_type ON domain_expertise(expertise_type);
CREATE INDEX IF NOT EXISTS idx_domain_expertise_metric ON domain_expertise(metric_name);

-- Vector index for knowledge retrieval
CREATE INDEX IF NOT EXISTS idx_domain_expertise_embedding ON domain_expertise
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);

-- ============================================================================
-- SEARCH FUNCTIONS
-- ============================================================================

-- Function to search learnings by semantic similarity
CREATE OR REPLACE FUNCTION search_learnings(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  filter_phase text DEFAULT NULL,
  filter_type text DEFAULT NULL,
  filter_industry text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  learning_type text,
  founder text,
  phase text,
  industry text,
  title text,
  description text,
  context_abstract text,
  tags text[],
  confidence_score decimal,
  created_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.learning_type,
    l.founder,
    l.phase,
    l.industry,
    l.title,
    l.description,
    l.context_abstract,
    l.tags,
    l.confidence_score,
    l.created_at,
    1 - (l.embedding <=> query_embedding) AS similarity
  FROM learnings l
  WHERE
    (filter_phase IS NULL OR l.phase = filter_phase)
    AND (filter_type IS NULL OR l.learning_type = filter_type)
    AND (filter_industry IS NULL OR l.industry = filter_industry)
    AND 1 - (l.embedding <=> query_embedding) > match_threshold
  ORDER BY l.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to search patterns by semantic similarity
CREATE OR REPLACE FUNCTION search_patterns(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  filter_category text DEFAULT NULL,
  filter_phase text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  category text,
  phase text,
  indicators text[],
  typical_outcomes text[],
  recommended_actions text[],
  occurrence_count int,
  success_rate decimal,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.description,
    p.category,
    p.phase,
    p.indicators,
    p.typical_outcomes,
    p.recommended_actions,
    p.occurrence_count,
    p.success_rate,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM patterns p
  WHERE
    (filter_category IS NULL OR p.category = filter_category)
    AND (filter_phase IS NULL OR p.phase = filter_phase)
    AND 1 - (p.embedding <=> query_embedding) > match_threshold
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to get domain expertise for an industry
CREATE OR REPLACE FUNCTION get_domain_expertise(
  target_industry text,
  expertise_types text[] DEFAULT NULL,
  max_results int DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  industry text,
  sub_domain text,
  topic text,
  insight text,
  expertise_type text,
  metric_name text,
  metric_value_low decimal,
  metric_value_high decimal,
  metric_unit text,
  confidence_score decimal,
  observation_count int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    de.id,
    de.industry,
    de.sub_domain,
    de.topic,
    de.insight,
    de.expertise_type,
    de.metric_name,
    de.metric_value_low,
    de.metric_value_high,
    de.metric_unit,
    de.confidence_score,
    de.observation_count
  FROM domain_expertise de
  WHERE
    de.industry = target_industry
    AND (expertise_types IS NULL OR de.expertise_type = ANY(expertise_types))
  ORDER BY de.observation_count DESC, de.confidence_score DESC
  LIMIT max_results;
END;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamp trigger for learnings
DROP TRIGGER IF EXISTS update_learnings_updated_at ON learnings;
CREATE TRIGGER update_learnings_updated_at
BEFORE UPDATE ON learnings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update timestamp trigger for patterns
DROP TRIGGER IF EXISTS update_patterns_updated_at ON patterns;
CREATE TRIGGER update_patterns_updated_at
BEFORE UPDATE ON patterns
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update timestamp trigger for domain_expertise
DROP TRIGGER IF EXISTS update_domain_expertise_updated_at ON domain_expertise;
CREATE TRIGGER update_domain_expertise_updated_at
BEFORE UPDATE ON domain_expertise
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- Note: These tables contain anonymized data and are accessed by service role
-- RLS is enabled but with permissive policies for service role access
-- ============================================================================

ALTER TABLE learnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_expertise ENABLE ROW LEVEL SECURITY;

-- Service role can access all flywheel data (used by CrewAI backend)
DROP POLICY IF EXISTS "Service role can manage learnings" ON learnings;
CREATE POLICY "Service role can manage learnings"
ON learnings FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage patterns" ON patterns;
CREATE POLICY "Service role can manage patterns"
ON patterns FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage outcomes" ON outcomes;
CREATE POLICY "Service role can manage outcomes"
ON outcomes FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage domain_expertise" ON domain_expertise;
CREATE POLICY "Service role can manage domain_expertise"
ON domain_expertise FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Authenticated users can read learnings (for transparency/debugging)
DROP POLICY IF EXISTS "Authenticated users can read learnings" ON learnings;
CREATE POLICY "Authenticated users can read learnings"
ON learnings FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can read patterns" ON patterns;
CREATE POLICY "Authenticated users can read patterns"
ON patterns FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can read domain_expertise" ON domain_expertise;
CREATE POLICY "Authenticated users can read domain_expertise"
ON domain_expertise FOR SELECT
TO authenticated
USING (true);

-- ============================================================================
-- SEED DATA: Initial Industry Benchmarks
-- Pre-populate with industry benchmark data from financial_data.py
-- ============================================================================

-- B2B SaaS SMB benchmarks
INSERT INTO domain_expertise (industry, sub_domain, topic, insight, expertise_type, metric_name, metric_value_low, metric_value_high, metric_unit, confidence_score, source, observation_count)
VALUES
  ('B2B SaaS', 'SMB', 'Customer Acquisition Cost', 'Typical CAC for B2B SaaS targeting SMB customers', 'benchmark', 'CAC', 150, 350, 'USD', 0.85, 'Industry aggregates', 100),
  ('B2B SaaS', 'SMB', 'Customer Lifetime Value', 'Typical LTV for B2B SaaS SMB customers', 'benchmark', 'LTV', 1500, 3000, 'USD', 0.85, 'Industry aggregates', 100),
  ('B2B SaaS', 'SMB', 'LTV/CAC Ratio', 'Healthy LTV/CAC ratio for B2B SaaS SMB', 'benchmark', 'LTV_CAC_RATIO', 5, 10, 'ratio', 0.85, 'Industry aggregates', 100),
  ('B2B SaaS', 'SMB', 'Gross Margin', 'Typical gross margin for B2B SaaS', 'benchmark', 'GROSS_MARGIN', 70, 85, 'percent', 0.90, 'Industry aggregates', 100),
  ('B2B SaaS', 'SMB', 'Monthly Churn', 'Typical monthly churn for SMB segment', 'benchmark', 'MONTHLY_CHURN', 2, 5, 'percent', 0.80, 'Industry aggregates', 100)
ON CONFLICT DO NOTHING;

-- B2B SaaS Enterprise benchmarks
INSERT INTO domain_expertise (industry, sub_domain, topic, insight, expertise_type, metric_name, metric_value_low, metric_value_high, metric_unit, confidence_score, source, observation_count)
VALUES
  ('B2B SaaS', 'Enterprise', 'Customer Acquisition Cost', 'Typical CAC for B2B SaaS targeting Enterprise customers', 'benchmark', 'CAC', 5000, 20000, 'USD', 0.80, 'Industry aggregates', 80),
  ('B2B SaaS', 'Enterprise', 'Customer Lifetime Value', 'Typical LTV for B2B SaaS Enterprise customers', 'benchmark', 'LTV', 50000, 200000, 'USD', 0.80, 'Industry aggregates', 80),
  ('B2B SaaS', 'Enterprise', 'LTV/CAC Ratio', 'Healthy LTV/CAC ratio for B2B SaaS Enterprise', 'benchmark', 'LTV_CAC_RATIO', 8, 15, 'ratio', 0.80, 'Industry aggregates', 80),
  ('B2B SaaS', 'Enterprise', 'Monthly Churn', 'Typical monthly churn for Enterprise segment', 'benchmark', 'MONTHLY_CHURN', 0.5, 2, 'percent', 0.85, 'Industry aggregates', 80)
ON CONFLICT DO NOTHING;

-- E-commerce/D2C benchmarks
INSERT INTO domain_expertise (industry, sub_domain, topic, insight, expertise_type, metric_name, metric_value_low, metric_value_high, metric_unit, confidence_score, source, observation_count)
VALUES
  ('E-commerce', 'D2C', 'Customer Acquisition Cost', 'Typical CAC for D2C e-commerce brands', 'benchmark', 'CAC', 30, 100, 'USD', 0.75, 'Industry aggregates', 90),
  ('E-commerce', 'D2C', 'Customer Lifetime Value', 'Typical LTV for D2C e-commerce', 'benchmark', 'LTV', 100, 400, 'USD', 0.75, 'Industry aggregates', 90),
  ('E-commerce', 'D2C', 'LTV/CAC Ratio', 'Healthy LTV/CAC ratio for D2C', 'benchmark', 'LTV_CAC_RATIO', 2.5, 4, 'ratio', 0.75, 'Industry aggregates', 90),
  ('E-commerce', 'D2C', 'Gross Margin', 'Typical gross margin for D2C', 'benchmark', 'GROSS_MARGIN', 40, 65, 'percent', 0.80, 'Industry aggregates', 90)
ON CONFLICT DO NOTHING;

-- Marketplace benchmarks
INSERT INTO domain_expertise (industry, sub_domain, topic, insight, expertise_type, metric_name, metric_value_low, metric_value_high, metric_unit, confidence_score, source, observation_count)
VALUES
  ('Marketplace', 'General', 'Customer Acquisition Cost', 'Typical CAC for marketplace businesses', 'benchmark', 'CAC', 20, 80, 'USD', 0.70, 'Industry aggregates', 70),
  ('Marketplace', 'General', 'Gross Margin (Take Rate)', 'Typical take rate/gross margin for marketplaces', 'benchmark', 'GROSS_MARGIN', 10, 25, 'percent', 0.75, 'Industry aggregates', 70),
  ('Marketplace', 'General', 'Monthly Churn', 'Typical monthly churn for marketplace users', 'benchmark', 'MONTHLY_CHURN', 3, 8, 'percent', 0.70, 'Industry aggregates', 70)
ON CONFLICT DO NOTHING;

-- Fintech benchmarks
INSERT INTO domain_expertise (industry, sub_domain, topic, insight, expertise_type, metric_name, metric_value_low, metric_value_high, metric_unit, confidence_score, source, observation_count)
VALUES
  ('Fintech', 'Consumer', 'Customer Acquisition Cost', 'Typical CAC for consumer fintech', 'benchmark', 'CAC', 50, 200, 'USD', 0.75, 'Industry aggregates', 60),
  ('Fintech', 'Consumer', 'Customer Lifetime Value', 'Typical LTV for consumer fintech', 'benchmark', 'LTV', 300, 1200, 'USD', 0.75, 'Industry aggregates', 60),
  ('Fintech', 'B2B', 'Customer Acquisition Cost', 'Typical CAC for B2B fintech', 'benchmark', 'CAC', 1000, 5000, 'USD', 0.70, 'Industry aggregates', 50),
  ('Fintech', 'B2B', 'Customer Lifetime Value', 'Typical LTV for B2B fintech', 'benchmark', 'LTV', 10000, 50000, 'USD', 0.70, 'Industry aggregates', 50)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMMENT ON TABLES
-- ============================================================================

COMMENT ON TABLE learnings IS 'Anonymized learnings from validation flows for the Flywheel system';
COMMENT ON TABLE patterns IS 'Recurring patterns identified across multiple validations';
COMMENT ON TABLE outcomes IS 'Validation outcomes for learning from results';
COMMENT ON TABLE domain_expertise IS 'Industry-specific knowledge and benchmarks';

COMMENT ON FUNCTION search_learnings IS 'Semantic similarity search for relevant learnings';
COMMENT ON FUNCTION search_patterns IS 'Semantic similarity search for relevant patterns';
COMMENT ON FUNCTION get_domain_expertise IS 'Retrieve domain expertise for a specific industry';
