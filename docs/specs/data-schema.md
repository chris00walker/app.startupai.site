---
purpose: "Private technical source of truth for application data schema"
status: "active"
last_reviewed: "2026-01-19"
---

# Data Schema

## Overview

- **Supabase Postgres** is the canonical store
- **Drizzle ORM schemas** in `frontend/src/db/schema/*.ts` provide type-safe queries (12 schema files)
- **Some tables exist only in Supabase** and are accessed via raw Supabase client queries (onboarding_sessions, entrepreneur_briefs, etc.)
- Schema changes: update Drizzle → `pnpm db:generate` → review SQL → `pnpm db:push`

### Schema Organization

| Category | Drizzle Schema | Supabase Only |
|----------|----------------|---------------|
| **Users** | `user_profiles`, `trial_usage_counters` | - |
| **Projects** | `projects`, `hypotheses`, `experiments`, `evidence`, `reports` | - |
| **Onboarding** | - | `onboarding_sessions`, `entrepreneur_briefs` |
| **Validation** | `crewai_validation_states`, `business_model_canvas`, `value_proposition_canvas` | `founders_briefs`, `validation_runs`, `validation_progress` |
| **HITL** | - | `approval_requests`, `approval_history`, `approval_preferences` |
| **Consultant** | `consultant_clients` | `consultant_profiles` |
| **Public** | `public_activity_log` | - |

## Layer 1 / Layer 2 Artifacts

StartupAI uses a two-layer artifact model for briefs:

| Layer | Table | Source | Purpose |
|-------|-------|--------|---------|
| **Layer 1** | `entrepreneur_briefs` | Alex chat extraction | Raw brief from onboarding conversation |
| **Layer 2** | `founders_briefs` | S1 agent validation | Validated, enriched, and structured brief |

**Key Insight**: Layer 1 is user-provided data (possibly incomplete/uncertain). Layer 2 is AI-validated data (enriched with research).

---

## Core Tables (Drizzle ORM)

### User & Access

#### `user_profiles`
User metadata mirrored from Supabase Auth.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | PK, FK to auth.users |
| `email` | TEXT | User email (required) |
| `full_name` | TEXT | Display name |
| `company` | TEXT | Company name |
| `consultant_id` | UUID | FK to user_profiles (assigned consultant) |
| `subscription_tier` | TEXT | free (default) |
| `subscription_status` | TEXT | trial (default) |
| `trial_expires_at` | TIMESTAMP | Trial expiry |
| `plan_status` | TEXT | active (default) |
| `role` | ENUM | trial, founder, consultant, admin ([canonical source](../user-experience/user-personas.md)) |
| `created_at` | TIMESTAMP | Account creation |
| `updated_at` | TIMESTAMP | Last update |

**Drizzle**: `frontend/src/db/schema/users.ts`

#### `trial_usage_counters`
Enforces free-tier limits.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | PK |
| `user_id` | UUID | FK to user_profiles |
| `action` | TEXT | onboarding, analysis, export |
| `period` | TEXT | monthly |
| `period_start` | TIMESTAMP | Period start time |
| `count` | INT | Usage count |
| `created_at` | TIMESTAMP | Created |
| `updated_at` | TIMESTAMP | Updated |

**Drizzle**: `frontend/src/db/schema/usage-quota.ts`

---

### Projects & Experimentation

#### `projects`
User's business ideas/startups.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | PK |
| `user_id` | UUID | FK to user_profiles (cascade delete) |
| `name` | TEXT | Project name (required) |
| `description` | TEXT | Brief description |
| `status` | TEXT | active, archived, completed (default: active) |
| `stage` | TEXT | DESIRABILITY, FEASIBILITY, VIABILITY, SCALE |
| `gate_status` | TEXT | Pending, Passed, Failed |
| `risk_budget_planned` | NUMERIC | Planned risk budget |
| `risk_budget_actual` | NUMERIC | Actual spend |
| `risk_budget_delta` | NUMERIC | Budget variance |
| `assigned_consultant` | TEXT | Consultant name |
| `last_activity` | TIMESTAMP | Last activity time |
| `next_gate_date` | DATE | Upcoming gate date |
| `evidence_quality` | NUMERIC | Quality score (0-1) |
| `hypotheses_count` | INT | Cached hypothesis count |
| `experiments_count` | INT | Cached experiment count |
| `evidence_count` | INT | Cached evidence count |
| `created_at` | TIMESTAMP | Created |
| `updated_at` | TIMESTAMP | Updated |

