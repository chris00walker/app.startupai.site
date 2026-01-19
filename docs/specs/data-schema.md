---
purpose: "Private technical source of truth for application data schema"
status: "active"
last_reviewed: "2026-01-18"
---

# Data Schema

## Overview

- **Supabase Postgres** is the canonical store. All DDL lives under `supabase/migrations` and is applied with `supabase db push --include-all`.
- **Drizzle models** in `frontend/src/db/schema/*` mirror the public schema for type-safe queries (13 schema files).
- Local development uses the Supabase CLI (`supabase/config.toml`), targeting Postgres 17. Production is on managed Postgres 15.
- Schema changes follow: update Drizzle → generate migration → review SQL → run locally → land under `supabase/migrations`.

## Layer 1 / Layer 2 Artifacts

StartupAI uses a two-layer artifact model for briefs:

| Layer | Table | Source | Purpose |
|-------|-------|--------|---------|
| **Layer 1** | `entrepreneur_briefs` | Alex chat extraction | Raw brief from onboarding conversation |
| **Layer 2** | `founders_briefs` | S1 agent validation | Validated, enriched, and structured brief |

**Key Insight**: Layer 1 is user-provided data (possibly incomplete/uncertain). Layer 2 is AI-validated data (enriched with research).

---

## Core Tables

### User & Access

#### `user_profiles`
User metadata mirrored from Supabase Auth.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | FK to auth.users |
| `email` | TEXT | User email |
| `user_role` | ENUM | trial, founder, consultant, admin |
| `plan_type` | TEXT | trial, sprint, founder, enterprise |
| `created_at` | TIMESTAMP | Account creation |
| `updated_at` | TIMESTAMP | Last update |

**Drizzle**: `frontend/src/db/schema/users.ts`
**Migrations**: `00001_initial_schema.sql`, `00005_user_roles_and_plans.sql`

#### `trial_usage_counters`
Enforces free-tier limits.

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | UUID | FK to users |
| `action` | TEXT | onboarding, analysis, export |
| `period` | TEXT | monthly |
| `count` | INT | Usage count |
| `period_start` | DATE | Period start date |

**Drizzle**: `frontend/src/db/schema/usage-quota.ts`

---

### Projects & Experimentation

#### `projects`
User's business ideas/startups.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to users |
| `name` | TEXT | Project name |
| `description` | TEXT | Brief description |
| `stage` | TEXT | Current validation stage |
| `gate_status` | TEXT | Gate progression status |
| `onboarding_session_id` | UUID | FK to onboarding_sessions |
| `entrepreneur_brief_id` | UUID | FK to entrepreneur_briefs (Layer 1) |
| `founders_brief_id` | UUID | FK to founders_briefs (Layer 2) |
| `onboarding_quality_score` | DECIMAL | Quality score from onboarding |

**Drizzle**: `frontend/src/db/schema/projects.ts`

#### `hypotheses`
Testable assumptions for validation.

**Drizzle**: `frontend/src/db/schema/hypotheses.ts`

#### `experiments`
Validation experiments linked to hypotheses.

**Drizzle**: `frontend/src/db/schema/experiments.ts`

---

### Onboarding & Briefs

#### `onboarding_sessions`
Tracks onboarding conversation state.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to users |
| `status` | TEXT | active, paused, completed, abandoned |
| `mode` | TEXT | founder, client |
| `current_stage` | INT | Current stage (1-7) |
| `stage_progress` | INT | Progress within stage (0-100) |
| `overall_progress` | INT | Overall progress (0-100) |
| `conversation_history` | JSONB | Full chat history |
| `stage_data` | JSONB | Extracted data per stage |
| `version` | INT | Optimistic locking (ADR-005) |
| `created_at` | TIMESTAMP | Session start |
| `completed_at` | TIMESTAMP | Session completion |

**Realtime**: Enabled (scalar columns only, not JSONB)
**Drizzle**: `frontend/src/db/schema/onboarding-sessions.ts`

