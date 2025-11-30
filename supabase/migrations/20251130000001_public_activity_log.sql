-- Public Activity Log Table
-- Stores anonymized agent activities for public marketing display.
-- Populated by the CrewAI webhook when validation results arrive.
-- This table intentionally has NO RLS - data is public by design.

CREATE TABLE IF NOT EXISTS public.public_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    founder_id TEXT NOT NULL,
    activity_type TEXT NOT NULL,
    description TEXT NOT NULL,
    project_id UUID,
    kickoff_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Constraints for enum-like values
    CONSTRAINT valid_founder_id CHECK (founder_id IN ('sage', 'forge', 'pulse', 'compass', 'guardian', 'ledger')),
    CONSTRAINT valid_activity_type CHECK (activity_type IN ('analysis', 'build', 'validation', 'research', 'review'))
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_public_activity_log_founder_id ON public.public_activity_log(founder_id);
CREATE INDEX IF NOT EXISTS idx_public_activity_log_activity_type ON public.public_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_public_activity_log_created_at ON public.public_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_public_activity_log_kickoff_id ON public.public_activity_log(kickoff_id);

-- Grant access to service role (for webhook insertions)
GRANT ALL ON public.public_activity_log TO service_role;

-- Grant read access to anon role (for public API)
GRANT SELECT ON public.public_activity_log TO anon;

COMMENT ON TABLE public.public_activity_log IS 'Anonymized AI Founder activities for public marketing display';
