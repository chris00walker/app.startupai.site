---
purpose: "Private technical source of truth for Supabase configuration"
status: "active"
last_reviewed: "2025-10-25"
---

# Supabase Configuration

## Project

- Production project id: `eqxropalhxjeyvfcoyxg` (us-east-1). Local development uses the Supabase CLI project declared in `supabase/config.toml` (`project_id = "app.startupai.site"`).
- Managed Postgres is currently version 15; the CLI spins up Postgres 17. Keep SQL portable (no `generated always as identity` or other 17-only features) until Supabase upgrades production.
- Extensions in use: `uuid-ossp` (migration `00001`), `pgvector` (enabled manually and used by `match_evidence`), and realtime/auth defaults. Additional extensions must be requested through the Supabase dashboard before adding migrations.
- Auth configuration relies on PKCE + secure cookies. Callback domains: production marketing domain, `127.0.0.1:3000` for local, and Netlify previews via dashboard settings.

## Environment Management

| Variable | Service | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Next.js frontend | Public URL for client SDK; mirrored in `.env.example` and Netlify UI. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Next.js frontend | Browser-safe key used by components that fetch directly from Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | Next.js API routes, Netlify functions, Python backend | Required for RLS-bypassing writes (`EvidenceStoreTool`, onboarding session creation). Never expose to browsers. |
| `DATABASE_URL` / `DIRECT_DATABASE_URL` | Drizzle migrations, backend scripts | Pooled connection for migrations; direct URL reserved for manual CLI use. |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` (backend) | Python crew and Netlify wrapper | Loaded from `backend/.env`. CLI bootstraps `backend/src/startupai/main.py`. |

Environment sources:
- Frontend `.env.example` and `.env.local` for developer workstations.
- Backend `.env.example` for CrewAI workers and Netlify functions.
- Netlify dashboard maintains the deploy-time versions; update there when rotating keys.

## Policies & Security

- RLS is enabled on every user-owned table. Policies for `projects`, `hypotheses`, `experiments`, `evidence`, `trial_usage_counters`, `onboarding_sessions`, and `entrepreneur_briefs` ensure `auth.uid()` ownership. Review `supabase/migrations/00004`, `00007`, and `00009` for specifics.
- Stored procedures (`create_onboarding_session`, `upsert_entrepreneur_brief`, etc.) are `SECURITY DEFINER` so service-role processes can call them without exposing elevated privileges to clients.
- Triggers: `set_updated_at_timestamp` (00005) and `entrepreneur_briefs_updated_at` keep timestamps consistent. Do not bypass triggers with direct SQL updates in code; use Supabase RPC or the provided functions.
- JWT validation for serverless workloads happens inside Netlify functions (`netlify/functions/crew-analyze.py`). Those functions fetch the anon key to validate the bearer token before touching service credentials.

## Migrations

- The migration folder is authoritative. `00001` through `00010` cover initial schema, role enums, trial usage, onboarding tables, and profile triggers. Timestamped migrations capture late adjustments; keep numbering consistent to avoid conflicts with Supabase `schema_migrations`.
- After shipping a migration, run `supabase db pull` so local state aligns with production and future diffs stay clean.
- Drizzle does not currently generate SQL for onboarding tables; those were authored manually. When we eventually add Drizzle models for onboarding we will backfill migrations with `--requires` comments to keep ordering explicit.
- Production deploy checklist: (1) run migrations locally against staging, (2) deploy infrastructure (Netlify/Next), (3) run `supabase db push --include-all` from CI, (4) verify with the smoke checklist in `../archive/legacy/database-seeding.md`.

## Data Retention & Privacy

- Conversation history and briefs remain in Supabase. Nothing is forwarded to CrewAI yet, so privacy risk is limited to Supabase storage. Once CrewAI is enabled, implement the masking rules preserved in `docs/archive/legacy/retention-and-pii.md` before sending prompts off-platform.
- Trial usage data (`trial_usage_counters`) is intended to be aggregated after 90 days. Automation is still TODO; until then, manual clean-up happens via Supabase SQL editor.
- Evidence attachments are not stored today. When we re-enable file uploads we will revive the storage bucket policies from the legacy docs and ensure automated expiry scripts are in place.
- Auditability: Supabase logs capture auth operations. For onboarding, `onboarding_sessions.ai_context` stores the workflow metadata so we can trace which agent or worker wrote a change.

Open tasks:
- Add Drizzle models for `onboarding_sessions` and `entrepreneur_briefs` so we stop juggling raw JSON in API routes.
- Finish wiring Netlify CrewAI workers to write evidence via stored procedures instead of direct table inserts.
- Document rotation procedures for Supabase keys alongside the Netlify deploy runbook.
