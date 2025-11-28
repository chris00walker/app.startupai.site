-- Migration: Add Strategyzer Test Card fields
-- Description: Extends experiments table with Strategyzer methodology fields and creates learning_cards table

-- Add Strategyzer Test Card fields to experiments table
ALTER TABLE experiments ADD COLUMN IF NOT EXISTS hypothesis TEXT;
ALTER TABLE experiments ADD COLUMN IF NOT EXISTS test_method TEXT;
ALTER TABLE experiments ADD COLUMN IF NOT EXISTS metric TEXT;
ALTER TABLE experiments ADD COLUMN IF NOT EXISTS success_criteria TEXT;
ALTER TABLE experiments ADD COLUMN IF NOT EXISTS expected_outcome TEXT;
ALTER TABLE experiments ADD COLUMN IF NOT EXISTS cost_time TEXT;
ALTER TABLE experiments ADD COLUMN IF NOT EXISTS cost_money NUMERIC(10, 2);
ALTER TABLE experiments ADD COLUMN IF NOT EXISTS actual_outcome TEXT;
ALTER TABLE experiments ADD COLUMN IF NOT EXISTS actual_metric_value TEXT;
ALTER TABLE experiments ADD COLUMN IF NOT EXISTS learning_card_id UUID;
ALTER TABLE experiments ADD COLUMN IF NOT EXISTS owner TEXT;

-- Create learning_cards table
CREATE TABLE IF NOT EXISTS learning_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  experiment_id UUID REFERENCES experiments(id) ON DELETE SET NULL,
  observations TEXT,
  insights TEXT,
  decision TEXT,
  owner TEXT,
  decision_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add foreign key constraint for learning_card_id on experiments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'experiments_learning_card_id_fkey'
  ) THEN
    ALTER TABLE experiments ADD CONSTRAINT experiments_learning_card_id_fkey
      FOREIGN KEY (learning_card_id) REFERENCES learning_cards(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_learning_cards_project_id ON learning_cards(project_id);
CREATE INDEX IF NOT EXISTS idx_learning_cards_experiment_id ON learning_cards(experiment_id);
CREATE INDEX IF NOT EXISTS idx_experiments_test_method ON experiments(test_method);
CREATE INDEX IF NOT EXISTS idx_experiments_expected_outcome ON experiments(expected_outcome);

-- Enable Row Level Security on learning_cards
ALTER TABLE learning_cards ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for learning_cards (users can only access their own project's learning cards)
DO $$
BEGIN
  -- Select policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own project learning cards' AND tablename = 'learning_cards'
  ) THEN
    CREATE POLICY "Users can view their own project learning cards"
      ON learning_cards FOR SELECT
      USING (
        project_id IN (
          SELECT id FROM projects WHERE user_id = auth.uid()
        )
      );
  END IF;

  -- Insert policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own project learning cards' AND tablename = 'learning_cards'
  ) THEN
    CREATE POLICY "Users can insert their own project learning cards"
      ON learning_cards FOR INSERT
      WITH CHECK (
        project_id IN (
          SELECT id FROM projects WHERE user_id = auth.uid()
        )
      );
  END IF;

  -- Update policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own project learning cards' AND tablename = 'learning_cards'
  ) THEN
    CREATE POLICY "Users can update their own project learning cards"
      ON learning_cards FOR UPDATE
      USING (
        project_id IN (
          SELECT id FROM projects WHERE user_id = auth.uid()
        )
      );
  END IF;

  -- Delete policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own project learning cards' AND tablename = 'learning_cards'
  ) THEN
    CREATE POLICY "Users can delete their own project learning cards"
      ON learning_cards FOR DELETE
      USING (
        project_id IN (
          SELECT id FROM projects WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;
