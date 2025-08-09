-- Logical schema for thin-slice (Postgres + pgvector)
CREATE EXTENSION IF NOT EXISTS vector;

-- Engagements
CREATE TABLE IF NOT EXISTS engagements (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assumptions (
  id UUID PRIMARY KEY,
  engagement_id UUID REFERENCES engagements(id),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Canvases
CREATE TABLE IF NOT EXISTS canvases (
  id UUID PRIMARY KEY,
  engagement_id UUID REFERENCES engagements(id),
  version TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS canvas_items (
  id UUID PRIMARY KEY,
  canvas_id UUID REFERENCES canvases(id),
  kind TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS exports (
  id UUID PRIMARY KEY,
  canvas_id UUID REFERENCES canvases(id),
  type TEXT NOT NULL, -- pdf|svg
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Evidence
CREATE TABLE IF NOT EXISTS evidence (
  id UUID PRIMARY KEY,
  source_url TEXT,
  snippet TEXT,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS evidence_links (
  evidence_id UUID REFERENCES evidence(id),
  canvas_item_id UUID REFERENCES canvas_items(id),
  PRIMARY KEY (evidence_id, canvas_item_id)
);

CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY,
  subject_type TEXT NOT NULL, -- canvas|evidence
  subject_id UUID NOT NULL,
  metric TEXT NOT NULL, -- quality|coherence|traceability
  value NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Orchestration
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY,
  state TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY,
  job_id UUID REFERENCES jobs(id),
  type TEXT NOT NULL, -- canvas.generate|evidence.collect|render.export
  state TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS evaluations (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES tasks(id),
  metric TEXT NOT NULL,
  value NUMERIC NOT NULL,
  rationale TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- NOTE: PII-minimization; apply column-level encryption where applicable using pgcrypto or app-level envelope encryption.
