---
purpose: "Private technical source of truth for application data schema"
status: "active"
last_reviewed: "2025-10-25"
---

# Data Schema

## Overview

- Supabase Postgres is the canonical store. All DDL lives under `supabase/migrations` and is applied with `supabase db push --include-all` so remote history stays in sync.
- Drizzle models in `frontend/src/db/schema/*` mirror the public schema for type-safe queries. Whenever we add or rename columns we need to update both Drizzle and SQL migrations so shared tooling (Netlify functions, Playwright fixtures) compile.
- Local development uses the Supabase CLI (`supabase/config.toml`), which targets Postgres 17. Production is still on the managed Postgres 15 image; keep migrations portable (no version-specific syntax).
- Schema changes follow the flow: update Drizzle, generate a migration (`pnpm drizzle-kit generate`), review SQL, run locally, and land the SQL file under `supabase/migrations`. Stored procedures are hand-written to keep comments and permission blocks readable.

## Core Tables

### User & Access

- `user_profiles` (`supabase/migrations/00001_initial_schema.sql` plus `00005_user_roles_and_plans.sql`): email, plan metadata, `user_role` enum, and timestamps. Trigger `handle_new_user` (`00010_user_profile_trigger.sql`) mirrors auth metadata into this table on signup. Drizzle mapping lives in `frontend/src/db/schema/users.ts`.
- `trial_usage_counters` (`00007_trial_usage_counters.sql` and `frontend/src/db/schema/usage-quota.ts`): enforces free-tier limits via `(user_id, action, period, period_start)` unique index. The Next.js onboarding API uses this to decide whether a session should start.

### Projects & Experimentation

- `projects` mixes portfolio data (stage, gate status, risk budget) with onboarding metadata. Columns were expanded in `00004_validation_tables.sql` and enriched again in `00009_onboarding_schema.sql` to link back to onboarding sessions (`onboarding_session_id`, `entrepreneur_brief_id`, `onboarding_quality_score`). Drizzle model: `frontend/src/db/schema/projects.ts`.
- `hypotheses` and `experiments` capture validation work. SQL migrations add RLS and timestamp triggers (`00004_validation_tables.sql`), and Drizzle equivalents live in `frontend/src/db/schema/hypotheses.ts` (legacy) and `experiments.ts`.
- `reports` supports AI-generated deliverables. Today it stores the stubbed output from onboarding completion; once CrewAI deposits artifacts we will backfill links from Netlify workflows.

### Evidence & Insights

- `evidence` was expanded in `00004_validation_tables.sql` to include categories, embeddings, contradiction flags, and fit types. The match function (`20251004082434_vector_search_function.sql`) exposes pgvector similarity search via `match_evidence(query_embedding, ...)`. Drizzle column definitions reference a 1536-dimension vector (`frontend/src/db/schema/evidence.ts`).
- Supporting functions: `EvidenceStoreTool` in the Python backend writes to `evidence` using the service role and attaches accessibility metadata so downstream dashboards know when content is AI generated.

### Onboarding & Briefs

- `onboarding_sessions` and `entrepreneur_briefs` were introduced in `00009_onboarding_schema.sql`. They store JSON conversation history, per-stage data, completeness scores, and AI guidance fields. `frontend/src/app/api/onboarding/*` reads and writes these tables directly.
- Helper functions such as `create_onboarding_session`, `upsert_entrepreneur_brief`, and `create_project_from_onboarding` encapsulate common workflows. They are granted to both `authenticated` and `service_role` roles so we can drive them from API routes or future CrewAI workers.
- Drizzle does not yet expose these tables; queries currently go through Supabase JS clients. Tracking issue: add `onboardingSessions` and `entrepreneurBriefs` models so we can move business logic into shared repositories.

### Upcoming CrewAI Tables

- We have placeholders in `docs/work/roadmap.md` for `crew_analysis_runs` and evidence audit logs. The Python workflow currently returns raw structures; when we wire the Netlify function we will introduce dedicated tables so the web app can consume structured outputs instead of parsing markdown.

## Row Level Security

- `user_profiles`, `projects`, `evidence`, `hypotheses`, `experiments`, `onboarding_sessions`, `entrepreneur_briefs`, and `trial_usage_counters` all enforce `auth.uid()` checks introduced across `00001`, `00004`, `00007`, and `00009` migrations.
- Service access is handled through explicit stored procedures (see onboarding functions above) and the Supabase service key. The backend falls back to user-scoped clients when the service key is unavailable to keep local development productive.
- Authenticated users can only manage resources tied to their projects. Policies join through `projects.user_id` to keep authorisation logic centralised.

## Migration Notes

- `00005_user_roles_and_plans.sql` defines the `user_role` enum and shared `set_updated_at_timestamp()` trigger. Reuse it for any new tables that require timestamps to stay accurate.
- `00007_trial_usage_counters.sql` introduced quotas; remember to seed new actions whenever we add features that should respect plan limits.
- `00009_onboarding_schema.sql` is the largest change set: onboarding tables, helper functions, and new columns on `projects`. Read through it before extending the onboarding journey so you reuse the existing functions instead of duplicating logic in the app layer.
- `00010_user_profile_trigger.sql` (duplicated as `20251024130830_user_profile_trigger.sql`) keeps profiles in sync. When updating triggers, modify both copies or delete the redundant migration after validating production state.
- Always run `supabase db pull` after applying migrations in production so local migrations stay linear. The migration folder contains verified history through October 2025; keep adding numbered files to maintain deterministic ordering.

Refer to the archived timeline in `docs/archive/legacy/database-schema-updates.md` when researching historical decisions.
