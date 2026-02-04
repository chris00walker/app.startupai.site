-- ============================================================================
-- Schema Cleanup Phase 4c: Evidence Table
-- ============================================================================
-- Created: 2026-02-05
-- Purpose: Rename ambiguous columns in evidence table
-- Plan Reference: Schema Cleanup Migration Plan
--
-- Changes:
-- 1. evidence.source → evidence_source
-- 2. evidence.category → evidence_category
-- 3. Update match_evidence() function to use new column name (aliased as 'source')

BEGIN;

-- ============================================================================
-- 1. Rename columns in evidence table
-- ============================================================================

ALTER TABLE evidence RENAME COLUMN source TO evidence_source;
ALTER TABLE evidence RENAME COLUMN category TO evidence_category;

-- ============================================================================
-- 2. Update match_evidence() function
-- ============================================================================
-- Note: Queries evidence_source but returns it aliased as 'source' for
-- backward compatibility with the single caller in netlify/functions/startupai/tools.py

CREATE OR REPLACE FUNCTION public.match_evidence(
  query_embedding vector,
  match_threshold double precision DEFAULT 0.7,
  match_count integer DEFAULT 10,
  filter_project_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(
  id uuid,
  project_id uuid,
  title text,
  content text,
  summary text,
  fit_type text,
  strength text,
  source text,  -- Keep as 'source' for backward compatibility
  similarity double precision
)
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    evidence.id,
    evidence.project_id,
    evidence.title,
    evidence.content,
    evidence.summary,
    evidence.fit_type,
    evidence.strength,
    evidence.evidence_source AS source,  -- Query new column, alias as old name
    1 - (evidence.embedding <=> query_embedding) AS similarity
  FROM evidence
  WHERE
    evidence.embedding IS NOT NULL
    AND (filter_project_id IS NULL OR evidence.project_id = filter_project_id)
    AND 1 - (evidence.embedding <=> query_embedding) > match_threshold
  ORDER BY evidence.embedding <=> query_embedding
  LIMIT match_count;
END;
$function$;

-- ============================================================================
-- Verify changes
-- ============================================================================

DO $$
BEGIN
  -- Verify evidence columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'evidence'
    AND column_name = 'evidence_source'
  ) THEN
    RAISE EXCEPTION 'Migration failed: evidence.evidence_source not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'evidence'
    AND column_name = 'evidence_category'
  ) THEN
    RAISE EXCEPTION 'Migration failed: evidence.evidence_category not found';
  END IF;

  -- Verify old columns are gone
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'evidence'
    AND column_name = 'source'
  ) THEN
    RAISE EXCEPTION 'Migration failed: old column evidence.source still exists';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'evidence'
    AND column_name = 'category'
  ) THEN
    RAISE EXCEPTION 'Migration failed: old column evidence.category still exists';
  END IF;

  RAISE NOTICE 'Phase 4c migration completed successfully';
END $$;

COMMIT;