**Drizzle**: `frontend/src/db/schema/projects.ts`

#### `hypotheses`
Testable assumptions for validation.

**Drizzle**: `frontend/src/db/schema/hypotheses.ts`

#### `experiments`
Validation experiments linked to hypotheses.

**Drizzle**: `frontend/src/db/schema/experiments.ts`

#### `reports`
AI-generated reports and insights.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | PK |
| `project_id` | UUID | FK to projects (cascade delete) |
| `report_type` | TEXT | strategy, validation, market_analysis, competitor |
| `title` | TEXT | Report title (required) |
| `content` | JSONB | Report content (required) |
| `model` | TEXT | AI model used (gpt-4, claude-3) |
| `tokens_used` | TEXT | Token count |
| `generated_at` | TIMESTAMP | Generation time |
| `updated_at` | TIMESTAMP | Updated |

**Drizzle**: `frontend/src/db/schema/reports.ts`

---

---

## Supabase-Only Tables

These tables exist in Supabase but don't have Drizzle schema files. They're accessed via raw Supabase client queries.

### Onboarding & Briefs

#### `onboarding_sessions`
Tracks onboarding conversation state.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | PK |
| `session_id` | TEXT | Session identifier |
| `user_id` | UUID | FK to auth.users |
| `status` | TEXT | active, paused, completed, abandoned |
| `current_stage` | INT | Current stage (1-7) |
| `stage_progress` | INT | Progress within stage (0-100) |
| `overall_progress` | INT | Overall progress (0-100) |
| `conversation_history` | JSONB | Full chat history |
| `stage_data` | JSONB | Extracted data per stage |
| `last_activity` | TIMESTAMP | Last activity time |
| `completed_at` | TIMESTAMP | Session completion |

**Realtime**: Enabled (scalar columns only, excludes JSONB)
**Access**: Via Supabase client queries (no Drizzle schema)

#### `entrepreneur_briefs` (Layer 1)
Raw brief extracted from Alex conversation.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | PK |
| `user_id` | UUID | FK to auth.users |
| `session_id` | TEXT | FK to onboarding_sessions |
| `company_name` | TEXT | Extracted company name |
| `problem_statement` | TEXT | Problem being solved |
| `target_customer` | TEXT | Target customer description |
| `solution` | TEXT | Proposed solution |
| `market_size` | TEXT | Market size estimate |
| `competition` | TEXT | Competitive landscape |
| `business_model` | TEXT | Revenue model |
| `quality_signals` | JSONB | {clarity, completeness, detail} |

**Access**: Via Supabase client queries (no Drizzle schema)

#### `founders_briefs` (Layer 2)
Validated and enriched brief from CrewAI S1 agent.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | PK |
| `project_id` | UUID | FK to projects |
| `run_id` | TEXT | CrewAI run ID |
| `entrepreneur_brief_id` | UUID | FK to entrepreneur_briefs |
| `content` | JSONB | Full validated brief content |
| `created_at` | TIMESTAMP | Brief creation |
| `updated_at` | TIMESTAMP | Last update |

**Realtime**: Enabled
**Access**: Via Supabase client queries (no Drizzle schema)

---

---

## Core Tables (Drizzle ORM) - continued

### Evidence & Insights

#### `evidence`
Validation evidence with embeddings.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | PK |
| `project_id` | UUID | FK to projects (cascade delete) |
| `title` | TEXT | Evidence title |
| `category` | TEXT | Survey, Interview, Experiment, Analytics, Research |
| `summary` | TEXT | Brief summary |
| `full_text` | TEXT | Full evidence text |
| `content` | TEXT | Evidence content (required) |
| `embedding` | VECTOR(1536) | OpenAI ada-002 embedding |
| `strength` | TEXT | weak, medium, strong |
| `is_contradiction` | BOOLEAN | Contradicts other evidence |
| `fit_type` | TEXT | Desirability, Feasibility, Viability |
| `source_type` | TEXT | user_input, web_scrape, document, api |
| `source_url` | TEXT | Source URL |
| `author` | TEXT | Author name |
| `source` | TEXT | Source name |
| `occurred_on` | DATE | When evidence occurred |
| `linked_assumptions` | TEXT[] | Linked assumption IDs |
| `tags` | TEXT[] | Tags for filtering |
| `created_at` | TIMESTAMP | Created |
| `updated_at` | TIMESTAMP | Updated |

**Drizzle**: `frontend/src/db/schema/evidence.ts`
**Vector Search**: `match_evidence(query_embedding, ...)` function

---

### CrewAI Integration

