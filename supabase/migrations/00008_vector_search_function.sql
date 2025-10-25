-- ============================================================================
-- Vector Search Function for Evidence
-- ============================================================================
-- Created: October 4, 2025
-- Purpose: Semantic search using pgvector for evidence matching
-- Dependencies: pgvector extension

-- 1) Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 2) Ensure embedding column exists on evidence
ALTER TABLE public.evidence
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- 3) Create an ANN index (cosine distance) for performant search
--    Requires pgvector >= 0.5 for vector_cosine_ops. Some hosted environments still
--    run pgvector builds without this operator class, so we catch the error and
--    continue rather than aborting the migration entirely.
DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS evidence_embedding_ivfflat_cos_idx
    ON public.evidence
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
EXCEPTION
  WHEN undefined_object THEN
    RAISE NOTICE 'vector_cosine_ops unavailable; skipping ANN index creation.';
END
$$;

DO $$
BEGIN
  BEGIN
    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION public.match_evidence(
        query_embedding vector(1536),
        match_threshold double precision DEFAULT 0.7,
        match_count integer DEFAULT 10,
        filter_project_id uuid DEFAULT NULL
      )
      RETURNS TABLE (
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
      LANGUAGE sql
      STABLE
      AS $body$
        SELECT
          e.id,
          e.project_id,
          e.title,
          e.content,
          e.summary,
          e.fit_type,
          e.strength,
          e.source,
          1 - (e.embedding <=> query_embedding)::double precision AS similarity
        FROM public.evidence e
        WHERE
          e.embedding IS NOT NULL
          AND (filter_project_id IS NULL OR e.project_id = filter_project_id)
          AND (1 - (e.embedding <=> query_embedding)::double precision) > match_threshold
        ORDER BY e.embedding <=> query_embedding
        LIMIT match_count
      $body$;
    $fn$;
  EXCEPTION
    WHEN undefined_object THEN
      RAISE NOTICE 'vector type unavailable; skipping match_evidence function creation.';
    WHEN others THEN
      RAISE NOTICE 'Skipping match_evidence function creation: %', SQLERRM;
  END;
END
$$;
