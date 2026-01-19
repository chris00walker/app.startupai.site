---
purpose: "Private technical source of truth for Supabase configuration"
status: "active"
last_reviewed: "2026-01-19"
---

# Supabase Configuration

## Project

- Production project id: `eqxropalhxjeyvfcoyxg` (us-east-1)
- Managed Postgres version 15 (no 17-only features like `generated always as identity`)
- Extensions in use: `uuid-ossp`, `pgvector` (for `match_evidence` similarity search), realtime/auth defaults
- Auth: PKCE + secure cookies
- Callback domains: production, `127.0.0.1:3000` (local), Netlify previews (via dashboard)

## Environment Management

### Supabase Variables

| Variable | Service | Notes |
|----------|---------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Next.js frontend | Public URL for client SDK |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Next.js frontend | Browser-safe key for direct Supabase access |
| `SUPABASE_SERVICE_ROLE_KEY` | Next.js API routes | RLS-bypassing admin access. **Never expose to browsers.** |
| `DATABASE_URL` | Drizzle ORM | Pooled connection via Supavisor (`?pgbouncer=true`) |

### Site Configuration

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SITE_URL` | Current site URL |
| `NEXT_PUBLIC_APP_URL` | Product app URL |
| `NEXT_PUBLIC_MARKETING_URL` | Marketing site URL |

### Modal/CrewAI Integration

| Variable | Purpose |
|----------|---------|
| `MODAL_KICKOFF_URL` | Modal `/kickoff` endpoint |
| `MODAL_STATUS_URL` | Modal `/status` endpoint |
| `MODAL_HITL_APPROVE_URL` | Modal `/hitl/approve` endpoint |
| `MODAL_AUTH_TOKEN` | Shared secret for webhook verification |

### AI Providers

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | Primary LLM provider |
| `OPENROUTER_API_KEY` | Multi-provider gateway |
| `OPENROUTER_MODEL` | Model selection (e.g., `meta-llama/llama-3.3-70b-instruct`) |
| `OPENROUTER_PROVIDER` | Provider hint (e.g., `Groq`) |

### Environment Sources

- **Frontend**: `.env.example` → `.env.local` for local development
- **Netlify**: Dashboard maintains deploy-time versions (update when rotating keys)
- **CrewAI Backend**: See `startupai-crew` repo for Modal configuration

## Policies & Security

### Row Level Security

RLS is enabled on user-owned tables with `auth.uid()` ownership checks:
- `projects`, `hypotheses`, `experiments`, `evidence`
- `trial_usage_counters`, `onboarding_sessions`, `entrepreneur_briefs`
- `consultant_clients` (with consultant/client access patterns)

See Drizzle migrations `0005_add_rls_policies_for_consultants.sql` and `0008_projects_rls_for_consultants.sql`.

### Stored Procedures (RPC Functions)

| Function | Purpose | Security |
|----------|---------|----------|
| `link_client_via_invite(token)` | Links client to consultant after signup | SECURITY DEFINER |
| `upsert_entrepreneur_brief(...)` | Saves/updates Layer 1 brief | SECURITY DEFINER |
| `create_project_from_onboarding(...)` | Creates project from completed onboarding | SECURITY DEFINER |
| `apply_onboarding_turn(...)` | Atomic save for Two-Pass architecture | SECURITY DEFINER |
| `queue_onboarding_for_kickoff(...)` | Queues session for CrewAI kickoff | SECURITY DEFINER |
| `reset_session_for_revision(...)` | Resets completed session for revision | SECURITY DEFINER |

### Triggers

- `set_updated_at_timestamp` - Maintains `updated_at` consistency
- Do not bypass triggers with direct SQL; use Supabase RPC functions

### Webhook Authentication

Modal webhooks use bearer token authentication:
- Webhook handler validates `Authorization: Bearer ${MODAL_AUTH_TOKEN}`
- Token shared between Modal deployment and this app

## Realtime Configuration

See [data-schema.md](data-schema.md#supabase-realtime-configuration) for full table configuration.

### Quick Reference

**Enabled Tables**: `onboarding_sessions` (scalar only), `founders_briefs`, `validation_runs`, `validation_progress`, `approval_requests`

**Disabled Tables**: `crewai_validation_states` (too large), `evidence` (batch updates)

### Frontend Subscription Pattern

```typescript
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
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

// Cleanup
return () => supabase.removeChannel(channel);
```

### Best Practices

- **Scalar columns only**: Exclude large JSONB from `onboarding_sessions`
- **Filter by user**: Always filter by `user_id` or `project_id`
- **Debounce**: Modal sends frequent updates; debounce on frontend
- **Connection limits**: Browser tabs share WebSocket connections

## Migrations

### Drizzle Migrations

Location: `frontend/src/db/migrations/`

| Migration | Purpose |
|-----------|---------|
| `0000_steady_namorita.sql` | Initial schema |
| `0001_user_roles_and_plans.sql` | User roles enum |
| `0002_trial_usage_counters.sql` | Usage quotas |
| `0003_create_clients_table.sql` | consultant_clients |
| `0004_add_consultant_id_to_user_profiles.sql` | Consultant FK |
| `0005_add_rls_policies_for_consultants.sql` | Consultant RLS |
| `0006_add_strategyzer_fields.sql` | Evidence fields |
| `0007_crewai_validation_states_and_bmc.sql` | CrewAI + canvas tables |
| `0008_projects_rls_for_consultants.sql` | Projects consultant access |
| `0009_archived_clients_table.sql` | Archive fields |
| `0010_enable_onboarding_realtime.sql` | Realtime config |

### Notes

- Some tables (`onboarding_sessions`, `entrepreneur_briefs`, approval tables) were created via Supabase dashboard, not Drizzle
- Production deploy: `pnpm db:push` after Netlify deployment
- See [data-schema.md](data-schema.md#drizzle-migration-files) for full migration details

## Data Retention & Privacy

- **Conversation data**: Stored in Supabase only. Onboarding transcripts forwarded to Modal/CrewAI for analysis
- **Trial usage**: `trial_usage_counters` intended for 90-day aggregation (manual cleanup via SQL editor)
- **Evidence attachments**: Not currently stored (file uploads disabled)
- **Auditability**: Supabase logs capture auth operations; `approval_history` tracks HITL decisions

## Supabase Client Architecture

Three client types in `frontend/src/lib/supabase/`:

| Client | File | Use Case |
|--------|------|----------|
| **Browser** | `client.ts` | Client components, auth, realtime |
| **Server** | `server.ts` | Server components, API routes (cookie-based auth) |
| **Admin** | `admin.ts` | API routes needing RLS bypass (service role key) |

```typescript
// Browser client (client components)
import { createClient } from '@/lib/supabase/client';

// Server client (server components, API routes)
import { createClient } from '@/lib/supabase/server';

// Admin client (RLS bypass)
import { createClient } from '@/lib/supabase/admin';
```

## Open Tasks

- [ ] Add Drizzle models for `onboarding_sessions` and `entrepreneur_briefs`
- [ ] Document key rotation procedures
- [ ] Implement automated trial usage cleanup (90-day aggregation)

---

## Related Documentation

- **Data Schema**: [data-schema.md](data-schema.md) (table definitions, Realtime config)
- **Authentication**: [auth.md](auth.md) (PKCE flow, OAuth setup)
- **CrewAI Integration**: [api-crewai.md](api-crewai.md) (webhook handlers)