#### `crewai_validation_states`
Full state persistence for validation runs. ~90 columns covering all CrewAI outputs.

| Column Group | Key Columns | Description |
|--------------|-------------|-------------|
| **Identity** | `id`, `project_id`, `user_id`, `session_id`, `kickoff_id` | Run identification |
| **Phase Tracking** | `phase`, `current_risk_axis`, `iteration` | Validation phase state |
| **Problem Fit** | `problem_fit`, `current_segment`, `current_value_prop` | P/S fit signals |
| **D-F-V Signals** | `desirability_signal`, `feasibility_signal`, `viability_signal` | Innovation Physics |
| **Pivot Tracking** | `last_pivot_type`, `pending_pivot_type`, `pivot_recommendation` | Pivot decisions |
| **HITL Status** | `human_approval_status`, `human_comment`, `human_input_required` | Human checkpoints |
| **Evidence** | `desirability_evidence`, `feasibility_evidence`, `viability_evidence` | JSONB evidence containers |
| **VPC Data** | `customer_profiles`, `value_maps`, `competitor_report` | JSONB segment data |
| **Crew Outputs** | `ad_impressions`, `cac`, `ltv`, `total_monthly_cost`, etc. | Numeric crew results |
| **QA** | `qa_reports`, `current_qa_status`, `framework_compliance` | Quality assurance |

**Drizzle**: `frontend/src/db/schema/crewai-validation-states.ts`
**Realtime**: Disabled (too many columns, large JSONB)

#### `validation_runs` (Supabase-only)
Lightweight run status tracking for progress polling.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | PK |
| `run_id` | TEXT | Modal run ID |
| `project_id` | UUID | FK to projects |
| `status` | TEXT | pending, running, paused, completed, failed |
| `current_phase` | INT | Current phase number |
| `phase_name` | TEXT | Phase display name |
| `progress` | INT | Overall progress percentage |
| `hitl_checkpoint` | JSONB | Active checkpoint data |
| `error` | TEXT | Error message if failed |
| `created_at` | TIMESTAMP | Run start |
| `updated_at` | TIMESTAMP | Last update |

**Realtime**: Enabled

#### `validation_progress` (Supabase-only)
Append-only progress updates from Modal webhooks.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | PK |
| `run_id` | TEXT | Modal run ID |
| `project_id` | UUID | FK to projects |
| `status` | TEXT | running, paused, completed |
| `current_phase` | INT | Phase number |
| `phase_name` | TEXT | Phase display name |
| `crew` | TEXT | Active crew name |
| `task` | TEXT | Current task |
| `agent` | TEXT | Active AI Founder |
| `progress_pct` | INT | Progress percentage |
| `error` | TEXT | Error message |
| `created_at` | TIMESTAMP | Update time |

**Realtime**: Enabled (triggers UI updates)

---

### HITL Approvals (Supabase-only)

#### `approval_requests`
Pending human approvals for HITL checkpoints.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | PK |
| `execution_id` | TEXT | CrewAI run ID |
| `task_id` | TEXT | Task/checkpoint identifier |
| `user_id` | UUID | FK to auth.users (owner) |
| `project_id` | UUID | FK to projects |
| `approval_type` | TEXT | segment_pivot, spend_increase, etc. |
| `owner_role` | TEXT | C-suite agent name (compass, ledger, etc.) |
| `title` | TEXT | Display title |
| `description` | TEXT | Full description |
| `task_output` | JSONB | Structured analysis output |
| `evidence_summary` | JSONB | D-F-V signals |
| `options` | JSONB | Array of decision options |
| `auto_approvable` | BOOLEAN | Can be auto-approved |
| `auto_approve_reason` | TEXT | Why auto-approved |
| `status` | TEXT | pending, approved, rejected |
| `decision` | TEXT | Chosen option ID |
| `human_feedback` | TEXT | User's reasoning |
| `decided_by` | UUID | FK to user who decided |
| `decided_at` | TIMESTAMP | Decision submitted |
| `created_at` | TIMESTAMP | Checkpoint received |
| `updated_at` | TIMESTAMP | Last update |

**Realtime**: Enabled

#### `approval_history`
Audit trail for approval actions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | PK |
| `approval_request_id` | UUID | FK to approval_requests |
| `action` | TEXT | created, viewed, approved, rejected, auto_approved |
| `actor_id` | UUID | FK to auth.users (null for system) |
| `actor_type` | TEXT | user or system |
| `details` | JSONB | Action metadata |
| `created_at` | TIMESTAMP | Action time |

