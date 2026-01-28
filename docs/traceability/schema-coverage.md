# Schema Coverage Status

**Generated**: 2026-01-27
**Tool**: `/schema-coverage` skill (combines local analysis + Supabase verification)

## Summary

| Metric | Value |
|--------|-------|
| Tables in Drizzle schema | 33 |
| Tables referenced in code | 45 |
| **CRITICAL** (in code, not in Supabase) | 2 |
| **WARNING** (in code + Supabase, not in Drizzle) | 12 |
| **INFO** (in Drizzle, not in code) | 2 |

## CRITICAL: Missing from Supabase (2 tables)

These tables are referenced in code but **do not exist in Supabase**. They will cause runtime errors.

| Table | References | Primary Usage | Action |
|-------|------------|---------------|--------|
| `analytics_events` | 2 | Stripe webhook events | Create table or remove code |
| `assistant_conversations` | 2 | AI assistant history | Create table or remove code |

### Affected Files

**analytics_events**:
- `frontend/src/app/api/stripe/webhook/route.ts:94`
- `frontend/src/app/api/stripe/webhook/route.ts:190`

**assistant_conversations**:
- `frontend/src/app/api/assistant/chat/route.ts:368`
- `frontend/src/app/api/assistant/history/route.ts:50`

## WARNING: Missing from Drizzle (12 tables)

These tables exist in Supabase and work at runtime, but have **no Drizzle schema** (losing type safety).

### Validation/Progress Tracking

| Table | References | Primary Usage |
|-------|------------|---------------|
| `validation_runs` | 13 | CrewAI validation tracking |
| `validation_progress` | 3 | Real-time progress updates |

### HITL/Approval System

| Table | References | Primary Usage |
|-------|------------|---------------|
| `approval_requests` | 16 | Core approval workflow |
| `approval_history` | 4 | Approval audit trail |
| `approval_preferences` | 4 | User notification settings |

### User/Profile Data

| Table | References | Primary Usage |
|-------|------------|---------------|
| `entrepreneur_briefs` | 11 | Onboarding output documents |
| `founders_briefs` | 1 | Legacy brief format |
| `consultant_profiles` | 6 | Consultant user data |
| `consultant_onboarding_sessions` | 5 | Consultant onboarding flow |
| `onboarding_sessions` | 2 | AI chat onboarding state |

### Client Management

| Table | References | Primary Usage |
|-------|------------|---------------|
| `clients` | 2 | Consultant client data |
| `archived_clients` | 3 | Consultant client archival |

## INFO: Unused in Code (2 tables)

Tables defined in Drizzle but never referenced via `.from()` in code:

| Table | Defined In | Notes |
|-------|------------|-------|
| `ad_performance_snapshots` | `ad-performance.ts` | May be used by Modal/external |
| `learning_cards` | `experiments.ts` | May be future feature |

## Remediation Plan

### Priority 1: CRITICAL - Create Missing Tables

Either create these tables in Supabase or remove the dead code:

```sql
-- Option A: Create tables (if needed)
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE assistant_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  messages JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Priority 2: WARNING - Add Drizzle Schemas

For each table in WARNING, introspect Supabase and create matching Drizzle schema:

1. Query table structure: `SELECT * FROM information_schema.columns WHERE table_name = 'X'`
2. Create schema file in `frontend/src/db/schema/`
3. Export from `frontend/src/db/schema/index.ts`
4. No migration needed - tables already exist

### Priority 3: INFO - Review Unused

Check if `ad_performance_snapshots` and `learning_cards` are used by external systems or can be removed.

## Commands

```bash
# Local analysis only (Code ↔ Drizzle)
pnpm schema:coverage

# Full analysis requires /schema-coverage skill (includes Supabase check)
```

**Scan scope (local):**
- `frontend/src` (TypeScript/TSX)
- `backend/netlify/functions` and `netlify/functions` if TypeScript files are present

**Reference detection:** `.from('table')` calls (supports generics and multiline).

## Related Skills

| Skill | Purpose |
|-------|---------|
| `/schema-coverage` | Full analysis: Code ↔ Drizzle ↔ Supabase |
| `/schema-drift` | Column-level: Drizzle ↔ Supabase columns |
| `/schema-check` | Spec compliance: Drizzle ↔ documentation |

---

**Full JSON report**: `docs/traceability/schema-coverage-report.json`
**Note**: JSON report is local analysis only; run `/schema-coverage` skill for Supabase verification.
