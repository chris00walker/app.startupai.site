-- ============================================================================
-- Vector Search Function for Evidence
-- ============================================================================
-- Created: October 4, 2025
-- Purpose: Semantic search using pgvector for evidence matching
-- Dependencies: pgvector extension (already enabled)

-- Create vector search function for evidence
CREATE OR REPLACE FUNCTION match_evidence(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10,
  filter_project_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  project_id UUID,
  title TEXT,
  content TEXT,
  summary TEXT,
  fit_type TEXT,
  strength TEXT,
  source TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
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
$$;

-- Add function comment
COMMENT ON FUNCTION match_evidence IS 'Semantic search for evidence using vector similarity (cosine distance). Returns evidence items ranked by similarity to query embedding.';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION match_evidence TO authenticated;
GRANT EXECUTE ON FUNCTION match_evidence TO service_role;