#### `approval_preferences`
User preferences for auto-approval behavior.

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | UUID | PK, FK to auth.users |
| `auto_approve_types` | TEXT[] | Types to auto-approve |
| `max_auto_approve_spend` | NUMERIC | Spend threshold |
| `auto_approve_low_risk` | BOOLEAN | Auto-approve low-risk |
| `notify_email` | BOOLEAN | Email notifications |
| `notify_sms` | BOOLEAN | SMS notifications |
| `escalation_email` | TEXT | Escalation contact |
| `created_at` | TIMESTAMP | Created |
| `updated_at` | TIMESTAMP | Updated |

---

### Consultant System

#### `consultant_profiles` (Supabase-only)
Extended profile for consultant users.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | PK, same as user_id |
| `company_name` | TEXT | Consulting firm name |
| `practice_size` | TEXT | Team size range |
| `current_clients` | INT | Number of active clients |
| `industries` | TEXT[] | Target industries |
| `services` | TEXT[] | Service offerings |
| `tools_used` | TEXT[] | Current tools |
| `pain_points` | TEXT | Current challenges |
| `white_label_enabled` | BOOLEAN | White-label interest |
| `ai_practice_analysis` | JSONB | CrewAI analysis |
| `ai_recommendations` | JSONB | AI recommendations |
| `ai_onboarding_tips` | JSONB | Onboarding suggestions |
| `ai_suggested_templates` | JSONB | Template suggestions |
| `ai_suggested_workflows` | JSONB | Workflow suggestions |
| `ai_white_label_suggestions` | JSONB | Branding suggestions |
| `ai_analysis_completed` | BOOLEAN | Analysis done |
| `ai_analysis_completed_at` | TIMESTAMP | Analysis completion time |
| `onboarding_completed` | BOOLEAN | Onboarding complete |

#### `consultant_clients`
Consultant-client relationships and invites.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | PK |
| `consultant_id` | UUID | FK to user_profiles (cascade delete) |
| `client_id` | UUID | FK to user_profiles (set null on delete) |
| `invite_email` | TEXT | Client's email (required) |
| `invite_token` | TEXT | Unique signup token (required) |
| `invite_expires_at` | TIMESTAMP | Token expiry (30 days) |
| `client_name` | TEXT | Optional personalization name |
| `status` | TEXT | invited, active, archived |
| `invited_at` | TIMESTAMP | Invite creation |
| `linked_at` | TIMESTAMP | When client signed up |
| `archived_at` | TIMESTAMP | When archived |
| `archived_by` | TEXT | consultant, client, or system |
| `created_at` | TIMESTAMP | Created |
| `updated_at` | TIMESTAMP | Updated |

**Drizzle**: `frontend/src/db/schema/consultant-clients.ts`
**Indexes**: consultant_id, client_id, invite_token, status, invite_email, (consultant_id, status)

### Strategyzer Canvas Tables

#### `business_model_canvas`
Editable Business Model Canvas data (9 building blocks).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | PK |
| `project_id` | UUID | FK to projects (cascade delete) |
| `user_id` | UUID | FK to user_profiles (cascade delete) |
| `source` | TEXT | crewai, manual, hybrid |
| `kickoff_id` | TEXT | CrewAI run that generated data |
| `customer_segments` | JSONB | BMCItem[] |
| `value_propositions` | JSONB | BMCItem[] |
| `channels` | JSONB | BMCItem[] |
| `customer_relationships` | JSONB | BMCItem[] |
| `revenue_streams` | JSONB | BMCItem[] |
| `key_resources` | JSONB | BMCItem[] |
| `key_activities` | JSONB | BMCItem[] |
| `key_partners` | JSONB | BMCItem[] |
| `cost_structure` | JSONB | BMCItem[] |
| `original_crewai_data` | JSONB | Original AI data for reset |
| `created_at` | TIMESTAMP | Created |
| `updated_at` | TIMESTAMP | Updated |

**Drizzle**: `frontend/src/db/schema/business-model-canvas.ts`

