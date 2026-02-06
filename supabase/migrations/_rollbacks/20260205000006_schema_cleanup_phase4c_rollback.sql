-- ============================================================================
-- Schema Cleanup Phase 4c: ROLLBACK
-- ============================================================================
-- Use this script to rollback Phase 4c changes if issues occur

BEGIN;

-- Rollback evidence columns
ALTER TABLE evidence RENAME COLUMN evidence_source TO source;
ALTER TABLE evidence RENAME COLUMN evidence_category TO category;

-- Rollback match_evidence() function to use original column name
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
  source text,
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
    evidence.source,
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

COMMIT;
