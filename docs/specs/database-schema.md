---
purpose: "Database schema documentation for StartupAI product platform"
status: "active"
last_reviewed: "2025-11-21"
---

# Database Schema

## Overview

StartupAI uses Supabase PostgreSQL with Row Level Security (RLS) on all tables.

**Project**: `eqxropalhxjeyvfcoyxg` (East US - North Virginia)
**Extensions**: uuid-ossp v1.1, pgvector v0.8.0, pg_net v0.19.5, hstore v1.8

## Core Tables

### user_profiles

```sql
create table public.user_profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  role text not null default 'trial' check (role in ('admin', 'consultant', 'founder', 'trial')),
  subscription_tier text check (subscription_tier in ('free', 'trial', 'sprint', 'founder', 'pro', 'enterprise')),
  plan_status text check (plan_status in ('active', 'trialing', 'paused', 'canceled')),
  subscription_status text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

**RLS**: Users can only access their own profile

### projects

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid, PK | Project identifier |
| `user_id` | uuid, FK → user_profiles | Owner |
| `name` | text | Project name |
| `description` | text | Project description |
| `stage` | enum | idea, validation, scaling |
| `portfolio_metrics` | jsonb | Metrics data |
| `created_at`, `updated_at` | timestamp | Timestamps |

**RLS**: Users can only access their own projects

### evidence

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid, PK | Evidence identifier |
| `project_id` | uuid, FK → projects | Parent project |
| `title` | text | Evidence title |
| `summary` | text | Brief summary |
| `full_text` | text | Full content |
| `fit_type` | enum | Desirability, Feasibility, Viability |
| `strength` | enum | strong, medium, weak |
| `embedding` | vector(1536) | OpenAI embedding for semantic search |

**RLS**: Access via project ownership

### reports

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid, PK | Report identifier |
| `project_id` | uuid, FK → projects | Parent project |
| `report_type` | text | Type of report |
| `content` | jsonb | Report content |
| `generated_at` | timestamp | Generation time |

**RLS**: Access via project ownership

### onboarding_sessions

```sql
create table public.onboarding_sessions (
  id uuid primary key default gen_random_uuid(),
  session_id text unique not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_type text not null check (plan_type in ('trial', 'sprint', 'founder', 'enterprise')),
  user_context jsonb default '{}',
  status text not null default 'active'
    check (status in ('active', 'paused', 'completed', 'abandoned', 'expired', 'error')),
  current_stage integer not null default 1 check (current_stage between 1 and 7),
  stage_progress integer not null default 0,
  overall_progress integer not null default 0,
  conversation_history jsonb not null default '[]',
  stage_data jsonb not null default '{}',
  ai_context jsonb default '{}',
  started_at timestamp with time zone not null default now(),
  last_activity timestamp with time zone not null default now(),
  completed_at timestamp with time zone,
  expires_at timestamp with time zone not null default (now() + interval '24 hours'),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

**RLS**: Users can access their own onboarding sessions

### trial_usage_counters

Tracks usage limits for trial users (3 projects/month, 10 workflows/month, 5 reports/month).

## Vector Search

**Function**: `match_evidence(query_embedding, match_threshold, match_count)`
**Index**: HNSW on `evidence.embedding`
**Dimensions**: 1536 (OpenAI text-embedding-ada-002)

## Storage Buckets

- `user-uploads` - User uploaded files
- `generated-reports` - AI generated reports
- `project-assets` - Project related assets
- `public-assets` - Public assets

All buckets have RLS policies.

## Triggers

### on_auth_user_created

Automatically creates `user_profiles` record when user signs up:

```sql
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
```

## Migrations

8 Drizzle migrations deployed (00001-00008):
- Initial schema
- Projects and validation tables
- Trial usage counters
- Onboarding sessions
- User profile triggers

See `supabase/migrations/` for full migration history.