#### `value_proposition_canvas`
Editable VPC data (per customer segment).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | PK |
| `project_id` | UUID | FK to projects (cascade delete) |
| `user_id` | UUID | FK to user_profiles (cascade delete) |
| `segment_key` | TEXT | Segment identifier (required) |
| `segment_name` | TEXT | Display name (required) |
| `source` | TEXT | crewai, manual, hybrid |
| `kickoff_id` | TEXT | CrewAI run that generated data |
| `jobs` | JSONB | VPCJobItem[] (functional, emotional, social) |
| `pains` | JSONB | VPCPainItem[] (with intensity) |
| `gains` | JSONB | VPCGainItem[] (with importance) |
| `resonance_score` | NUMERIC | Testing resonance (0-1) |
| `products_and_services` | JSONB | VPCItem[] |
| `pain_relievers` | JSONB | VPCPainRelieverItem[] |
| `gain_creators` | JSONB | VPCGainCreatorItem[] |
| `differentiators` | JSONB | VPCItem[] |
| `original_crewai_data` | JSONB | Original AI data for reset |
| `created_at` | TIMESTAMP | Created |
| `updated_at` | TIMESTAMP | Updated |

**Drizzle**: `frontend/src/db/schema/value-proposition-canvas.ts`

### Public Activity Log

#### `public_activity_log`
Anonymized agent activities for public marketing display.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | PK |
| `founder_id` | TEXT | sage, forge, pulse, compass, guardian, ledger |
| `activity_type` | TEXT | analysis, build, validation, research, review |
| `description` | TEXT | Anonymized activity description |
| `project_id` | UUID | Internal tracking (not exposed publicly) |
| `kickoff_id` | TEXT | Internal tracking |
| `created_at` | TIMESTAMP | Activity time |

**Drizzle**: `frontend/src/db/schema/public-activity-log.ts`
**RLS**: Disabled (data is public by design)
**Indexes**: founder_id, activity_type, created_at, kickoff_id

---

## Supabase Realtime Configuration

### Enabled Tables

| Table | Columns | Use Case |
|-------|---------|----------|
| `onboarding_sessions` | Scalar only (id, session_id, user_id, status, current_stage, stage_progress, overall_progress, last_activity, completed_at) | Progress bar updates |
| `founders_briefs` | Full table | Brief completion notification |
| `validation_runs` | Full table | Run status updates |
| `validation_progress` | Full table | Live progress during validation |
| `approval_requests` | Full table | New approval notifications |

### Disabled Tables

| Table | Reason |
|-------|--------|
| `crewai_validation_states` | ~90 columns, large JSONB |
| `onboarding_sessions` (JSONB) | conversation_history, stage_data excluded |
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

All user-owned tables enforce `auth.uid()` checks:

| Table | Policy |
|-------|--------|
| `user_profiles` | Own profile only |
| `projects` | Own projects OR consultant's clients |
| `onboarding_sessions` | Own sessions only |
| `entrepreneur_briefs` | Own briefs only |
| `founders_briefs` | Via project ownership |
| `evidence` | Via project ownership |
| `approval_requests` | Own approvals OR consultant access |
| `consultant_clients` | Consultant sees own clients, client sees own relationship |
| `validation_progress` | Via project ownership |
| `public_activity_log` | **No RLS** (public by design) |

Service access uses stored procedures and the Supabase service key.

---

## Drizzle Migration Files

Located in `frontend/src/db/migrations/`:

| Migration | Purpose |
|-----------|---------|
| `0000_steady_namorita.sql` | Initial schema (projects, evidence, reports, hypotheses, experiments) |
| `0001_user_roles_and_plans.sql` | User roles enum, user_profiles |
| `0002_trial_usage_counters.sql` | Usage quota tracking |
| `0003_create_clients_table.sql` | consultant_clients table |
| `0004_add_consultant_id_to_user_profiles.sql` | Consultant FK on user_profiles |
| `0005_add_rls_policies_for_consultants.sql` | RLS policies for consultant access |
| `0006_add_strategyzer_fields.sql` | Additional evidence fields |
| `0007_crewai_validation_states_and_bmc.sql` | CrewAI state, BMC, VPC tables |
| `0008_projects_rls_for_consultants.sql` | Projects RLS for consultant access |
| `0009_archived_clients_table.sql` | Archive fields for consultant_clients |
| `0010_enable_onboarding_realtime.sql` | Realtime for onboarding_sessions |

> **Note**: Some tables (onboarding_sessions, entrepreneur_briefs, founders_briefs, approval_requests, etc.) exist in Supabase but don't have Drizzle migrations. They were created via Supabase dashboard or direct SQL.

---

## Related Documentation

- **API Specs**: [api-onboarding.md](api-onboarding.md), [api-crewai.md](api-crewai.md), [api-approvals.md](api-approvals.md)
- **Consultant System**: [consultant-client-system.md](../features/consultant-client-system.md)
- **Authentication**: [auth.md](auth.md)
- **User Personas**: [user-personas.md](../user-experience/user-personas.md)
