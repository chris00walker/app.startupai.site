-- Ensure upserts on crewai_validation_states(project_id) have a unique target
CREATE UNIQUE INDEX IF NOT EXISTS crewai_validation_states_project_id_unique
  ON crewai_validation_states(project_id);