#### `entrepreneur_briefs` (Layer 1)
Raw brief extracted from Alex conversation.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to users |
| `session_id` | UUID | FK to onboarding_sessions |
| `company_name` | TEXT | Extracted company name |
| `problem_statement` | TEXT | Problem being solved |
| `target_customer` | TEXT | Target customer description |
| `solution` | TEXT | Proposed solution |
| `market_size` | TEXT | Market size estimate |
| `competition` | TEXT | Competitive landscape |
| `business_model` | TEXT | Revenue model |
| `quality_signals` | JSONB | {clarity, completeness, detail} |
| `uncertain_fields` | TEXT[] | Fields marked uncertain |

**Drizzle**: `frontend/src/db/schema/entrepreneur-briefs.ts`

#### `founders_briefs` (Layer 2)
Validated and enriched brief from S1 agent.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `project_id` | UUID | FK to projects |
| `entrepreneur_brief_id` | UUID | FK to entrepreneur_briefs |
| `company_name` | TEXT | Validated company name |
| `problem_statement` | TEXT | Enriched problem statement |
| `target_customer` | JSONB | Detailed customer profile |
| `market_analysis` | JSONB | Market research findings |
| `competitive_analysis` | JSONB | Competitor research |
| `validation_metadata` | JSONB | AI validation details |
| `dfv_scores` | JSONB | {desirability, feasibility, viability} |
| `created_at` | TIMESTAMP | Brief creation |
| `updated_at` | TIMESTAMP | Last update |

**Realtime**: Enabled (full table)
**Drizzle**: `frontend/src/db/schema/founders-briefs.ts`

---

### Evidence & Insights

#### `evidence`
Validation evidence with embeddings.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `project_id` | UUID | FK to projects |
| `hypothesis_id` | UUID | FK to hypotheses (optional) |
| `type` | TEXT | Evidence category |
| `content` | TEXT | Evidence content |
| `source` | TEXT | Data source |
| `embedding` | VECTOR(1536) | OpenAI embedding |
| `fit_type` | TEXT | D-F-V classification |
| `confidence` | DECIMAL | Confidence score |
| `is_ai_generated` | BOOLEAN | AI vs human sourced |
| `contradiction_flag` | BOOLEAN | Contradicts other evidence |

**Vector Search**: `match_evidence(query_embedding, ...)` function

---

### CrewAI Integration

#### `crewai_validation_states`
Full state persistence for validation runs.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `project_id` | UUID | FK to projects |
| `run_id` | TEXT | Modal run ID |
| `phase` | TEXT | Current phase (phase_0-4) |
| `status` | TEXT | running, paused, completed, failed |
| `state_data` | JSONB | Full serialized state |
| `checkpoint_data` | JSONB | HITL checkpoint info |
| `started_at` | TIMESTAMP | Run start |
| `completed_at` | TIMESTAMP | Run completion |

**Realtime**: Disabled (state_data too large)

#### `validation_progress`
Real-time progress updates from Modal.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `run_id` | TEXT | Modal run ID |
| `phase` | TEXT | Current phase |
| `step` | TEXT | Current step |
| `progress_pct` | INT | Progress percentage |
| `message` | TEXT | Status message |
| `agent` | TEXT | Active AI Founder |
| `created_at` | TIMESTAMP | Update time |

**Realtime**: Enabled (triggers UI updates)

---

### HITL Approvals

#### `approval_requests`
Pending human approvals for HITL checkpoints.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to users (owner) |
| `project_id` | UUID | FK to projects |
| `run_id` | TEXT | Modal run ID |
| `checkpoint_name` | TEXT | Checkpoint identifier |
| `approval_type` | TEXT | evidence_review, strategy_approval, etc. |
| `status` | TEXT | pending, approved, rejected, revised, auto_approved |
| `data` | JSONB | Checkpoint data for review |
| `resume_url` | TEXT | Modal callback URL |
| `low_risk` | BOOLEAN | Auto-approve eligible |
| `decision` | TEXT | User's decision |
| `feedback` | TEXT | User's feedback |
| `created_at` | TIMESTAMP | Checkpoint received |
| `decided_at` | TIMESTAMP | Decision submitted |
| `expires_at` | TIMESTAMP | Review deadline |

