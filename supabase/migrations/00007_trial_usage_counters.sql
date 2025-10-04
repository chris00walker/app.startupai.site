-- Trial usage counters table for enforcing free-tier limits
-- Tracks per-user action usage across configured periods.

CREATE TABLE IF NOT EXISTS public.trial_usage_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  action text NOT NULL,
  period text NOT NULL,
  period_start timestamptz NOT NULL,
  count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS trial_usage_user_action_period_idx
  ON public.trial_usage_counters (user_id, action, period, period_start);

-- Maintain updated_at on change (re-uses general timestamp trigger helper).
DROP TRIGGER IF EXISTS set_trial_usage_counters_updated_at ON public.trial_usage_counters;
CREATE TRIGGER set_trial_usage_counters_updated_at
BEFORE UPDATE ON public.trial_usage_counters
FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

ALTER TABLE public.trial_usage_counters ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'trial_usage_counters'
      AND policyname = 'Users manage own trial counters'
  ) THEN
    CREATE POLICY "Users manage own trial counters"
    ON public.trial_usage_counters
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;