#### `approval_history`
Audit trail for approval actions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `approval_id` | UUID | FK to approval_requests |
| `action` | TEXT | created, viewed, decided, auto_approved |
| `actor_id` | UUID | FK to users |
| `metadata` | JSONB | Action details |
| `created_at` | TIMESTAMP | Action time |

---

### Consultant System

#### `consultant_profiles`
Extended profile for consultant users.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to users |
| `company_name` | TEXT | Consulting firm name |
| `specializations` | TEXT[] | Areas of expertise |
| `industries` | TEXT[] | Target industries |
| `practice_analysis` | JSONB | AI analysis of practice |
| `onboarding_session_id` | UUID | FK to onboarding_sessions |

#### `consultant_clients`
Consultant-client relationships.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `consultant_id` | UUID | FK to users |
| `client_id` | UUID | FK to users (nullable until signup) |
| `email` | TEXT | Client's email |
| `name` | TEXT | Client's name (optional) |
| `invite_token` | UUID | Unique signup token |
| `status` | TEXT | invited, active, archived |
| `created_at` | TIMESTAMP | Invite creation |
| `expires_at` | TIMESTAMP | Token expiry (30 days) |
| `accepted_at` | TIMESTAMP | When client signed up |
| `archived_at` | TIMESTAMP | When archived |

---

## Supabase Realtime Configuration

### Enabled Tables

| Table | Columns | Use Case |
|-------|---------|----------|
| `onboarding_sessions` | Scalar only (not JSONB) | Progress bar updates |
| `founders_briefs` | Full table | Brief completion notification |
| `validation_progress` | Full table | Live progress during validation |
| `approval_requests` | Full table | New approval notifications |

### Disabled Tables

| Table | Reason |
|-------|--------|
| `crewai_validation_states` | state_data JSONB too large |
| `conversation_history` | Part of onboarding_sessions JSONB |
| `evidence` | Batch updates, no real-time need |

### Frontend Subscription Pattern

```typescript
// Subscribe to validation progress
const channel = supabase
  .channel('validation-progress')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'validation_progress',
    filter: `run_id=eq.${runId}`
  }, (payload) => {
    setProgress(payload.new.progress_pct);
  })
  .subscribe();
```

---

## Row Level Security

All tables enforce `auth.uid()` checks:

| Table | Policy |
|-------|--------|
| `user_profiles` | Own profile only |
| `projects` | Own projects only |
| `onboarding_sessions` | Own sessions only |
| `entrepreneur_briefs` | Own briefs only |
| `founders_briefs` | Via project ownership |
| `evidence` | Via project ownership |
| `approval_requests` | Own approvals only |
| `consultant_clients` | Own clients only (consultant role) |
| `validation_progress` | Via project ownership |

Service access uses stored procedures and the Supabase service key.

---

## Migration Files

| Migration | Purpose |
|-----------|---------|
| `00001_initial_schema.sql` | Core tables |
| `00004_validation_tables.sql` | Evidence, hypotheses, experiments |
| `00005_user_roles_and_plans.sql` | User roles enum, plans |
| `00007_trial_usage_counters.sql` | Usage quotas |
| `00009_onboarding_schema.sql` | Onboarding, entrepreneur_briefs |
| `00010_user_profile_trigger.sql` | Auth sync trigger |
| `00011_founders_briefs.sql` | Layer 2 briefs |
| `00012_crewai_tables.sql` | CrewAI state, progress |
| `00013_approval_tables.sql` | HITL approvals |
| `00014_consultant_tables.sql` | Consultant profiles, clients |

---

## Related Documentation

- **API Specs**: [api-onboarding.md](api-onboarding.md), [api-crewai.md](api-crewai.md)
- **Architecture**: [overview/architecture.md](../overview/architecture.md)
- **Supabase Config**: [supabase.md](supabase.md)
